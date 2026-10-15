import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Video,
  FolderOpen,
  Calendar,
  Share2,
  BarChart3,
  Settings,
  FolderCog,
  Smartphone,
  Monitor,
  Flame,
  LogOut,
  Cloud,
  Check,
  Loader2,
  Shield,
  ChevronsUpDown,
  Sparkles,
  MessageSquare,
  History,
  Menu,
  X,
  ChevronRight,
  Edit3,
  BookOpen,
  Plus,
  BookmarkCheck,
  Play,
  Trash2,
  ImageIcon,
  FileText,
  Clock,
  ArrowLeft,
  GraduationCap,
  Tag,
} from 'lucide-react';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { VideoPlayer16x9 } from './components/VideoPlayer16x9';
import { ProficiencyRater } from './components/ProficiencyRater';
import { HashtagTechniqueInput, TaxonomyTechniqueItem } from './components/HashtagTechniqueInput';
import {
  db,
  auth,
  signInWithGoogle,
  signOutUser,
  onAuthStateChanged,
  testFirestoreConnection,
  ADMIN_EMAIL,
  type User,
} from './firebase';
import {
  loadUserCloudData,
  saveUserCloudData,
  fetchGlobalSystemConfig,
  getLocalGlobalSystemConfig,
  saveGlobalSystemConfig,
  recordWatchLog,
  fetchWatchLogs,
  deleteWatchLog,
  clearAllWatchLogs,
  getLocalWatchLogs,
  fetchClassJournal,
  saveClassJournalEntries,
} from './services/archiveService';
import {
  ActiveModuleTab,
  AppSettings,
  MetadataConfig,
  MindmapStorageState,
  TechniqueVideo,
  WatchHistoryLog,
  JournalMemo,
} from './types';
import {
  INITIAL_METADATA,
  INITIAL_QUEUE_ITEMS,
  INITIAL_SETTINGS,
  INITIAL_TECHNIQUES,
  DEFAULT_MENU_VISIBILITY,
  createInitialMindmapState,
} from './data/initialData';
import { applyCoreTaxonomyToMetadata } from './data/bjjTaxonomy';
import { Module1VideoAdd } from './components/Module1VideoAdd';
import { Module2VideoFolder } from './components/Module2VideoFolder';
import { Module3TrainingJournal } from './components/Module3TrainingJournal';
import { ModuleClassJournal } from './components/ModuleClassJournal';
import { ModuleAiClassRecommend } from './components/ModuleAiClassRecommend';
import { Module4Mindmap } from './components/Module4Mindmap';
import { Module5Statistics } from './components/Module5Statistics';
import { Module6SettingsModal } from './components/Module6SettingsModal';
import { MetadataManagerModal } from './components/MetadataManagerModal';
import { UnifiedEditModal } from './components/UnifiedEditModal';
import { EndPositionMultiSelect } from './components/EndPositionMultiSelect';
import { SubmissionMultiSelect } from './components/SubmissionMultiSelect';
import { LoginLandingShowcase } from './components/LoginLandingShowcase';
import { PositionTaxonomyView } from './components/PositionTaxonomyView';
import { WatchHistoryLogsView } from './components/WatchHistoryLogsView';
import { AdminCenterView } from './components/AdminCenterView';
import { SettingsPageView } from './components/SettingsPageView';
import { CommunityBoardView } from './components/CommunityBoardView';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useLanguage } from './i18n/LanguageContext';
import {
  extractYoutubeId,
  extractInstagramReelId,
  getYoutubeThumbnail,
  getInstagramThumbnail,
  formatSecondsToKoreanLabel,
  extractTechniqueTagsFromMemo,
} from './utils/bjjAnalyzer';

const STORAGE_KEYS = {
  SETTINGS: 'bjj_archive_settings_v1',
  METADATA: 'bjj_archive_metadata_v5',
  VIDEOS: 'bjj_archive_videos_v1',
  QUEUE: 'bjj_archive_queue_v1',
  MINDMAP: 'bjj_archive_mindmap_v1',
};

