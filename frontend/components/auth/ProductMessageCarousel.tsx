'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const PRODUCT_MESSAGES = [
  {
    title: 'Conversations that stay connected.',
    subtitle: 'Instant messaging engineered for high reliability and zero clutter.',
  },
  {
    title: 'Message instantly. Stay in sync.',
    subtitle: 'Real-time WebSocket synchronization across all your devices.',
  },
  {
    title: 'Simple conversations. Real-time connection.',
    subtitle: 'Designed for focus, speed, and seamless daily communication.',
  },
  {
    title: 'Your conversations, wherever you are.',
    subtitle: 'High performance cursor pagination and live presence tracking.',
  },
  {
    title: 'Chat without the clutter.',
    subtitle: 'A clean, distraction-free environment for meaningful dialogs.',
  },
];

export function ProductMessageCarousel() {
  const [index, setIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % PRODUCT_MESSAGES.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const currentMessage = PRODUCT_MESSAGES[index];

  return (
    <div className="min-h-[120px] flex flex-col justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="space-y-2"
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)] leading-snug">
            "{currentMessage.title}"
          </h2>
          <p className="text-sm text-[var(--text-secondary)] font-normal leading-relaxed max-w-md">
            {currentMessage.subtitle}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Progress Dots */}
      <div className="flex items-center gap-2 mt-6" aria-label="Message indicators">
        {PRODUCT_MESSAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index
                ? 'w-6 bg-[var(--text-primary)]'
                : 'w-1.5 bg-[var(--border)] hover:bg-[var(--text-secondary)]'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
