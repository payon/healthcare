'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useKioskStore, type Screen } from '@/store/kiosk-store';
import { ttsTexts } from '@/lib/tts-texts';

const SPEECH_RATE = 0.85;
const SPEECH_PITCH = 1.0;
const SPEECH_VOLUME = 1.0;
// Chrome(특히 모바일)은 긴 발화를 중간에 멈추는 버그가 있어 문장 단위로 쪼개 재생한다.
const CHUNK_MAX = 180;
// cancel() 직후 speak()이 무시되는 Chrome 레이스 회피용 지연
const SPEAK_DELAY_MS = 80;

interface UseTTSOptions {
  /** 화면 전환 시 자동 읽기 여부. page.tsx에서만 true로 설정 */
  autoSpeak?: boolean;
}

// 모든 useTTS 인스턴스가 공유하는 발화 세대. speak/stop이 호출되면 증가하여
// 이전 화면에서 시작된 체인·타이머가 뒤늦게 말하는 일을 구조적으로 막는다.
let speechGeneration = 0;

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
  const voicesHandlerRef = useRef<(() => void) | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis && voicesHandlerRef.current) {
      window.speechSynthesis.removeEventListener('voiceschanged', voicesHandlerRef.current);
      voicesHandlerRef.current = null;
    }
  }, []);

  const getKoreanVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    const krVoice = voices.find((v) => v.lang.startsWith('ko'));
    if (krVoice) return krVoice;
    const krLike = voices.find(
      (v) => v.lang.includes('KO') || v.lang.includes('kr') || v.name.includes('Korean')
    );
    return krLike || voices[0] || null;
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined') return;
      if (!window.speechSynthesis) return;
      if (!text.trim()) return;
      const myGen = ++speechGeneration;
      cancelSpeech();
      clearTimer();
      const chunks = splitChunks(text);
      let index = 0;
      const speakNext = () => {
        // 화면이 바뀌었거나 stop()됐으면 체인 중단
        if (myGen !== speechGeneration) return;
        if (index >= chunks.length) return;
        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.rate = SPEECH_RATE;
        utterance.pitch = SPEECH_PITCH;
        utterance.volume = SPEECH_VOLUME;
        const voice = getKoreanVoice();
        if (voice) utterance.voice = voice;
        else utterance.lang = 'ko-KR';
        utterance.onend = () => {
          index += 1;
          speakNext();
        };
        utterance.onerror = () => {
          // 취소(cancel)로 인한 에러는 정상 종료로 간주
        };
        window.speechSynthesis.speak(utterance);
      };
      // cancel→speak 레이스 회피: 한 틱 뒤 재생 (타이머는 정리 가능)
      timerRef.current = setTimeout(speakNext, SPEAK_DELAY_MS);
    },
    [clearTimer, getKoreanVoice]
  );

  const speakIntro = useCallback(() => {
    const content = ttsTexts[currentScreen];
    if (content) speak(content.intro);
  }, [currentScreen, speak]);

  const speakFull = useCallback(() => {
    const content = ttsTexts[currentScreen];
    if (content) speak(content.full || content.intro);
  }, [currentScreen, speak]);

  const stop = useCallback(() => {
    speechGeneration += 1;
    clearTimer();
    cancelSpeech();
  }, [clearTimer]);

  // 화면 전환 시: 이전 발화는 항상 중단. standby 진입 시도 중단만 하고 읽지 않음.
  useEffect(() => {
    if (!options?.autoSpeak) return;
    if (currentScreen === prevScreenRef.current) return;
    prevScreenRef.current = currentScreen;
    stop();
    if (!ttsEnabled) return;
    if (currentScreen === 'standby') return;

    const trySpeak = () => speakIntro();

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        trySpeak();
      } else {
        const handler = () => {
          voicesHandlerRef.current = null;
          window.speechSynthesis.removeEventListener('voiceschanged', handler);
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
  }, [currentScreen, ttsEnabled, speakIntro, stop, options?.autoSpeak]);

  // 타이머 정리
  useEffect(() => clearTimer, [clearTimer]);

  // 언마운트 시 정지
  useEffect(() => {
    return () => {
      speechGeneration += 1;
      cancelSpeech();
    };
  }, []);

  // ttsEnabled가 false면 즉시 정지
  useEffect(() => {
    if (!ttsEnabled) stop();
  }, [ttsEnabled, stop]);

  return { speak, speakIntro, speakFull, stop };
}
