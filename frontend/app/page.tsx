'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, MapPin, ArrowRight, Sparkles, Zap, ShieldCheck, TrendingUp } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import JobCard from '@/components/jobs/JobCard';
import StatsCounter from '@/components/ui/StatsCounter';
import { statsService, PublicStats } from '@/services/statsService';
import { Job, Company } from '@/types';
import { getInitials } from '@/utils/helpers';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Resume Matching',
    desc: 'Our AI analyzes your skills and experience to surface the roles you are genuinely most likely to land.',
  },
  {
    icon: Zap,
    title: 'Real-Time Everything',
    desc: 'Instant notifications the moment you are shortlisted, messaged, or a new matching role goes live.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Companies',
    desc: 'Every employer profile is reviewed so you always know who you are talking to.',
  },
  {
    icon: TrendingUp,
    title: 'Career Analytics',
    desc: 'Track your application funnel and profile strength with live, data-backed dashboards.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Maria Gonzales',
    role: 'Product Designer at a Series B startup',
    quote:
      'CareerAI surfaced a role I never would have searched for myself — the match score explained exactly why I was a fit.',
  },
  {
    name: 'James Okafor',
    role: 'Backend Engineer',
    quote:
      'The real-time notifications meant I heard back about my application status within hours, not weeks of silence.',
  },
  {
    name: 'Priya Nair',
    role: 'Head of Talent, mid-size SaaS company',
    quote:
      'We cut our time-to-shortlist dramatically once we could see AI match scores against every applicant.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [stats, setStats] = useState<PublicStats>({
    totalJobs: 0,
    totalCompanies: 0,
    totalCandidates: 0,
    totalApplications: 0,
  });
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [featuredCompanies, setFeaturedCompanies] = useState<Company[]>([]);
  const [trendingCategories, setTrendingCategories] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([statsService.getPublicStats(), statsService.getHomepageContent()])
      .then(([statsRes, contentRes]) => {
        setStats(statsRes.stats);
        setLatestJobs(contentRes.latestJobs);
        setFeaturedCompanies(contentRes.featuredCompanies);
        setTrendingCategories(contentRes.trendingCategories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (location) params.set('location', location);
    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-grid-pattern bg-[size:48px_48px] opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div
          className="absolute -top-24 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--accent-primary), transparent 70%)' }}
        />

        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
            AI-Powered Hiring, Reimagined
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl"
          >
            Find work that fits <span className="gradient-text">your future</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-secondary)]"
          >
            CareerAI matches your skills and experience against thousands of live roles in real time,
            so you spend less time searching and more time interviewing.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSearch}
            className="glass-card mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl p-3 sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-[var(--input-bg)] px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Job title, skill, or company"
                className="w-full border-none bg-transparent p-0 text-sm outline-none"
              />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-[var(--input-bg)] px-4 py-3">
              <MapPin className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="w-full border-none bg-transparent p-0 text-sm outline-none"
              />
            </div>
            <Button type="submit" size="lg">
              Search Jobs
            </Button>
          </motion.form>
        </div>
      </section>

      {/* LIVE STATS */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <StatsCounter stats={stats} />
      </section>

      {/* TRENDING CATEGORIES */}
      {trendingCategories.length > 0 && (
        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
              Trending Categories
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {trendingCategories.map((cat) => (
                <Link key={cat.name} href={`/jobs?category=${encodeURIComponent(cat.name)}`}>
                  <span className="glass-card-hover glass-card inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-[var(--text-primary)]">
                    {cat.name}
                    <span className="rounded-full bg-[var(--accent-primary)]/15 px-2 py-0.5 text-xs text-[var(--accent-primary)]">
                      {cat.count}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LATEST JOBS */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
              Latest Opportunities
            </h2>
            <Link href="/jobs" className="flex items-center gap-1 text-sm font-semibold text-[var(--accent-primary)]">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-56 rounded-2xl" />
              ))}
            </div>
          ) : latestJobs.length === 0 ? (
            <p className="text-center text-[var(--text-muted)]">No jobs posted yet — check back soon.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {latestJobs.map((job, i) => (
                <JobCard key={job._id} job={job} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Why teams and candidates choose CareerAI
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
                    <f.icon className="h-5 w-5 text-[var(--accent-primary)]" />
                  </div>
                  <h3 className="mt-4 font-semibold text-[var(--text-primary)]">{f.title}</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED COMPANIES */}
      {featuredCompanies.length > 0 && (
        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                Featured Companies
              </h2>
              <Link href="/companies" className="flex items-center gap-1 text-sm font-semibold text-[var(--accent-primary)]">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredCompanies.map((c) => (
                <Link key={c._id} href={`/companies/${c._id}`}>
                  <Card className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] text-sm font-bold text-[var(--accent-primary)]">
                      {c.logo?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.logo.url} alt={c.name} className="h-full w-full object-cover" />
                      ) : (
                        getInitials(c.name)
                      )}
                    </div>
                    <h3 className="mt-3 truncate font-semibold text-[var(--text-primary)]">{c.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{c.industry || 'General'}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Success stories
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name}>
                <p className="text-sm italic text-[var(--text-secondary)]">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3 border-t border-[var(--border-color)] pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-primary)]/15 text-xs font-bold text-[var(--accent-primary)]">
                    {getInitials(t.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{t.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-4xl text-center" padding="lg">
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Ready to find your next role — or hire your next star?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[var(--text-secondary)]">
            Join thousands of candidates and companies already using CareerAI's matching engine.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/jobs">
              <Button size="lg" variant="secondary">
                Browse Jobs
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
