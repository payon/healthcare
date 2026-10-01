/**
 * 장비 준비단계/주의사항 정규화.
 *
 * DB에는 두 가지 모양이 섞여 있다:
 * - 시드 데이터: 주의사항이 {level, text} 객체 배열
 * - 관리자 저장분: 주의사항이 문자열 배열
 * 키오스크는 객체를, 관리자 대화상자는 문자열을 기대하므로,
 * 경계(API)에서 각각 맞는 모양으로 변환한다.
 */

export interface Precaution {
  level: string;
  text: string;
}

function parseJsonArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function precautionText(item: unknown): string {
  if (typeof item === 'string') return item.trim();
  if (item && typeof item === 'object') {
    const text = (item as { text?: unknown }).text;
    if (typeof text === 'string') return text.trim();
  }
  return '';
}

/** 관리자 대화상자용: 무엇이 와도 문자열 배열로 */
export function precautionToTexts(input: unknown): string[] {
  return parseJsonArray(input).map(precautionText).filter(Boolean);
}

/** 문자열 단계용 (준비단계): 객체가 섞여 와도 안전하게 */
export function stepList(input: unknown): string[] {
  return parseJsonArray(input)
    .map((s) => (typeof s === 'string' ? s.trim() : precautionText(s)))
    .filter(Boolean);
}

const VALID_LEVELS = new Set(['info', 'warning', 'danger']);

/** 키오스크/DB 저장용: 무엇이 와도 {level, text} 배열로 (기본 warning) */
export function precautionToObjects(input: unknown): Precaution[] {
  return parseJsonArray(input)
    .map((item): Precaution | null => {
      if (typeof item === 'string') {
        const text = item.trim();
        return text ? { level: 'warning', text } : null;
      }
      if (item && typeof item === 'object') {
        const text = precautionText(item);
        if (!text) return null;
        const level = (item as { level?: unknown }).level;
        return {
          level: typeof level === 'string' && VALID_LEVELS.has(level) ? level : 'warning',
          text,
        };
      }
      return null;
    })
    .filter((p): p is Precaution => p !== null);
}
