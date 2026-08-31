'use client';

import { useState } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DenimPatch, Sticker } from '@/components/scrapbook/Decorations';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        username: username.trim(),
        email: username.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Username atau password salah');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gingham flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Scrapbook Elements */}
      <DenimPatch rotate={-4} className="absolute top-10 left-10 hidden md:block opacity-40">⭐ HOARIZON</DenimPatch>
      <DenimPatch rotate={3} className="absolute bottom-16 right-16 hidden md:block opacity-40">💙 Kas Kelas</DenimPatch>

      {/* Floating Stickers */}
      <Sticker emoji="✨" rotate={-12} className="absolute top-32 left-[15%] hidden lg:flex">Sparkle</Sticker>
      <Sticker emoji="💰" rotate={8} className="absolute bottom-32 right-[15%] hidden lg:flex">Save</Sticker>
      <Sticker emoji="🎯" rotate={-6} className="absolute top-48 right-[12%] hidden lg:flex">Goals</Sticker>
      <Sticker emoji="🎀" rotate={15} className="absolute bottom-48 left-[12%] hidden lg:flex">D3TI 2A</Sticker>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Paper Container with Shadow */}
        <div className="relative">
          {/* Tape decoration top-left */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="absolute -top-3 left-8 w-16 h-5 bg-gradient-to-r from-amber-100/70 via-amber-50/60 to-amber-100/70 rounded-sm border border-amber-200/30 shadow-sm z-10"
            style={{ transform: 'rotate(-3deg)' }}
          />

          {/* Tape decoration top-right */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="absolute -top-3 right-8 w-16 h-5 bg-gradient-to-r from-amber-100/70 via-amber-50/60 to-amber-100/70 rounded-sm border border-amber-200/30 shadow-sm z-10"
            style={{ transform: 'rotate(2deg)' }}
          />

          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-[var(--shadow-puffy-xl)] border border-[var(--color-baby-blue-200)]/30 p-8 md:p-10">
            {/* Logo Badge */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                className="inline-block relative mb-3"
              >
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-[var(--shadow-puffy-lg)] border-2 border-white/80 mx-auto ring-4 ring-[var(--color-baby-blue-100)]">
                  <Image
                    src="/logo.png"
                    alt="Hoarizon Logo"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-sm text-[var(--color-denim)] font-semibold tracking-wide font-[var(--font-display)]">
                  Class Cashflow & Savings
                </p>
                <p className="text-xs text-[var(--color-denim-light)] mt-1 opacity-70">
                  Every contribution tells a story
                </p>
              </motion.div>
            </div>

            {/* Decorative divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="h-px bg-gradient-to-r from-transparent via-[var(--color-baby-blue)] to-transparent mb-8"
            />

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.4 }}
              >
                <Input
                  label="Username"
                  type="text"
                  placeholder="Nama Lengkap (Contoh: Marie Allycia Renaldine)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.4 }}
              >
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[var(--color-expense-bg)] border border-[var(--color-expense-light)] text-[var(--color-expense)] text-sm p-3 rounded-xl font-medium"
                >
                  {error}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.4 }}
              >
                <Button
                  type="submit"
                  variant="denim"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full text-base font-bold tracking-wide rounded-2xl"
                >
                  {isLoading ? 'Opening...' : '👛 OPEN CLASS WALLET'}
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="text-center"
              >
                <button
                  type="button"
                  className="text-xs text-[var(--color-denim-light)] hover:text-[var(--color-denim)] transition-colors underline-offset-2 hover:underline"
                >
                  Lupa password? Hubungi Bendahara / Ketua
                </button>
              </motion.div>
            </form>

            {/* Bottom decoration */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-8 text-center"
            >
              <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-denim-light)]/60">
                <span className="w-8 h-px bg-[var(--color-baby-blue-200)]" />
                <span>Manage class cashflow beautifully</span>
                <span className="w-8 h-px bg-[var(--color-baby-blue-200)]" />
              </div>
            </motion.div>
          </div>

          {/* Stitching decoration bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.3 }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-px border-b-2 border-dashed border-[var(--color-denim-light)]"
          />
        </div>

        {/* Copyright notice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="mt-6 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-[var(--color-baby-blue-200)]/40 shadow-sm text-xs text-[var(--color-denim)] font-medium">
            <span>✨</span>
            <span>CopyRight @Pacar Marie</span>
            <span>💙</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
