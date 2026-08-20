'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Type, Volume2, VolumeX, Eye, RotateCcw } from 'lucide-react';
import { useKioskStore } from '@/store/kiosk-store';

// ========================================
// TTS 표시 인디케이터 (화면 하단 고정)
// ========================================
function TTSIndicator({ onReplay, onReplayFull }: { onReplay: () => void; onReplayFull: () => void }) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const check = () => {
      setSpeaking(window.speechSynthesis.speaking);
    };

    // 폴링으로 speechSynthesis.speaking 상태 추적
    const interval = setInterval(check, 300);
    return () => clearInterval(interval);
  }, []);

  if (!speaking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-x-0 bottom-[4.5rem] z-40 flex items-center justify-center gap-3 md:bottom-6"
    >
      <div className={`tts-indicator tts-speaking shadow-lg`}>
        <Volume2 className="h-4 w-4" />
        <span>음성 안내 중...</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onReplay();
        }}
        className="tts-indicator shadow-lg"
        aria-label="요약 다시 듣기"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">요약</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onReplayFull();
        }}
        className="tts-indicator shadow-lg"
        aria-label="전체 다시 듣기"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">전체</span>
      </button>
    </motion.div>
  );
}

// ========================================
// 글꼴 크기 옵션
// ========================================
type FontSize = 'normal' | 'large' | 'xlarge';

interface SizeOption {
  value: FontSize;
  label: string;
  display: string;
  textSize: string;
}

const sizeOptions: SizeOption[] = [
  { value: 'normal', label: '보통', display: 'A', textSize: 'text-sm' },
  { value: 'large', label: '크게', display: 'A', textSize: 'text-lg' },
  { value: 'xlarge', label: '아주 크게', display: 'A', textSize: 'text-2xl' },
];

// ========================================
// 모바일 접근성 툴바 (상단 인라인)
// ========================================
function MobileToolbar({
  onReplay,
  onReplayFull,
}: {
  onReplay: () => void;
  onReplayFull: () => void;
}) {
  const { fontSize, setFontSize, ttsEnabled, setTtsEnabled, highContrast, setHighContrast } =
    useKioskStore();

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 md:hidden"
      role="toolbar"
      aria-label="접근성 설정"
    >
      {/* 글꼴 크기 */}
      {sizeOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setFontSize(opt.value)}
          aria-label={opt.label}
          aria-pressed={fontSize === opt.value}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            fontSize === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <span className={opt.textSize} style={{ lineHeight: 1 }}>
            {opt.display}
          </span>
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}

      {/* 구분선 */}
      <div className="mx-0.5 h-5 w-px bg-border" />

      {/* TTS 토글 */}
      <button
        onClick={() => setTtsEnabled(!ttsEnabled)}
        aria-label={ttsEnabled ? '음성 안내 끄기' : '음성 안내 켜기'}
        aria-pressed={ttsEnabled}
        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          ttsEnabled
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        }`}
      >
        {ttsEnabled ? (
          <Volume2 className="h-3.5 w-3.5" />
        ) : (
          <VolumeX className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">TTS</span>
      </button>

      {/* 고대비 토글 */}
      <button
        onClick={() => setHighContrast(!highContrast)}
        aria-label={highContrast ? '고대비 끄기' : '고대비 켜기'}
        aria-pressed={highContrast}
        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          highContrast
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        }`}
      >
        <Eye className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">고대비</span>
      </button>
    </div>
  );
}

// ========================================
// 데스크톱 접근성 툴바 (우측 고정 플로팅)
// ========================================
function DesktopToolbar({
  onReplay,
  onReplayFull,
}: {
  onReplay: () => void;
  onReplayFull: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { fontSize, setFontSize, ttsEnabled, setTtsEnabled, highContrast, setHighContrast } =
    useKioskStore();

  const handleAction = useCallback(
    (action: () => void) => {
      action();
      setExpanded(false);
    },
    []
  );

  return (
    <div className="fixed right-4 top-4 z-40 hidden md:block">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-64 rounded-2xl border bg-card p-4 shadow-xl"
            role="dialog"
            aria-label="접근성 설정"
          >
            {/* 글꼴 크기 */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                글꼴 크기
              </p>
              <div className="flex gap-1.5">
                {sizeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAction(() => setFontSize(opt.value))}
                    aria-label={opt.label}
                    aria-pressed={fontSize === opt.value}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                      fontSize === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <span className={opt.textSize} style={{ lineHeight: 1 }}>
                      {opt.display}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 구분선 */}
            <div className="mb-4 h-px bg-border" />

            {/* TTS */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                음성 안내 (TTS)
              </p>
              <button
                onClick={() => handleAction(() => setTtsEnabled(!ttsEnabled))}
                aria-pressed={ttsEnabled}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  ttsEnabled
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {ttsEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
                <span>{ttsEnabled ? '음성 안내 켜짐' : '음성 안내 꺼짐'}</span>
              </button>
              {ttsEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 flex gap-2"
                >
                  <button
                    onClick={() => {
                      onReplay();
                      setExpanded(false);
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
                    aria-label="요약 다시 듣기"
                  >
                    <RotateCcw className="h-3 w-3" />
                    요약 듣기
                  </button>
                  <button
                    onClick={() => {
                      onReplayFull();
                      setExpanded(false);
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
                    aria-label="전체 다시 듣기"
                  >
                    <RotateCcw className="h-3 w-3" />
                    전체 듣기
                  </button>
                </motion.div>
              )}
            </div>

            {/* 구분선 */}
            <div className="mb-4 h-px bg-border" />

            {/* 고대비 */}
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                화면 표시
              </p>
              <button
                onClick={() => handleAction(() => setHighContrast(!highContrast))}
                aria-pressed={highContrast}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  highContrast
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                <Eye className="h-4 w-4" />
                <span>{highContrast ? '고대비 켜짐' : '고대비 꺼짐'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메인 버튼 */}
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-label="접근성 설정"
        aria-expanded={expanded}
        className={`flex h-11 w-11 items-center justify-center rounded-full border bg-card shadow-lg transition-colors hover:bg-secondary ${
          expanded ? 'bg-primary text-primary-foreground border-primary' : ''
        }`}
      >
        <Type className="h-5 w-5" />
      </button>

      {/* 상태 뱃지: 켜진 기능 표시 */}
      {(ttsEnabled || highContrast || fontSize !== 'normal') && !expanded && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
          {[ttsEnabled, highContrast, fontSize !== 'normal'].filter(Boolean).length}
        </div>
      )}
    </div>
  );
}

// ========================================
// 메인 익스포트
// ========================================
interface AccessibilityToolbarProps {
  onReplay: () => void;
  onReplayFull: () => void;
}

export function AccessibilityToolbar({ onReplay, onReplayFull }: AccessibilityToolbarProps) {
  return (
    <>
      <MobileToolbar onReplay={onReplay} onReplayFull={onReplayFull} />
      <DesktopToolbar onReplay={onReplay} onReplayFull={onReplayFull} />
      <TTSIndicator onReplay={onReplay} onReplayFull={onReplayFull} />
    </>
  );
}
