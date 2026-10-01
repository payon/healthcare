/**
 * 키오스크 이용 방법 도움말 콘텐츠
 * HelpDialog에서 화면 표시용 + TTS 음성 안내용으로 함께 사용한다.
 */

export interface HelpStep {
  title: string;
  description: string;
}

export const helpSteps: HelpStep[] = [
  {
    title: '시작하기',
    description: '대기 화면에서 ‘터치하여 시작하기’ 버튼을 누르면 교육이 시작됩니다.',
  },
  {
    title: '메뉴 선택하기',
    description: '배우고 싶은 항목(장비 소개, 앱 설치, 측정 방법 등)을 터치하면 해당 안내 화면으로 이동합니다.',
  },
  {
    title: '음성 안내 듣기',
    description:
      '우측 상단(또는 상단)의 스피커 버튼으로 음성 안내를 켤 수 있습니다. 켜면 화면이 바뀔 때마다 내용을 읽어주고, ‘요약 듣기·전체 듣기’로 다시 들을 수 있습니다.',
  },
  {
    title: '글자 크기 조절',
    description: '글자가 작게 느껴지면 접근성 설정에서 ‘크게’ 또는 ‘아주 크게’를 선택하세요. 화면 전체가 확대됩니다.',
  },
  {
    title: '고대비 화면',
    description: '눈 모양 버튼으로 고대비 모드를 켜면 검은 배경에 밝은 글자로 표시되어 잘 보입니다.',
  },
  {
    title: '이동·종료',
    description:
      '‘뒤로’ 버튼으로 이전 화면, ‘홈’으로 처음 메뉴로 돌아갑니다. 2분 동안 터치가 없으면 자동으로 대기 화면으로 돌아가니 안심하세요.',
  },
];

/** 도움말 전체를 읽어주는 TTS 대본 */
export const helpTtsScript = [
  '바이오그램 미니 교육 키오스크 이용 방법을 안내해 드립니다.',
  ...helpSteps.map((s, i) => ` ${i + 1}. ${s.title}. ${s.description}`),
  ' 설명이 끝났습니다. 닫기 버튼을 눌러 교육을 계속해 주세요.',
].join(' ');
