/**
 * 키오스크 메뉴 정의 (단일 소스).
 * 표시 순서는 관리자 지정(menu.order)이 적용되고, 여기서는 항목 정의만 한다.
 * - 데스크톱: 사이드바 + 메인 그리드
 * - 모바일: 하단 탭(상위 4개 + 더보기) + 메인 카드 + 더보기 화면
 */
import {
  Activity,
  MapPin,
  Smartphone,
  UserPlus,
  Fingerprint,
  LogIn,
  User,
  ClipboardCheck,
  Stethoscope,
  FileBarChart,
  ArrowRightCircle,
  Home,
  Ellipsis,
  type LucideIcon,
} from 'lucide-react';
import type { Screen } from '@/store/kiosk-store';

export interface KioskMenuItem {
  screen: Screen;
  label: string;
  description: string;
  icon: LucideIcon;
}

/** 데스크톱 그리드/사이드바용 전체 항목 (completion CTA 포함) */
export const DESKTOP_MENU_ITEMS: KioskMenuItem[] = [
  { screen: 'equipment-intro', label: '장비 소개', description: 'Biogram MINI 측정 항목을 소개합니다', icon: Activity },
  { screen: 'location', label: '설치 위치 안내', description: '장비가 설치된 위치를 안내합니다', icon: MapPin },
  { screen: 'app-install', label: '앱 설치 안내', description: '바이오그램 앱 설치 방법을 안내합니다', icon: Smartphone },
  { screen: 'signup', label: '회원가입 안내', description: '회원가입 절차를 안내합니다', icon: UserPlus },
  { screen: 'vein-register', label: '지정맥 등록 안내', description: '지정맥 등록 방법을 안내합니다', icon: Fingerprint },
  { screen: 'login', label: '로그인 안내', description: '지정맥/QR 로그인 방법을 안내합니다', icon: LogIn },
  { screen: 'non-member', label: '비회원 안내', description: '비회원 체험 방법을 안내합니다', icon: User },
  { screen: 'measurement-mode', label: '측정 시작 안내', description: '전체측정/선택측정 방법을 안내합니다', icon: ClipboardCheck },
  { screen: 'measurement-equipment', label: '측정 장비 안내', description: '각 장비별 측정 방법을 안내합니다', icon: Stethoscope },
  { screen: 'results', label: '결과 확인 안내', description: '측정 결과 확인 방법을 안내합니다', icon: FileBarChart },
  { screen: 'completion', label: '실제 장비로 이동', description: '교육을 마치고 장비로 이동합니다', icon: ArrowRightCircle },
];

/** 모바일 카드/하단 탭용 (completion 제외 — 별도 CTA 버튼 존재) */
export const MOBILE_CARDS: KioskMenuItem[] = [
  { screen: 'equipment-intro', label: '장비 알아보기', description: '측정 항목 소개', icon: Activity },
  { screen: 'location', label: '위치/설치', description: '설치 위치 안내', icon: MapPin },
  { screen: 'app-install', label: '앱 설치', description: '앱 설치 방법', icon: Smartphone },
  { screen: 'signup', label: '회원가입/로그인', description: '가입 및 로그인', icon: UserPlus },
  { screen: 'vein-register', label: '지정맥 등록', description: '등록 방법 안내', icon: Fingerprint },
  { screen: 'login', label: '로그인 안내', description: '지정맥/QR 로그인', icon: LogIn },
  { screen: 'non-member', label: '비회원 안내', description: '비회원 이용법', icon: User },
  { screen: 'measurement-mode', label: '측정 시작', description: '측정 모드 안내', icon: ClipboardCheck },
  { screen: 'measurement-equipment', label: '장비별 안내', description: '장비별 측정법', icon: Stethoscope },
  { screen: 'results', label: '결과 확인', description: '결과 확인 방법', icon: FileBarChart },
];

/** 화면 → 아이콘 (하단 탭·사이드바 공용) */
export const SCREEN_ICONS: Record<Screen, LucideIcon> = {
  main: Home,
  'equipment-intro': Activity,
  location: MapPin,
  'app-install': Smartphone,
  signup: UserPlus,
  'vein-register': Fingerprint,
  login: LogIn,
  'non-member': User,
  'measurement-mode': ClipboardCheck,
  'measurement-equipment': Stethoscope,
  results: FileBarChart,
  completion: ArrowRightCircle,
  more: Ellipsis,
};

/** 화면 → 짧은 라벨 (하단 탭·사이드바 공용) */
export const SCREEN_SHORT_LABELS: Record<Screen, string> = {
  main: '홈',
  'equipment-intro': '장비',
  location: '위치',
  'app-install': '앱설치',
  signup: '가입',
  'vein-register': '지정맥',
  login: '로그인',
  'non-member': '비회원',
  'measurement-mode': '측정',
  'measurement-equipment': '장비안내',
  results: '결과',
  completion: '장비이동',
  more: '더보기',
};
