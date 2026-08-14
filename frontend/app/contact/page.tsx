'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const CONTACT_CARDS = [
  { icon: Mail, title: 'Email', value: 'support@careerai.com' },
  { icon: Phone, title: 'Phone', value: '+1 (555) 123-4567' },
  { icon: MapPin, title: 'Office', value: 'San Francisco, CA' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (form.name.trim().length < 2) newErrors.name = 'Please enter your full name';
    if (!/^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$/.test(form.email)) newErrors.email = 'Please enter a valid email';
    if (form.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSending(true);
    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error('Contact form is not configured yet. Please set EmailJS environment variables.');
      }

      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: form.name,
          from_email: form.email,
          subject: form.subject || 'New contact form submission',
          message: form.message,
        },
        publicKey
      );

      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      toast.success('Message sent! We will get back to you soon.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">Get in touch</h1>
        <p className="mx-auto mt-3 max-w-xl text-[var(--text-secondary)]">
          Have a question about CareerAI? Our team typically replies within one business day.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {CONTACT_CARDS.map((c) => (
          <Card key={c.title} className="text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
              <c.icon className="h-5 w-5 text-[var(--accent-primary)]" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">{c.title}</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{c.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <Card padding="lg">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <CheckCircle2 className="h-14 w-14 text-[var(--accent-primary)]" />
              <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">Message sent!</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">We'll be in touch shortly.</p>
              <Button className="mt-6" variant="secondary" onClick={() => setSent(false)}>
                Send another message
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  placeholder="Jane Doe"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Subject</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Message</label>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  placeholder="Tell us more..."
                />
                {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
              </div>
              <Button type="submit" fullWidth size="lg" loading={sending} icon={<Send className="h-4 w-4" />}>
                Send Message
              </Button>
            </form>
          )}
        </Card>

        <Card padding="none" className="overflow-hidden">
          <div className="flex h-full min-h-72 items-center justify-center bg-[var(--bg-card-alt)]">
            <div className="text-center text-[var(--text-muted)]">
              <MapPin className="mx-auto h-8 w-8" />
              <p className="mt-2 text-sm">Map integration placeholder</p>
              <p className="text-xs">(Embed Google Maps with your API key here)</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
