import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CareerAI — AI-Powered Job Portal',
  description:
    'CareerAI connects exceptional talent with ambitious companies using AI-powered resume matching, real-time notifications, and a premium hiring experience.',
  keywords: [
    'jobs',
    'careers',
    'AI recruitment',
    'hiring',
    'job search',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <Navbar />

              <main className="min-h-screen">
                {children}
              </main>

              <Footer />

              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    backdropFilter: 'blur(16px)',
                  },
                }}
              />
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}