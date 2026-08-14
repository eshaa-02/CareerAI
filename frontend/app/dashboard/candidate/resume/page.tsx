'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Upload, Download, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { candidateService } from '@/services/candidateService';
import { API_URL } from '@/services/api';
import { CandidateProfile } from '@/types';

export default function CandidateResumePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    candidateService
      .getMyProfile()
      .then((res) => setProfile(res.profile))
      .catch((err) =>
        toast.error(
          err instanceof Error ? err.message : 'Failed to load resume'
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOC, or DOCX file.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resume must be smaller than 5MB.');
      e.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const res = await candidateService.uploadResume(file);

      setProfile(res.profile);

      toast.success('Resume uploaded successfully!');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to upload resume'
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const getResumeUrl = () => {
    const url = profile?.resume?.url;

    if (!url) return '';

    // Already a complete URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Convert /uploads/... into http://localhost:5000/uploads/...
    const backendUrl = API_URL.replace(/\/api\/?$/, '');

    return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleDownload = async () => {
    const url = getResumeUrl();

    if (!url) {
      toast.error('Resume file not found.');
      return;
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Resume could not be downloaded.');
      }

      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = profile?.resume?.fileName || 'resume';
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open the file directly
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return <div className="skeleton h-64 rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Resume
        </h1>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Your resume is used by the AI matching engine to score you against
          job listings.
        </p>
      </div>

      <Card>
        {profile?.resume?.url ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-primary)]/15">
              <FileText className="h-8 w-8 text-[var(--accent-primary)]" />
            </div>

            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                {profile.resume.fileName}
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Uploaded{' '}
                {profile.resume.uploadedAt
                  ? new Date(profile.resume.uploadedAt).toDateString()
                  : ''}
              </p>
            </div>

            <div className="flex gap-3">
              {/* DOWNLOAD */}
              <Button
                type="button"
                variant="secondary"
                icon={<Download className="h-4 w-4" />}
                onClick={handleDownload}
              >
                Download
              </Button>

              {/* REPLACE */}
              <Button
                type="button"
                variant="secondary"
                loading={uploading}
                icon={<Upload className="h-4 w-4" />}
                onClick={() => fileInputRef.current?.click()}
              >
                Replace
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-color)] p-12 text-center">
            <Upload className="h-8 w-8 text-[var(--text-muted)]" />

            <p className="mt-3 font-medium text-[var(--text-primary)]">
              {uploading ? 'Uploading...' : 'Upload your resume'}
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              PDF or Word document, up to 5MB
            </p>

            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </Card>

      <Card className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-primary)]" />

        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Tip: keep skills up to date
          </p>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            The AI matching engine scores you primarily on skills listed in
            your profile, not just your uploaded file. Add or update skills on
            your{' '}
            <a
              href="/dashboard/candidate/profile"
              className="text-[var(--accent-primary)]"
            >
              profile page
            </a>{' '}
            for the most accurate match scores.
          </p>
        </div>
      </Card>
    </div>
  );
}