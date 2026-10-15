export type SubmissionCompassDirection = 'N' | 'W' | 'E' | 'S';
export type SubmissionGroupId = string;

export interface TimelineFrame {
  id: string;
  timeSeconds: number;
  timeLabel: string;
  stepTitle: string;
  detailNote: string;
  snapshotDataUrl?: string;
}

export interface JournalMemo {
  id: string;
  date: string;
  timeSeconds: number;
  timeLabel: string;
  content: string;
  imageUrl?: string;
  techniqueTag?: string;
  createdAt: string;
}

export interface TechniqueVideo {
  id: string;
  youtubeUrl: string;
  youtubeId: string;
  titleKo: string;
  titleEn: string;
  thumbnailUrl: string;
  position: string;
  positions?: string[];
  category: string;
  categories?: string[];
  endPosition?: string;
  endPositions?: string[];
  giType: string;
  difficulty: string;
  submissionGroup: SubmissionGroupId | 'none';
  submissionDetail: string;
  proficiencyScore: number;
  isFavorite: boolean;
  generalNotes: string;
  timelineFrames: TimelineFrame[];
  journalMemos: JournalMemo[];
  practiceDates: string[];
  nextTechniqueIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PositionFolder {
  id: string;
  name: string;
  nameEn: string;
  subCategories: string[];
  group?: '스탠딩 및 특수 포지션' | '탑 & 도미넌트 (상위)' | '가드 포지션 (하위)' | string;
  description?: string;
  isGlobalDefault?: boolean;
}

export interface SubmissionCompassGroup {
  id: SubmissionGroupId;
  direction?: SubmissionCompassDirection;
  directionLabel?: string;
  name: string;
  hubTitle: string;
  customImageUrl?: string;
  items: string[];
  isCustom?: boolean;
  isGlobalDefault?: boolean;
  description?: string;
}

export interface MetadataConfig {
  positions: PositionFolder[];
  categories: string[];
  giTypes: string[];
  difficulties: string[];
  submissions: SubmissionCompassGroup[];
}

export interface FolderClusterLayout {
  x: number;
  y: number;
  collapsed: boolean;
}

export interface CardOffsetLayout {
  dx: number;
  dy: number;
}

export interface MindmapModeLayout {
  folders: Record<string, FolderClusterLayout>;
  cardOffsets: Record<string, CardOffsetLayout>;
  submissionOffsets?: Record<string, { x: number; y: number }>;
}

export interface MindmapStorageState {
  byPosition: MindmapModeLayout;
  byCategory: MindmapModeLayout;
}

export interface FolderColorsConfig {
  guard?: string;
  dominant?: string;
  other?: string;
  [key: string]: string | undefined;
}

export interface MindmapColorsConfig {
  startPositionColor?: string;     // 시작 포지션 폴더 테두리/포인트 색상 (기본: #0284c7)
  endPositionLineColor?: string;   // 최종 포지션 전개 연결선 색상 (기본: #8b5cf6)
  submissionLineColor?: string;    // 서브미션 피니시 연결선 색상 (기본: #f43f5e)
  submissionNodeColor?: string;    // 서브미션 피니시 노드 배경/테두리 색상 (기본: #e11d48)
}

export interface LandingShowcaseConfig {
  headline?: string;
  subheadline?: string;
  headerLoginButtonText?: string;
  empathyTitle?: string;
  empathyImageUrl?: string;
  empathyPoints?: Array<{ title: string; desc: string }>;
  featuresBadge?: string;
  featuresTitle?: string;
  featuresHighlightTitle?: string;
  featuresHighlightSub?: string;
  featuresFooterCallout?: string;
  featuresList?: Array<{
    title: string;
    subtitle?: string;
    desc: string;
    imageUrl?: string;
  }>;
  comparisonTitle?: string;
  comparisonCategoryHeader?: string;
  comparisonBeforeHeader?: string;
  comparisonAfterHeader?: string;
  comparisonItems?: Array<{ category: string; before: string; after: string }>;
  ctaBadge?: string;
  ctaQuote?: string;
  ctaSubtext?: string;
  ctaButtonText?: string;
  ctaNoteText?: string;
  heroImageUrl?: string;
  footerText?: string;
  youtubeUrl?: string;
  showYoutube?: boolean;
  instagramUrl?: string;
  showInstagram?: boolean;
}

export type MindmapToolbarPosition = 'top' | 'bottom' | 'left' | 'right';

export interface WatchHistoryLog {
  id: string;
  userId?: string;
  userEmail?: string;
  videoId: string;
  videoTitleKo: string;
  videoTitleEn?: string;
  thumbnailUrl?: string;
  position: string;
  category: string;
  giType?: string;
  submissionGroup?: string;
  submissionDetail?: string;
  difficulty?: string;
  proficiencyScore?: number;
  watchedAt: string; // ISO string e.g. 2026-10-03T15:28:00.000Z
  source?: 'direct' | 'search' | 'mindmap' | 'journal' | 'stats' | 'folder';
}

export interface CommunityVideoClip {
  id: string;
  clipNumber: number;
  startTime: number;
  endTime?: number;
  timeLabel: string;
  question: string;
}

export type CommunityPostType = 'TEXT' | 'VIDEO_CLIPS';

export interface CommunityPollOption {
  id: string;
  text: string;
  voteCount: number;
  votedUserIds: string[];
}

export interface CommunityPoll {
  id: string;
  question: string;
  options: CommunityPollOption[];
  allowMultiple?: boolean;
  totalVotes: number;
  closed?: boolean;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  postNumber?: number;
  userId: string;
  userEmail: string;
  userName: string;
  userPhotoUrl?: string;
  title: string;
  content: string;
  category: string;
  postType: CommunityPostType;
  
