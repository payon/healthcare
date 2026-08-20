'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useKioskStore, type Screen } from '@/store/kiosk-store';
import { ttsTexts } from '@/lib/tts-texts';

/** 말하기 속도 (0.1~2.0, 노인층을 위해 약간 느리게) */
const SPEECH_RATE = 0.85;
/** 음높이 (0~2, 1.0이 기본) */
const SPEECH_PITCH = 1.0;
/** 볼륨 (0~1) */
const SPEECH_VOLUME = 1.0;

/**
 * Web Speech API 기반 TTS 훅
 * - 화면 전환 시 자동으로 해당 화면의 intro 텍스트를 읽음
 * - "다시 듣기" 버튼으로 수동 재생 가능
 * - ttsEnabled 상태에 따라 켜기/끄기 가능
 */
export function useTTS() {
  const currentScreen = useKioskStore((s) => s.currentScreen);
  const ttsEnabled = useKioskStore((s) => s.ttsEnabled);
  const prevScreenRef = useRef<Screen | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  /** 한국어 음성을 찾음 */
  const getKoreanVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    // 1순위: Korean voice
    const krVoice = voices.find((v) => v.lang.startsWith('ko'));
    if (krVoice) return krVoice;
    // 2순위: 한국어 포함
    const krLike = voices.find((v) =>
      v.lang.includes('KO') || v.lang.includes('kr') || v.name.includes('Korean')
    );
    return krLike || voices[0] || null;
  }, []);

  /** 텍스트 읽기 */
  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined') return;
      if (!window.speechSynthesis) return;

      // 기존 음성 중지
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = SPEECH_RATE;
      utterance.pitch = SPEECH_PITCH;
      utterance.volume = SPEECH_VOLUME;

      const voice = getKoreanVoice();
      if (voice) {
        utterance.voice = voice;
      } else {
        utterance.lang = 'ko-KR';
      }

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [getKoreanVoice]
  );

  /** 현재 화면 intro 읽기 */
  const speakIntro = useCallback(() => {
    const content = ttsTexts[currentScreen];
    if (content) {
      speak(content.intro);
    }
  }, [currentScreen, speak]);

  /** 현재 화면 전체 읽기 */
  const speakFull = useCallback(() => {
    const content = ttsTexts[currentScreen];
    if (content) {
      speak(content.full || content.intro);
    }
  }, [currentScreen, speak]);

  /** 음성 정지 */
  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // 화면 전환 감지 → 자동 읽기
  useEffect(() => {
    if (currentScreen === prevScreenRef.current) return;
    prevScreenRef.current = currentScreen;

    if (!ttsEnabled) return;
    if (currentScreen === 'standby') return; // 대기 화면은 자동 읽지 않음

    // 음성 목록 로딩 대기
    const trySpeak = () => {
      speakIntro();
    };

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        trySpeak();
      } else {
        // voiceschanged 이벤트 대기 (크롬에서 비동기 로딩)
        const handler = () => {
          window.speechSynthesis.removeEventListener('voiceschanged', handler);
          trySpeak();
        };
        window.speechSynthesis.addEventListener('voiceschanged', handler);
        // 폴백: 500ms 후 시도
        setTimeout(trySpeak, 500);
      }
    }
  }, [currentScreen, ttsEnabled, speakIntro]);

  // 언마운트 시 정지
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // iOS/Safari 버그 방지: ttsEnabled가 false면 즉시 정지
  useEffect(() => {
    if (!ttsEnabled) {
      stop();
    }
  }, [ttsEnabled, stop]);

  return { speak, speakIntro, speakFull, stop };
}
