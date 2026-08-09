'use client';

export function AuthDivider() {
  return (
    <div className="relative my-5 flex items-center justify-center">
      <div className="w-full border-t border-[var(--border)]" />
      <span className="absolute bg-[var(--background)] px-3 text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
        Or continue with
      </span>
    </div>
  );
}
