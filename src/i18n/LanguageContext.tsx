import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ko' | 'en';

export interface Translations {
  [key: string]: {
    ko: string;
    en: string;
  };
}

export const TRANSLATIONS = {
  // Navigation & Menus
  appTitle: { ko: '주짓수 스케치', en: 'BJJ Sketch' },
  dashboard: { ko: '대시보드', en: 'Dashboard' },
  home: { ko: '홈', en: 'Home' },
  folder: { ko: '영상 폴더', en: 'Video Folders' },
  add: { ko: '영상 추가', en: 'Add Video' },
  journal: { ko: '학습일지', en: 'Training Journal' },
  mindmap: { ko: '다이어그램', en: 'Diagram' },
  positions: { ko: '포지션 분류', en: 'Positions' },
  watchLogs: { ko: '시청 로그 기록', en: 'Watch History' },
  community: { ko: '자유게시판', en: 'Community' },
  settings: { ko: '환경설정', en: 'Settings' },
  admin: { ko: '관리자 설정', en: 'Admin Center' },
  logout: { ko: '로그아웃', en: 'Log Out' },
  loginWithGoogle: { ko: 'Google 계정으로 시작', en: 'Sign in with Google' },
  cloudSync: { ko: '계정 DB 연동', en: 'Cloud DB Synced' },
  cloudSyncing: { ko: '동기화 중...', en: 'Syncing...' },
  sectionLearn: { ko: '학습', en: 'Learn' },
  sectionTaxonomy: { ko: '기술 체계 & 분류', en: 'Technique System' },
  sectionHistory: { ko: '활동 히스토리', en: 'Activity History' },
  sectionCommunity: { ko: '소통 & 커뮤니티', en: 'Community' },
  sectionAdmin: { ko: '관리 & 설정', en: 'Admin & Settings' },

  // Dashboard KPI
  totalVideos: { ko: '영상 보유', en: 'Total Videos' },
  avgScore: { ko: '숙련도', en: 'Proficiency' },
  strengthsWeaknesses: { ko: '강점 및 약점', en: 'Strengths & Weaknesses' },
  strengths: { ko: '강점', en: 'Strengths' },
  weaknesses: { ko: '약점', en: 'Weaknesses' },
  reviews30Days: { ko: '복습 (30일 이내)', en: 'Reviews (30d)' },
  itemUnit: { ko: '개', en: ' items' },
  scoreUnit: { ko: '점', en: ' pts' },
  timeUnit: { ko: '회', en: ' times' },

  // Dashboard Charts & Tables
  techStats: { ko: '기술 통계', en: 'Technique Stats' },
  viewLarger: { ko: '크게 보기', en: 'Expand' },
  posStats: { ko: '포지션 통계', en: 'Position Stats' },
  byCount: { ko: '보유량순', en: 'By Count' },
  byScore: { ko: '숙련도순', en: 'By Score' },
  byWeak: { ko: '취약순', en: 'Weakest' },
  byRecent: { ko: '최근수련순', en: 'Recent' },
  giVsNoGi: { ko: 'Gi vs No-Gi 보유량 및 숙련도 비교', en: 'Gi vs No-Gi Count & Proficiency' },
  giOnly: { ko: 'Gi (도복 전용)', en: 'Gi Only' },
  noGiOnly: { ko: 'No-Gi (노기 / 레슬링)', en: 'No-Gi' },
  allGiNoGi: { ko: 'All (도복/노기 공통)', en: 'All (Both)' },
  isolatedNodes: { ko: '테크 트리 고립 노드', en: 'Isolated Tech Tree Nodes' },
  isolatedDesc: { ko: '연계 체인이 연결되지 않은 기술입니다.', en: 'Techniques not yet linked to chains.' },
  neglectedAlerts: { ko: '방치된 기술 알림', en: 'Neglected Technique Alerts' },
  neglectedDesc: { ko: '60일 이상 미수련 상태인 기술입니다.', en: 'Techniques unpracticed for 60+ days.' },
  openBtn: { ko: '열기', en: 'Open' },

  // Taxonomy Categories in Radar Chart
  guardPlay: { ko: '가드 운용', en: 'Guard Play' },
  guardPass: { ko: '가드 패스', en: 'Guard Pass' },
  submission: { ko: '서브미션', en: 'Submission' },
  escapeDefense: { ko: '이스케이프 & 디펜스', en: 'Escape & Defense' },
  takedownStanding: { ko: '테이크다운 & 스탠딩', en: 'Takedown & Standing' },

  // Community Board
  boardTitle: { ko: '자유게시판', en: 'Community Board' },
  writePost: { ko: '글쓰기', en: 'Write' },
  numberCol: { ko: '번호', en: 'No.' },
  categoryCol: { ko: '말머리', en: 'Category' },
  titleCol: { ko: '제목', en: 'Title' },
  authorCol: { ko: '글쓴이', en: 'Author' },
  dateCol: { ko: '작성일', en: 'Date' },
  viewsCol: { ko: '조회', en: 'Views' },
  likesCol: { ko: '추천', en: 'Like' },
  dislikesCol: { ko: '비추', en: 'Dislike' },
  manageCol: { ko: '관리', en: 'Manage' },
  noticeBadge: { ko: '공지', en: 'Notice' },
  generalCat: { ko: '일반', en: 'General' },
  videoCat: { ko: '영상', en: 'Video' },
  pollBadge: { ko: '투표', en: 'Poll' },
  clipBadge: { ko: '클립', en: 'Clip' },
  privateBadge: { ko: '비공개', en: 'Private' },
  searchPlaceholder: { ko: '검색어 입력...', en: 'Search keywords...' },
  searchBtn: { ko: '검색', en: 'Search' },
  backToList: { ko: '목록으로', en: 'Back' },
  refreshBtn: { ko: '새로고침', en: 'Refresh' },
  unprivateBtn: { ko: '비공개 해제', en: 'Unblind' },
  makePrivateBtn: { ko: '비공개', en: 'Blind' },
  deleteBtn: { ko: '삭제', en: 'Delete' },
  recommendBtn: { ko: '추천', en: 'Like' },
  dislikeBtn: { ko: '비추', en: 'Dislike' },
  commentsTitle: { ko: '댓글', en: 'Comments' },
  submitCommentBtn: { ko: '등록', en: 'Submit' },
  replyBtn: { ko: '답글', en: 'Reply' },
  cancelBtn: { ko: '취소', en: 'Cancel' },

  // Write Form
  enterTitle: { ko: '제목을 입력하세요', en: 'Enter post title...' },
  enterContent: { ko: '내용을 자유롭게 입력하세요...', en: 'Write content freely...' },
  optionText: { ko: '텍스트', en: 'Text' },
  optionVideoArchive: { ko: '영상 보관함', en: 'Archive' },
  optionYoutube: { ko: 'YouTube', en: 'YouTube' },
  optionPoll: { ko: '투표', en: 'Poll' },
  optionPollConfigured: { ko: '투표✓', en: 'Poll✓' },
  pollQuestionPlaceholder: { ko: '투표 질문 입력 (선택)', en: 'Enter poll question...' },
  pollOptionPlaceholder: { ko: '선택지 입력', en: 'Option text' },
  pollAllowMultiple: { ko: '복수 선택 허용', en: 'Allow multiple votes' },
  pollAddOption: { ko: '선택지 추가', en: 'Add Option' },
  pollVoteBtn: { ko: '투표하기', en: 'Vote' },
  pollMyVote: { ko: '내 투표', en: 'My Vote' },

  // Settings
  languageSettingTitle: { ko: '언어 설정 (Language)', en: 'Language Selection' },
  languageSettingDesc: { ko: '한국어 또는 영어(English)로 서비스 언어를 전환합니다.', en: 'Switch service language between Korean and English.' },
  korean: { ko: '한국어', en: 'Korean' },
  english: { ko: 'English', en: 'English' },
  nicknameSettingTitle: { ko: '자유게시판 닉네임 설정', en: 'Community Nickname' },
  nicknameSettingDesc: { ko: '게시판 글쓴이명으로 적용됩니다', en: 'Used as your author name on the board' },
  saveBtn: { ko: '저장', en: 'Save' },
  excelBackupTitle: { ko: '엑셀(.xlsx) 데이터 백업 및 복원', en: 'Excel Data Backup & Restore' },
  exportExcelBtn: { ko: '엑셀 데이터 백업', en: 'Export Excel' },
  importExcelBtn: { ko: '엑셀 데이터 복원', en: 'Restore Excel' },
  dbResetTitle: { ko: '데이터베이스 전체 초기화', en: 'Reset Database' },
  dbResetBtn: { ko: '초기화 실행', en: 'Reset Now' },
  proficiencySettingTitle: { ko: '숙련도 기준 점수 설정', en: 'Proficiency Score Thresholds' },
  strengthThreshold: { ko: '강점 기술 기준', en: 'Strength Threshold' },
  weaknessThreshold: { ko: '약점 기술 기준', en: 'Weakness Threshold' },
  closeBtn: { ko: '닫기', en: 'Close' },
  confirmBtn: { ko: '확인', en: 'Confirm' },
  hiddenBadge: { ko: '숨김', en: 'Hidden' },
  logoutConfirm: { ko: '정말 로그아웃 하시겠습니까?', en: 'Are you sure you want to log out?' },
  keepLogin: { ko: '로그인 유지', en: 'Stay Logged In' },

  // Landing Page
  landingHeroBadge: { ko: '합리적인 무료 클라우드로 즉시 시작하세요', en: 'Get started instantly on free cloud storage' },
  landingHeroSub: { ko: 'Google 원클릭 계정 연동으로 나만의 독립된 기술 아카이브가 즉시 생성됩니다.', en: 'One-click Google sign-in creates your private technique vault.' },
  landingEmpathyTitle: { ko: '"이런 적 있으신가요?"', en: '"Have you ever experienced this?"' },
  landingCard1Title: { ko: '저장해 둔 영상은 많은데 정작 스파링할 땐 생각이 안 날 때', en: 'Saved tons of clips, but draw a blank during sparring' },
  landingCard1Desc: { ko: '인스타그램이나 유튜브 보관함에 영상은 가득하지만, 나중에 찾으려면 어디 있는지 알기 어렵습니다.', en: 'Your bookmarks are overflowing, but finding that specific counter is impossible.' },
  landingCard2Title: { ko: '기술 하나가 막히면 다음 동작이 안 떠오를 때', en: 'When one move is blocked and you have no follow-up' },
  landingCard2Desc: { ko: '스윕이나 서브미션을 시도했다가 상대가 방어하면 흐름이 뚝 끊겨 당황하곤 합니다.', en: 'You attempt a sweep, opponent bases out, and your entire attack chain dies.' },
  landingCard3Title: { ko: '내가 요즘 뭘 연습하고 있는지 흐릿할 때', en: 'Losing clarity on what skills you need to develop' },
  landingCard3Desc: { ko: '좋아하는 기술만 계속 쓰다 보니, 정작 취약한 포지션 탈출이나 기본기는 한동안 연습하지 않은 채 지나치기 쉽습니다.', en: 'Spamming favourite attacks while ignoring critical escapes and weak positions.' },
  landingSolutionBadge: { ko: '핵심 솔루션 안내', en: 'Core Solution' },
  landingSolutionTitle: { ko: '유튜브로 영상 공부는 하는데, 기억을 못하신다고요?', en: 'Studying on YouTube but forgetting on the mats?' },
  landingSolutionDesc: { ko: '주짓수 스케치는 수련자 여러분이 진짜 필요하다고 하신 마인드맵, 유튜브 타임라인, 자기만의 폴더 저장, 메모가 가능해요.', en: 'BJJ Sketch provides interactive diagrams, YouTube timestamps, custom folders, and training memos.' },
} as const;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof TRANSLATIONS) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'ko',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => TRANSLATIONS[key]?.ko || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('bjj_app_language');
      if (saved === 'en' || saved === 'ko') return saved;
    } catch {}
    return 'ko'; // 기본 한국어
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('bjj_app_language', lang);
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
  };

  const t = (key: keyof typeof TRANSLATIONS): string => {
    const item = TRANSLATIONS[key];
    if (!item) return String(key);
    return item[language] || item.ko || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
