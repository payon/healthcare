'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useKioskStore, type Screen } from '@/store/kiosk-store';
import { useKioskContent } from '@/hooks/use-kiosk-content';
import { ttsTexts } from '@/lib/tts-texts';

const SPEECH_RATE = 0.85;
const SPEECH_PITCH = 1.0;
const SPEECH_VOLUME = 1.0;
// Chrome(특히 모바일)은 긴 발화를 중간에 멈추는 버그가 있어 문장 단위로 쪼개 재생한다.
const CHUNK_MAX = 180;
// cancel() 직후 speak()이 무시되는 Chrome 레이스 회피용 지연
// (저사양 기기에서는 80ms로 부족해 발화가 통째로 삼켜지는 경우가 있어 여유 있게)
const SPEAK_DELAY_MS = 200;
// 발화 시작 후에도 speaking/pending이 안 잡히면 삼켜진 것으로 보고 재시도
const STUCK_CHECK_MS = 900;
const STUCK_RETRY_MAX = 2;

interface UseTTSOptions {
  /** 화면 전환 시 자동 읽기 여부. page.tsx에서만 true로 설정 */
  autoSpeak?: boolean;
}

// 모든 useTTS 인스턴스가 공유하는 발화 세대. speak/stop이 호출되면 증가하여
// 이전 화면에서 시작된 체인·타이머가 뒤늦게 말하는 일을 구조적으로 막는다.
let speechGeneration = 0;
// 인벤토리 보고는 페이지 로드당 1회 (화면별 인스턴스 리마운트 시 중복 방지)
let inventoryReported = false;
// 첫 사용자 제스처 전까지 자동 낭독 보류 (대기 화면 없이 바로 시작하므로,
// 로드 직후 무제스처 발화 시도로 모바일 차단 에러가 쌓이는 것 방지)
let userGestured = false;
export function markUserGesture() {
  userGestured = true;
}

function splitChunks(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?。\n])/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let cur = '';
  for (const s of sentences) {
    const merged = cur ? `${cur} ${s}` : s;
    if (merged.length > CHUNK_MAX && cur) {
      chunks.push(cur);
      cur = s;
    } else {
      cur = merged;
    }
  }
  if (cur) chunks.push(cur);
  return chunks.length > 0 ? chunks : [text];
}

function cancelSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function useTTS(options?: UseTTSOptions) {
  const currentScreen = useKioskStore((s) => s.currentScreen);
  const ttsEnabled = useKioskStore((s) => s.ttsEnabled);
  const prevScreenRef = useRef<Screen | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Chrome이 긴 발화를 paused 상태로 고착시키는 버그 대응용 watchdog
  const resumeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 발화 삼킴 감지용 단발 타이머
  const stuckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voicesHandlerRef = useRef<(() => void) | null>(null);
  const { getContent } = useKioskContent();
  // Admin-tuned speech params (defaults = constants below)
  const rateRef = useRef<number>(SPEECH_RATE);
  const voiceURIRef = useRef<string>('');

  // Admin-managed voice scripts win over bundled fallbacks (empty = fallback)
  const getAdminScript = useCallback(
    (screen: Screen): { intro: string; full: string } | null => {
      const content = getContent(screen);
      if (!content) return null;
      const intro = (content.ttsIntro || '').trim();
      const full = (content.ttsFull || '').trim();
      if (!intro && !full) return null;
      return { intro: intro || full, full: full || intro };
    },
    [getContent]
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (resumeRef.current) {
      clearInterval(resumeRef.current);
      resumeRef.current = null;
    }
    if (stuckTimerRef.current) {
      clearTimeout(stuckTimerRef.current);
      stuckTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis && voicesHandlerRef.current) {
      window.speechSynthesis.removeEventListener('voiceschanged', voicesHandlerRef.current);
      voicesHandlerRef.current = null;
    }
  }, []);

  const getKoreanVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    // Admin-pinned voice first (exact voiceURI match)
    if (voiceURIRef.current) {
      const pinned = voices.find((v) => v.voiceURI === voiceURIRef.current);
      if (pinned) return pinned;
    }
    const krVoice = voices.find((v) => v.lang.startsWith('ko'));
    if (krVoice) return krVoice;
    const krLike = voices.find(
      (v) => v.lang.includes('KO') || v.lang.includes('kr') || v.name.includes('Korean')
    );
    return krLike || voices[0] || null;
  }, []);

  // Load admin TTS tuning once (rate 0.5–1.5, preferred voiceURI)
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const s = data?.settings as Record<string, string> | undefined;
        if (!s) return;
        const rate = parseFloat(s['tts.rate'] ?? '');
        if (Number.isFinite(rate)) rateRef.current = Math.min(1.5, Math.max(0.5, rate));
        if (s['tts.voiceURI']) voiceURIRef.current = s['tts.voiceURI'].slice(0, 200);
      })
      .catch(() => {});
  }, []);

  const reportTtsDiag = useCallback((detail: string) => {
    if (typeof window === 'undefined') return;
    try {
      const state = useKioskStore.getState();
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId || 'main',
          eventType: 'diag',
          screen: state.currentScreen,
          detail: `tts-diag: ${detail}`,
        }),
      }).catch(() => {});
    } catch {
      // 로깅 실패는 무시
    }
  }, []);

  // 기기 음성 인벤토리 1회 보고 (diag): 한국어 음성 유무·개수로 기기 문제 판별
  // (페이지 로드당 1회 — 화면별 인스턴스가 리마운트될 때마다 쏘면 로그 rate-limit 낭비)
  useEffect(() => {
    if (inventoryReported) return;
    const report = () => {
      if (inventoryReported) return;
      inventoryReported = true;
      try {
        const synth = window.speechSynthesis;
        if (!synth) {
          reportTtsDiag('no-speechSynthesis');
          return;
        }
        const vs = synth.getVoices();
        const ko = vs.filter((v) => (v.lang || '').toLowerCase().startsWith('ko')).length;
        reportTtsDiag(`voices=${vs.length} ko=${ko}`);
      } catch {
        // 무시
      }
    };
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.getVoices().length > 0) {
        report();
      } else {
        const handler = () => {
          window.speechSynthesis.removeEventListener('voiceschanged', handler);
          report();
        };
        window.speechSynthesis.addEventListener('voiceschanged', handler);
        // voiceschanged가 안 오면 4초 후 있는 그대로 보고
        const t = setTimeout(report, 4000);
        return () => clearTimeout(t);
      }
    }
  }, [reportTtsDiag]);

  const reportTtsError = useCallback((error: string, detail?: string) => {
    if (typeof window === 'undefined') return;
    console.warn(`[TTS] ${error}`, detail ?? '');
    try {
      const state = useKioskStore.getState();
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId || 'main',
          eventType: 'error',
          screen: state.currentScreen,
          detail: `tts-error: ${error}${detail ? ` (${detail})` : ''}`,
        }),
      }).catch(() => {});
    } catch {
      // 로깅 실패는 무시
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined') return;
      if (!window.speechSynthesis) {
        reportTtsError('speechSynthesis 미지원 브라우저');
        return;
      }
      if (!text.trim()) return;
      const myGen = ++speechGeneration;
      cancelSpeech();
      clearTimer();
      // paused 고착 watchdog: 말하는 중인데 멈춰 있으면 resume
      resumeRef.current = setInterval(() => {
        if (myGen !== speechGeneration) return;
        try {
          if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        } catch {
          // 무시
        }
      }, 1000);
      const chunks = splitChunks(text);
      let index = 0;
      let stuckRetries = 0;
      const disarmStuckCheck = () => {
        if (stuckTimerRef.current) {
          clearTimeout(stuckTimerRef.current);
          stuckTimerRef.current = null;
        }
      };
      const armStuckCheck = () => {
        disarmStuckCheck();
        // 첫 청크 시작 후에도 엔진이 조용하면 삼켜진 것으로 보고 같은 청크 재발화
        stuckTimerRef.current = setTimeout(() => {
          stuckTimerRef.current = null;
          if (myGen !== speechGeneration) return;
          if (index >= chunks.length) return;
          try {
            if (window.speechSynthesis.speaking || window.speechSynthesis.pending) return;
          } catch {
            return;
          }
          if (stuckRetries < STUCK_RETRY_MAX) {
            stuckRetries += 1;
            cancelSpeech();
            // cancel→speak 레이스 회피: 지연 후 같은 청크 재발화
            timerRef.current = setTimeout(() => {
              if (myGen === speechGeneration) speakNext();
            }, SPEAK_DELAY_MS);
          } else {
            reportTtsError('발화 시작 무응답(재시도 초과)', chunks[index]?.slice(0, 60));
          }
        }, STUCK_CHECK_MS);
      };
      const speakNext = () => {
        // 화면이 바뀌었거나 stop()됐으면 체인 중단
        if (myGen !== speechGeneration) return;
        if (index >= chunks.length) {
          if (resumeRef.current) {
            clearInterval(resumeRef.current);
            resumeRef.current = null;
          }
          return;
        }
        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.rate = rateRef.current;
        utterance.pitch = SPEECH_PITCH;
        utterance.volume = SPEECH_VOLUME;
        // 항상 한국어 지정: fallback 음성(영어 등)이 잡혀도 언어 힌트 유지
        utterance.lang = 'ko-KR';
        const voice = getKoreanVoice();
        if (voice) {
          try {
            utterance.voice = voice;
          } catch {
            // 비정상 voice 객체 거부 시 lang 힌트로 진행
          }
        }
        utterance.onend = () => {
          disarmStuckCheck();
          index += 1;
          speakNext();
        };
        utterance.onerror = (event) => {
          disarmStuckCheck();
          // 취소(cancel)로 인한 에러는 정상 종료로 간주
          const err = (event as SpeechSynthesisErrorEvent)?.error ?? '';
          if (err && err !== 'canceled' && err !== 'interrupted') {
            reportTtsError(`발화 실패: ${err}`, chunks[index]?.slice(0, 60));
          }
        };
        try {
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          disarmStuckCheck();
          reportTtsError('발화 호출 실패', e instanceof Error ? e.message.slice(0, 100) : undefined);
          return;
        }
        // 첫 청크에 대해서만 삼킴 감시 (이후 청크는 onend 체인으로 진행 확인)
        if (index === 0) armStuckCheck();
      };
      // cancel→speak 레이스 회피: 한 틱 뒤 재생 (타이머는 정리 가능)
      timerRef.current = setTimeout(speakNext, SPEAK_DELAY_MS);
    },
    [clearTimer, getKoreanVoice, reportTtsError]
  );

  const speakIntro = useCallback(() => {
    const admin = getAdminScript(currentScreen);
    if (admin) {
      speak(admin.intro);
      return;
    }
    const content = ttsTexts[currentScreen];
    if (content) speak(content.intro);
  }, [currentScreen, speak, getAdminScript]);

  const speakFull = useCallback(() => {
    const admin = getAdminScript(currentScreen);
    if (admin) {
      speak(admin.full);
      return;
    }
    const content = ttsTexts[currentScreen];
    if (content) speak(content.full || content.intro);
  }, [currentScreen, speak, getAdminScript]);

  const stop = useCallback(() => {
    speechGeneration += 1;
    clearTimer();
    cancelSpeech();
  }, [clearTimer]);

  // 항상 최신 speakIntro를 가리키는 ref.
  // (speakIntro는 렌더마다 재생성되므로 effect 의존성에 넣으면 내비게이션 1회에
  // effect가 여러 번 재실행되어 예약된 발화가 early-return으로 파기되는 버그 발생.
  // 실제 재현: 발화 타이머 SET 3ms 뒤 CLEAR 후 재예약 없음 → 전 화면 무음)
  const speakIntroRef = useRef(speakIntro);
  speakIntroRef.current = speakIntro;

  // 화면 전환 시: 이전 발화는 항상 중단.
  // NOTE: 의존성에서 speakIntro를 뺐다. 리렌더로 인한 재실행이 발화 예약을
  // 파기하는 일이 없도록 화면·토글 변화 때만 동작한다.
  useEffect(() => {
    if (!options?.autoSpeak) return;
    if (currentScreen === prevScreenRef.current) return;
    prevScreenRef.current = currentScreen;
    stop();
    if (!userGestured) return;
    if (!ttsEnabled) return;

    const trySpeak = () => speakIntroRef.current();

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        trySpeak();
      } else {
        const handler = () => {
          voicesHandlerRef.current = null;
          window.speechSynthesis.removeEventListener('voiceschanged', handler);
          // 폴백 타이머가 따로 발화하는 이중 시작 방지
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          trySpeak();
        };
        voicesHandlerRef.current = handler;
        window.speechSynthesis.addEventListener('voiceschanged', handler);
        // 폴백 타이머도 정리 가능하게 보관 (이전 화면 텍스트가 뒤늦게 재생되던 버그 수정)
        timerRef.current = setTimeout(trySpeak, 500);
      }
    }

    // 화면이 다시 바뀌거나 언마운트되면 대기 중인 발화 예약을 파기
    return () => {
      clearTimer();
    };
  }, [currentScreen, ttsEnabled, stop, options?.autoSpeak]);

  // 타이머 정리
  useEffect(() => clearTimer, [clearTimer]);

  // 언마운트 시 정지 — autoSpeak 인스턴스(page.tsx, 앱 전체 생명주기 유지)에만 등록.
  // 화면별 인스턴스(ContentLayout/MainMenu)는 화면 전환 시 구 트리가 exit 애니메이션
  // 후 unmount되면서 이 cleanup이 실행돼, 새 화면에서 막 시작한 낭독을 죽이는
  // 버그가 있었다 (메인 이후 화면에서 음성이 안 나오는 원인). 구 화면의 잔여 체인은
  // 화면 전환 시 stop()의 generation 증가로 이미 무효화되므로 여기서 막을 필요 없다.
  const autoSpeak = options?.autoSpeak ?? false;
  useEffect(() => {
    if (!autoSpeak) return;
    return () => {
      speechGeneration += 1;
      cancelSpeech();
    };
  }, [autoSpeak]);

  // ttsEnabled가 false면 즉시 정지
  useEffect(() => {
    if (!ttsEnabled) stop();
  }, [ttsEnabled, stop]);

  const isSupported = typeof window !== 'undefined' && !!window.speechSynthesis;

  return { speak, speakIntro, speakFull, stop, isSupported };
}
