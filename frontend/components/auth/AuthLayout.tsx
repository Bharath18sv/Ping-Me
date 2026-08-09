'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ShieldCheck, Zap, Lock } from 'lucide-react';
import { ProductMessageCarousel } from './ProductMessageCarousel';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex bg-[var(--background)] text-[var(--foreground)] relative overflow-hidden select-none transition-colors duration-200">
      {/* Subtle Responsive Grid Background */}
      <div className="absolute inset-0 auth-grid-bg pointer-events-none" />

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-30">
        <ThemeToggle />
      </div>

      <div className="w-full flex flex-col lg:flex-row min-h-screen relative z-10">
        {/* LEFT PANEL - Product Story & Brand */}
        <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[var(--border-muted)] bg-[var(--surface-panel)] backdrop-blur-sm relative transition-colors duration-200">
          {/* Top Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                Ping-Me
              </span>
              <span className="ml-2 text-[10px] uppercase font-semibold tracking-wider text-[var(--text-secondary)] bg-[var(--badge-bg)] border border-[var(--glass-border)] px-2 py-0.5 rounded-full">
                Chat
              </span>
            </div>
          </div>

          {/* Center Product Messaging Carousel */}
          <div className="my-12 lg:my-0 max-w-lg">
            <ProductMessageCarousel />
          </div>

          {/* Bottom Feature Badges */}
          <div className="hidden sm:grid grid-cols-3 gap-4 pt-6 border-t border-[var(--border-muted)] text-[var(--text-secondary)] text-xs font-medium">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--text-primary)]" />
              <span>Real-Time Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[var(--text-primary)]" />
              <span>Secure JWT Auth</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--text-primary)]" />
              <span>Live Presence</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Authentication Form Container */}
        <div className="w-full lg:w-1/2 p-6 sm:p-12 lg:p-16 flex items-center justify-center bg-[var(--background)] transition-colors duration-200">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
