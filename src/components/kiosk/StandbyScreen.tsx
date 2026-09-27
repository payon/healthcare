'use client';

import { motion } from 'framer-motion';
import { Activity, Volume2, VolumeX, Eye } from 'lucide-react';
import { useKioskStore } from '@/store/kiosk-store';
import { useKioskContent } from '@/hooks/use-kiosk-content';
import { themeStyle } from '@/lib/kiosk-theme';

export function StandbyScreen() {
  const { startSession, ttsEnabled, setTtsEnabled, highContrast, setHighContrast } =
    useKioskStore();
  const { getContent } = useKioskContent();
  const content = getContent('standby');

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-teal-500 via-emerald-600 to-green-800"
      style={themeStyle(content?.backgroundColor, content?.backgroundImageUrl)}
    >
      {/* Decorative background circles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-48 -right-48 h-[500px] w-[500px] rounded-full bg-white/5" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-white/5" />
      </div>

      {/* Accessibility quick toggles (top-right, subtle on standby) */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setTtsEnabled(!ttsEnabled)}
          aria-label={ttsEnabled ? '음성 안내 끄기' : '음성 안내 켜기'}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            ttsEnabled
              ? 'bg-white/30 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
        <button
          onClick={() => setHighContrast(!highContrast)}
          aria-label={highContrast ? '고대비 끄기' : '고대비 켜기'}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            highContrast
              ? 'bg-white/30 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          <Eye className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        {/* Animated health icon */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Activity className="h-16 w-16 text-white/80 md:h-20 md:w-20" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="text-center text-5xl font-extrabold tracking-tight text-white md:text-7xl"
        >
          {content?.title || 'Biogram MINI'}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
          className="text-center text-xl text-white/80 md:text-2xl"
        >
          {content?.body || '헬스케어 장비 이용 교육'}
        </motion.p>

        {/* Start button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8, ease: 'easeOut' }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={startSession}
          className="mt-8 min-h-20 rounded-2xl bg-white px-12 text-xl font-bold text-primary shadow-xl transition-shadow hover:shadow-2xl md:px-16 md:text-2xl"
        >
          <motion.span
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            터치하여 시작하기
          </motion.span>
        </motion.button>
      </div>

      {/* Bottom note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="absolute bottom-8 text-center text-sm text-white/50"
      >
        화면을 터치하면 교육이 시작됩니다
      </motion.p>
    </div>
  );
}
