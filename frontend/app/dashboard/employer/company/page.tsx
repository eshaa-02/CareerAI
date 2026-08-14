'use client';

import { useEffect, useState } from 'react';
import { BadgeCheck, Upload, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { companyService } from '@/services/companyService';
import api from '@/services/api';
import { Company } from '@/types';

const SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

export default function EmployerCompanyPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [form, setForm] = useState({
    name: '',
    industry: '',
    companySize: '1-10',
    foundedYear: '',
    description: '',
    website: '',
    location: '',
  });

  useEffect(() => {
    companyService
      .getMyCompany()
      .then((res) => {
        setCompany(res.company);
        setForm({
          name: res.company.name || '',
          industry: res.company.industry || '',
          companySize: res.company.companySize || '1-10',
          foundedYear: res.company.foundedYear ? String(res.company.foundedYear) : '',
          description: res.company.description || '',
          website: res.company.website || '',
          location: res.company.location || '',
        });
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load company profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await companyService.updateMyCompany({
        ...form,
        foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
      });
      setCompany(res.company);
      toast.success('Company profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const { data } = await api.put<{ company: Company }>('/companies/me/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCompany(data.company);
      toast.success('Logo updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Company Profile</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          {company?.verified ? (
            <>
              <BadgeCheck className="h-4 w-4 text-[var(--accent-primary)]" /> Verified company
            </>
          ) : (
            'Not yet verified — a complete profile improves your chances of admin verification.'
          )}
        </p>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold text-[var(--text-primary)]">Logo</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)]">
            {company?.logo?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo.url} alt={company.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-[var(--text-muted)]">No logo</span>
            )}
          </div>
          <label>
            <Button variant="secondary" size="sm" loading={uploadingLogo} icon={<Upload className="h-4 w-4" />}>
              Upload Logo
              <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleLogoUpload} />
            </Button>
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Company Details</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Company Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Industry</label>
              <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Company Size</label>
              <select value={form.companySize} onChange={(e) => setForm({ ...form, companySize: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm">
                {SIZES.map((s) => (
                  <option key={s} value={s}>{s} employees</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Founded Year</label>
              <input type="number" value={form.foundedYear} onChange={(e) => setForm({ ...form, foundedYear: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Website</label>
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" className="w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Description</label>
            <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <Button onClick={handleSave} loading={saving} icon={<Save className="h-4 w-4" />}>
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}
