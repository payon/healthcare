'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useKioskStore, type Screen } from '@/store/kiosk-store';
import { ttsTexts } from '@/lib/tts-texts';

const SPEECH_RATE = 0.85;
const SPEECH_PITCH = 1.0;
const SPEECH_VOLUME = 1.0;

interface UseTTSOptions {
  /** 화면 전환 시 자동 읽기 여부. page.tsx에서만 true로 설정 */
  autoSpeak?: boolean;
}

export function useTTS(options?: UseTTSOptions) {
  const currentScreen = useKioskStore((s) => s.currentScreen);
  const ttsEnabled = useKioskStore((s) => s.ttsEnabled);
  const prevScreenRef = useRef<Screen | null>(null);

  const getKoreanVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    const krVoice = voices.find((v) => v.lang.startsWith('ko'));
    if (krVoice) return krVoice;
    const krLike = voices.find((v) =>
      v.lang.includes('KO') || v.lang.includes('kr') || v.name.includes('Korean')
    );
    return krLike || voices[0] || null;
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined') return;
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = SPEECH_RATE;
      utterance.pitch = SPEECH_PITCH;
      utterance.volume = SPEECH_VOLUME;
      const voice = getKoreanVoice();
      if (voice) utterance.voice = voice;
      else utterance.lang = 'ko-KR';
      window.speechSynthesis.speak(utterance);
    },
    [getKoreanVoice]
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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // 화면 전환 시 자동 읽기 (autoSpeak=true인 경우만)
  useEffect(() => {
    if (!options?.autoSpeak) return;
    if (currentScreen === prevScreenRef.current) return;
    prevScreenRef.current = currentScreen;
    if (!ttsEnabled) return;
    if (currentScreen === 'standby') return;

    const trySpeak = () => speakIntro();

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        trySpeak();
      } else {
        const handler = () => {
          window.speechSynthesis.removeEventListener('voiceschanged', handler);
          trySpeak();
        };
        window.speechSynthesis.addEventListener('voiceschanged', handler);
        setTimeout(trySpeak, 500);
      }
    }
  }, [currentScreen, ttsEnabled, speakIntro, options?.autoSpeak]);

  // 언마운트 시 정지
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // ttsEnabled가 false면 즉시 정지
  useEffect(() => {
    if (!ttsEnabled) stop();
  }, [ttsEnabled, stop]);

  return { speak, speakIntro, speakFull, stop };
}
