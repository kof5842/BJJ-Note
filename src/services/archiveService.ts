import * as XLSX from 'xlsx';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  updateDoc,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isFirestoreQuotaExceeded } from '../firebase';
import {
  AppSettings,
  FolderColorsConfig,
  MindmapColorsConfig,
  LandingShowcaseConfig,
  MetadataConfig,
  MindmapStorageState,
  NavMenuVisibilityConfig,
  PositionFolder,
  SubmissionCompassGroup,
  TechniqueVideo,
  WatchHistoryLog,
  CommunityPost,
  CommunityComment,
  ClassJournalEntry,
  ClassJournalStyleConfig,
} from '../types';

export interface AdminUserSummary {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  isBanned?: boolean;
  bannedAt?: string;
  bannedReason?: string;
  videoCount: number;
  queueCount: number;
  learnedVideoCount?: number;
  totalStaySeconds?: number;
  thisMonthAddedCount?: number;
  prevMonthAddedCount?: number;
  momVideoChange?: number;
  lastActiveAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function formatStayTime(seconds?: number): string {
  if (!seconds || seconds <= 0) return '1분 미만';
  const mins = Math.floor(seconds / 60);
  if (mins < 1) return '1분 미만';
  if (mins < 60) return `${mins}분`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours < 24) {
    return remainingMins > 0 ? `${hours}시간 ${remainingMins}분` : `${hours}시간`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}일 ${remainingHours}시간`;
}

export interface FullArchivePayload {
  version: string;
  exportedAt: string;
  settings: AppSettings;
  metadata: MetadataConfig;
  videos: TechniqueVideo[];
  queueItems: TechniqueVideo[];
  mindmapState: MindmapStorageState;
  userId?: string;
}

export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// ----------------------------------------------------
// 1. Cloud Firestore Per-Account Database Synchronization
// ----------------------------------------------------

export async function loadUserCloudData(
  userId: string
): Promise<FullArchivePayload | null> {
  const path = `users/${userId}/userData/main`;
  try {
    const docRef = doc(db, 'users', userId, 'userData', 'main');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      version: data.version || '2.0.0',
      exportedAt: data.updatedAt || new Date().toISOString(),
      settings: data.settings,
      metadata: data.metadata,
      videos: data.videos || [],
      queueItems: data.queueItems || [],
      mindmapState: data.mindmapState,
      userId,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserCloudData(
  userId: string,
  payload: Omit<FullArchivePayload, 'userId'>
): Promise<void> {
  if (isFirestoreQuotaExceeded()) return;
  const path = `users/${userId}/userData/main`;
  try {
    const docRef = doc(db, 'users', userId, 'userData', 'main');
    await setDoc(
      docRef,
      {
        userId,
        version: payload.version || '2.0.0',
        videos: payload.videos,
        queueItems: payload.queueItems,
        metadata: payload.metadata,
        settings: payload.settings,
        mindmapState: payload.mindmapState,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Keep user profile summary synced for lightweight admin queries
    try {
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      const videosList = payload.videos || [];
      let thisMonthAddedCount = 0;
      let prevMonthAddedCount = 0;
      let learnedVideoCount = 0;

      videosList.forEach((v) => {
        if (v.createdAt) {
          const ym = v.createdAt.slice(0, 7);
          if (ym === currentYearMonth) {
            thisMonthAddedCount++;
          } else if (ym === prevYearMonth) {
            prevMonthAddedCount++;
          }
        }
        if (
          (v.proficiencyScore && v.proficiencyScore > 0) ||
          (v.practiceDates && v.practiceDates.length > 0) ||
          (v.journalMemos && v.journalMemos.length > 0)
        ) {
          learnedVideoCount++;
        }
      });

      const momVideoChange = thisMonthAddedCount - prevMonthAddedCount;

      const profileRef = doc(db, 'users', userId);
      await setDoc(
        profileRef,
        {
          uid: userId,
          email: auth.currentUser?.email || '',
          displayName: auth.currentUser?.displayName || '',
          photoURL: auth.currentUser?.photoURL || '',
          videoCount: payload.videos.length,
          learnedVideoCount,
          thisMonthAddedCount,
          prevMonthAddedCount,
          momVideoChange,
          queueCount: (payload.queueItems || []).length,
          lastActiveAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Failed to update user profile summary metrics:', e);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------------------------------------------
// 2. Admin Statistics & User Management Service
// ----------------------------------------------------

export async function fetchAdminAllUsers(): Promise<AdminUserSummary[]> {
  const path = 'users';
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    const users: AdminUserSummary[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      users.push({
        uid: docSnap.id,
        email: d.email || '',
        displayName: d.displayName || '',
        photoURL: d.photoURL || '',
        role: d.role || (d.email === 'kof5842@gmail.com' ? 'admin' : 'user'),
        isBanned: d.isBanned === true,
        bannedAt: d.bannedAt || undefined,
        bannedReason: d.bannedReason || undefined,
        videoCount: typeof d.videoCount === 'number' ? d.videoCount : 0,
        queueCount: typeof d.queueCount === 'number' ? d.queueCount : 0,
        learnedVideoCount: typeof d.learnedVideoCount === 'number' ? d.learnedVideoCount : 0,
        totalStaySeconds: typeof d.totalStaySeconds === 'number' ? d.totalStaySeconds : 0,
        thisMonthAddedCount: typeof d.thisMonthAddedCount === 'number' ? d.thisMonthAddedCount : 0,
        prevMonthAddedCount: typeof d.prevMonthAddedCount === 'number' ? d.prevMonthAddedCount : 0,
        momVideoChange: typeof d.momVideoChange === 'number' ? d.momVideoChange : 0,
        lastActiveAt: d.lastActiveAt || d.updatedAt || '',
        createdAt: d.createdAt || '',
        updatedAt: d.updatedAt || '',
      });
    });
    // Sort by last active desc
    return users.sort((a, b) => (b.lastActiveAt || '').localeCompare(a.lastActiveAt || ''));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export const fetchAdminUserSummaries = fetchAdminAllUsers;

// ----------------------------------------------------
// 3. Excel (.xlsx) Export & Import Engine
// ----------------------------------------------------

export function exportArchiveToExcel(payload: FullArchivePayload): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: 기술 영상 목록 (Videos)
  const videoRows = payload.videos.map((v, idx) => ({
    번호: idx + 1,
    ID: v.id,
    '기술명(한글)': v.titleKo,
    '기술명(영문)': v.titleEn,
    유튜브링크: v.youtubeUrl,
    유튜브ID: v.youtubeId,
    포지션: v.position,
    카테고리: v.category,
    도복구분: v.giType,
    난이도: v.difficulty,
    서브미션군: v.submissionGroup,
    서브미션상세: v.submissionDetail,
    '숙련도점수(1-10)': v.proficiencyScore,
    즐겨찾기: v.isFavorite ? 'Y' : 'N',
    핵심기술메모: v.generalNotes,
    수련일자들: (v.practiceDates || []).join(', '),
    연계기술ID목록: (v.nextTechniqueIds || []).join(', '),
    썸네일URL: v.thumbnailUrl,
    생성일시: v.createdAt,
    수정일시: v.updatedAt,
    타임라인메모_JSON: JSON.stringify(v.timelineFrames || []),
    학습일지_JSON: JSON.stringify(v.journalMemos || []),
  }));

  const wsVideos = XLSX.utils.json_to_sheet(videoRows);
  XLSX.utils.book_append_sheet(wb, wsVideos, '기술영상목록');

  // Sheet 2: 수련 대기열 (Queue)
  const queueRows = payload.queueItems.map((v, idx) => ({
    번호: idx + 1,
    ID: v.id,
    '기술명(한글)': v.titleKo,
    '기술명(영문)': v.titleEn,
    유튜브링크: v.youtubeUrl,
    유튜브ID: v.youtubeId,
    포지션: v.position,
    카테고리: v.category,
    도복구분: v.giType,
    난이도: v.difficulty,
    서브미션군: v.submissionGroup,
    서브미션상세: v.submissionDetail,
    '숙련도점수(1-10)': v.proficiencyScore,
    즐겨찾기: v.isFavorite ? 'Y' : 'N',
    핵심기술메모: v.generalNotes,
    수련일자들: (v.practiceDates || []).join(', '),
    연계기술ID목록: (v.nextTechniqueIds || []).join(', '),
    썸네일URL: v.thumbnailUrl,
    생성일시: v.createdAt,
    수정일시: v.updatedAt,
    타임라인메모_JSON: JSON.stringify(v.timelineFrames || []),
    학습일지_JSON: JSON.stringify(v.journalMemos || []),
  }));

  const wsQueue = XLSX.utils.json_to_sheet(queueRows);
  XLSX.utils.book_append_sheet(wb, wsQueue, '수련대기열');

  // Sheet 3: 포지션 및 서브미션 분류체계 (Metadata)
  const metaRows = [
    ...payload.metadata.positions.map((p) => ({
      구분: '포지션',
      명칭: p.name,
      영문명: p.nameEn,
      하위카테고리: (p.subCategories || []).join(', '),
    })),
    ...payload.metadata.categories.map((c) => ({
      구분: '기술분류',
      명칭: c,
      영문명: '',
      하위카테고리: '',
    })),
    ...payload.metadata.submissions.map((s) => ({
      구분: '서브미션군',
      명칭: s.name,
      영문명: s.directionLabel,
      하위카테고리: (s.items || []).join(', '),
    })),
    ...payload.metadata.difficulties.map((d) => ({
      구분: '난이도',
      명칭: d,
      영문명: '',
      하위카테고리: '',
    })),
    ...payload.metadata.giTypes.map((g) => ({
      구분: '도복타입',
      명칭: g,
      영문명: '',
      하위카테고리: '',
    })),
  ];
  const wsMeta = XLSX.utils.json_to_sheet(metaRows);
  XLSX.utils.book_append_sheet(wb, wsMeta, '분류체계설정');

  // Sheet 4: 환경설정 & 완전복원 데이터 (System)
  const systemRows = [
    { 속성: '앱타이틀', 설정값: payload.settings.appTitle },
    { 속성: '앱서브타이틀', 설정값: payload.settings.appSubtitle },
    { 속성: '고득점기준', 설정값: String(payload.settings.highScoreThreshold) },
    { 속성: '취약점기준', 설정값: String(payload.settings.lowScoreThreshold) },
    { 속성: '미수련알림일수', 설정값: String(payload.settings.neglectedDaysThreshold) },
    { 속성: '마인드맵테마', 설정값: payload.settings.mindmapTheme || 'white' },
    { 속성: '타임라인이미지허용', 설정값: payload.settings.allowTimelineMemoImages ? 'true' : 'false' },
    { 속성: '백업버전', 설정값: payload.version || '2.0.0' },
    { 속성: '내보낸일시', 설정값: new Date().toISOString() },
    // Raw JSON string to allow 100% lossless restore of mindmap coordinates and custom objects
    { 속성: '__FULL_BACKUP_RAW__', 설정값: JSON.stringify(payload) },
  ];
  const wsSystem = XLSX.utils.json_to_sheet(systemRows);
  XLSX.utils.book_append_sheet(wb, wsSystem, '환경설정');

  // Write and trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `주짓수마스터리_아카이브_데이터_${dateStr}.xlsx`);
}

export async function importArchiveFromExcel(
  file: File
): Promise<Partial<FullArchivePayload>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          throw new Error('파일 데이터를 읽을 수 없습니다.');
        }

        const wb = XLSX.read(buffer, { type: 'array' });

        // 1. Check if the file has the full raw payload in 환경설정 sheet
        if (wb.SheetNames.includes('환경설정')) {
          const sysSheet = wb.Sheets['환경설정'];
          const sysRows: any[] = XLSX.utils.sheet_to_json(sysSheet);
          const rawRow = sysRows.find((r) => r.속성 === '__FULL_BACKUP_RAW__');
          if (rawRow && rawRow.설정값) {
            try {
              const parsed = JSON.parse(rawRow.설정값);
              resolve(parsed);
              return;
            } catch (err) {
              console.warn('Raw JSON parse failed, falling back to sheet parsing', err);
            }
          }
        }

        // 2. Parse from '기술영상목록' sheet
        const sheetName =
          wb.SheetNames.find(
            (s) => s.includes('기술') || s.includes('영상') || s.includes('Video')
          ) || wb.SheetNames[0];

        const sheet = wb.Sheets[sheetName];
        if (!sheet) {
          throw new Error('엑셀 시트를 찾을 수 없습니다.');
        }

        const rows: any[] = XLSX.utils.sheet_to_json(sheet);
        const importedVideos: TechniqueVideo[] = rows.map((r, idx) => {
          let timelineFrames = [];
          let journalMemos = [];
          let practiceDates: string[] = [];
          let nextTechniqueIds: string[] = [];

          try {
            if (r.타임라인메모_JSON) timelineFrames = JSON.parse(r.타임라인메모_JSON);
          } catch {}
          try {
            if (r.학습일지_JSON) journalMemos = JSON.parse(r.학습일지_JSON);
          } catch {}

          if (r.수련일자들 && typeof r.수련일자들 === 'string') {
            practiceDates = r.수련일자들
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean);
          }

          if (r.연계기술ID목록 && typeof r.연계기술ID목록 === 'string') {
            nextTechniqueIds = r.연계기술ID목록
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean);
          }

          return {
            id: r.ID || r.id || `tech-imported-${Date.now()}-${idx}`,
            titleKo: r['기술명(한글)'] || r.titleKo || r.제목 || '제목 미정',
            titleEn: r['기술명(영문)'] || r.titleEn || '',
            youtubeUrl: r.유튜브링크 || r.youtubeUrl || '',
            youtubeId: r.유튜브ID || r.youtubeId || '',
            thumbnailUrl:
              r.썸네일URL ||
              r.thumbnailUrl ||
              (r.유튜브ID ? `https://i.ytimg.com/vi/${r.유튜브ID}/hqdefault.jpg` : ''),
            position: r.포지션 || r.position || '미분류',
            category: r.카테고리 || r.category || '가드',
            giType: r.도복구분 || r.giType || 'Gi',
            difficulty: r.난이도 || r.difficulty || '초급(하)',
            submissionGroup: r.서브미션군 || r.submissionGroup || 'none',
            submissionDetail: r.서브미션상세 || r.submissionDetail || '미지정',
            proficiencyScore: Number(r['숙련도점수(1-10)'] || r.proficiencyScore || 0),
            isFavorite: r.즐겨찾기 === 'Y' || r.isFavorite === true,
            generalNotes: r.핵심기술메모 || r.generalNotes || '',
            timelineFrames,
            journalMemos,
            practiceDates,
            nextTechniqueIds,
            createdAt: r.생성일시 || new Date().toISOString(),
            updatedAt: r.수정일시 || new Date().toISOString(),
          };
        });

        // 3. Parse Queue if present
        let importedQueue: TechniqueVideo[] = [];
        if (wb.SheetNames.includes('수련대기열')) {
          const qSheet = wb.Sheets['수련대기열'];
          const qRows: any[] = XLSX.utils.sheet_to_json(qSheet);
          importedQueue = qRows.map((r, idx) => ({
            id: r.ID || r.id || `queue-imported-${Date.now()}-${idx}`,
            titleKo: r['기술명(한글)'] || r.titleKo || '제목 미정',
            titleEn: r['기술명(영문)'] || r.titleEn || '',
            youtubeUrl: r.유튜브링크 || r.youtubeUrl || '',
            youtubeId: r.유튜브ID || r.youtubeId || '',
            thumbnailUrl: r.썸네일URL || r.thumbnailUrl || '',
            position: r.포지션 || r.position || '미분류',
            category: r.카테고리 || r.category || '가드',
            giType: r.도복구분 || r.giType || 'Gi',
            difficulty: r.난이도 || r.difficulty || '초급(하)',
            submissionGroup: r.서브미션군 || r.submissionGroup || 'none',
            submissionDetail: r.서브미션상세 || r.submissionDetail || '미지정',
            proficiencyScore: Number(r['숙련도점수(1-10)'] || 0),
            isFavorite: false,
            generalNotes: r.핵심기술메모 || '',
            timelineFrames: [],
            journalMemos: [],
            practiceDates: [],
            nextTechniqueIds: [],
            createdAt: r.생성일시 || new Date().toISOString(),
            updatedAt: r.수정일시 || new Date().toISOString(),
          }));
        }

        resolve({
          videos: importedVideos,
          queueItems: importedQueue,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// ----------------------------------------------------
// 5. Global System Config (Platform-wide Admin Presets)
// ----------------------------------------------------

export interface GlobalSystemConfig {
  appTitle?: string;
  appSubtitle?: string;
  logoImageUrl?: string;
  logoText?: string;
  globalPositions?: PositionFolder[];
  globalCategories?: string[];
  globalSubmissions?: SubmissionCompassGroup[];
  allowTimelineMemoImages?: boolean;
  primaryColor?: string;
  hideEmptyFolders?: boolean;
  folderColors?: FolderColorsConfig;
  mindmapColors?: MindmapColorsConfig;
  landingShowcase?: LandingShowcaseConfig;
  mindmapToolbarPosition?: 'top' | 'bottom' | 'left' | 'right';
  menuVisibility?: NavMenuVisibilityConfig;
  classJournalStyle?: ClassJournalStyleConfig;
  updatedAt?: string;
  updatedBy?: string;
}

const LOCAL_GLOBAL_CONFIG_KEY = 'bjj_global_system_config_v3';

export function getLocalGlobalSystemConfig(): GlobalSystemConfig | null {
  try {
    const raw = localStorage.getItem(LOCAL_GLOBAL_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to get local global config', e);
    return null;
  }
}

export function saveLocalGlobalSystemConfig(config: Partial<GlobalSystemConfig>): void {
  try {
    const current = getLocalGlobalSystemConfig() || {};
    const merged: GlobalSystemConfig = {
      ...current,
      ...config,
      menuVisibility: {
        ...(current.menuVisibility || {}),
        ...(config.menuVisibility || {}),
      },
      folderColors: {
        ...(current.folderColors || {}),
        ...(config.folderColors || {}),
      },
      mindmapColors: {
        ...(current.mindmapColors || {}),
        ...(config.mindmapColors || {}),
      },
      classJournalStyle: {
        ...(current.classJournalStyle || {}),
        ...(config.classJournalStyle || {}),
      },
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_GLOBAL_CONFIG_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error('Failed to save local global config', e);
  }
}

export async function fetchGlobalSystemConfig(): Promise<GlobalSystemConfig | null> {
  const localConfig = getLocalGlobalSystemConfig();
  const path = 'systemConfig/defaultMetadata';
  try {
    const docRef = doc(db, 'systemConfig', 'defaultMetadata');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return localConfig;
    const cloudConfig = snap.data() as GlobalSystemConfig;
    const merged: GlobalSystemConfig = {
      ...(localConfig || {}),
      ...cloudConfig,
      menuVisibility: {
        ...(localConfig?.menuVisibility || {}),
        ...(cloudConfig.menuVisibility || {}),
      },
      folderColors: {
        ...(localConfig?.folderColors || {}),
        ...(cloudConfig.folderColors || {}),
      },
      mindmapColors: {
        ...(localConfig?.mindmapColors || {}),
        ...(cloudConfig.mindmapColors || {}),
      },
      classJournalStyle: {
        ...(localConfig?.classJournalStyle || {}),
        ...(cloudConfig.classJournalStyle || {}),
      },
    };
    saveLocalGlobalSystemConfig(merged);
    return merged;
  } catch (error) {
    console.warn('Global system config fetch fallback to local cache:', error);
    return localConfig;
  }
}

export async function saveGlobalSystemConfig(
  config: Partial<GlobalSystemConfig>,
  adminEmail: string
): Promise<void> {
  // 1. Save immediately to local cache
  saveLocalGlobalSystemConfig(config);

  // 2. Sync to Cloud Firestore
  const path = 'systemConfig/defaultMetadata';
  try {
    const docRef = doc(db, 'systemConfig', 'defaultMetadata');
    await setDoc(
      docRef,
      {
        ...config,
        updatedAt: new Date().toISOString(),
        updatedBy: adminEmail,
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Firestore global config write deferred/warning:', error);
  }
}

// ----------------------------------------------------
// 6. Admin User Ban / Unban Control
// ----------------------------------------------------

export async function setUserBanStatus(
  userId: string,
  isBanned: boolean,
  reason?: string
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      isBanned,
      bannedAt: isBanned ? new Date().toISOString() : null,
      bannedReason: isBanned ? (reason || '관리자 제재 조치') : null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// ----------------------------------------------------
// 8. Watch History Logs (시청 로그 기록) Per-User Isolated Cloud & Local Storage
// ----------------------------------------------------

export function getLocalWatchLogs(userId?: string): WatchHistoryLog[] {
  const key = `bjj_watch_history_logs_${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as WatchHistoryLog[];
  } catch (e) {
    console.error('Failed to parse local watch logs', e);
    return [];
  }
}

export function saveLocalWatchLogs(logs: WatchHistoryLog[], userId?: string): void {
  const key = `bjj_watch_history_logs_${userId || 'guest'}`;
  try {
    localStorage.setItem(key, JSON.stringify(logs.slice(0, 300)));
  } catch (e) {
    console.error('Failed to save local watch logs', e);
  }
}

export async function recordWatchLog(
  userId: string | undefined,
  logData: Omit<WatchHistoryLog, 'id' | 'watchedAt'> & { watchedAt?: string }
): Promise<WatchHistoryLog> {
  const newLog: WatchHistoryLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    userId: userId || 'guest',
    userEmail: logData.userEmail || '',
    videoId: logData.videoId,
    videoTitleKo: logData.videoTitleKo,
    videoTitleEn: logData.videoTitleEn || '',
    thumbnailUrl: logData.thumbnailUrl || '',
    position: logData.position,
    category: logData.category,
    giType: logData.giType || 'Gi',
    submissionGroup: logData.submissionGroup || 'none',
    submissionDetail: logData.submissionDetail || '',
    difficulty: logData.difficulty || '미분류',
    proficiencyScore: logData.proficiencyScore ?? 0,
    watchedAt: logData.watchedAt || new Date().toISOString(),
    source: logData.source || 'direct',
  };

  // 1. Update personal per-user local storage
  const currentLocal = getLocalWatchLogs(userId);
  const updatedLocal = [newLog, ...currentLocal.filter((item) => item.id !== newLog.id)].slice(0, 300);
  saveLocalWatchLogs(updatedLocal, userId);

  // 2. If user is logged in, sync to isolated per-user subcollection
  if (userId) {
    const path = `users/${userId}/watchLogs/${newLog.id}`;
    try {
      const docRef = doc(db, 'users', userId, 'watchLogs', newLog.id);
      await setDoc(docRef, newLog);
    } catch (error) {
      console.warn('Firestore watch log write deferred/fallback to local:', error);
    }
  }

  return newLog;
}

export async function fetchWatchLogs(userId: string | undefined): Promise<WatchHistoryLog[]> {
  const localLogs = getLocalWatchLogs(userId);

  if (!userId) {
    return localLogs.sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());
  }

  const path = `users/${userId}/watchLogs`;
  try {
    const colRef = collection(db, 'users', userId, 'watchLogs');
    const q = query(colRef, orderBy('watchedAt', 'desc'), limit(150));
    const snap = await getDocs(q);

    if (snap.empty) {
      return localLogs.sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());
    }

    const cloudLogs: WatchHistoryLog[] = [];
    snap.forEach((d) => {
      cloudLogs.push(d.data() as WatchHistoryLog);
    });

    // Merge with unsynced local logs of THIS user only
    const mergedMap = new Map<string, WatchHistoryLog>();
    for (const l of cloudLogs) {
      mergedMap.set(l.id, l);
    }
    for (const l of localLogs) {
      if (!mergedMap.has(l.id)) {
        mergedMap.set(l.id, l);
      }
    }

    const merged = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
    );
    saveLocalWatchLogs(merged, userId);
    return merged;
  } catch (error) {
    console.warn('Failed to fetch cloud watch logs, using local cache:', error);
    return localLogs.sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());
  }
}

export async function deleteWatchLog(userId: string | undefined, logId: string): Promise<void> {
  const currentLocal = getLocalWatchLogs(userId);
  const updatedLocal = currentLocal.filter((l) => l.id !== logId);
  saveLocalWatchLogs(updatedLocal, userId);

  if (userId) {
    const path = `users/${userId}/watchLogs/${logId}`;
    try {
      const docRef = doc(db, 'users', userId, 'watchLogs', logId);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn('Firestore watch log delete failed:', error);
    }
  }
}

export async function clearAllWatchLogs(userId: string | undefined): Promise<void> {
  saveLocalWatchLogs([], userId);

  if (userId) {
    try {
      const colRef = collection(db, 'users', userId, 'watchLogs');
      const snap = await getDocs(colRef);
      const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.warn('Failed to clear cloud watch logs:', error);
    }
  }
}

// ----------------------------------------------------
// 9. Community Free Board (자유게시판) Cloud Service
// ----------------------------------------------------

const LOCAL_COMMUNITY_POSTS_KEY = 'bjj_community_posts_cache_v2';

export function getLocalCommunityPosts(): CommunityPost[] {
  try {
    const raw = localStorage.getItem(LOCAL_COMMUNITY_POSTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to get local community posts', e);
    return [];
  }
}

export function saveLocalCommunityPosts(posts: CommunityPost[]): void {
  try {
    localStorage.setItem(LOCAL_COMMUNITY_POSTS_KEY, JSON.stringify(posts.slice(0, 300)));
  } catch (e) {
    console.error('Failed to save local community posts', e);
  }
}

export async function fetchCommunityPosts(): Promise<CommunityPost[]> {
  const localPosts = getLocalCommunityPosts();
  const path = 'communityPosts';
  try {
    const colRef = collection(db, 'communityPosts');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);

    if (snap.empty) {
      return localPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const cloudPosts: CommunityPost[] = [];
    snap.forEach((d) => {
      cloudPosts.push(d.data() as CommunityPost);
    });

    // Merge cloud posts with local cache to ensure no newly created posts are lost
    const postMap = new Map<string, CommunityPost>();
    for (const p of cloudPosts) {
      postMap.set(p.id, p);
    }
    for (const p of localPosts) {
      if (!postMap.has(p.id)) {
        postMap.set(p.id, p);
      }
    }

    const merged = Array.from(postMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    saveLocalCommunityPosts(merged);
    return merged;
  } catch (error) {
    console.warn('Failed to fetch cloud community posts, using local cache:', error);
    return localPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function saveCommunityPost(post: CommunityPost): Promise<void> {
  const path = `communityPosts/${post.id}`;
  const cleaned = cleanForFirestore({
    ...post,
    updatedAt: new Date().toISOString(),
  });

  // 1. Update local cache immediately
  const localPosts = getLocalCommunityPosts();
  const idx = localPosts.findIndex((p) => p.id === post.id);
  const updatedLocal = idx >= 0
    ? localPosts.map((p) => (p.id === post.id ? cleaned : p))
    : [cleaned, ...localPosts];
  saveLocalCommunityPosts(updatedLocal);

  // 2. Sync to Cloud Firestore
  try {
    const docRef = doc(db, 'communityPosts', post.id);
    await setDoc(docRef, cleaned);
  } catch (error) {
    console.warn('Firestore community post write deferred/failed:', error);
  }
}

export async function deleteCommunityPost(postId: string): Promise<void> {
  const path = `communityPosts/${postId}`;
  const localPosts = getLocalCommunityPosts().filter((p) => p.id !== postId);
  saveLocalCommunityPosts(localPosts);

  try {
    const docRef = doc(db, 'communityPosts', postId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore delete post failed:', error);
  }
}

export async function togglePostLike(postId: string, userId: string, isLiked: boolean): Promise<void> {
  const localPosts = getLocalCommunityPosts();
  const target = localPosts.find((p) => p.id === postId);
  if (target) {
    let likedUsers = target.likedUserIds || [];
    let dislikedUsers = target.dislikedUserIds || [];
    if (isLiked) {
      if (!likedUsers.includes(userId)) likedUsers = [...likedUsers, userId];
      dislikedUsers = dislikedUsers.filter((u) => u !== userId);
    } else {
      likedUsers = likedUsers.filter((u) => u !== userId);
    }
    const updatedPost: CommunityPost = {
      ...target,
      likedUserIds: likedUsers,
      likesCount: likedUsers.length,
      dislikedUserIds: dislikedUsers,
      dislikesCount: dislikedUsers.length,
      updatedAt: new Date().toISOString(),
    };
    saveLocalCommunityPosts(localPosts.map((p) => (p.id === postId ? updatedPost : p)));
    try {
      const docRef = doc(db, 'communityPosts', postId);
      await updateDoc(docRef, {
        likedUserIds: likedUsers,
        likesCount: likedUsers.length,
        dislikedUserIds: dislikedUsers,
        dislikesCount: dislikedUsers.length,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to sync post like to firestore:', e);
    }
  }
}

export async function togglePostDislike(postId: string, userId: string, isDisliked: boolean): Promise<void> {
  const localPosts = getLocalCommunityPosts();
  const target = localPosts.find((p) => p.id === postId);
  if (target) {
    let dislikedUsers = target.dislikedUserIds || [];
    let likedUsers = target.likedUserIds || [];
    if (isDisliked) {
      if (!dislikedUsers.includes(userId)) dislikedUsers = [...dislikedUsers, userId];
      likedUsers = likedUsers.filter((u) => u !== userId);
    } else {
      dislikedUsers = dislikedUsers.filter((u) => u !== userId);
    }
    const updatedPost: CommunityPost = {
      ...target,
      likedUserIds: likedUsers,
      likesCount: likedUsers.length,
      dislikedUserIds: dislikedUsers,
      dislikesCount: dislikedUsers.length,
      updatedAt: new Date().toISOString(),
    };
    saveLocalCommunityPosts(localPosts.map((p) => (p.id === postId ? updatedPost : p)));
    try {
      const docRef = doc(db, 'communityPosts', postId);
      await updateDoc(docRef, {
        likedUserIds: likedUsers,
        likesCount: likedUsers.length,
        dislikedUserIds: dislikedUsers,
        dislikesCount: dislikedUsers.length,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to sync post dislike to firestore:', e);
    }
  }
}

export async function incrementPostViews(postId: string, currentViews: number): Promise<void> {
  const newViews = (currentViews || 0) + 1;
  const localPosts = getLocalCommunityPosts();
  const updatedLocal = localPosts.map((p) => (p.id === postId ? { ...p, viewsCount: newViews } : p));
  saveLocalCommunityPosts(updatedLocal);

  try {
    const docRef = doc(db, 'communityPosts', postId);
    await updateDoc(docRef, {
      viewsCount: newViews,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Failed to update views count in firestore:', e);
  }
}

export async function voteOnPoll(postId: string, optionIds: string[], userId: string): Promise<CommunityPost | null> {
  const localPosts = getLocalCommunityPosts();
  const target = localPosts.find((p) => p.id === postId);
  if (!target || !target.poll) return null;

  const poll = target.poll;
  const updatedOptions = poll.options.map((opt) => {
    let voters = opt.votedUserIds || [];
    const isSelected = optionIds.includes(opt.id);
    if (isSelected) {
      if (!voters.includes(userId)) voters = [...voters, userId];
    } else {
      voters = voters.filter((id) => id !== userId);
    }
    return {
      ...opt,
      votedUserIds: voters,
      voteCount: voters.length,
    };
  });

  const totalVotes = updatedOptions.reduce((acc, curr) => acc + curr.voteCount, 0);

  const updatedPost: CommunityPost = {
    ...target,
    poll: {
      ...poll,
      options: updatedOptions,
      totalVotes,
    },
    updatedAt: new Date().toISOString(),
  };

  saveLocalCommunityPosts(localPosts.map((p) => (p.id === postId ? updatedPost : p)));
  try {
    const docRef = doc(db, 'communityPosts', postId);
    await updateDoc(docRef, {
      poll: updatedPost.poll,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Failed to sync poll vote to firestore:', e);
  }

  return updatedPost;
}

export async function togglePostPrivacy(postId: string, isPrivate: boolean): Promise<void> {
  const localPosts = getLocalCommunityPosts();
  const updatedLocal = localPosts.map((p) => (p.id === postId ? { ...p, isPrivateByAdmin: isPrivate } : p));
  saveLocalCommunityPosts(updatedLocal);

  try {
    const docRef = doc(db, 'communityPosts', postId);
    await updateDoc(docRef, {
      isPrivateByAdmin: isPrivate,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Failed to update post privacy in firestore:', e);
  }
}

// ----------------------------------------------------
// Comments & Hierarchical Replies Service
// ----------------------------------------------------

export async function fetchPostComments(postId: string): Promise<CommunityComment[]> {
  const localKey = `bjj_comments_${postId}_v2`;
  let localComments: CommunityComment[] = [];
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) localComments = JSON.parse(raw);
  } catch {}

  const path = `communityPosts/${postId}/comments`;
  try {
    const colRef = collection(db, 'communityPosts', postId, 'comments');
    const q = query(colRef, orderBy('createdAt', 'asc'), limit(200));
    const snap = await getDocs(q);

    if (snap.empty) {
      return localComments;
    }

    const cloudComments: CommunityComment[] = [];
    snap.forEach((d) => {
      cloudComments.push(d.data() as CommunityComment);
    });

    const commentMap = new Map<string, CommunityComment>();
    for (const c of cloudComments) {
      commentMap.set(c.id, c);
    }
    for (const c of localComments) {
      if (!commentMap.has(c.id)) {
        commentMap.set(c.id, c);
      }
    }

    const merged = Array.from(commentMap.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    try {
      localStorage.setItem(localKey, JSON.stringify(merged));
    } catch {}
    return merged;
  } catch (error) {
    console.warn('Failed to fetch post comments from firestore:', error);
    return localComments;
  }
}

export async function savePostComment(postId: string, comment: CommunityComment): Promise<void> {
  const localKey = `bjj_comments_${postId}_v2`;
  let localComments: CommunityComment[] = [];
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) localComments = JSON.parse(raw);
  } catch {}

  const cleaned = cleanForFirestore({
    ...comment,
    updatedAt: new Date().toISOString(),
  });

  const idx = localComments.findIndex((c) => c.id === comment.id);
  const updatedLocal = idx >= 0
    ? localComments.map((c) => (c.id === comment.id ? cleaned : c))
    : [...localComments, cleaned];

  try {
    localStorage.setItem(localKey, JSON.stringify(updatedLocal));
  } catch {}

  // Also increment commentsCount on post
  const localPosts = getLocalCommunityPosts();
  const post = localPosts.find((p) => p.id === postId);
  if (post && idx < 0) {
    const newCount = (post.commentsCount || 0) + 1;
    saveLocalCommunityPosts(localPosts.map((p) => (p.id === postId ? { ...p, commentsCount: newCount } : p)));
    try {
      const postRef = doc(db, 'communityPosts', postId);
      await updateDoc(postRef, { commentsCount: newCount });
    } catch {}
  }

  const path = `communityPosts/${postId}/comments/${comment.id}`;
  try {
    const docRef = doc(db, 'communityPosts', postId, 'comments', comment.id);
    await setDoc(docRef, cleaned);
  } catch (error) {
    console.warn('Failed to save comment to firestore:', error);
  }
}

export async function deletePostComment(postId: string, commentId: string): Promise<void> {
  const localKey = `bjj_comments_${postId}_v2`;
  let localComments: CommunityComment[] = [];
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) localComments = JSON.parse(raw);
  } catch {}

  const updatedLocal = localComments.filter((c) => c.id !== commentId);
  try {
    localStorage.setItem(localKey, JSON.stringify(updatedLocal));
  } catch {}

  // decrement commentsCount on post
  const localPosts = getLocalCommunityPosts();
  const post = localPosts.find((p) => p.id === postId);
  if (post && post.commentsCount && post.commentsCount > 0) {
    const newCount = Math.max(0, post.commentsCount - 1);
    saveLocalCommunityPosts(localPosts.map((p) => (p.id === postId ? { ...p, commentsCount: newCount } : p)));
    try {
      const postRef = doc(db, 'communityPosts', postId);
      await updateDoc(postRef, { commentsCount: newCount });
    } catch {}
  }

  const path = `communityPosts/${postId}/comments/${commentId}`;
  try {
    const docRef = doc(db, 'communityPosts', postId, 'comments', commentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Failed to delete comment from firestore:', error);
  }
}

export async function toggleCommentPrivacy(postId: string, commentId: string, isPrivate: boolean): Promise<void> {
  const localKey = `bjj_comments_${postId}_v2`;
  let localComments: CommunityComment[] = [];
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) localComments = JSON.parse(raw);
  } catch {}

  const updatedLocal = localComments.map((c) => (c.id === commentId ? { ...c, isPrivateByAdmin: isPrivate } : c));
  try {
    localStorage.setItem(localKey, JSON.stringify(updatedLocal));
  } catch {}

  try {
    const docRef = doc(db, 'communityPosts', postId, 'comments', commentId);
    await updateDoc(docRef, {
      isPrivateByAdmin: isPrivate,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Failed to toggle comment privacy in firestore:', e);
  }
}

// ----------------------------------------------------
// 6. Crowd-Sourced Shared Video Classification Index
// ----------------------------------------------------

export interface SharedVideoClassification {
  youtubeId: string;
  position?: string;
  category?: string;
  giType?: string;
  difficulty?: string;
  endPosition?: string;
  endPositions?: string[];
  submissionGroup?: string;
  submissionDetail?: string;
  titleKo?: string;
  updatedAt?: string;
}

export async function fetchSharedVideoClassification(
  youtubeId: string
): Promise<SharedVideoClassification | null> {
  if (!youtubeId) return null;
  const cleanId = youtubeId.trim().replace(/^ig-/, '');
  if (!cleanId) return null;

  // 1. Check local cache first
  try {
    const localRaw = localStorage.getItem(`bjj_shared_video_${cleanId}`);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (parsed && (parsed.position || parsed.category || parsed.submissionGroup)) {
        return parsed;
      }
    }
  } catch {}

  // 2. Query Firestore shared index
  try {
    const docRef = doc(db, 'sharedVideoClassifications', cleanId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as SharedVideoClassification;
      try {
        localStorage.setItem(`bjj_shared_video_${cleanId}`, JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (e) {
    console.warn('Failed to fetch shared video classification:', e);
  }

  return null;
}

export async function saveSharedVideoClassification(
  video: TechniqueVideo
): Promise<void> {
  if (!video || !video.youtubeId) return;
  const cleanId = video.youtubeId.trim().replace(/^ig-/, '');
  if (!cleanId) return;

  // Only save if at least one meaningful classification is selected (not unclassified)
  const isMeaningful =
    (video.position && video.position !== '미지정' && video.position !== '미분류') ||
    (video.category && video.category !== '미분류' && video.category !== '미지정') ||
    (video.submissionGroup && video.submissionGroup !== 'none') ||
    (video.endPosition && video.endPosition !== '미지정');

  if (!isMeaningful) return;

  const payload: SharedVideoClassification = {
    youtubeId: cleanId,
    position: video.position,
    category: video.category,
    giType: video.giType,
    difficulty: video.difficulty,
    endPosition: video.endPosition,
    endPositions: video.endPositions || [],
    submissionGroup: video.submissionGroup,
    submissionDetail: video.submissionDetail,
    titleKo: video.titleKo,
    updatedAt: new Date().toISOString(),
  };

  // Local cache
  try {
    localStorage.setItem(`bjj_shared_video_${cleanId}`, JSON.stringify(payload));
  } catch {}

  try {
    const docRef = doc(db, 'sharedVideoClassifications', cleanId);
    await setDoc(docRef, cleanForFirestore(payload), { merge: true });
  } catch (e) {
    console.warn('Failed to save shared video classification:', e);
  }
}

// ----------------------------------------------------
// 12. Class Journal (수업일지) & Team Members Synchronization
// ----------------------------------------------------

export async function fetchClassJournal(): Promise<ClassJournalEntry[]> {
  try {
    const docRef = doc(db, 'systemConfig', 'class_journal');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.entries)) {
        try {
          localStorage.setItem('bjj_class_journal_v1', JSON.stringify(data.entries));
        } catch {}
        return data.entries;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch class journal from Firestore:', e);
  }

  // Fallback to local cache
  try {
    const saved = localStorage.getItem('bjj_class_journal_v1');
    if (saved) return JSON.parse(saved);
  } catch {}

  return [];
}

export async function saveClassJournalEntries(entries: ClassJournalEntry[]): Promise<void> {
  // 1. Local Storage
  try {
    localStorage.setItem('bjj_class_journal_v1', JSON.stringify(entries));
    window.dispatchEvent(new Event('bjj_class_journal_changed'));
  } catch {}

  // 2. Firestore Cloud DB
  try {
    const docRef = doc(db, 'systemConfig', 'class_journal');
    await setDoc(docRef, cleanForFirestore({
      entries,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (e) {
    console.warn('Failed to save class journal to Firestore:', e);
  }
}

export async function fetchTeamMemberUids(): Promise<string[]> {
  try {
    const docRef = doc(db, 'systemConfig', 'team_members');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.uids)) {
        try {
          localStorage.setItem('bjj_my_team_members_v1', JSON.stringify(data.uids));
        } catch {}
        return data.uids;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch team members from Firestore:', e);
  }

  // Fallback to local cache
  try {
    const saved = localStorage.getItem('bjj_my_team_members_v1');
    if (saved) return JSON.parse(saved);
  } catch {}

  return [];
}

export async function saveTeamMemberUids(uids: string[]): Promise<void> {
  // 1. Local Storage
  try {
    localStorage.setItem('bjj_my_team_members_v1', JSON.stringify(uids));
    window.dispatchEvent(new Event('bjj_team_members_changed'));
  } catch {}

  // 2. Firestore Cloud DB
  try {
    const docRef = doc(db, 'systemConfig', 'team_members');
    await setDoc(docRef, cleanForFirestore({
      uids,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (e) {
    console.warn('Failed to save team members to Firestore:', e);
  }
}


