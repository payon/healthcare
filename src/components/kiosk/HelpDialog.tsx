'use client';

import { useState, useEffect } from 'react';
import { Volume2, Square, X } from 'lucide-react';
import { useKioskStore } from '@/store/kiosk-store';
import { useTTS } from '@/hooks/use-tts';
import { helpSteps, helpTtsScript } from '@/lib/help-content';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

/**
 * 이용 방법 도움말 다이얼로그.
 * page.tsx에 1회만 렌더링되며, store.helpOpen으로 열림/닫힘을 제어한다.
 * (화면 전환 시에도 유지되도록 AnimatePresence 바깥에 둔다)
 */
export function HelpDialog() {
  const helpOpen = useKioskStore((s) => s.helpOpen);
  const setHelpOpen = useKioskStore((s) => s.setHelpOpen);
  const { speak, stop, isSupported } = useTTS();
  const [listening, setListening] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      stop();
      setListening(false);
    }
    setHelpOpen(open);
  };

  const handleListen = () => {
    if (listening) {
      stop();
      setListening(false);
      return;
    }
    speak(helpTtsScript);
    setListening(true);
  };

  // 낭독이 자연 종료되면 버튼 상태를 되돌린다 (청크 사이 짧은 공백 오판 방지용 여유)
  useEffect(() => {
    if (!listening) return;
    let quietCount = 0;
    const id = setInterval(() => {
      try {
        const synth = window.speechSynthesis;
        if (synth && !synth.speaking && !synth.pending) {
          quietCount += 1;
          if (quietCount >= 2) setListening(false);
        } else {
          quietCount = 0;
        }
      } catch {
        // 무시
      }
    }, 1000);
    return () => clearInterval(id);
  }, [listening]);

  return (
    <Dialog open={helpOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto kiosk-scroll"
        aria-label="이용 방법 도움말"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">이용 방법</DialogTitle>
          <DialogDescription className="text-base">
            바이오그램 미니 교육 키오스크 사용법입니다
          </DialogDescription>
        </DialogHeader>

        <ol className="mt-2 flex flex-col gap-3">
          {helpSteps.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-3 rounded-xl border bg-card p-4"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
              >
                {i + 1}
              </span>
              <div>
                <p className="text-lg font-bold">{step.title}</p>
                <p className="mt-0.5 text-base leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {isSupported ? (
            <button
              onClick={handleListen}
              aria-label={listening ? '음성 안내 중단' : '음성으로 듣기'}
              className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-lg font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {listening ? (
                <>
                  <Square className="h-5 w-5" />
                  듣기 중단
                </>
              ) : (
                <>
                  <Volume2 className="h-5 w-5" />
                  음성으로 듣기
                </>
              )}
            </button>
          ) : (
            <p className="flex-1 rounded-xl border px-4 py-3 text-center text-sm text-muted-foreground">
              이 브라우저에서는 음성 안내를 지원하지 않습니다
            </p>
          )}
          <button
            onClick={() => handleOpenChange(false)}
            aria-label="도움말 닫기"
            className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl border px-6 text-lg font-bold transition-colors hover:bg-secondary"
          >
            <X className="h-5 w-5" />
            닫기
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
