'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, SlidersHorizontal, X } from 'lucide-react';
import JobCard from '@/components/jobs/JobCard';
import Button from '@/components/ui/Button';
import { jobService, JobFilters } from '@/services/jobService';
import { candidateService } from '@/services/candidateService';
import { Job, PaginationMeta } from '@/types';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
const EXPERIENCE_LEVELS = ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'];

function JobsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  const [filters, setFilters] = useState<JobFilters>({
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || '',
    category: searchParams.get('category') || '',
    type: '',
    experience: '',
    isRemote: false,
    page: 1,
  });

  const fetchJobs = useCallback(async (activeFilters: JobFilters) => {
    setLoading(true);
    try {
      const { jobs: results, pagination: pag } = await jobService.getJobs(activeFilters);
      setJobs(results);
      setPagination(pag);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page]);

  useEffect(() => {
    if (user?.role === 'candidate') {
      candidateService
        .getSavedJobs()
        .then((res) => setSavedJobIds(res.jobs.map((j) => j._id)))
        .catch(() => {});
    }
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs({ ...filters, page: 1 });
    setFilters((f) => ({ ...f, page: 1 }));
  };

  const handleSaveJob = async (jobId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      const { saved } = await candidateService.toggleSavedJob(jobId);
      setSavedJobIds((prev) => (saved ? [...prev, jobId] : prev.filter((id) => id !== jobId)));
      toast.success(saved ? 'Job saved' : 'Job removed from saved');
    } catch {
      toast.error('Please log in as a candidate to save jobs');
    }
  };

  const clearFilters = () => {
    const cleared = { search: '', location: '', category: '', type: '', experience: '', isRemote: false, page: 1 };
    setFilters(cleared);
    fetchJobs(cleared);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Find your next role</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          {pagination.total} active job{pagination.total !== 1 ? 's' : ''} waiting for you
        </p>
      </div>

      <form onSubmit={handleSearch} className="glass-card mb-6 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-[var(--input-bg)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Job title, skill, or keyword"
            className="w-full border-none bg-transparent p-0 text-sm outline-none"
          />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-[var(--input-bg)] px-4 py-3">
          <MapPin className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <input
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            placeholder="Location"
            className="w-full border-none bg-transparent p-0 text-sm outline-none"
          />
        </div>
        <Button type="button" variant="secondary" onClick={() => setShowFilters((v) => !v)} icon={<SlidersHorizontal className="h-4 w-4" />}>
          Filters
        </Button>
        <Button type="submit">Search</Button>
      </form>

      {showFilters && (
        <div className="glass-card mb-8 grid grid-cols-1 gap-4 rounded-2xl p-5 sm:grid-cols-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="">Any Job Type</option>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace('-', ' ')}
              </option>
            ))}
          </select>

          <select
            value={filters.experience}
            onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
            className="rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="">Any Experience</option>
            {EXPERIENCE_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>

          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="">Newest First</option>
            <option value="salary-high">Salary: High to Low</option>
            <option value="salary-low">Salary: Low to High</option>
            <option value="oldest">Oldest First</option>
          </select>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={filters.isRemote}
                onChange={(e) => setFilters({ ...filters, isRemote: e.target.checked })}
              />
              Remote only
            </label>
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          </div>

          <div className="sm:col-span-4">
            <Button size="sm" onClick={() => fetchJobs({ ...filters, page: 1 })}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-2xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <p className="text-[var(--text-secondary)]">No jobs match your search. Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, i) => (
              <JobCard
                key={job._id}
                job={job}
                index={i}
                onSave={handleSaveJob}
                saved={savedJobIds.includes(job._id)}
              />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFilters({ ...filters, page: i + 1 })}
                  className={`h-10 w-10 rounded-xl text-sm font-medium transition-colors ${
                    pagination.page === i + 1
                      ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]'
                      : 'glass-card text-[var(--text-primary)]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-[var(--text-muted)]">Loading...</div>}>
      <JobsContent />
    </Suspense>
  );
}