  // Video attachments
  youtubeUrl?: string;
  youtubeId?: string;
  videoTitle?: string;
  thumbnailUrl?: string;
  positionTag?: string;
  
  // Multi clips with individual questions
  clips?: CommunityVideoClip[];
  
  // Poll / Voting
  poll?: CommunityPoll;
  isNotice?: boolean; // 관리자 공지글
  
  tags: string[];
  viewsCount: number;
  likesCount: number;
  likedUserIds: string[];
  dislikesCount?: number;
  dislikedUserIds?: string[];
  commentsCount: number;
  
  isPrivateByAdmin?: boolean;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  parentId?: string | null;
  userId: string;
  userEmail: string;
  userName: string;
  userPhotoUrl?: string;
  content: string;
  likesCount?: number;
  likedUserIds?: string[];
  isPrivateByAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NavMenuVisibilityConfig {
  home?: boolean;        // 홈 (통계 대시보드)
  folder?: boolean;      // 영상 폴더
  add?: boolean;         // 영상 추가
  journal?: boolean;     // 학습일지
  classJournal?: boolean;// 수업일지 (관리자 전용)
  mindmap?: boolean;     // 다이어그램
  positions?: boolean;   // 포지션 분류
  community?: boolean;   // 자유게시판
  watchLogs?: boolean;   // 로그기록 (시청 기록)
}

export interface ClassJournalStyleConfig {
  cardBgColor?: string; // 관장님 수업일지 카드 배경색 (기본값: #fffbeb)
  borderColor?: string; // 모서리 선/테두리 색상 (기본값: #f59e0b)
  badgeLabel?: string;  // 뱃지 라벨 (기본값: '관장님 수업')
}

export interface ClassJournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  videoId: string;
  videoTitleKo: string;
  videoTitleEn?: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string;
  position: string;
  category: string;
  categories?: string[];
  endPosition?: string;
  giType?: string;
  difficulty?: string;
  proficiencyScore?: number;
  generalNotes?: string;
  journalMemos?: JournalMemo[];
  timelineFrames?: TimelineFrame[];
  isPublished: boolean; // 회원 공개 (true) vs 비공개 (false)
  targetTeamMemberUids?: string[]; // 특정 팀원 UID 목록 (비어있으면 팀원 전체)
  instructorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  appTitle: string;
  appSubtitle: string;
  logoText: string;
  logoImageUrl: string;
  highScoreThreshold: number;
  lowScoreThreshold: number;
  neglectedDaysThreshold: number;
  viewportPreviewMode: 'pc' | 'mobile';
  mindmapTheme?: 'white' | 'dark';
  mindmapToolbarPosition?: MindmapToolbarPosition;
  allowTimelineMemoImages?: boolean;
  primaryColor?: string;
  hideEmptyFolders?: boolean;
  folderColors?: FolderColorsConfig;
  mindmapColors?: MindmapColorsConfig;
  landingShowcase?: LandingShowcaseConfig;
  menuVisibility?: NavMenuVisibilityConfig;
  weeklyViewLayout?: 'horizontal' | 'vertical';
  journalLayoutPc?: 'horizontal' | 'vertical';
  journalLayoutMobile?: 'horizontal' | 'vertical';
  userNickname?: string;
  classJournalStyle?: ClassJournalStyleConfig;
}

export type ActiveModuleTab =
  | 'add'
  | 'folder'
  | 'journal'
  | 'class_journal'
  | 'ai_class_recommend'
  | 'mindmap'
  | 'stats'
  | 'positions'
  | 'community'
  | 'watch_logs'
  | 'admin'
  | 'settings';

export type AiRecommendLanguage = 'ko' | 'en' | 'all';
export type AiRecommendDayStyle = 'gi' | 'nogi' | 'wrestling' | 'judo' | 'all' | 'off';
export type AiRecommendPositionCycle = 'daily' | 'weekly' | 'chain';
export type AiRecommendSearchScope = 'all_expanded' | 'master_tree_only';

export interface AiRecommendSettings {
  language: AiRecommendLanguage;
  dayStyles: {
    1: AiRecommendDayStyle; // 월
    2: AiRecommendDayStyle; // 화
    3: AiRecommendDayStyle; // 수
    4: AiRecommendDayStyle; // 목
    5: AiRecommendDayStyle; // 금
    6: AiRecommendDayStyle; // 토
    0: AiRecommendDayStyle; // 일
  };
  positionCycle: AiRecommendPositionCycle;
  searchScope?: AiRecommendSearchScope; // 마스터 트리 전체 + 분류 외 확장 기술 (기본) vs 마스터 트리 69개 기준 순환
  dedupPeriod: '30' | '90' | '180' | '365' | 'custom';
  customDedupDays?: number;
  dailyGoalCount: 1 | 2 | 3;
  defaultDifficulty?: '초급' | '중급' | '고급';
}

export interface AiRecommendedVideoCandidate {
  id: string;
  techniqueName: string;
  techniqueNameEn?: string;
  startPosition: string; // 동일 시작 포지션 / 테마
  category: string; // 기술 성격: 스윕, 가드 패스, 서브미션, 이스케이프, 테이크다운, 유도 메치기 등
  giType: 'Gi' | 'No-Gi' | 'Both' | '레슬링' | '유도';
  difficulty?: '초급' | '중급' | '고급';
  youtubeUrl: string;
  youtubeId: string;
  channelName: string;
  thumbnailUrl: string;
  duration?: string;
  recommendedStartTime: string; // e.g. '01:30'
  recommendedStartSec: number;
  keyDetailTag: string; // e.g. '필수 기본기 카운터', '피니시 그립 디테일'
  language: 'ko' | 'en';
}


