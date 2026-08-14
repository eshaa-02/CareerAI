'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Upload, FileText, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { candidateService } from '@/services/candidateService';
import { CandidateProfile, EducationEntry, ExperienceEntry } from '@/types';

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    headline: '',
    bio: '',
    skillsInput: '',
    desiredJobTitle: '',
    desiredSalary: 0,
  });

  const [newEdu, setNewEdu] = useState({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' });
  const [newExp, setNewExp] = useState({ company: '', title: '', startDate: '', endDate: '', description: '' });

  const fetchProfile = () => {
    setLoading(true);
    candidateService
      .getMyProfile()
      .then((res) => {
        setProfile(res.profile);
        setForm({
          headline: res.profile.headline || '',
          bio: res.profile.bio || '',
          skillsInput: (res.profile.skills || []).join(', '),
          desiredJobTitle: res.profile.desiredJobTitle || '',
          desiredSalary: res.profile.desiredSalary || 0,
        });
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load profile'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveBasics = async () => {
    setSaving(true);
    try {
      const skills = form.skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await candidateService.updateMyProfile({
        headline: form.headline,
        bio: form.bio,
        skills,
        desiredJobTitle: form.desiredJobTitle,
        desiredSalary: form.desiredSalary,
      });
      setProfile(res.profile);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      const res = await candidateService.uploadResume(file);
      setProfile(res.profile);
      toast.success('Resume uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  const handleAddEducation = async () => {
    if (!newEdu.institution || !newEdu.degree) {
      toast.error('Institution and degree are required');
      return;
    }
    try {
      const res = await candidateService.addEducation(newEdu);
      setProfile(res.profile);
      setNewEdu({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' });
      toast.success('Education added');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add education');
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      const res = await candidateService.deleteEducation(id);
      setProfile(res.profile);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove');
    }
  };

  const handleAddExperience = async () => {
    if (!newExp.company || !newExp.title) {
      toast.error('Company and title are required');
      return;
    }
    try {
      const res = await candidateService.addExperience(newExp);
      setProfile(res.profile);
      setNewExp({ company: '', title: '', startDate: '', endDate: '', description: '' });
      toast.success('Experience added');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add experience');
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      const res = await candidateService.deleteExperience(id);
      setProfile(res.profile);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">My Profile</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {profile?.completionPercentage ?? 0}% complete — keep it updated to improve your AI match scores.
          </p>
        </div>
      </div>

      {/* Resume */}
      {/* Resume */}
      <Card>
        <h2 className="mb-3 font-semibold text-[var(--text-primary)]">
          Resume
        </h2>

        {profile?.resume?.url ? (
          <div className="flex items-center justify-between rounded-xl border border-[var(--border-color)] p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[var(--accent-primary)]" />

              <span className="text-sm text-[var(--text-primary)]">
                {profile.resume.fileName}
              </span>
            </div>

            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={uploadingResume}
                icon={<Upload className="h-4 w-4" />}
                onClick={() => resumeInputRef.current?.click()}
              >
                Replace
              </Button>

              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleResumeUpload}
                disabled={uploadingResume}
              />
            </div>
          </div>
        ) : (
          <div
            onClick={() => resumeInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-color)] p-8 text-center"
          >
            <Upload className="h-6 w-6 text-[var(--text-muted)]" />

            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {uploadingResume
                ? 'Uploading...'
                : 'Click to upload your resume (PDF or Word)'}
            </p>

            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleResumeUpload}
              disabled={uploadingResume}
            />
          </div>
        )}
      </Card>

      {/* Basics */}
      <Card>
        <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Headline</label>
            <input
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="e.g. Senior Full Stack Developer"
              className="w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Bio</label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell employers about yourself..."
              className="w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Skills (comma-separated)</label>
            <input
              value={form.skillsInput}
              onChange={(e) => setForm({ ...form, skillsInput: e.target.value })}
              placeholder="React, Node.js, MongoDB, TypeScript"
              className="w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Desired Job Title</label>
              <input
                value={form.desiredJobTitle}
                onChange={(e) => setForm({ ...form, desiredJobTitle: e.target.value })}
                className="w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Desired Salary (annual)</label>
              <input
                type="number"
                value={form.desiredSalary}
                onChange={(e) => setForm({ ...form, desiredSalary: Number(e.target.value) })}
                className="w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <Button onClick={handleSaveBasics} loading={saving} icon={<Save className="h-4 w-4" />}>
            Save Changes
          </Button>
        </div>
      </Card>

      {/* Education */}
      <Card>
        <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Education</h2>
        <div className="space-y-3">
          {profile?.education.map((edu: EducationEntry) => (
            <motion.div
              key={edu._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between rounded-xl border border-[var(--border-color)] p-4"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{edu.degree}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {edu.institution} {edu.fieldOfStudy && `· ${edu.fieldOfStudy}`}
                </p>
              </div>
              <button onClick={() => handleDeleteEducation(edu._id)} className="text-[var(--text-muted)] hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 rounded-xl border border-dashed border-[var(--border-color)] p-4 sm:grid-cols-2">
          <input
            placeholder="Institution"
            value={newEdu.institution}
            onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
            className="rounded-xl px-4 py-2.5 text-sm"
          />
          <input
            placeholder="Degree"
            value={newEdu.degree}
            onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
            className="rounded-xl px-4 py-2.5 text-sm"
          />
          <input
            placeholder="Field of study (optional)"
            value={newEdu.fieldOfStudy}
            onChange={(e) => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })}
            className="rounded-xl px-4 py-2.5 text-sm"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={newEdu.startDate}
              onChange={(e) => setNewEdu({ ...newEdu, startDate: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm"
            />
            <input
              type="date"
              value={newEdu.endDate}
              onChange={(e) => setNewEdu({ ...newEdu, endDate: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={handleAddEducation} icon={<Plus className="h-4 w-4" />} className="sm:col-span-2">
            Add Education
          </Button>
        </div>
      </Card>

      {/* Experience */}
      <Card>
        <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Experience</h2>
        <div className="space-y-3">
          {profile?.experience.map((exp: ExperienceEntry) => (
            <motion.div
              key={exp._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between rounded-xl border border-[var(--border-color)] p-4"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{exp.title}</p>
                <p className="text-xs text-[var(--text-muted)]">{exp.company}</p>
              </div>
              <button onClick={() => handleDeleteExperience(exp._id)} className="text-[var(--text-muted)] hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 rounded-xl border border-dashed border-[var(--border-color)] p-4 sm:grid-cols-2">
          <input
            placeholder="Company"
            value={newExp.company}
            onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
            className="rounded-xl px-4 py-2.5 text-sm"
          />
          <input
            placeholder="Job Title"
            value={newExp.title}
            onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
            className="rounded-xl px-4 py-2.5 text-sm"
          />
          <div className="flex gap-2 sm:col-span-2">
            <input
              type="date"
              value={newExp.startDate}
              onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm"
            />
            <input
              type="date"
              value={newExp.endDate}
              onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <textarea
            placeholder="Description (optional)"
            value={newExp.description}
            onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
            className="rounded-xl px-4 py-2.5 text-sm sm:col-span-2"
            rows={2}
          />
          <Button variant="secondary" size="sm" onClick={handleAddExperience} icon={<Plus className="h-4 w-4" />} className="sm:col-span-2">
            Add Experience
          </Button>
        </div>
      </Card>
    </div>
  );
}
