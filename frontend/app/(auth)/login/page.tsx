'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { loginSchema, LoginInput } from '@/schemas/auth.schema';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginThunk, clearAuthError } from '@/features/auth.slice';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GoogleOAuthButton } from '@/components/auth/GoogleOAuthButton';
import { AuthDivider } from '@/components/auth/AuthDivider';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Clear stale auth error when entering the Login page
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: LoginInput) => {
    dispatch(loginThunk(data));
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Welcome back
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5">
            Sign in to your Ping-Me account to continue
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <GoogleOAuthButton />

        <AuthDivider />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--icon-muted)]" />
              <input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--icon-muted)]" />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all"
              />
            </div>
            {errors.password && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl btn-primary font-medium text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer mt-2 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-xs text-center text-[var(--text-secondary)] pt-2">
          Don't have an account?{' '}
          <Link href="/register" className="text-[var(--text-primary)] font-semibold hover:underline transition-all">
            Create account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
