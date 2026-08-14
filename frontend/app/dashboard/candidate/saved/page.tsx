'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import JobCard from '@/components/jobs/JobCard';
import { candidateService } from '@/services/candidateService';
import { Job } from '@/types';

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = () => {
    setLoading(true);
    candidateService
      .getSavedJobs()
      .then((res) => setJobs(res.jobs))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load saved jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleUnsave = async (jobId: string) => {
    try {
      await candidateService.toggleSavedJob(jobId);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      toast.success('Removed from saved jobs');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Saved Jobs</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Jobs you've bookmarked for later.</p>
      </div>

      {jobs.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-[var(--text-muted)]">
            No saved jobs yet — tap the bookmark icon on any job listing to save it here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job, i) => (
            <JobCard key={job._id} job={job} index={i} onSave={handleUnsave} saved />
          ))}
        </div>
      )}
    </div>
  );
}