export default function App() {
  // 1. Settings state
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          // Always ensure mindmap background is white as requested
          mindmapTheme: parsed.mindmapTheme || 'white',
        };
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
    return INITIAL_SETTINGS;
  });

  // Pure helper to ensure required defaults (미분류, Both) are set cleanly
  const normalizeMetadata = (raw: MetadataConfig): MetadataConfig => {
    let nextGiTypes = [...(raw.giTypes || [])];
    let nextCategories = [...(raw.categories || [])];
    let nextPositions = [...(raw.positions || [])];

    if (!nextGiTypes.includes('Both') || !nextGiTypes.includes('미분류')) {
      const clean = nextGiTypes.filter((g) => g !== 'Both' && g !== '미분류');
      nextGiTypes = [...clean, 'Both', '미분류'];
    }

    if (!nextCategories.includes('미분류') || nextCategories[0] !== '미분류') {
      const cleanCats = nextCategories.filter((c) => c !== '미분류');
      nextCategories = ['미분류', ...cleanCats];
    }

    const unclassifiedPosIndex = nextPositions.findIndex((p) => p.name === '미분류');
    if (unclassifiedPosIndex !== 0) {
      if (unclassifiedPosIndex > 0) {
        const target = nextPositions[unclassifiedPosIndex];
        const rest = nextPositions.filter((_, idx) => idx !== unclassifiedPosIndex);
        nextPositions = [target, ...rest];
      } else {
        const p0 = {
          id: 'pos-p0',
          name: '미분류',
          nameEn: 'Unclassified',
          group: '미분류',
          subCategories: [...nextCategories],
        };
        nextPositions = [p0, ...nextPositions];
      }
    }

    return {
      ...raw,
      giTypes: nextGiTypes,
      categories: nextCategories,
      positions: nextPositions,
    };
  };

  // 2. Metadata configuration state - completely synchronized with 37 positions, 46 categories in 5 groups, 41 submissions
  const [metadata, setMetadata] = useState<MetadataConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.METADATA);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.positions &&
          parsed.positions.length > 0 &&
          parsed.submissions &&
          parsed.categories
        ) {
          return normalizeMetadata(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load metadata', e);
    }
    return normalizeMetadata(INITIAL_METADATA);
  });

  // 3. Technique videos state - Persisted in per-user LocalStorage & Cloud DB
  const [videos, setVideos] = useState<TechniqueVideo[]>([]);

  // 4. Registration queue state - Persisted in per-user LocalStorage & Cloud DB
  const [queueItems, setQueueItems] = useState<TechniqueVideo[]>([]);

  // 5. Mindmap layout state
  const [mindmapState, setMindmapState] = useState<MindmapStorageState>(() => 
    createInitialMindmapState(INITIAL_METADATA)
  );
  const [activeTab, setActiveTab] = useState<ActiveModuleTab>('stats');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, language } = useLanguage();

  // App Theme Primary Color (User Request: 관리자 설정창에서 메인컬러를 원하는 색으로 변경, 기본 하늘색 #0ea5e9)
  const primaryColor = settings.primaryColor || '#0ea5e9';

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColor);
  }, [primaryColor]);

  // Firebase Authentication & Per-Account Database State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isUserBanned, setIsUserBanned] = useState(false);
  const [bannedReason, setBannedReason] = useState<string>('');
  const isCloudLoadedRef = useRef(false);
  const skipCloudSyncRef = useRef(false);

  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [metadataModal, setMetadataModal] = useState<{
    isOpen: boolean;
    tab?: 'positions' | 'categories' | 'submissions' | 'gi_diff' | 'taxonomy';
  }>({ isOpen: false });

  const [unifiedModal, setUnifiedModal] = useState<{
    isOpen: boolean;
    video: TechniqueVideo | null;
    mode: 'view' | 'edit';
    activeJournalDate?: string;
    isQueueItem?: boolean;
    initialSeekSeconds?: number;
  }>({
    isOpen: false,
    video: null,
    mode: 'view',
  });

  // Watch History Logs State (시청 로그 기록)
  const [watchLogs, setWatchLogs] = useState<WatchHistoryLog[]>(() => getLocalWatchLogs());
  const [mobileInlineState, setMobileInlineState] = useState<{
    video: TechniqueVideo;
    mode: 'view' | 'edit';
    initialSeekSeconds?: number;
  } | null>(null);
  const [editDraft, setEditDraft] = useState<TechniqueVideo | null>(null);
  const [currentPlaySeconds, setCurrentPlaySeconds] = useState<number>(0);
  const [seekTrigger, setSeekTrigger] = useState<{ time: number; nonce: number } | null>(null);
  const [memoSavedToast, setMemoSavedToast] = useState<string | null>(null);
  const [isMobileTitleExpanded, setIsMobileTitleExpanded] = useState<boolean>(false);

  useEffect(() => {
    setIsMobileTitleExpanded(false);
  }, [mobileInlineState?.video.id]);

  const mobileVideoRef = useRef<HTMLDivElement | null>(null);

  const handleSeek = (seconds: number) => {
    setSeekTrigger({ time: seconds, nonce: Date.now() });
    if (window.innerWidth < 1024 && mobileVideoRef.current) {
      mobileVideoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleQuickAddTimestampMemo = (seconds?: number) => {
    if (!mobileInlineState || mobileInlineState.mode !== 'view') return;
    const targetSec = typeof seconds === 'number' ? Math.max(0, Math.floor(seconds)) : Math.max(0, Math.floor(currentPlaySeconds));
    const todayStr = new Date().toISOString().slice(0, 10);
    const newMemo: JournalMemo = {
      id: `jm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: todayStr,
      timeSeconds: targetSec,
      timeLabel: formatSecondsToKoreanLabel(targetSec),
      content: '',
      createdAt: new Date().toISOString(),
    };
    const updatedMemos = [...(mobileInlineState.video.journalMemos || []), newMemo].sort((a, b) => a.timeSeconds - b.timeSeconds);
    const updated: TechniqueVideo = {
      ...mobileInlineState.video,
      journalMemos: updatedMemos,
      updatedAt: new Date().toISOString(),
    };
    setMobileInlineState({ ...mobileInlineState, video: updated });
    handleUpdateVideo(updated);
    setMemoSavedToast(`⏱️ ${formatSecondsToKoreanLabel(targetSec)} 타임 기록 완료! 아래 메모장에 내용을 작성하세요.`);
    setTimeout(() => setMemoSavedToast(null), 2200);
  };

  const handleSelectTechniqueTagForMobileMemo = (
    memoId: string,
    item: TaxonomyTechniqueItem
  ) => {
    if (!mobileInlineState || mobileInlineState.mode !== 'view') return;
    const tagName = item.name;
    const currentVid = mobileInlineState.video;

    const currentPositions = currentVid.positions && currentVid.positions.length > 0
      ? [...currentVid.positions]
      : (currentVid.position && currentVid.position !== '미분류' ? [currentVid.position] : []);

    const currentCategories = currentVid.categories && currentVid.categories.length > 0
      ? [...currentVid.categories]
      : (currentVid.category && currentVid.category !== '미분류' ? [currentVid.category] : []);

    let newPosition = currentVid.position;
    let newCategory = currentVid.category;
    let newSubmissionDetail = currentVid.submissionDetail;
    let newSubmissionGroup = currentVid.submissionGroup;

    if (item.type === 'position') {
      if (!currentPositions.includes(tagName)) {
        currentPositions.push(tagName);
      }
      if (!newPosition || newPosition === '미분류') {
        newPosition = tagName;
      }
    } else if (item.type === 'category') {
      if (!currentCategories.includes(tagName)) {
        currentCategories.push(tagName);
      }
      if (!newCategory || newCategory === '미분류') {
        newCategory = tagName;
      }
    } else if (item.type === 'submission') {
      newSubmissionDetail = tagName;
      if (item.subGroupId) {
        newSubmissionGroup = item.subGroupId;
      }
      if (!currentCategories.includes(tagName)) {
        currentCategories.push(tagName);
      }
    }

    const updatedMemos = (currentVid.journalMemos || []).map((m) =>
      m.id === memoId ? { ...m, techniqueTag: tagName } : m
    );

    const updated: TechniqueVideo = {
      ...currentVid,
      position: newPosition || (currentPositions[0] || '미분류'),
      positions: currentPositions,
      category: newCategory || (currentCategories[0] || '미분류'),
      categories: currentCategories,
      submissionDetail: newSubmissionDetail,
      submissionGroup: newSubmissionGroup,
      journalMemos: updatedMemos,
      updatedAt: new Date().toISOString(),
    };

    setMobileInlineState({ ...mobileInlineState, video: updated });
    handleUpdateVideo(updated);

    const folderName =
      item.type === 'position'
        ? `${tagName} 포지션`
        : item.type === 'submission'
        ? `서브미션 > ${tagName}`
        : `${item.groupName} > ${tagName}`;

    setMemoSavedToast(`🏷️ #${tagName} 태그 완료! '${folderName}' 폴더에 분류되었습니다.`);
    setTimeout(() => {
      setMemoSavedToast(null);
    }, 3200);
  };

  const handleUpdateMemoContent = (memoId: string, newContent: string) => {
    if (!mobileInlineState || mobileInlineState.mode !== 'view') return;
    const detectedTags = extractTechniqueTagsFromMemo({ content: newContent }, metadata);
    const primaryTag = detectedTags.length > 0 ? detectedTags[0] : undefined;

    const updatedMemos = mobileInlineState.video.journalMemos.map((m) =>
      m.id === memoId
        ? {
            ...m,
            content: newContent,
            ...(primaryTag ? { techniqueTag: primaryTag } : {}),
          }
        : m
    );
    const updated: TechniqueVideo = {
      ...mobileInlineState.video,
      journalMemos: updatedMemos,
      updatedAt: new Date().toISOString(),
    };
    setMobileInlineState({ ...mobileInlineState, video: updated });
    handleUpdateVideo(updated);
  };

  const handleUpdateMemoImage = (memoId: string, imgData: string | undefined) => {
    if (!mobileInlineState || mobileInlineState.mode !== 'view') return;
    const updatedMemos = mobileInlineState.video.journalMemos.map((m) =>
      m.id === memoId ? { ...m, imageUrl: imgData } : m
    );
    const updated: TechniqueVideo = {
      ...mobileInlineState.video,
      journalMemos: updatedMemos,
      updatedAt: new Date().toISOString(),
    };
    setMobileInlineState({ ...mobileInlineState, video: updated });
    handleUpdateVideo(updated);
  };

  const handleDeleteMemo = (memoId: string) => {
    if (!mobileInlineState || mobileInlineState.mode !== 'view') return;
    const updated: TechniqueVideo = {
      ...mobileInlineState.video,
      journalMemos: mobileInlineState.video.journalMemos.filter((m) => m.id !== memoId),
      updatedAt: new Date().toISOString(),
    };
    setMobileInlineState({ ...mobileInlineState, video: updated });
    handleUpdateVideo(updated);
  };

  const handleUpdateGeneralNotes = (newNotes: string) => {
    if (!mobileInlineState || mobileInlineState.mode !== 'view') return;
    const updated: TechniqueVideo = {
      ...mobileInlineState.video,
      generalNotes: newNotes,
      updatedAt: new Date().toISOString(),
    };
    setMobileInlineState({ ...mobileInlineState, video: updated });
    handleUpdateVideo(updated);
  };

  useEffect(() => {
    if (mobileInlineState?.mode === 'edit') {
      setEditDraft({
        ...mobileInlineState.video,
        timelineFrames: [...(mobileInlineState.video.timelineFrames || [])],
        journalMemos: [...(mobileInlineState.video.journalMemos || [])],
        practiceDates: [...(mobileInlineState.video.practiceDates || [])],
      });
    } else {
      setEditDraft(null);
    }
  }, [mobileInlineState]);

  useEffect(() => {
    if (mobileInlineState?.initialSeekSeconds && mobileInlineState.initialSeekSeconds > 0) {
      setSeekTrigger({ time: mobileInlineState.initialSeekSeconds, nonce: Date.now() });
      setCurrentPlaySeconds(mobileInlineState.initialSeekSeconds);
      setMemoSavedToast(`⏱️ ${formatSecondsToKoreanLabel(mobileInlineState.initialSeekSeconds)} 타임라인부터 재생합니다.`);
      setTimeout(() => setMemoSavedToast(null), 3000);
    }
  }, [mobileInlineState?.video.id, mobileInlineState?.initialSeekSeconds]);

  // Central video opener that logs watch history when viewing
  const handleOpenVideoView = (
    v: TechniqueVideo,
    mode: 'view' | 'edit' = 'view',
    activeJournalDate?: string,
    source: 'direct' | 'search' | 'mindmap' | 'journal' | 'stats' | 'folder' = 'direct',
    isQueueItem?: boolean,
    initialSeekSeconds?: number
  ) => {
    // On mobile devices, both view and edit open inline page views instead of popup modals
    if (window.innerWidth < 1024 && !isQueueItem) {
      setMobileInlineState({ video: v, mode, initialSeekSeconds });
      if (mode === 'view') {
        recordWatchLog(currentUser?.uid, {
          userEmail: currentUser?.email || '',
          videoId: v.id,
          videoTitleKo: v.titleKo,
          videoTitleEn: v.titleEn,
          thumbnailUrl: v.thumbnailUrl,
          position: v.position,
          category: v.category,
          giType: v.giType,
          submissionGroup: v.submissionGroup,
          submissionDetail: v.submissionDetail,
          difficulty: v.difficulty,
          proficiencyScore: v.proficiencyScore,
          source,
        }).catch((err) => console.error('Failed to record watch log', err));
      }
      return;
    }
    if (mode === 'view' && !isQueueItem) {
      recordWatchLog(currentUser?.uid, {
        userEmail: currentUser?.email || '',
        videoId: v.id,
        videoTitleKo: v.titleKo,
        videoTitleEn: v.titleEn,
        thumbnailUrl: v.thumbnailUrl,
        position: v.position,
        category: v.category,
        giType: v.giType,
        submissionGroup: v.submissionGroup,
        submissionDetail: v.submissionDetail,
        difficulty: v.difficulty,
        proficiencyScore: v.proficiencyScore,
        source,
      })
        .then((newLog) => {
          setWatchLogs((prev) => [newLog, ...prev.filter((l) => l.id !== newLog.id)].slice(0, 300));
        })
        .catch((err) => {
          console.error('Failed to record watch log', err);
        });
    }

    setUnifiedModal({
      isOpen: true,
      video: v,
      mode,
      activeJournalDate,
      isQueueItem,
      initialSeekSeconds,
    });
  };

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
    } catch (e) {
      console.error(e);
    }
  }, [metadata]);

  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem(`bjj_user_videos_${currentUser.uid}`, JSON.stringify(videos));
    } catch (e) {
      console.error(e);
    }
  }, [videos, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem(`bjj_user_queue_${currentUser.uid}`, JSON.stringify(queueItems));
    } catch (e) {
      console.error(e);
    }
  }, [queueItems, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`bjj_user_mindmap_${currentUser.uid}`, JSON.stringify(mindmapState));
      } catch (e) {
        console.error(e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [mindmapState, currentUser]);

  // Test Firestore connection on boot and listen to Auth state
  useEffect(() => {
    testFirestoreConnection();

    // Fetch global system config on boot for landing showcase & presets
    fetchGlobalSystemConfig()
      .then((globalConfig) => {
        if (globalConfig) {
          if (globalConfig.primaryColor) {
            setSettings((prev) => ({ ...prev, primaryColor: globalConfig.primaryColor! }));
          }
          if (globalConfig.appTitle) {
            setSettings((prev) => ({ ...prev, appTitle: globalConfig.appTitle! }));
          }
          if (globalConfig.appSubtitle) {
            setSettings((prev) => ({ ...prev, appSubtitle: globalConfig.appSubtitle! }));
          }
          if (globalConfig.logoImageUrl !== undefined) {
            setSettings((prev) => ({ ...prev, logoImageUrl: globalConfig.logoImageUrl! }));
          }
          if (globalConfig.logoText) {
            setSettings((prev) => ({ ...prev, logoText: globalConfig.logoText! }));
          }
          if (globalConfig.landingShowcase) {
            setSettings((prev) => ({
              ...prev,
              landingShowcase: {
                ...prev.landingShowcase,
                ...globalConfig.landingShowcase,
              },
            }));
          }
          if (globalConfig.folderColors) {
            setSettings((prev) => ({
              ...prev,
              folderColors: {
                ...prev.folderColors,
                ...globalConfig.folderColors,
              },
            }));
          }
          if (globalConfig.mindmapColors) {
            setSettings((prev) => ({
              ...prev,
              mindmapColors: {
                ...prev.mindmapColors,
                ...globalConfig.mindmapColors,
              },
            }));
          }
          if (globalConfig.allowTimelineMemoImages !== undefined) {
            setSettings((prev) => ({
              ...prev,
              allowTimelineMemoImages: globalConfig.allowTimelineMemoImages,
            }));
          }
          if (globalConfig.mindmapToolbarPosition) {
            setSettings((prev) => ({
              ...prev,
              mindmapToolbarPosition: globalConfig.mindmapToolbarPosition,
            }));
          }
          if (globalConfig.menuVisibility) {
            setSettings((prev) => ({
              ...prev,
              menuVisibility: {
                ...prev.menuVisibility,
                ...globalConfig.menuVisibility,
              },
            }));
          }
          if (globalConfig.globalPositions?.length) {
            setMetadata((prev) => ({
              ...prev,
              positions: globalConfig.globalPositions!,
            }));
          }
          if (globalConfig.globalCategories?.length) {
            setMetadata((prev) => ({
              ...prev,
              categories: globalConfig.globalCategories!,
            }));
          }
          if (globalConfig.globalSubmissions?.length) {
            setMetadata((prev) => ({
              ...prev,
              submissions: globalConfig.globalSubmissions!,
            }));
          }
        }
      })
      .catch((err) => console.warn('Boot global config load:', err));

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(false);
      if (user) {
        setCurrentUser(user);

        // Check if current user is banned
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const uData = userDocSnap.data();
            if (uData.isBanned === true) {
              setIsUserBanned(true);
              setBannedReason(uData.bannedReason || '관리자 강퇴 처리');
              setIsCloudSyncing(false);
              return;
            } else {
              setIsUserBanned(false);
            }
          }
        } catch (e) {
          console.warn('Failed to verify ban status:', e);
        }

        setIsCloudSyncing(true);
        try {
          // Load Watch History Logs for this user
          fetchWatchLogs(user.uid)
            .then((logs) => setWatchLogs(logs))
            .catch((e) => console.warn('Failed to load watch logs', e));

          const cloudData = await loadUserCloudData(user.uid);
          if (cloudData) {
            skipCloudSyncRef.current = true;
            if (cloudData.settings) {
              const globalCfg = getLocalGlobalSystemConfig();
              setSettings({
                ...cloudData.settings,
                ...(globalCfg?.mindmapToolbarPosition ? { mindmapToolbarPosition: globalCfg.mindmapToolbarPosition } : {}),
                ...(globalCfg?.menuVisibility ? {
                  menuVisibility: {
                    ...(cloudData.settings.menuVisibility || {}),
                    ...globalCfg.menuVisibility,
                  }
                } : {}),
              });
            }
            if (cloudData.metadata) {
              if (
                cloudData.metadata.positions &&
                cloudData.metadata.positions.length > 0
              ) {
                setMetadata(cloudData.metadata);
              } else {
                const refreshed = applyCoreTaxonomyToMetadata();
                setMetadata(refreshed);
              }
            }
            // Load videos and queue items exclusively for THIS user!
            setVideos(cloudData.videos || []);
            setQueueItems(cloudData.queueItems || []);

            if (cloudData.mindmapState) setMindmapState(cloudData.mindmapState);
            setTimeout(() => {
              skipCloudSyncRef.current = false;
            }, 300);
            setSyncFeedback('개인 클라우드 DB 동기화 완료');
            setTimeout(() => setSyncFeedback(null), 3000);
          } else {
            // New account: Start with clean isolated account state (Do NOT copy other accounts' videos!)
            let userLocalVids: TechniqueVideo[] = [];
            let userLocalQueue: TechniqueVideo[] = [];
            try {
              const sv = localStorage.getItem(`bjj_user_videos_${user.uid}`);
              if (sv) userLocalVids = JSON.parse(sv);
              const sq = localStorage.getItem(`bjj_user_queue_${user.uid}`);
              if (sq) userLocalQueue = JSON.parse(sq);
            } catch (e) {
              console.error(e);
            }

            const freshVideos = userLocalVids;
            const freshQueue = userLocalQueue;
            const freshMetadata = INITIAL_METADATA;
            const freshSettings = INITIAL_SETTINGS;
            const freshMindmap = createInitialMindmapState(INITIAL_METADATA);

            skipCloudSyncRef.current = true;
            setVideos(freshVideos);
            setQueueItems(freshQueue);
            setMetadata(freshMetadata);
            setSettings(freshSettings);
            setMindmapState(freshMindmap);
            setTimeout(() => {
              skipCloudSyncRef.current = false;
            }, 300);

            await saveUserCloudData(user.uid, {
              version: '2.0.0',
              exportedAt: new Date().toISOString(),
              settings: freshSettings,
              metadata: freshMetadata,
              videos: freshVideos,
              queueItems: freshQueue,
              mindmapState: freshMindmap,
            });
            setSyncFeedback('독립된 개인 클라우드 데이터베이스가 성공적으로 생성되었습니다.');
            setTimeout(() => setSyncFeedback(null), 4000);
          }

          // Merge any Admin Global Presets (Positions, Attributes, Submissions, Settings)
          try {
            const globalConfig = await fetchGlobalSystemConfig();
            if (globalConfig) {
              if (globalConfig.primaryColor) {
                setSettings((prev) => ({ ...prev, primaryColor: globalConfig.primaryColor }));
                document.documentElement.style.setProperty('--primary-color', globalConfig.primaryColor);
              }
              if (globalConfig.appTitle) {
                setSettings((prev) => ({ ...prev, appTitle: globalConfig.appTitle! }));
              }
              if (globalConfig.appSubtitle) {
                setSettings((prev) => ({ ...prev, appSubtitle: globalConfig.appSubtitle! }));
              }
              if (globalConfig.logoImageUrl !== undefined) {
                setSettings((prev) => ({ ...prev, logoImageUrl: globalConfig.logoImageUrl! }));
              }
              if (globalConfig.logoText) {
                setSettings((prev) => ({ ...prev, logoText: globalConfig.logoText! }));
              }
              if (globalConfig.allowTimelineMemoImages !== undefined) {
                setSettings((prev) => ({
                  ...prev,
                  allowTimelineMemoImages: globalConfig.allowTimelineMemoImages,
                }));
              }
              if (globalConfig.folderColors) {
                setSettings((prev) => ({
                  ...prev,
                  folderColors: { ...prev.folderColors, ...globalConfig.folderColors },
                }));
              }
              if (globalConfig.mindmapColors) {
                setSettings((prev) => ({
                  ...prev,
                  mindmapColors: { ...prev.mindmapColors, ...globalConfig.mindmapColors },
                }));
              }
              if (globalConfig.landingShowcase) {
                setSettings((prev) => ({
                  ...prev,
                  landingShowcase: { ...prev.landingShowcase, ...globalConfig.landingShowcase },
                }));
              }
              if (globalConfig.mindmapToolbarPosition) {
                setSettings((prev) => ({
                  ...prev,
                  mindmapToolbarPosition: globalConfig.mindmapToolbarPosition,
                }));
              }
              if (globalConfig.menuVisibility) {
                setSettings((prev) => ({
                  ...prev,
                  menuVisibility: {
                    ...prev.menuVisibility,
                    ...globalConfig.menuVisibility,
                  },
                }));
              }
              if (globalConfig.globalPositions?.length) {
                setMetadata((prev) => ({
                  ...prev,
                  positions: globalConfig.globalPositions!,
                }));
              }
              if (globalConfig.globalCategories?.length) {
                setMetadata((prev) => ({
                  ...prev,
                  categories: globalConfig.globalCategories!,
                }));
              }
              if (globalConfig.globalSubmissions?.length) {
                setMetadata((prev) => ({
                  ...prev,
                  submissions: globalConfig.globalSubmissions!,
                }));
              }
            }
          } catch (e) {
            console.warn('Failed to load global presets', e);
          }
        } catch (err) {
          console.error('Failed to load user cloud data', err);
        } finally {
          setIsCloudSyncing(false);
          isCloudLoadedRef.current = true;
        }
      } else {
        setCurrentUser(null);
        setVideos([]);
        setQueueItems([]);
        setWatchLogs([]);
        isCloudLoadedRef.current = false;
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto-sync data to user's isolated Firestore database when logged in
  useEffect(() => {
    if (!currentUser || !isCloudLoadedRef.current || skipCloudSyncRef.current) return;

    const timer = setTimeout(async () => {
      setIsCloudSyncing(true);
      try {
        await saveUserCloudData(currentUser.uid, {
          version: '2.0.0',
          exportedAt: new Date().toISOString(),
          settings,
          metadata,
          videos,
          queueItems,
          mindmapState,
        });
      } catch (err) {
        console.error('Cloud auto-save error', err);
      } finally {
        setIsCloudSyncing(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentUser, settings, metadata, videos, queueItems, mindmapState]);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In failed', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError('로그인 창이 닫혔습니다. 다시 시도해 주세요.');
      } else if (err?.code === 'auth/popup-blocked') {
        setAuthError('브라우저에서 팝업이 차단되었습니다. 팝업 허용 후 다시 시도해 주세요.');
      } else {
        setAuthError('구글 로그인에 실패했습니다. 다시 시도해 주세요.');
      }
    }
  };

  // Sign-Out Handlers (In-App Modal to avoid iframe window.confirm block)
  const handleSignOutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOutUser();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      setCurrentUser(null);
      try {
        const sv = localStorage.getItem(STORAGE_KEYS.VIDEOS);
        if (sv) setVideos(JSON.parse(sv));
        const sq = localStorage.getItem(STORAGE_KEYS.QUEUE);
        if (sq) setQueueItems(JSON.parse(sq));
      } catch (e) {
        console.error(e);
      }
      isCloudLoadedRef.current = false;
      skipCloudSyncRef.current = false;
      setSyncFeedback(null);
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  // Sync document title and favicon
  useEffect(() => {
    if (settings.appTitle) {
      document.title = settings.appTitle;
    }
    if (settings.logoImageUrl) {
      let link: HTMLLinkElement | null =
        document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.logoImageUrl;
    }
  }, [settings.appTitle, settings.logoImageUrl]);

  // Safety redirect if current active tab is hidden by admin
  useEffect(() => {
    if (!isAdmin && settings.menuVisibility) {
      const vis = { ...DEFAULT_MENU_VISIBILITY, ...settings.menuVisibility };
      const isCurrentTabHidden =
        (activeTab === 'stats' && vis.home === false) ||
        (activeTab === 'folder' && vis.folder === false) ||
        (activeTab === 'add' && vis.add === false) ||
        (activeTab === 'journal' && vis.journal === false) ||
        (activeTab === 'mindmap' && vis.mindmap === false) ||
        (activeTab === 'positions' && vis.positions === false);
      if (isCurrentTabHidden) {
        if (vis.home !== false) setActiveTab('stats');
        else if (vis.folder !== false) setActiveTab('folder');
        else if (vis.add !== false) setActiveTab('add');
        else if (vis.journal !== false) setActiveTab('journal');
        else if (vis.mindmap !== false) setActiveTab('mindmap');
        else if (vis.positions !== false) setActiveTab('positions');
      }
    }
  }, [settings.menuVisibility, activeTab, isAdmin]);

  // Update Settings handler
  const handleUpdateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  // Commit items from Queue to Main Archive
  const handleCommitToArchive = (itemsToCommit: TechniqueVideo[]) => {
    const idsToCommit = new Set(itemsToCommit.map((i) => i.id));
    setVideos((prev) => [...prev, ...itemsToCommit]);
    setQueueItems((prev) => prev.filter((i) => !idsToCommit.has(i.id)));
  };

  // Video Update Handler
  const handleUpdateVideo = (updated: TechniqueVideo) => {
    setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    // Also if in queue, update
    setQueueItems((prev) =>
      prev.map((v) => (v.id === updated.id ? updated : v))
    );

    // Sync timeline notes and journal memos with any matching ClassJournalEntry so team members can view
    fetchClassJournal().then((entries) => {
      let changed = false;
      const nextEntries = entries.map((e) => {
        if (e.videoId === updated.id || e.id === updated.id) {
          changed = true;
          return {
            ...e,
            generalNotes: updated.generalNotes !== undefined ? updated.generalNotes : e.generalNotes,
            timelineFrames: updated.timelineFrames || e.timelineFrames || [],
            journalMemos: updated.journalMemos || e.journalMemos || [],
            updatedAt: new Date().toISOString(),
          };
        }
        return e;
      });
      if (changed) {
        saveClassJournalEntries(nextEntries);
      }
    });
  };

  // Video Delete Handler
  const handleDeleteVideo = (videoId: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    setQueueItems((prev) => prev.filter((v) => v.id !== videoId));
  };

  // Journal date toggle handler
  const handleToggleDateAssignment = (videoId: string, dateStr: string) => {
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id !== videoId) return v;
        const exists = v.practiceDates.includes(dateStr);
        const nextDates = exists
          ? v.practiceDates.filter((d) => d !== dateStr)
          : [...v.practiceDates, dateStr].sort();
        return {
          ...v,
          practiceDates: nextDates,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Quick assign date handler
  const handleQuickAssignDate = (videoId: string, dateStr: string) => {
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id !== videoId) return v;
        if (v.practiceDates.includes(dateStr)) return v;
        return {
          ...v,
          practiceDates: [...v.practiceDates, dateStr].sort(),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Metadata update with cascade rename to all videos
  const handleUpdateMetadata = (
    nextMeta: MetadataConfig,
    renamedMap?: {
      type: 'position' | 'category' | 'submission';
      oldName: string;
      newName: string;
    }
  ) => {
    setMetadata(nextMeta);

    if (isAdmin) {
      saveGlobalSystemConfig(
        {
          globalPositions: nextMeta.positions,
          globalCategories: nextMeta.categories,
          globalSubmissions: nextMeta.submissions,
        },
        currentUser?.email || 'admin'
      ).catch((e) => console.warn('Failed to save global system config for metadata:', e));
    }

    if (renamedMap && renamedMap.oldName !== renamedMap.newName) {
      const { type, oldName, newName } = renamedMap;
      const updater = (v: TechniqueVideo): TechniqueVideo => {
        let updated = { ...v };
        if (type === 'position' && v.position === oldName) {
          updated.position = newName;
        }
        if (type === 'category') {
          if (v.category === oldName) {
            updated.category = newName;
          }
          if (v.categories && v.categories.includes(oldName)) {
            updated.categories = v.categories.map((c) => (c === oldName ? newName : c));
          }
        }
        if (type === 'submission' && v.submissionDetail === oldName) {
          updated.submissionDetail = newName;
        }
        if ((type as string) === 'submission_group' && (v.submissionGroup === oldName || (v as any).submissionGroup === oldName)) {
          updated.submissionGroup = newName as any;
        }
        return updated;
      };

      setVideos((prev) => prev.map(updater));
      setQueueItems((prev) => prev.map(updater));
    }
  };

  // Full backup restore
  const handleRestoreFullBackup = async (payload: {
    settings?: AppSettings;
    metadata?: MetadataConfig;
    videos?: TechniqueVideo[];
    queueItems?: TechniqueVideo[];
    mindmapState?: MindmapStorageState;
  }) => {
    let nextSettings = settings;
    let nextMetadata = metadata;
    let nextVideos = videos;
    let nextQueue = queueItems;
    let nextMindmap = mindmapState;

    if (payload.settings) {
      nextSettings = {
        ...INITIAL_SETTINGS,
        ...payload.settings,
        mindmapTheme: payload.settings.mindmapTheme || 'white',
      };
      setSettings(nextSettings);
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(nextSettings));
      } catch {}
    }
    if (payload.metadata) {
      nextMetadata = payload.metadata;
      setMetadata(nextMetadata);
      try {
        localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(nextMetadata));
      } catch {}
    }
    if (payload.videos) {
      nextVideos = payload.videos;
      setVideos(nextVideos);
      try {
        localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(nextVideos));
      } catch {}
    }
    if (payload.queueItems) {
      nextQueue = payload.queueItems;
      setQueueItems(nextQueue);
      try {
        localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(nextQueue));
      } catch {}
    }
    if (payload.mindmapState) {
      nextMindmap = payload.mindmapState;
      setMindmapState(nextMindmap);
      try {
        localStorage.setItem(STORAGE_KEYS.MINDMAP, JSON.stringify(nextMindmap));
      } catch {}
    }

    if (currentUser?.uid) {
      try {
        await saveUserCloudData(currentUser.uid, {
          version: '2.0.0',
          exportedAt: new Date().toISOString(),
          settings: nextSettings,
          metadata: nextMetadata,
          videos: nextVideos,
          queueItems: nextQueue,
          mindmapState: nextMindmap,
        });
      } catch (e) {
        console.error('Failed to sync restored data to cloud:', e);
      }
    }

    setSyncFeedback('✅ 엑셀 데이터 백업 파일이 성공적으로 복원되었습니다.');
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  // Complete Database Wipe & Clean Reset Handler
  const handleResetToDefaults = async () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.VIDEOS);
      localStorage.removeItem(STORAGE_KEYS.QUEUE);
      localStorage.removeItem(STORAGE_KEYS.METADATA);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.MINDMAP);
      localStorage.removeItem('bjj_archive_watch_logs_v1');
    } catch (e) {
      console.error('Failed to clear local storage:', e);
    }

    setVideos([]);
    setQueueItems([]);
    setWatchLogs([]);
    setMetadata(INITIAL_METADATA);
    setSettings(INITIAL_SETTINGS);
    setMindmapState(createInitialMindmapState(INITIAL_METADATA));

    if (currentUser?.uid) {
      try {
        await saveUserCloudData(currentUser.uid, {
          version: '2.0.0',
          exportedAt: new Date().toISOString(),
          settings: INITIAL_SETTINGS,
          metadata: INITIAL_METADATA,
          videos: [],
          queueItems: [],
          mindmapState: createInitialMindmapState(INITIAL_METADATA),
        });
        await clearAllWatchLogs(currentUser.uid);
      } catch (e) {
        console.error('Failed to wipe cloud user data:', e);
      }
    }

    setSyncFeedback('🧹 데이터베이스 전체 초기화가 완료되었습니다. 모든 데이터가 리셋되었습니다.');
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  // Safe tab navigation that closes open modals & drawers
  const handleNavigateTab = (tab: ActiveModuleTab) => {
    setUnifiedModal({ isOpen: false, video: null, mode: 'view' });
    setMetadataModal({ isOpen: false });
    setIsSettingsOpen(false);
    setMobileInlineState(null);
    setIsMobileMenuOpen(false);
    setActiveTab(tab);
  };

  // Track active stay time for logged-in user
  useEffect(() => {
    if (!currentUser?.uid || isUserBanned) return;
    const interval = setInterval(async () => {
      try {
        const profileRef = doc(db, 'users', currentUser.uid);
        await setDoc(
          profileRef,
          {
            totalStaySeconds: increment(30),
            lastActiveAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Failed to update stay time:', e);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.uid, isUserBanned]);

  // 1. Loading screen while Firebase checks session (Sky Blue & White Theme)
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 flex items-center justify-center text-white font-black text-xl shadow-md animate-pulse">
            {settings.logoText || 'BJJ'}
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
            <span>계정 세션 확인 중...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Login Landing Screen Gate: User MUST log in with Google to enter home screen
  if (!currentUser) {
    return (
      <LoginLandingShowcase
        onGoogleSignIn={handleGoogleSignIn}
        authError={authError}
        onClearAuthError={() => setAuthError(null)}
        appTitle={settings.appTitle}
        appSubtitle={settings.appSubtitle}
        logoImageUrl={settings.logoImageUrl}
        logoText={settings.logoText}
        landingConfig={settings.landingShowcase}
        primaryColor={primaryColor}
      />
    );
  }

  // 3. User Banned Screen Gate
  if (isUserBanned) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center mb-4 shadow-xl">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black mb-2 text-rose-400">서비스 이용이 제한되었습니다</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
          관리자 조치에 의해 해당 계정이 강퇴(이용 정지) 처리되었습니다.
          <br />
          <span className="text-xs text-rose-300 font-mono mt-2 block bg-rose-950/60 p-2.5 rounded-xl border border-rose-800/50">
            사유: {bannedReason || '관리자에 의한 강퇴 조치'}
          </span>
        </p>
        <button
          type="button"
          onClick={() => {
            signOutUser().then(() => {
              setCurrentUser(null);
              setIsUserBanned(false);
            });
          }}
          className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-md flex items-center gap-2"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>로그아웃 후 다른 계정으로 로그인</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col md:flex-row">
      {/* Mobile Top Header (Visible only on < md screens) */}
      <header className="flex md:hidden items-center justify-between px-3.5 py-2.5 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shrink-0"
            title={language === 'ko' ? '전체 메뉴 열기' : 'Open Menu'}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-black text-slate-900 truncate">
            {language === 'en' ? (settings.appTitle === '주짓수 스케치' || settings.appTitle === '주짓수 마스터리' || !settings.appTitle ? 'BJJ Sketch' : settings.appTitle) : (settings.appTitle || '주짓수 스케치')}
          </h1>
        </div>

        <span
          className="px-2.5 py-1 rounded-full text-xs font-extrabold text-white shadow-2xs whitespace-nowrap shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          {activeTab === 'stats'
            ? t('home')
            : activeTab === 'folder'
            ? t('folder')
            : activeTab === 'add'
            ? t('add')
            : activeTab === 'journal'
            ? t('journal')
            : activeTab === 'mindmap'
            ? t('mindmap')
            : activeTab === 'positions'
            ? t('positions')
            : activeTab === 'community'
            ? t('community')
            : activeTab === 'watch_logs'
            ? t('watchLogs')
            : activeTab === 'admin'
            ? t('admin')
            : t('settings')}
        </span>
      </header>

      {/* Sky Blue & White: Left Vertical Sidebar Navigation (Desktop only) */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-white border-r border-slate-200 flex-col shrink-0 md:h-screen md:sticky md:top-0 z-30 shadow-xs">
        {/* Top: Dojo / Brand Card */}
        <div className="p-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-200/90 hover:bg-slate-100/60 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0 overflow-hidden"
                style={{ backgroundColor: primaryColor }}
              >
                {settings.logoImageUrl ? (
                  <img
                    src={settings.logoImageUrl}
                    alt="Dojo Logo"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{settings.logoText || 'BJJ'}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 mt-0.5">
                  <h1 className="text-xs font-black text-slate-900 truncate">
                    {language === 'en' ? (settings.appTitle === '주짓수 스케치' || settings.appTitle === '주짓수 마스터리' || !settings.appTitle ? 'BJJ Sketch' : settings.appTitle) : (settings.appTitle || '주짓수 스케치')}
                  </h1>
                </div>
              </div>
            </div>
            {/* Desktop Brand Area Language Switcher */}
            <LanguageSwitcher variant="pill" primaryColor={primaryColor} />
          </div>
        </div>

        {/* Middle: Categorized Vertical Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {/* Top: [홈] - Dedicated Top Level Item */}
          {((settings.menuVisibility?.home ?? true) || isAdmin) && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNavigateTab('stats')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'stats'
                    ? 'text-white shadow-xs font-extrabold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={activeTab === 'stats' ? { backgroundColor: primaryColor } : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4" style={{ color: activeTab === 'stats' ? '#ffffff' : primaryColor }} />
                  <span>{t('home')}</span>
                </div>
                {settings.menuVisibility?.home === false && isAdmin ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-200 text-slate-600 font-normal">
                    {t('hiddenBadge')}
                  </span>
                ) : (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      activeTab === 'stats'
                        ? 'bg-white/20 text-white'
                        : 'border'
                    }`}
                    style={activeTab !== 'stats' ? {
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                      borderColor: `${primaryColor}30`,
                    } : undefined}
                  >
                    {t('dashboard')}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Group 1: 학습 (Renamed from 수련 아카이브) */}
          {(isAdmin ||
            (settings.menuVisibility?.folder ?? true) ||
            (settings.menuVisibility?.add ?? true) ||
            (settings.menuVisibility?.journal ?? true) ||
            (settings.menuVisibility?.mindmap ?? true)) && (
            <div className="space-y-1">
              <div className="px-2.5 pb-1 text-[11px] font-bold text-slate-400 tracking-wider">
                {t('sectionLearn')}
              </div>

              {/* [영상 폴더] */}
              {((settings.menuVisibility?.folder ?? true) || isAdmin) && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('folder')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'folder'
                      ? 'text-white shadow-xs font-extrabold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  style={activeTab === 'folder' ? { backgroundColor: primaryColor } : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <FolderOpen className="w-4 h-4" style={{ color: activeTab === 'folder' ? '#ffffff' : primaryColor }} />
                    <span>{t('folder')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {settings.menuVisibility?.folder === false && isAdmin && (
                      <span className="px-1 py-0.2 rounded text-[9px] bg-slate-200 text-slate-600 font-normal">
                        {t('hiddenBadge')}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        activeTab === 'folder'
                          ? 'bg-white/25 text-white'
                          : 'border'
                      }`}
                      style={activeTab !== 'folder' ? {
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                        borderColor: `${primaryColor}30`,
                      } : undefined}
                    >
                      {videos.length}
                    </span>
                  </div>
                </button>
              )}

              {/* [영상 추가] */}
              {((settings.menuVisibility?.add ?? true) || isAdmin) && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('add')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'add'
                      ? 'text-white shadow-xs font-extrabold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  style={activeTab === 'add' ? { backgroundColor: primaryColor } : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Video className="w-4 h-4" style={{ color: activeTab === 'add' ? '#ffffff' : primaryColor }} />
                    <span>{t('add')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {settings.menuVisibility?.add === false && isAdmin && (
                      <span className="px-1 py-0.2 rounded text-[9px] bg-slate-200 text-slate-600 font-normal">
                        {t('hiddenBadge')}
                      </span>
                    )}
                    {queueItems.length > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          activeTab === 'add'
                            ? 'bg-white/25 text-white'
                            : 'border'
                        }`}
                        style={activeTab !== 'add' ? {
                          backgroundColor: `${primaryColor}15`,
                          color: primaryColor,
                          borderColor: `${primaryColor}30`,
                        } : undefined}
                      >
                        {queueItems.length}
                      </span>
                    )}
                  </div>
                </button>
              )}

              {/* [학습일지] */}
              {((settings.menuVisibility?.journal ?? true) || isAdmin) && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('journal')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'journal'
                      ? 'text-white shadow-xs font-extrabold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  style={activeTab === 'journal' ? { backgroundColor: primaryColor } : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4" style={{ color: activeTab === 'journal' ? '#ffffff' : primaryColor }} />
                    <span>{t('journal')}</span>
                  </div>
                  {settings.menuVisibility?.journal === false && isAdmin && (
                    <span className="px-1 py-0.2 rounded text-[9px] bg-slate-200 text-slate-600 font-normal">
                      {t('hiddenBadge')}
                    </span>
                  )}
                </button>
              )}

              {/* [수업일지] - 관리자 전용 (Admin Only) */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('class_journal')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'class_journal'
                      ? 'text-white shadow-xs font-extrabold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  style={activeTab === 'class_journal' ? { backgroundColor: primaryColor } : undefined}
                  title={language === 'ko' ? '수업일지 (관리자 전용: 특정 팀원 수업 배정 및 회원 공개 설정)' : 'Class Journal (Admin Only)'}
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-4 h-4" style={{ color: activeTab === 'class_journal' ? '#ffffff' : primaryColor }} />
                    <span>{language === 'ko' ? '수업일지' : 'Class Journal'}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                      activeTab === 'class_journal'
                        ? 'bg-white/20 text-white'
                        : 'border'
                    }`}
                    style={activeTab !== 'class_journal' ? {
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                      borderColor: `${primaryColor}30`,
                    } : undefined}
                  >
                    ADMIN
                  </span>
                </button>
              )}

              {/* [✨ AI 수업 추천] - 관리자 전용 (Admin Only) */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('ai_class_recommend')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'ai_class_recommend'
                      ? 'text-white shadow-xs font-extrabold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  style={activeTab === 'ai_class_recommend' ? { backgroundColor: primaryColor } : undefined}
                  title={language === 'ko' ? 'AI 수업 추천 (관리자 전용: 동일 시작 포지션 기반 하루 3개 추천 및 수업일지 연동)' : 'AI Class Recommendation (Admin Only)'}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4" style={{ color: activeTab === 'ai_class_recommend' ? '#ffffff' : '#f59e0b' }} />
                    <span>{language === 'ko' ? '✨ AI 수업 추천' : '✨ AI Class Recommend'}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                      activeTab === 'ai_class_recommend'
                        ? 'bg-white/20 text-white'
                        : 'border'
                    }`}
                    style={activeTab !== 'ai_class_recommend' ? {
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                      borderColor: `${primaryColor}30`,
                    } : undefined}
                  >
                    ADMIN
                  </span>
                </button>
              )}

              {/* [다이어그램] */}
              {((settings.menuVisibility?.mindmap ?? true) || isAdmin) && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('mindmap')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'mindmap'
                      ? 'text-white shadow-xs font-extrabold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  style={activeTab === 'mindmap' ? { backgroundColor: primaryColor } : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Share2 className="w-4 h-4" style={{ color: activeTab === 'mindmap' ? '#ffffff' : primaryColor }} />
                    <span>{t('mindmap')}</span>
                  </div>
                  {settings.menuVisibility?.mindmap === false && isAdmin && (
                    <span className="px-1 py-0.2 rounded text-[9px] bg-slate-200 text-slate-600 font-normal">
                      {t('hiddenBadge')}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Group 2: 기술 체계 & 분류 (Taxonomy & Hierarchy) */}
          {(isAdmin || (settings.menuVisibility?.positions ?? true)) && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="px-2.5 pb-1 text-[11px] font-bold text-slate-400 tracking-wider">
                {t('sectionTaxonomy')}
              </div>

              {/* [포지션 분류] */}
              <button
                type="button"
                onClick={() => handleNavigateTab('positions')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'positions'
                    ? 'text-white shadow-xs font-extrabold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={activeTab === 'positions' ? { backgroundColor: primaryColor } : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <FolderCog className="w-4 h-4" style={{ color: activeTab === 'positions' ? '#ffffff' : primaryColor }} />
                  <span>{t('positions')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {settings.menuVisibility?.positions === false && isAdmin && (
                    <span className="px-1 py-0.2 rounded text-[9px] bg-slate-200 text-slate-600 font-normal">
                      {t('hiddenBadge')}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      activeTab === 'positions'
                        ? 'bg-white/20 text-white'
                        : 'border'
                    }`}
                    style={activeTab !== 'positions' ? {
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                      borderColor: `${primaryColor}30`,
                    } : undefined}
                  >
                    {metadata.positions.length}
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Group 3: 활동 기록 (시청 로그 기록 분리) */}
          {(isAdmin || (settings.menuVisibility?.watchLogs ?? true)) && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="px-2.5 pb-1 text-[11px] font-bold text-slate-400 tracking-wider">
                {t('sectionHistory')}
              </div>

              {/* [로그기록 (시청 기록)] */}
              <button
                type="button"
                onClick={() => handleNavigateTab('watch_logs')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'watch_logs'
                    ? 'text-white shadow-xs font-extrabold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={activeTab === 'watch_logs' ? { backgroundColor: primaryColor } : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4" style={{ color: activeTab === 'watch_logs' ? '#ffffff' : primaryColor }} />
                  <span>{t('watchLogs')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {settings.menuVisibility?.watchLogs === false && isAdmin && (
                    <span className="px-1 py-0.2 rounded text-[9px] bg-slate-200 text-slate-600 font-normal">
                      {t('hiddenBadge')}
                    </span>
                  )}
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      activeTab === 'watch_logs'
                        ? 'bg-white/20 text-white'
                        : 'border'
                    }`}
                    style={activeTab !== 'watch_logs' ? {
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                      borderColor: `${primaryColor}30`,
                    } : undefined}
                  >
                    {watchLogs.length}
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Group 4: 소통 & 커뮤니티 (Community Free Board) */}
          {(isAdmin || (settings.menuVisibility?.community ?? true)) && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="px-2.5 pb-1 text-[11px] font-bold text-slate-400 tracking-wider">
                {t('sectionCommunity')}
              </div>

              {/* [자유게시판] */}
              <button
                type="button"
                onClick={() => handleNavigateTab('community')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'community'
                    ? 'text-white shadow-xs font-extrabold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={activeTab === 'community' ? { backgroundColor: primaryColor } : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4" style={{ color: activeTab === 'community' ? '#ffffff' : primaryColor }} />
                  <span>{t('community')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {settings.menuVisibility?.community === false && isAdmin && (
                    <span className="px-1 py-0.2 rounded text-[9px] bg-slate-200 text-slate-600 font-normal">
                      {t('hiddenBadge')}
                    </span>
                  )}
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'community'
                        ? 'bg-white/20 text-white'
                        : 'border'
                    }`}
                    style={activeTab !== 'community' ? {
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                      borderColor: `${primaryColor}30`,
                    } : undefined}
                  >
                    Q&A
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Group 5: 관리 & 설정 (Admin & Settings) - User Request: 관리자 설정이 환경설정 밑으로 이동 */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="px-2.5 pb-1 text-[11px] font-bold text-slate-400 tracking-wider">
              {t('sectionAdmin')}
            </div>

            {/* [환경설정] - Placed ABOVE Admin */}
            <button
              type="button"
              onClick={() => handleNavigateTab('settings')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'text-white shadow-xs font-extrabold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
              style={activeTab === 'settings' ? { backgroundColor: primaryColor } : undefined}
              title={language === 'ko' ? '앱 환경 설정 및 엑셀 데이터 백업 / 복원' : 'App Settings & Excel Backup / Restore'}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" style={{ color: activeTab === 'settings' ? '#ffffff' : primaryColor }} />
                <span>{t('settings')}</span>
              </div>
            </button>

            {/* Admin Center Button (Placed BELOW 환경설정 as requested by user) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNavigateTab('admin')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'border-transparent text-white font-black shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold'
                }`}
                style={activeTab === 'admin' ? { backgroundColor: primaryColor } : undefined}
                title={language === 'ko' ? '관리자 설정: 전체 회원 가입 현황 및 글로벌 환경설정' : 'Admin Center: Member Management & Global Settings'}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" style={{ color: activeTab === 'admin' ? '#ffffff' : primaryColor }} />
                  <span>{t('admin')}</span>
                </div>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    activeTab === 'admin'
                      ? 'bg-white/20 text-white'
                      : 'border'
                  }`}
                  style={activeTab !== 'admin' ? {
                    backgroundColor: `${primaryColor}15`,
                    color: primaryColor,
                    borderColor: `${primaryColor}40`,
                  } : undefined}
                >
                  ADMIN
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom User Card */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80">
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="User"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-slate-300 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'}
                </div>
              )}
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <span className="text-[10px] font-semibold text-sky-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                  <span className="truncate">{isCloudSyncing ? t('cloudSyncing') : t('cloudSync')}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOutClick}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
              title={t('logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace (White / Sky theme, Smooth Scrolling, Sticky elements follow viewport) */}
      <main className={`flex-1 min-w-0 ${activeTab === 'mindmap' ? 'p-2 sm:p-6 lg:p-8 space-y-2 md:space-y-6 pb-16 md:pb-32 lg:pb-8' : 'p-3 sm:p-6 lg:p-8 space-y-6 pb-32 lg:pb-8'} bg-slate-50/30`}>
        {/* Cloud Sync Feedback Banner */}
        {syncFeedback && (
          <div className="flex items-center justify-between gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl shadow-xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{syncFeedback}</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-normal">
              {currentUser?.email} 계정 전용 클라우드 DB
            </span>
          </div>
        )}

        {mobileInlineState ? (
          <div className="space-y-3 -mx-3 sm:mx-0 animate-in fade-in duration-200">
            {mobileInlineState.mode === 'view' ? (
              /* VIEW MODE INLINE */
              <>
                {/* Top Back Navigation Bar with Metadata in between */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-3 bg-white sm:bg-white rounded-none sm:rounded-2xl border-b sm:border border-slate-200 px-3 py-2 sm:p-3 shadow-3xs">
                  <button
                    type="button"
                    onClick={() => setMobileInlineState(null)}
                    className="flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 bg-white sm:bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-3xs shrink-0"
                    title="목록으로 돌아가기"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-600 px-1 overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-800 font-bold shrink-0">
                      {mobileInlineState.video.position}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="shrink-0">{mobileInlineState.video.category}</span>
                    <span className="text-slate-300">·</span>
                    <span className="shrink-0">{mobileInlineState.video.giType}</span>
                    <span className="text-slate-300">·</span>
                    <span className="shrink-0">난이도: {mobileInlineState.video.difficulty}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileInlineState({ video: mobileInlineState.video, mode: 'edit' })}
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 text-white transition-colors cursor-pointer shadow-3xs shrink-0 hover:bg-slate-800"
                    title="수정하기"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Video Detail Inline Container */}
                <div className="bg-transparent sm:bg-white rounded-none sm:rounded-2xl border-0 sm:border sm:border-slate-200 overflow-hidden shadow-none sm:shadow-3xs p-3 sm:p-6 space-y-3 sm:space-y-4">
                  {/* Title (Single line with '...' and '더보기' toggle, English only visible when expanded) */}
                  <div className="space-y-1 px-1 sm:px-0">
                    <div className="flex items-start justify-between gap-2">
                      <h2
                        className={`text-sm sm:text-lg font-black text-slate-900 leading-snug flex-1 ${
                          isMobileTitleExpanded ? '' : 'truncate'
                        }`}
                        title={mobileInlineState.video.titleKo}
                      >
                        {mobileInlineState.video.titleKo}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setIsMobileTitleExpanded(!isMobileTitleExpanded)}
                        className="text-[11px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer shrink-0 mt-0.5"
                      >
                        {isMobileTitleExpanded ? '접기' : '더보기'}
                      </button>
                    </div>
                    {isMobileTitleExpanded && mobileInlineState.video.titleEn && (
                      <p className="text-xs text-slate-400 font-mono pt-0.5 animate-in fade-in duration-150">
                        {mobileInlineState.video.titleEn}
                      </p>
                    )}
                  </div>

                  {/* YouTube Player (Margin removed on mobile for edge-to-edge maximum viewing) */}
                  <div ref={mobileVideoRef} className="-mx-3 sm:mx-0">
                    <VideoPlayer16x9
                      youtubeId={mobileInlineState.video.youtubeId}
                      videoUrl={mobileInlineState.video.youtubeUrl}
                      title={mobileInlineState.video.titleKo}
                      externalSeekTime={seekTrigger}
                      initialSeekTime={mobileInlineState.initialSeekSeconds}
                      onTimeChange={setCurrentPlaySeconds}
                      showPrecisionControls={true}
                      onCaptureTimecode={(sec) => handleQuickAddTimestampMemo(sec)}
                      captureButtonLabel="+ 타임스탬프 기록"
                    />
                  </div>



                  {/* Practice Record / Memos & Timeline */}
                  <div className="pt-3 border-t border-slate-100 space-y-3 px-1 sm:px-0">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-xs font-bold text-slate-900">
                          타임라인 메모
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700">
                          {mobileInlineState.video.journalMemos?.length || 0}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickAddTimestampMemo(currentPlaySeconds)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ 메모 작성 ({formatSecondsToKoreanLabel(currentPlaySeconds)})</span>
                      </button>
                    </div>

                    {memoSavedToast && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl animate-fade-in">
                        <BookmarkCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{memoSavedToast}</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      {mobileInlineState.video.journalMemos && mobileInlineState.video.journalMemos.length > 0 ? (
                        mobileInlineState.video.journalMemos.map((memo) => {
                          const tagText = memo.techniqueTag || memo.content.match(/#([가-힣a-zA-Z0-9_\/·\-]+)/)?.[1];
                          const isMatchingSeek = mobileInlineState.initialSeekSeconds
                            ? Math.abs(mobileInlineState.initialSeekSeconds - memo.timeSeconds) < 2
                            : Math.abs(currentPlaySeconds - memo.timeSeconds) < 1.5;

                          return (
                            <div key={memo.id} className={`p-3.5 rounded-2xl bg-white sm:bg-slate-50 border space-y-2 shadow-3xs sm:shadow-none ${
                              isMatchingSeek ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/20' : 'border-slate-200'
                            }`}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSeek(memo.timeSeconds)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 transition-colors font-mono text-xs font-bold cursor-pointer"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>{memo.timeLabel}</span>
                                  </button>

                                  {tagText && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      <Tag className="w-2.5 h-2.5" />
                                      <span>#{tagText}</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {memo.date}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMemo(memo.id)}
                                    className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                    title="메모 삭제"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <HashtagTechniqueInput
                                  value={memo.content}
                                  onChange={(val) => handleUpdateMemoContent(memo.id, val)}
                                  onSelectTechniqueTag={(item) => handleSelectTechniqueTagForMobileMemo(memo.id, item)}
                                  metadata={metadata}
                                  placeholder="기술 디테일, 주의점 작성 (#기술명 입력 시 해당 폴더로 자동 분류)..."
                                  rows={Math.max(2, (memo.content || '').split('\n').length)}
                                  className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-xl focus:outline-none transition-colors resize-y leading-relaxed font-sans"
                                />
                              </div>

                            {/* Image Attachment */}
                            <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                              <label className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors font-medium">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>{memo.imageUrl ? '사진 변경' : '디테일 사진 첨부'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      if (typeof reader.result === 'string') {
                                        handleUpdateMemoImage(memo.id, reader.result);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                />
                              </label>

                              {memo.imageUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateMemoImage(memo.id, undefined)}
                                  className="text-[11px] text-rose-500 hover:text-rose-600 underline cursor-pointer"
                                >
                                  사진 삭제
                                </button>
                              )}
                            </div>

                            {memo.imageUrl && (
                              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-40 flex items-center justify-center">
                                <img
                                  src={memo.imageUrl}
                                  alt="타임라인 메모 사진"
                                  className="w-full h-36 object-contain"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })
                      ) : (
                        <div className="p-5 rounded-2xl border border-dashed border-slate-300 text-center space-y-2 bg-white/60">
                          <Clock className="w-7 h-7 text-indigo-400 mx-auto" />
                          <div className="text-xs font-bold text-slate-700">
                            기록된 타임라인 메모가 없습니다
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            영상 재생 중 상단의 <strong>[+ 메모 작성]</strong> 버튼을 누르면 시간이 즉시 기록됩니다.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* General Notes */}
                    <div className="pt-3 border-t border-slate-100 space-y-2 mt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span>메모</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 font-medium">상시 자유 메모</span>
                      </div>
                      <textarea
                        value={mobileInlineState.video.generalNotes || ''}
                        onChange={(e) => handleUpdateGeneralNotes(e.target.value)}
                        rows={3}
                        placeholder="기술 디테일, 상대 베이스 방향, 체중 실리는 각도 등 메모를 자유롭게 입력하세요..."
                        className="w-full px-3 py-2 text-xs bg-white sm:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-xl focus:outline-none transition-colors leading-relaxed text-slate-800 resize-y shadow-3xs sm:shadow-none"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* EDIT MODE INLINE */
              editDraft && (
                <>
                  {/* Top Edit Action Bar */}
                  <div className="flex items-center justify-between bg-transparent sm:bg-white rounded-none sm:rounded-2xl border-b sm:border border-slate-200 px-3 py-2.5 sm:p-3.5 shadow-none sm:shadow-3xs">
                    <button
                      type="button"
                      onClick={() => setMobileInlineState({ video: mobileInlineState.video, mode: 'view' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white sm:bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-3xs sm:shadow-none"
                    >
                      <span>← 취소</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!editDraft) return;
                        const finalVideo: TechniqueVideo = {
                          ...editDraft,
                          titleKo: editDraft.titleKo.trim() || '이름 없는 주짓수 기술',
                          titleEn: editDraft.titleEn.trim() || 'Untitled BJJ Technique',
                          updatedAt: new Date().toISOString(),
                        };
                        handleUpdateVideo(finalVideo);
                        setMobileInlineState({ video: finalVideo, mode: 'view' });
                      }}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-3xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>수정사항 저장</span>
                    </button>
                  </div>

                  {/* Edit Form Container */}
                  <div className="bg-transparent sm:bg-white rounded-none sm:rounded-2xl border-0 sm:border sm:border-slate-200 overflow-hidden shadow-none sm:shadow-3xs p-3 sm:p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 px-1 sm:px-0">
                        유튜브 / 인스타그램 릴스 URL
                      </label>
                      <input
                        type="text"
                        value={editDraft.youtubeUrl}
                        onChange={(e) => {
                          const url = e.target.value;
                          const ytId = extractYoutubeId(url);
                          const igId = extractInstagramReelId(url);
                          setEditDraft({
                            ...editDraft,
                            youtubeUrl: url,
                            youtubeId: ytId || igId || url,
                            thumbnailUrl: ytId ? getYoutubeThumbnail(ytId) : igId ? getInstagramThumbnail(igId) : editDraft.thumbnailUrl,
                          });
                        }}
                        className="w-full px-3.5 py-2 text-xs bg-white sm:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 shadow-3xs sm:shadow-none"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>

                    <VideoPlayer16x9
                      youtubeId={editDraft.youtubeId}
                      videoUrl={editDraft.youtubeUrl}
                      title={editDraft.titleKo}
                    />

                    <div className="space-y-3 px-1 sm:px-0">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">한글 기술명</label>
                        <input
                          type="text"
                          value={editDraft.titleKo}
                          onChange={(e) => setEditDraft({ ...editDraft, titleKo: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs bg-white sm:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-bold shadow-3xs sm:shadow-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">영문 기술명</label>
                        <input
                          type="text"
                          value={editDraft.titleEn}
                          onChange={(e) => setEditDraft({ ...editDraft, titleEn: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs bg-white sm:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-mono shadow-3xs sm:shadow-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-1 sm:px-0 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">시작 포지션</label>
                        <select
                          value={editDraft.position}
                          onChange={(e) => setEditDraft({ ...editDraft, position: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-white sm:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-bold cursor-pointer shadow-3xs sm:shadow-none"
                        >
                          {metadata.positions.map((p) => (
                            <option key={p.name} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">하위 카테고리</label>
                        <select
                          value={editDraft.category}
                          onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-white sm:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-bold cursor-pointer shadow-3xs sm:shadow-none"
                        >
                          {metadata.categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">도복 / 노기</label>
                        <select
                          value={editDraft.giType}
                          onChange={(e) => setEditDraft({ ...editDraft, giType: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-white sm:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-bold cursor-pointer shadow-3xs sm:shadow-none"
                        >
                          {metadata.giTypes.map((g) => (
                            <option key={g} value={g}>{g === 'Gi' ? '도복' : g === 'No-Gi' ? '노기' : '공용'}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">난이도</label>
                        <select
                          value={editDraft.difficulty}
                          onChange={(e) => setEditDraft({ ...editDraft, difficulty: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-white sm:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-bold cursor-pointer shadow-3xs sm:shadow-none"
                        >
                          {metadata.difficulties.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Final Positions (다중선택) */}
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1 px-1 sm:px-0">
                        최종 포지션 (다중선택)
                      </label>
                      <EndPositionMultiSelect
                        draft={editDraft}
                        setDraft={setEditDraft}
                        metadata={metadata}
                      />
                    </div>

                    {/* Submission Finish (다중선택) */}
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1 px-1 sm:px-0">
                        서브미션 피니시 (다중선택)
                      </label>
                      <SubmissionMultiSelect
                        selectedGroup={editDraft.submissionGroup}
                        selectedDetail={editDraft.submissionDetail}
                        metadata={metadata}
                        onChange={(grp, det) =>
                          setEditDraft({
                            ...editDraft,
                            submissionGroup: grp,
                            submissionDetail: det,
                          })
                        }
                      />
                    </div>


                  </div>
                </>
              )
            )}
          </div>
        ) : (
          <>

        {activeTab === 'add' && (
          <Module1VideoAdd
            queueItems={queueItems}
            existingVideos={videos}
            onUpdateQueue={setQueueItems}
            onCommitToArchive={handleCommitToArchive}
            metadata={metadata}
            onOpenMetadataManager={() =>
              setActiveTab('positions')
            }
            onOpenUnifiedEditor={(v, isQueueItem) =>
              handleOpenVideoView(v, 'edit', undefined, 'direct', isQueueItem)
            }
            primaryColor={primaryColor}
          />
        )}

        {activeTab === 'folder' && (
          <Module2VideoFolder
            videos={videos}
            metadata={metadata}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onUpdateVideo={handleUpdateVideo}
            onDeleteVideo={handleDeleteVideo}
            onOpenModal={(v, mode, seekSec) =>
              handleOpenVideoView(v, mode, undefined, 'folder', false, seekSec)
            }
            onOpenMetadataManager={() =>
              setActiveTab('positions')
            }
            onQuickAssignDate={handleQuickAssignDate}
          />
        )}

        {activeTab === 'journal' && (
          <Module3TrainingJournal
            videos={videos}
            metadata={metadata}
            settings={settings}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onUpdateSettings={handleUpdateSettings}
            onUpdateVideo={handleUpdateVideo}
            onToggleDateAssignment={handleToggleDateAssignment}
            onOpenReviewPopup={(v, dateStr) =>
              handleOpenVideoView(v, 'view', dateStr, 'journal')
            }
          />
        )}

        {/* Module Class Journal (수업일지 - 관리자 전용) */}
        {activeTab === 'class_journal' && isAdmin && (
          <ModuleClassJournal
            videos={videos}
            metadata={metadata}
            settings={settings}
            onOpenVideoReview={(v, dateStr) =>
              handleOpenVideoView(v, 'view', dateStr, 'journal')
            }
            onOpenSettingsTab={() => setActiveTab('admin')}
            onOpenAiRecommend={() => setActiveTab('ai_class_recommend')}
          />
        )}

        {/* Module AI Class Recommend (AI 수업 추천 - 관리자 전용) */}
        {activeTab === 'ai_class_recommend' && isAdmin && (
          <ModuleAiClassRecommend
            videos={videos}
            metadata={metadata}
            settings={settings}
            onNavigateToClassJournal={() => setActiveTab('class_journal')}
          />
        )}

        {activeTab === 'mindmap' && (
          <Module4Mindmap
            videos={videos}
            metadata={metadata}
            settings={settings}
            mindmapState={mindmapState}
            onUpdateMindmapState={setMindmapState}
            onOpenModal={(v, mode) =>
              handleOpenVideoView(v, mode, undefined, 'mindmap')
            }
            onOpenSettingsModal={() => setActiveTab('settings')}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeTab === 'stats' && (
          <Module5Statistics
            videos={videos}
            metadata={metadata}
            settings={settings}
            onOpenModal={(v, mode, activeJournalDate) =>
              handleOpenVideoView(v, mode, activeJournalDate, 'stats')
            }
            onQuickAssignToday={(videoId) =>
              handleQuickAssignDate(
                videoId,
                new Date().toISOString().slice(0, 10)
              )
            }
          />
        )}

        {/* Position Taxonomy Full Workspace View (Merged 8-Pillars & Position Customization) */}
        {activeTab === 'positions' && (
          <PositionTaxonomyView
            metadata={metadata}
            onUpdateMetadata={handleUpdateMetadata}
          />
        )}

        {/* Watch History Logs (시청 로그 기록) Full Workspace View */}
        {activeTab === 'watch_logs' && (
          <WatchHistoryLogsView
            logs={watchLogs}
            videos={videos}
            userEmail={currentUser?.email || ''}
            primaryColor={primaryColor}
            onOpenVideo={(v) => handleOpenVideoView(v, 'view', undefined, 'direct')}
            onDeleteLog={async (logId) => {
              await deleteWatchLog(currentUser?.uid, logId);
              setWatchLogs((prev) => prev.filter((l) => l.id !== logId));
            }}
            onClearAllLogs={async () => {
              await clearAllWatchLogs(currentUser?.uid);
              setWatchLogs([]);
            }}
            onRefreshLogs={async () => {
              const logs = await fetchWatchLogs(currentUser?.uid);
              setWatchLogs(logs);
            }}
            onNavigateToFolder={() => setActiveTab('folder')}
          />
        )}

        {/* Community Free Board (자유게시판) Full Workspace View */}
        {activeTab === 'community' && currentUser && (
          <CommunityBoardView
            currentUser={{
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || undefined,
              photoURL: currentUser.photoURL || undefined,
              isBanned: (currentUser as any).isBanned,
            }}
            isAdmin={isAdmin}
            metadata={metadata}
            videos={videos}
            primaryColor={primaryColor}
            onNavigatePosition={(pos) => {
              setActiveTab('folder');
            }}
          />
        )}

        {/* Admin Center Full Workspace View (Direct View, NOT modal!) */}
        {activeTab === 'admin' && isAdmin && (
          <AdminCenterView
            adminEmail={ADMIN_EMAIL}
            metadata={metadata}
            settings={settings}
            onUpdateMetadata={handleUpdateMetadata}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {/* Settings Full Workspace View (Direct View, NOT modal!) */}
        {activeTab === 'settings' && (
          <SettingsPageView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            metadata={metadata}
            onUpdateMetadata={handleUpdateMetadata}
            videos={videos}
            queueItems={queueItems}
            mindmapState={mindmapState}
            currentUser={currentUser}
            onRequestSignOut={handleSignOutClick}
            onOpenAdminDashboard={() => setActiveTab('admin')}
            onRestoreFullBackup={handleRestoreFullBackup}
            onResetToDefaults={handleResetToDefaults}
          />
        )}
        </>
      )}
      </main>

      {/* Unified Detail & Edit Modal with 16:9 Video Player */}
      <UnifiedEditModal
        video={unifiedModal.video}
        mode={unifiedModal.mode}
        isOpen={unifiedModal.isOpen}
        onClose={() =>
          setUnifiedModal({ isOpen: false, video: null, mode: 'view' })
        }
        onSave={(updated, closeModal = true) => {
          handleUpdateVideo(updated);
          if (closeModal) {
            setUnifiedModal({ isOpen: false, video: null, mode: 'view' });
          } else {
            setUnifiedModal((prev) => ({ ...prev, video: updated }));
          }
        }}
        onDelete={(videoId) => {
          handleDeleteVideo(videoId);
          setUnifiedModal({ isOpen: false, video: null, mode: 'view' });
        }}
        metadata={metadata}
        allVideos={videos}
        onOpenMetadataManager={() => {
          setUnifiedModal({ isOpen: false, video: null, mode: 'view' });
          setActiveTab('positions');
        }}
        activeJournalDate={unifiedModal.activeJournalDate}
        settings={settings}
        initialSeekSeconds={unifiedModal.initialSeekSeconds}
      />

      {/* Custom Metadata Manager Modal (Fallback) */}
      <MetadataManagerModal
        isOpen={metadataModal.isOpen}
        initialTab={metadataModal.tab}
        onClose={() => setMetadataModal({ isOpen: false })}
        metadata={metadata}
        onUpdateMetadata={handleUpdateMetadata}
      />

      {/* Module 6 Global Settings & Backup Modal */}
      <Module6SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        metadata={metadata}
        onUpdateMetadata={(next) => setMetadata(next)}
        videos={videos}
        queueItems={queueItems}
        mindmapState={mindmapState}
        currentUser={currentUser}
        onRequestSignOut={() => {
          setIsSettingsOpen(false);
          setShowLogoutModal(true);
        }}
        onOpenAdminDashboard={() => {
          setIsSettingsOpen(false);
          setActiveTab('admin');
        }}
        onRestoreFullBackup={handleRestoreFullBackup}
        onResetToDefaults={handleResetToDefaults}
      />

      {/* Mobile Bottom Navigation Bar (Fixed for quick finger access on mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1.5 flex md:hidden items-center justify-around shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => handleNavigateTab('stats')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'stats'
              ? 'font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          style={activeTab === 'stats' ? { color: primaryColor } : undefined}
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px]">{language === 'ko' ? '홈' : 'Home'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavigateTab('folder')}
          className={`relative flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'folder'
              ? 'font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          style={activeTab === 'folder' ? { color: primaryColor } : undefined}
        >
          <FolderOpen className="w-4 h-4" />
          <span className="text-[10px]">{language === 'ko' ? '영상폴더' : 'Folders'}</span>
          {videos.length > 0 && (
            <span
              className="absolute -top-0.5 right-1 px-1 rounded-full text-[8px] font-mono font-bold text-white leading-tight"
              style={{ backgroundColor: primaryColor }}
            >
              {videos.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleNavigateTab('add')}
          className={`relative flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'add'
              ? 'font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          style={activeTab === 'add' ? { color: primaryColor } : undefined}
        >
          <Video className="w-4 h-4" />
          <span className="text-[10px]">{language === 'ko' ? '영상추가' : 'Add Video'}</span>
          {queueItems.length > 0 && (
            <span className="absolute -top-0.5 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleNavigateTab('journal')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'journal'
              ? 'font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          style={activeTab === 'journal' ? { color: primaryColor } : undefined}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[10px]">{language === 'ko' ? '학습일지' : 'Journal'}</span>
        </button>
      </nav>

      {/* Mobile Full Navigation Drawer Side Drawer Sheet */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-slate-950/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200">
          {/* Backdrop Click to Close */}
          <div
            className="absolute inset-0"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative w-[85%] max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="User"
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U'}
                  </div>
                )}
                <span className="text-sm font-bold text-slate-900 truncate">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || '사용자'}님
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <LanguageSwitcher variant="pill" primaryColor={primaryColor} />
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer transition-colors"
                  title={t('closeBtn')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Menu List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-slate-800 text-sm font-semibold">
              {/* 홈 */}
              {((settings.menuVisibility?.home ?? true) || isAdmin) && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('stats')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer text-left ${
                    activeTab === 'stats'
                      ? 'border-l-4 bg-sky-50/70 text-sky-600 font-extrabold'
                      : 'border-l-4 border-transparent hover:bg-slate-50 text-slate-800'
                  }`}
                  style={activeTab === 'stats' ? { borderColor: primaryColor, color: primaryColor } : undefined}
                >
                  <span>{t('home')}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" style={activeTab === 'stats' ? { color: primaryColor } : undefined} />
                </button>
              )}

              {/* 영상 폴더 */}
              {((settings.menuVisibility?.folder ?? true) || isAdmin) && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('folder')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer text-left ${
                    activeTab === 'folder'
                      ? 'border-l-4 bg-sky-50/70 text-sky-600 font-extrabold'
                      : 'border-l-4 border-transparent hover:bg-slate-50 text-slate-800'
                  }`}
                  style={activeTab === 'folder' ? { borderColor: primaryColor, color: primaryColor } : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{t('folder')}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-600">
                      {videos.length}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" style={activeTab === 'folder' ? { color: primaryColor } : undefined} />
                </button>
              )}

              {/* 영상 추가 */}
              {((settings.menuVisibility?.add ?? true) || isAdmin) && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('add')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer text-left ${
                    activeTab === 'add'
                      ? 'border-l-4 bg-sky-50/70 text-sky-600 font-extrabold'
                      : 'border-l-4 border-transparent hover:bg-slate-50 text-slate-800'
                  }`}
                  style={activeTab === 'add' ? { borderColor: primaryColor, color: primaryColor } : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{t('add')}</span>
                    {queueItems.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-600">
                        {queueItems.length}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" style={activeTab === 'add' ? { color: primaryColor } : undefined} />
                </button>
              )}

              {/* 학습일지 */}
              {((settings.menuVisibility?.journal ?? true) || isAdmin) && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('journal')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer text-left ${
                    activeTab === 'journal'
                      ? 'border-l-4 bg-sky-50/70 text-sky-600 font-extrabold'
                      : 'border-l-4 border-transparent hover:bg-slate-50 text-slate-800'
                  }`}
                  style={activeTab === 'journal' ? { borderColor: primaryColor, color: primaryColor } : undefined}
                >
                  <span>{t('journal')}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" style={activeTab === 'journal' ? { color: primaryColor } : undefined} />
                </button>
              )}

              {/* 수업일지 (관리자 전용) */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('class_journal')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer text-left ${
                    activeTab === 'class_journal'
                      ? 'border-l-4 bg-sky-50/70 text-sky-600 font-extrabold'
                      : 'border-l-4 border-transparent hover:bg-slate-50 text-slate-800'
                  }`}
                  style={activeTab === 'class_journal' ? { borderColor: primaryColor, color: primaryColor } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{language === 'ko' ? '수업일지' : 'Class Journal'}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800">
                      ADMIN
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" style={activeTab === 'class_journal' ? { color: primaryColor } : undefined} />
                </button>
              )}

              {/* ✨ AI 수업 추천 (관리자 전용) */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('ai_class_recommend')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer text-left ${
                    activeTab === 'ai_class_recommend'
                      ? 'border-l-4 bg-sky-50/70 text-sky-600 font-extrabold'
                      : 'border-l-4 border-transparent hover:bg-slate-50 text-slate-800'
                  }`}
                  style={activeTab === 'ai_class_recommend' ? { borderColor: primaryColor, color: primaryColor } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                    <span>{language === 'ko' ? '✨ AI 수업 추천' : '✨ AI Class Recommend'}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800">
                      ADMIN
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" style={activeTab === 'ai_class_recommend' ? { color: primaryColor } : undefined} />
                </button>
              )}

              {/* 다이어그램 */}
              {((settings.menuVisibility?.mindmap ?? true) || isAdmin) && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('mindmap')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer text-left ${
                    activeTab === 'mindmap'
                      ? 'border-l-4 bg-sky-50/70 text-sky-600 font-extrabold'
                      : 'border-l-4 border-transparent hover:bg-slate-50 text-slate-800'
                  }`}
                  style={activeTab === 'mindmap' ? { borderColor: primaryColor, color: primaryColor } : undefined}
                >
                  <span>{t('mindmap')}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" style={activeTab === 'mindmap' ? { color: primaryColor } : undefined} />
                </button>
              )}

              {/* 포지션 분류 */}
              {((settings.menuVisibility?.positions ?? true) || isAdmin) && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('positions')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer text-left ${
                    activeTab === 'positions'
                      ? 'border-l-4 bg-sky-50/70 text-sky-600 font-extrabold'
                      : 'border-l-4 border-transparent hover:bg-slate-50 text-slate-800'
                  }`}
                  style={activeTab === 'positions' ? { borderColor: primaryColor, color: primaryColor } : undefined}
                >
                  <span>{t('positions')}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" style={activeTab === 'positions' ? { color: primaryColor } : undefined} />
                </button>
              )}

              {/* 자유게시판 */}
              {((settings.menuVisibility?.community ?? true) || isAdmin) && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('community')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer text-left ${
                    activeTab === 'community'
                      ? 'border-l-4 bg-sky-50/70 text-sky-600 font-extrabold'
                      : 'border-l-4 border-transparent hover:bg-slate-50 text-slate-800'
                  }`}
                  style={activeTab === 'community' ? { borderColor: primaryColor, color: primaryColor } : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{t('community')}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500">
                      Q&A
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" style={activeTab === 'community' ? { color: primaryColor } : undefined} />
                </button>
              )}

              {/* 시청 로그 기록 */}
              {((settings.menuVisibility?.watchLogs ?? true) || isAdmin) && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('watch_logs')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer text-left ${
                    activeTab === 'watch_logs'
                      ? 'border-l-4 bg-sky-50/70 text-sky-600 font-extrabold'
                      : 'border-l-4 border-transparent hover:bg-slate-50 text-slate-800'
                  }`}
                  style={activeTab === 'watch_logs' ? { borderColor: primaryColor, color: primaryColor } : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{t('watchLogs')}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-600">
                      Beta
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" style={activeTab === 'watch_logs' ? { color: primaryColor } : undefined} />
                </button>
              )}

              {/* 환경설정 */}
              <button
                type="button"
                onClick={() => handleNavigateTab('settings')}
                className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer text-left ${
                  activeTab === 'settings'
                    ? 'border-l-4 bg-sky-50/70 text-sky-600 font-extrabold'
                    : 'border-l-4 border-transparent hover:bg-slate-50 text-slate-800'
                }`}
                style={activeTab === 'settings' ? { borderColor: primaryColor, color: primaryColor } : undefined}
              >
                <span>{t('settings')}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" style={activeTab === 'settings' ? { color: primaryColor } : undefined} />
              </button>

              {/* 관리자 설정 */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNavigateTab('admin')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer text-left ${
                    activeTab === 'admin'
                      ? 'border-l-4 bg-sky-50/70 text-sky-600 font-extrabold'
                      : 'border-l-4 border-transparent hover:bg-slate-50 text-slate-800'
                  }`}
                  style={activeTab === 'admin' ? { borderColor: primaryColor, color: primaryColor } : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{t('admin')}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-slate-200 text-slate-700">
                      ADMIN
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" style={activeTab === 'admin' ? { color: primaryColor } : undefined} />
                </button>
              )}
            </div>

            {/* Bottom Footer */}
            <div className="p-4 border-t border-slate-100 space-y-3 bg-white shrink-0">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>연결 도장</span>
                <span className="text-[10px] font-mono">v2.0</span>
              </div>

              {/* Dojo / App Card */}
              <div className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 overflow-hidden shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  {settings.logoImageUrl ? (
                    <img
                      src={settings.logoImageUrl}
                      alt="Logo"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{settings.logoText || 'BJJ'}</span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800 truncate">
                  {settings.appTitle || '주짓수 스케치'}
                </span>
              </div>

              {/* Red Outline Logout Button */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout In-App Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              로그아웃 하시겠습니까?
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {currentUser?.email ? (
                <>
                  <strong className="text-slate-700 font-semibold">{currentUser.email}</strong> 계정에서 로그아웃하고 로그인 첫 화면으로 이동합니다.
                </>
              ) : (
                '현재 계정에서 로그아웃하고 로그인 첫 화면으로 이동합니다.'
              )}
              <br />
              클라우드 DB에 동기화된 모든 수련 데이터는 안전하게 보관됩니다.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOut}
                disabled={isLoggingOut}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>로그아웃 중...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>로그아웃 확인</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
