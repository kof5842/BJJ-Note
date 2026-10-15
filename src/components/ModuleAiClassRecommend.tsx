import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Settings,
  Calendar,
  RefreshCw,
  Clock,
  Play,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
  Filter,
  X,
  Plus,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Flame,
  Shield,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import {
  AppSettings,
  MetadataConfig,
  ClassJournalEntry,
  AiRecommendSettings,
  AiRecommendLanguage,
  AiRecommendDayStyle,
  AiRecommendPositionCycle,
  AiRecommendSearchScope,
  AiRecommendedVideoCandidate,
  PositionFolder,
  TechniqueVideo,
} from '../types';
import {
  STORAGE_KEY_AI_RECOMMEND_SETTINGS,
  DEFAULT_AI_RECOMMEND_SETTINGS,
  calculateStartPositionForDate,
  getDayOfWeekFromDateStr,
  getExcludedClassEntriesCount,
  getNormalizedVideoKey,
  seenUrlsHistory,
  recordUrlToSeenHistory,
  buildAllVideosPool,
  getLoggedUrlsSet,
  pickUniqueVideos,
} from '../data/aiRecommendedTechniquesData';
import {
  fetchClassJournal,
  saveClassJournalEntries,
} from '../services/archiveService';
import { VideoPlayer16x9 } from './VideoPlayer16x9';

interface ModuleAiClassRecommendProps {
  videos?: TechniqueVideo[];
  metadata: MetadataConfig;
  settings: AppSettings;
  onNavigateToClassJournal: () => void;
}

type PeriodTab = 'day' | 'week' | 'month';

const DAY_NAMES_KOREAN = ['일', '월', '화', '수', '목', '금', '토'];

export const ModuleAiClassRecommend: React.FC<ModuleAiClassRecommendProps> = ({
  videos = [],
  metadata,
  settings,
  onNavigateToClassJournal,
}) => {
  const themeColor = settings.primaryColor || '#0ea5e9';

  // 1. Settings state from localStorage
  const [recommendSettings, setRecommendSettings] = useState<AiRecommendSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AI_RECOMMEND_SETTINGS);
      if (saved) {
        return { ...DEFAULT_AI_RECOMMEND_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse AI recommend settings', e);
    }
    return DEFAULT_AI_RECOMMEND_SETTINGS;
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [draftSettings, setDraftSettings] = useState<AiRecommendSettings>(recommendSettings);

  // 2. Class Journal Entries state
  const [classEntries, setClassEntries] = useState<ClassJournalEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchClassJournal().then((data) => {
      if (isMounted) {
        setClassEntries(data);
        setIsLoadingEntries(false);
      }
    });

    const handleJournalChanged = () => {
      fetchClassJournal().then((data) => setClassEntries(data));
    };

    window.addEventListener('bjj_class_journal_changed', handleJournalChanged);
    return () => {
      window.removeEventListener('bjj_class_journal_changed', handleJournalChanged);
    };
  }, []);

  // 3. Navigation Date state
  const todayDateStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayDateStr);
  const [activePeriodTab, setActivePeriodTab] = useState<PeriodTab>('day');

  // Month navigation state
  const [viewYear, setViewYear] = useState<number>(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => new Date().getMonth() + 1);

  // Position override map per date: { [dateStr]: positionName }
  const [positionOverrides, setPositionOverrides] = useState<Record<string, string>>({});
  // Category override map per date: { [dateStr]: categoryName }
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});
  // Custom assigned cards per date (set when refreshing all or swapping a single card): { [dateStr]: AiRecommendedVideoCandidate[] }
  const [customDayCards, setCustomDayCards] = useState<Record<string, AiRecommendedVideoCandidate[]>>({});
  // Start time edits per card: { [`${dateStr}-${cardIndex}`]: 'MM:SS' }
  const [startTimeEdits, setStartTimeEdits] = useState<Record<string, string>>({});

  // Preview Video Modal
  const [previewingVideo, setPreviewingVideo] = useState<{
    candidate: AiRecommendedVideoCandidate;
    startSec: number;
    timeLabel: string;
  } | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Save settings handler
  const handleSaveSettings = () => {
    seenUrlsHistory.clear();
    setCustomDayCards({});
    setRecommendSettings(draftSettings);
    try {
      localStorage.setItem(STORAGE_KEY_AI_RECOMMEND_SETTINGS, JSON.stringify(draftSettings));
    } catch {}
    setIsSettingsModalOpen(false);
    showToast('⚙️ 관장 맞춤 추천 설정이 저장되었습니다.');
  };

  // Convert "MM:SS" or "SS" to seconds
  const parseMMSS = (val: string): number => {
    if (!val) return 0;
    const parts = val.trim().split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 1 && !isNaN(parts[0])) {
      return parts[0];
    }
    return 0;
  };

  // Format seconds to "MM:SS"
  const formatSecToMMSS = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Week view: generate Mon~Sun (7 days) for the selected week
  const weekDays = useMemo(() => {
    const target = new Date(selectedDateStr);
    const day = target.getDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(target);
    monday.setDate(target.getDate() + diffToMonday);

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push(str);
    }
    return days;
  }, [selectedDateStr]);

  // Combined deduplicated video pool
  const allVideosPool = useMemo(() => buildAllVideosPool(videos), [videos]);

  // Compute weekly schedule in a single coordinated pass so NO two days in the week share a URL
  const weekScheduleMap = useMemo(() => {
    const map: Record<
      string,
      {
        startPosition: string;
        dayStyle: AiRecommendDayStyle;
        isOffDay: boolean;
        candidates: AiRecommendedVideoCandidate[];
        totalPoolSize: number;
        unseenPoolSize: number;
      }
    > = {};

    const currentlyAssignedUrls = new Set<string>();
    const goalCount = Math.min(Math.max(recommendSettings.dailyGoalCount || 3, 1), 3);

    // 1. Pre-register any custom refreshed/swapped cards in this week so other days never duplicate them
    weekDays.forEach((dStr) => {
      const custom = customDayCards[dStr];
      if (custom && custom.length > 0) {
        custom.slice(0, goalCount).forEach((c) => {
          const k = getNormalizedVideoKey(c.youtubeUrl || c.youtubeId || '');
          if (k) currentlyAssignedUrls.add(k);
        });
      }
    });

    // 2. Assign unique videos for each day of the week using pickUniqueVideos
    weekDays.forEach((dStr) => {
      const dayOfWeek = getDayOfWeekFromDateStr(dStr);
      const dayStyle: AiRecommendDayStyle =
        (recommendSettings.dayStyles as Record<number, AiRecommendDayStyle>)[dayOfWeek] || 'all';

      if (dayStyle === 'off') {
        map[dStr] = {
          startPosition: '휴관 (수업 없음)',
          dayStyle: 'off',
          isOffDay: true,
          candidates: [],
          totalPoolSize: 0,
          unseenPoolSize: 0,
        };
        return;
      }

      const startPosition = calculateStartPositionForDate(
        dStr,
        recommendSettings.positionCycle,
        positionOverrides[dStr],
        recommendSettings.searchScope || 'all_expanded',
        dayStyle
      );

      if (customDayCards[dStr] && customDayCards[dStr].length > 0) {
        const customList = customDayCards[dStr].slice(0, goalCount).map((c) => ({
          ...c,
          startPosition,
        }));
        map[dStr] = {
          startPosition,
          dayStyle,
          isOffDay: false,
          candidates: customList,
          totalPoolSize: allVideosPool.length,
          unseenPoolSize: customList.length,
        };
        return;
      }

      const loggedUrls = getLoggedUrlsSet(
        classEntries,
        recommendSettings.dedupPeriod,
        recommendSettings.customDedupDays,
        dStr
      );
      const overrideCat = categoryOverrides[dStr];
      const targetType =
        !overrideCat || overrideCat === '전체' || overrideCat === '미분류' ? 'ALL' : overrideCat;

      const selected = pickUniqueVideos({
        allVideosPool,
        settings: recommendSettings,
        dateStr: dStr,
        dayOfWeek,
        targetPosition: startPosition,
        targetType,
        loggedUrls,
        currentlyAssignedUrls,
        countToPick: goalCount,
        recordToSeenHistory: false,
      });

      map[dStr] = {
        startPosition,
        dayStyle,
        isOffDay: false,
        candidates: selected,
        totalPoolSize: allVideosPool.length,
        unseenPoolSize: selected.length,
      };
    });

    return map;
  }, [
    weekDays,
    customDayCards,
    recommendSettings,
    positionOverrides,
    categoryOverrides,
    classEntries,
    allVideosPool,
  ]);

  // Get candidate list for any given date
  const getCandidatesForDate = useCallback(
    (dateStr: string) => {
      if (weekScheduleMap[dateStr]) {
        return weekScheduleMap[dateStr];
      }
      const dayOfWeek = getDayOfWeekFromDateStr(dateStr);
      const dayStyle: AiRecommendDayStyle =
        (recommendSettings.dayStyles as Record<number, AiRecommendDayStyle>)[dayOfWeek] || 'all';
      if (dayStyle === 'off') {
        return {
          startPosition: '휴관 (수업 없음)',
          dayStyle: 'off' as AiRecommendDayStyle,
          isOffDay: true,
          candidates: [],
          totalPoolSize: 0,
          unseenPoolSize: 0,
        };
      }
      const startPosition = calculateStartPositionForDate(
        dateStr,
        recommendSettings.positionCycle,
        positionOverrides[dateStr],
        recommendSettings.searchScope || 'all_expanded',
        dayStyle
      );
      const goalCount = Math.min(Math.max(recommendSettings.dailyGoalCount || 3, 1), 3);
      if (customDayCards[dateStr] && customDayCards[dateStr].length > 0) {
        return {
          startPosition,
          dayStyle,
          isOffDay: false,
          candidates: customDayCards[dateStr].slice(0, goalCount).map((c) => ({ ...c, startPosition })),
          totalPoolSize: allVideosPool.length,
          unseenPoolSize: customDayCards[dateStr].length,
        };
      }
      const loggedUrls = getLoggedUrlsSet(
        classEntries,
        recommendSettings.dedupPeriod,
        recommendSettings.customDedupDays,
        dateStr
      );
      const currentlyAssignedUrls = new Set<string>();
      const overrideCat = categoryOverrides[dateStr];
      const targetType =
        !overrideCat || overrideCat === '전체' || overrideCat === '미분류' ? 'ALL' : overrideCat;
      const selected = pickUniqueVideos({
        allVideosPool,
        settings: recommendSettings,
        dateStr,
        dayOfWeek,
        targetPosition: startPosition,
        targetType,
        loggedUrls,
        currentlyAssignedUrls,
        countToPick: goalCount,
        recordToSeenHistory: false,
      });
      return {
        startPosition,
        dayStyle,
        isOffDay: false,
        candidates: selected,
        totalPoolSize: allVideosPool.length,
        unseenPoolSize: selected.length,
      };
    },
    [
      weekScheduleMap,
      recommendSettings,
      positionOverrides,
      categoryOverrides,
      customDayCards,
      allVideosPool,
      classEntries,
    ]
  );

  // Check if a technique or video is already registered in class journal for this date
  const isCandidateRegisteredOnDate = useCallback(
    (dateStr: string, candidate: AiRecommendedVideoCandidate) => {
      const candKey = getNormalizedVideoKey(candidate.youtubeUrl || candidate.youtubeId || '');
      return classEntries.some((entry) => {
        if (entry.date !== dateStr) return false;
        const entryKey = getNormalizedVideoKey(entry.youtubeUrl || entry.youtubeId || '');
        return (
          (candKey && entryKey === candKey) ||
          entry.videoTitleKo.trim().toLowerCase() === candidate.techniqueName.trim().toLowerCase()
        );
      });
    },
    [classEntries]
  );

  // Count registered entries on date
  const getRegisteredCountForDate = useCallback(
    (dateStr: string) => {
      return classEntries.filter((entry) => entry.date === dateStr).length;
    },
    [classEntries]
  );

  // Register a candidate video to Class Journal
  const handleRegisterToClassJournal = async (
    dateStr: string,
    candidate: AiRecommendedVideoCandidate,
    cardIndex: number
  ) => {
    const timeKey = `${dateStr}-${cardIndex}`;
    const specifiedTimeLabel = startTimeEdits[timeKey] || candidate.recommendedStartTime || '00:00';
    const specifiedSec = parseMMSS(specifiedTimeLabel);

    if (isCandidateRegisteredOnDate(dateStr, candidate)) {
      showToast(`이미 [${dateStr}] 수업일지에 등록되어 있는 기술입니다.`);
      return;
    }

    const newClassEntry: ClassJournalEntry = {
      id: `cj-ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: dateStr,
      videoId: `rec-vid-${candidate.youtubeId}`,
      videoTitleKo: candidate.techniqueName,
      videoTitleEn: candidate.techniqueNameEn || '',
      youtubeUrl: candidate.youtubeUrl,
      youtubeId: candidate.youtubeId,
      thumbnailUrl:
        candidate.thumbnailUrl || `https://i.ytimg.com/vi/${candidate.youtubeId}/hqdefault.jpg`,
      position: candidate.startPosition,
      category: candidate.category,
      giType: candidate.giType === 'Both' ? 'Both' : candidate.giType,
      difficulty: candidate.difficulty,
      proficiencyScore: 5,
      generalNotes: `[AI 추천 기술] 시작 포지션: ${candidate.startPosition} | 추천 채널: ${candidate.channelName} | 핵심 포인트: ${candidate.keyDetailTag}`,
      timelineFrames: [
        {
          id: `tf-${Date.now()}`,
          timeSeconds: specifiedSec,
          timeLabel: specifiedTimeLabel,
          stepTitle: `${candidate.techniqueName} 시작 구간`,
          detailNote: candidate.keyDetailTag || 'AI 추천 시작 포인트',
        },
      ],
      journalMemos: [
        {
          id: `jm-${Date.now()}`,
          date: dateStr,
          timeSeconds: specifiedSec,
          timeLabel: specifiedTimeLabel,
          content: `#${candidate.techniqueName} ${candidate.keyDetailTag ? `(${candidate.keyDetailTag})` : ''}`,
          createdAt: new Date().toISOString(),
          techniqueTag: candidate.techniqueName,
        },
      ],
      isPublished: true,
      instructorName: settings.appTitle || '관장님',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextEntries = [newClassEntry, ...classEntries];
    setClassEntries(nextEntries);
    await saveClassJournalEntries(nextEntries);

    showToast(`✅ [${dateStr}] '${candidate.techniqueName}' (${specifiedTimeLabel}) 수업일지 등록 완료!`);
  };

  // Refresh all candidate videos for a date using pickUniqueVideos (100% URL duplicate check)
  const handleRefreshDayCandidates = (dateStr: string) => {
    const currentData = getCandidatesForDate(dateStr);
    if (currentData.isOffDay || currentData.candidates.length === 0) return;

    const currentlyAssignedUrls = new Set<string>();
    const currentScreenUrls = new Set<string>();

    // Register all currently visible cards across the week AND add current date's cards to currentScreenUrls & seenUrlsHistory
    weekDays.forEach((dStr) => {
      const dData = getCandidatesForDate(dStr);
      dData.candidates.forEach((c) => {
        const key = getNormalizedVideoKey(c.youtubeUrl || c.youtubeId || '');
        if (key) {
          currentlyAssignedUrls.add(key);
          if (dStr === dateStr) {
            currentScreenUrls.add(key);
            recordUrlToSeenHistory(key);
          }
        }
      });
    });

    currentData.candidates.forEach((c) => {
      const key = getNormalizedVideoKey(c.youtubeUrl || c.youtubeId || '');
      if (key) {
        currentlyAssignedUrls.add(key);
        currentScreenUrls.add(key);
        recordUrlToSeenHistory(key);
      }
    });

    const dayOfWeek = getDayOfWeekFromDateStr(dateStr);
    const goalCount = Math.min(Math.max(recommendSettings.dailyGoalCount || 3, 1), 3);
    const loggedUrls = getLoggedUrlsSet(
      classEntries,
      recommendSettings.dedupPeriod,
      recommendSettings.customDedupDays,
      dateStr
    );
    const overrideCat = categoryOverrides[dateStr];
    const targetType =
      !overrideCat || overrideCat === '전체' || overrideCat === '미분류' ? 'ALL' : overrideCat;

    const prevSeenSize = seenUrlsHistory.size;
    const nextCandidates = pickUniqueVideos({
      allVideosPool,
      settings: recommendSettings,
      dateStr,
      dayOfWeek,
      targetPosition: currentData.startPosition,
      targetType,
      loggedUrls,
      currentlyAssignedUrls,
      currentScreenUrls,
      countToPick: goalCount,
      recordToSeenHistory: true,
    });
    const wasReset = prevSeenSize > 0 && seenUrlsHistory.size < prevSeenSize;

    if (nextCandidates.length > 0) {
      setCustomDayCards((prev) => ({
        ...prev,
        [dateStr]: nextCandidates,
      }));
    }

    if (wasReset) {
      showToast(`🔄 모든 후보 영상을 탐색하여 이전 스킵 기록을 초기화하고 새로운 조합으로 순환합니다.`);
    } else {
      showToast(`✨ 중복 없는 새로운 URL 영상 ${nextCandidates.length}개를 불러왔습니다.`);
    }
  };

  // Swap a single card using pickUniqueVideos (countToPick: 1, strict URL & style & language check)
  const handleSwapSingleCard = (
    dateStr: string,
    cardIndex: number,
    currentCandidate: AiRecommendedVideoCandidate,
    startPosition: string
  ) => {
    const currentData = getCandidatesForDate(dateStr);
    if (currentData.isOffDay) return;

    const currentlyAssignedUrls = new Set<string>();
    const currentScreenUrls = new Set<string>();
    // Register all currently displayed cards across the week (and on this date) so the replacement never collides
    weekDays.forEach((dStr) => {
      const dData = getCandidatesForDate(dStr);
      dData.candidates.forEach((c) => {
        const key = getNormalizedVideoKey(c.youtubeUrl || c.youtubeId || '');
        if (key) {
          currentlyAssignedUrls.add(key);
          if (dStr === dateStr) {
            currentScreenUrls.add(key);
          }
        }
      });
    });
    currentData.candidates.forEach((c) => {
      const key = getNormalizedVideoKey(c.youtubeUrl || c.youtubeId || '');
      if (key) {
        currentlyAssignedUrls.add(key);
        currentScreenUrls.add(key);
      }
    });

    const currentCardKey = getNormalizedVideoKey(
      currentCandidate.youtubeUrl || currentCandidate.youtubeId || ''
    );
    if (currentCardKey) {
      currentlyAssignedUrls.add(currentCardKey);
      currentScreenUrls.add(currentCardKey);
      recordUrlToSeenHistory(currentCardKey);
    }

    const dayOfWeek = getDayOfWeekFromDateStr(dateStr);
    const loggedUrls = getLoggedUrlsSet(
      classEntries,
      recommendSettings.dedupPeriod,
      recommendSettings.customDedupDays,
      dateStr
    );
    const overrideCat = categoryOverrides[dateStr];
    const targetType =
      !overrideCat || overrideCat === '전체' || overrideCat === '미분류' ? 'ALL' : overrideCat;

    const picked = pickUniqueVideos({
      allVideosPool,
      settings: recommendSettings,
      dateStr,
      dayOfWeek,
      targetPosition: startPosition,
      targetType,
      loggedUrls,
      currentlyAssignedUrls,
      currentScreenUrls,
      countToPick: 1,
      recordToSeenHistory: true,
    });

    if (picked.length > 0) {
      const updatedList = currentData.candidates.map((cand, idx) =>
        idx === cardIndex ? { ...picked[0], startPosition } : cand
      );
      setCustomDayCards((prev) => ({
        ...prev,
        [dateStr]: updatedList,
      }));
      showToast(`🔍 '${startPosition}'의 중복 없는 새로운 영상으로 교체되었습니다.`);
    }
  };

  // Change category/position override via dropdown
  const handleSelectPositionOverride = (dateStr: string, newPosition: string) => {
    setPositionOverrides((prev) => ({
      ...prev,
      [dateStr]: newPosition,
    }));
    setCustomDayCards((prev) => {
      const next = { ...prev };
      delete next[dateStr];
      return next;
    });
    showToast(`📂 시작 포지션을 '${newPosition}'(으)로 변경했습니다.`);
  };

  // All available position options from metadata (or taxonomy)
  const availablePositions = useMemo(() => {
    const list = metadata.positions && metadata.positions.length > 0
      ? metadata.positions.map((p) => p.name).filter((n) => n !== '미분류')
      : [
          '클로즈드 가드',
          '하프 가드',
          '사이드 컨트롤',
          '마운트',
          '백 마운트 / 백 컨트롤',
          '스탠딩 / 오픈 그립',
          '레슬링 클린치 / 타이업',
          '터틀 포지션',
          '버터플라이 가드',
          '데라히바 가드',
          '스파이더 가드',
          '라쏘 가드',
          '싱글렉 X 가드',
          'X 가드',
          '니온밸리',
          '노스 사우스 컨트롤',
        ];
    return Array.from(new Set(list));
  }, [metadata.positions]);

  // Technique natures
  const techniqueCategories = ['전체', '가드 패스', '스윕', '서브미션', '이스케이프', '테이크다운'];

  // Current selected day candidate bundle
  const currentDayData = useMemo(() => {
    return getCandidatesForDate(selectedDateStr);
  }, [getCandidatesForDate, selectedDateStr]);

  // Real-time calculation of how many class entries are excluded by the dedup period
  const dedupExcludedCount = useMemo(() => {
    return getExcludedClassEntriesCount(
      classEntries,
      draftSettings.dedupPeriod,
      draftSettings.customDedupDays
    );
  }, [classEntries, draftSettings.dedupPeriod, draftSettings.customDedupDays]);

  // Month view: days in viewYear & viewMonth
  const monthDays = useMemo(() => {
    const totalDays = new Date(viewYear, viewMonth, 0).getDate();
    const days: string[] = [];
    for (let i = 1; i <= totalDays; i++) {
      days.push(
        `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      );
    }
    return days;
  }, [viewYear, viewMonth]);

  // Style label helper (Gi, No-Gi, Wrestling, Judo, All, Off)
  const getStyleBadgeInfo = (style: AiRecommendDayStyle) => {
    switch (style) {
      case 'gi':
        return { label: '도복(Gi)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'nogi':
        return { label: '노기(No-Gi)', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'wrestling':
        return { label: '레슬링/스탠딩', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'judo':
        return { label: '유도(Judo)', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'off':
        return { label: '🚫 수업 없음(휴관)', bg: 'bg-slate-100 text-slate-500 border-slate-300' };
      case 'all':
      default:
        return { label: '구분 없음(All)', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/60 pb-20 text-slate-900">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="px-2 py-0.5 text-[10px] font-black rounded tracking-wider uppercase text-white shadow-xs"
                style={{ backgroundColor: themeColor }}
              >
                ADMIN ONLY
              </span>
              <span className="text-xs font-bold text-amber-700 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                관장님 맞춤 커리큘럼 추천
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              ✨ AI 수업 추천
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              동일 시작 포지션 기반 하루 3개 엄선 영상 추천 · 타임코드 지정 및 [수업일지] 원클릭 배정
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={onNavigateToClassJournal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>수업일지 바로가기</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftSettings(recommendSettings);
                setIsSettingsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-xs hover:opacity-95"
              style={{ backgroundColor: themeColor }}
            >
              <Settings className="w-4 h-4" />
              <span>⚙️ 추천 설정</span>
            </button>
          </div>
        </div>

        {/* Navigation & Controls Bar */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          {/* Period Tabs: 오늘 / 이번 주 / 이번 달 */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActivePeriodTab('day')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activePeriodTab === 'day'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              오늘 (일간)
            </button>
            <button
              type="button"
              onClick={() => setActivePeriodTab('week')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activePeriodTab === 'week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              이번 주 (주간: 월~일)
            </button>
            <button
              type="button"
              onClick={() => setActivePeriodTab('month')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activePeriodTab === 'month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              이번 달 (월간)
            </button>
          </div>

          {/* Quick Date Stepper */}
          {activePeriodTab === 'day' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(selectedDateStr);
                  d.setDate(d.getDate() - 1);
                  setSelectedDateStr(
                    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                  );
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                title="이전 날짜"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDateStr}
                onChange={(e) => e.target.value && setSelectedDateStr(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => {
                  const d = new Date(selectedDateStr);
                  d.setDate(d.getDate() + 1);
                  setSelectedDateStr(
                    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                  );
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                title="다음 날짜"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {selectedDateStr !== todayDateStr && (
                <button
                  type="button"
                  onClick={() => setSelectedDateStr(todayDateStr)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 hover:bg-sky-100 cursor-pointer"
                >
                  오늘로 이동
                </button>
              )}
            </div>
          )}

          {/* Week Stepper */}
          {activePeriodTab === 'week' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(selectedDateStr);
                  d.setDate(d.getDate() - 7);
                  setSelectedDateStr(
                    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                  );
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                title="이전 주"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 px-2">
                {weekDays[0]} ~ {weekDays[weekDays.length - 1]}
              </span>
              <button
                type="button"
                onClick={() => {
                  const d = new Date(selectedDateStr);
                  d.setDate(d.getDate() + 7);
                  setSelectedDateStr(
                    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                  );
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                title="다음 주"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDateStr(todayDateStr)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 hover:bg-sky-100 cursor-pointer"
              >
                이번 주
              </button>
            </div>
          )}

          {/* Month Stepper */}
          {activePeriodTab === 'month' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (viewMonth === 1) {
                    setViewMonth(12);
                    setViewYear((y) => y - 1);
                  } else {
                    setViewMonth((m) => m - 1);
                  }
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                title="이전 달"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-extrabold text-slate-800 px-3">
                {viewYear}년 {viewMonth}월
              </span>
              <button
                type="button"
                onClick={() => {
                  if (viewMonth === 12) {
                    setViewMonth(1);
                    setViewYear((y) => y + 1);
                  } else {
                    setViewMonth((m) => m + 1);
                  }
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                title="다음 달"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* VIEW 1: 오늘 (일간) 탭                                          */}
        {/* ============================================================ */}
        {activePeriodTab === 'day' && (
          <div className="mt-6">
            <DayRecommendationSection
              dateStr={selectedDateStr}
              data={currentDayData}
              recommendSettings={recommendSettings}
              availablePositions={availablePositions}
              techniqueCategories={techniqueCategories}
              selectedCategory={categoryOverrides[selectedDateStr] || '전체'}
              onSelectCategory={(cat) => {
                setCategoryOverrides((prev) => ({ ...prev, [selectedDateStr]: cat }));
                setCustomDayCards((prev) => {
                  const next = { ...prev };
                  delete next[selectedDateStr];
                  return next;
                });
              }}
              onSelectPosition={(pos) => handleSelectPositionOverride(selectedDateStr, pos)}
              onRefreshAll={() => handleRefreshDayCandidates(selectedDateStr)}
              onSwapSingleCard={(idx, candidate) =>
                handleSwapSingleCard(selectedDateStr, idx, candidate, currentDayData.startPosition)
              }
              onRegisterCard={(idx, candidate) =>
                handleRegisterToClassJournal(selectedDateStr, candidate, idx)
              }
              startTimeEdits={startTimeEdits}
              onStartTimeChange={(idx, timeVal) =>
                setStartTimeEdits((prev) => ({ ...prev, [`${selectedDateStr}-${idx}`]: timeVal }))
              }
              onPreviewVideo={(candidate, sec, label) =>
                setPreviewingVideo({ candidate, startSec: sec, timeLabel: label })
              }
              isRegistered={(candidate) =>
                isCandidateRegisteredOnDate(selectedDateStr, candidate)
              }
              registeredCount={getRegisteredCountForDate(selectedDateStr)}
              themeColor={themeColor}
              parseMMSS={parseMMSS}
              formatSecToMMSS={formatSecToMMSS}
              getStyleBadgeInfo={getStyleBadgeInfo}
              onNavigateToClassJournal={onNavigateToClassJournal}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: 이번 주 (주간: 월~일) 탭                                 */}
        {/* ============================================================ */}
        {activePeriodTab === 'week' && (
          <div className="mt-6 space-y-8">
            <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-4 text-xs text-sky-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  <strong>주간 맞춤 추천:</strong> 월요일부터 일요일까지 매일 동일 시작 포지션에서 출발하는 후보 기술을 추천합니다. 원하는 기술을 선택해 수업일지에 바로 배정할 수 있습니다.
                </span>
              </div>
              <span className="text-[11px] font-bold text-sky-700 bg-white px-2.5 py-1 rounded-lg border border-sky-200 shrink-0">
                목표: 하루 {recommendSettings.dailyGoalCount}개
              </span>
            </div>

            {weekDays.map((dateStr) => {
              const dayData = getCandidatesForDate(dateStr);
              return (
                <div
                  key={dateStr}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden"
                >
                  <DayRecommendationSection
                    dateStr={dateStr}
                    data={dayData}
                    recommendSettings={recommendSettings}
                    availablePositions={availablePositions}
                    techniqueCategories={techniqueCategories}
                    selectedCategory={categoryOverrides[dateStr] || '전체'}
                    onSelectCategory={(cat) => {
                      setCategoryOverrides((prev) => ({ ...prev, [dateStr]: cat }));
                      setCustomDayCards((prev) => {
                        const next = { ...prev };
                        delete next[dateStr];
                        return next;
                      });
                    }}
                    onSelectPosition={(pos) => handleSelectPositionOverride(dateStr, pos)}
                    onRefreshAll={() => handleRefreshDayCandidates(dateStr)}
                    onSwapSingleCard={(idx, candidate) =>
                      handleSwapSingleCard(dateStr, idx, candidate, dayData.startPosition)
                    }
                    onRegisterCard={(idx, candidate) =>
                      handleRegisterToClassJournal(dateStr, candidate, idx)
                    }
                    startTimeEdits={startTimeEdits}
                    onStartTimeChange={(idx, timeVal) =>
                      setStartTimeEdits((prev) => ({ ...prev, [`${dateStr}-${idx}`]: timeVal }))
                    }
                    onPreviewVideo={(candidate, sec, label) =>
                      setPreviewingVideo({ candidate, startSec: sec, timeLabel: label })
                    }
                    isRegistered={(candidate) => isCandidateRegisteredOnDate(dateStr, candidate)}
                    registeredCount={getRegisteredCountForDate(dateStr)}
                    themeColor={themeColor}
                    parseMMSS={parseMMSS}
                    formatSecToMMSS={formatSecToMMSS}
                    getStyleBadgeInfo={getStyleBadgeInfo}
                    onNavigateToClassJournal={onNavigateToClassJournal}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 3: 이번 달 (월간) 탭                                      */}
        {/* ============================================================ */}
        {activePeriodTab === 'month' && (
          <div className="mt-6 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-700" />
                  <h2 className="text-sm font-extrabold text-slate-900">
                    {viewYear}년 {viewMonth}월 전체 커리큘럼 달력
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  날짜를 클릭하면 해당 날짜의 3개 후보 기술을 바로 확인 및 수정할 수 있습니다.
                </span>
              </div>

              {/* Day header row */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 pb-2">
                <span className="text-red-500">일</span>
                <span>월</span>
                <span>화</span>
                <span>수</span>
                <span>목</span>
                <span>금</span>
                <span className="text-blue-500">토</span>
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Blank days before day 1 */}
                {Array.from({
                  length: new Date(viewYear, viewMonth - 1, 1).getDay(),
                }).map((_, i) => (
                  <div key={`blank-${i}`} className="min-h-[90px] bg-slate-50/50 rounded-xl" />
                ))}

                {monthDays.map((dStr) => {
                  const dayNum = parseInt(dStr.split('-')[2], 10);
                  const dObj = new Date(dStr);
                  const dayOfWeek = dObj.getDay();
                  const isSelected = dStr === selectedDateStr;
                  const isToday = dStr === todayDateStr;
                  const registeredCnt = getRegisteredCountForDate(dStr);
                  const dayStyle =
                    recommendSettings.dayStyles[dayOfWeek as keyof typeof recommendSettings.dayStyles] ||
                    'all';
                  const isOff = dayStyle === 'off';
                  const dayPos = isOff
                    ? '휴관 (수업 없음)'
                    : calculateStartPositionForDate(
                        dStr,
                        recommendSettings.positionCycle,
                        positionOverrides[dStr],
                        recommendSettings.searchScope || 'all_expanded',
                        dayStyle
                      );
                  const styleInfo = getStyleBadgeInfo(dayStyle);

                  return (
                    <button
                      key={dStr}
                      type="button"
                      onClick={() => {
                        setSelectedDateStr(dStr);
                        setActivePeriodTab('day');
                      }}
                      className={`min-h-[95px] p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-sky-500 ring-2 ring-sky-200 bg-sky-50/40'
                          : isOff
                          ? 'border-slate-200/60 bg-slate-50/50 hover:bg-slate-100/50 opacity-75'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs font-black ${
                            isToday
                              ? 'bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center'
                              : dayOfWeek === 0
                              ? 'text-red-500'
                              : dayOfWeek === 6
                              ? 'text-blue-500'
                              : 'text-slate-700'
                          }`}
                        >
                          {dayNum}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${styleInfo.bg}`}
                        >
                          {isOff ? '휴관' : styleInfo.label.split('(')[0]}
                        </span>
                      </div>

                      <div className="my-1">
                        <p className={`text-[10px] font-bold line-clamp-1 ${isOff ? 'text-slate-400 italic' : 'text-slate-800'}`}>
                          {dayPos}
                        </p>
                      </div>

                      <div className="flex items-center justify-between w-full text-[9px]">
                        {isOff ? (
                          <span className="text-slate-400 font-bold">🚫 수업 없음</span>
                        ) : registeredCnt > 0 ? (
                          <span className="font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            {registeredCnt}개 배정
                          </span>
                        ) : (
                          <span className="text-slate-400">후보 {recommendSettings.dailyGoalCount || 3}개</span>
                        )}
                        <span className="text-slate-400 hover:text-sky-600 font-bold">선택 &rarr;</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: [⚙️ 관장 맞춤 설정창]                                */}
      {/* ============================================================ */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: themeColor }}
                >
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    ⚙️ 관장 맞춤 AI 추천 설정
                  </h3>
                  <p className="text-xs text-slate-500">
                    체육관 수련 철학에 맞춘 언어, 요일별 도복/노기 스타일, 중복 방지 규칙 설정
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
              {/* 1) 영상 검색 언어 설정 */}
              <div className="space-y-2">
                <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <span>1. 영상 검색 언어 설정</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'all', label: '한국어 + 영어 모두 (기본)' },
                    { val: 'ko', label: '한국어 영상만' },
                    { val: 'en', label: '영어(해외) 영상만' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() =>
                        setDraftSettings((s) => ({
                          ...s,
                          language: item.val as AiRecommendLanguage,
                        }))
                      }
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        draftSettings.language === item.val
                          ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-200 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2) 요일별 수업 스타일(Gi / No-Gi / 레슬링 / 유도 / 휴관) 지정 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-900 text-xs">
                    2. 요일별 수업 스타일 지정 (월~일 7일 전체)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    지정된 요일에는 해당 스타일 기술만 엄선 추천 (휴관 요일은 수업 추천 제외)
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
                  {[
                    { day: 1, name: '월요일' },
                    { day: 2, name: '화요일' },
                    { day: 3, name: '수요일' },
                    { day: 4, name: '목요일' },
                    { day: 5, name: '금요일' },
                    { day: 6, name: '토요일' },
                    { day: 0, name: '일요일' },
                  ].map(({ day, name }) => {
                    const currentStyle =
                      draftSettings.dayStyles[day as keyof typeof draftSettings.dayStyles] || (day === 0 ? 'off' : 'all');
                    return (
                      <div
                        key={day}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs"
                      >
                        <span className={`font-bold text-xs w-16 shrink-0 ${day === 0 ? 'text-red-500 font-black' : day === 6 ? 'text-blue-500 font-black' : 'text-slate-800'}`}>
                          {name}
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 flex-1">
                          {[
                            { val: 'gi', label: '도복(Gi)' },
                            { val: 'nogi', label: '노기(No-Gi)' },
                            { val: 'wrestling', label: '레슬링/스탠딩' },
                            { val: 'judo', label: '유도(Judo)' },
                            { val: 'all', label: '구분 없음(All)' },
                            { val: 'off', label: '🚫 수업 없음(휴관)' },
                          ].map((opt) => (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() =>
                                setDraftSettings((s) => ({
                                  ...s,
                                  dayStyles: {
                                    ...s.dayStyles,
                                    [day]: opt.val as AiRecommendDayStyle,
                                  },
                                }))
                              }
                              className={`py-1.5 px-1.5 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer text-center leading-tight truncate ${
                                currentStyle === opt.val
                                  ? opt.val === 'off'
                                    ? 'border-slate-600 bg-slate-800 text-white shadow-xs font-black'
                                    : opt.val === 'judo'
                                    ? 'border-rose-500 bg-rose-500 text-white shadow-xs font-black'
                                    : 'border-sky-500 bg-sky-500 text-white shadow-xs font-black'
                                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                              }`}
                              title={opt.label}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3) 포지션 전환 주기, 탐색 범위 및 중복 방지 기간 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="font-extrabold text-slate-900 text-xs">
                    3-A. 포지션 / 테마 전환 주기
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'daily', label: '매일 다른 포지션 (기본)' },
                      { val: 'weekly', label: '매주 포지션 변경 (월~일 정렬)' },
                      { val: 'chain', label: '직전 수업 포지션 연계' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() =>
                          setDraftSettings((s) => ({
                            ...s,
                            positionCycle: item.val as AiRecommendPositionCycle,
                          }))
                        }
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                          draftSettings.positionCycle === item.val
                            ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-200 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* 3-A-2. 탐색 범위 설정 (Requirement 3) */}
                  <div className="pt-2 mt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>기술 탐색 범위 설정</span>
                      </span>
                      <span className="text-[11px] text-slate-500">
                        69개 포지션 외 신기술/유도/레슬링/변칙 포함
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDraftSettings((s) => ({
                            ...s,
                            searchScope: 'all_expanded',
                          }))
                        }
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          (draftSettings.searchScope || 'all_expanded') === 'all_expanded'
                            ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-200 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-sky-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                            마스터 트리 전체 + 분류 외 확장 기술 (권장)
                          </span>
                          {(draftSettings.searchScope || 'all_expanded') === 'all_expanded' && (
                            <span className="text-[10px] font-black bg-sky-500 text-white px-1.5 py-0.2 rounded-md">
                              선택됨
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                          69개 기본 포지션뿐만 아니라 서브미션 특강, 유도 메치기, 레슬링 태클, 가드 리텐션, 최신 모던 변칙 시퀀스 기술까지 폭넓게 탐색 추천합니다.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDraftSettings((s) => ({
                            ...s,
                            searchScope: 'master_tree_only',
                          }))
                        }
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          draftSettings.searchScope === 'master_tree_only'
                            ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-200 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-600" />
                            내 포지션 분류(69개) 기준 순환
                          </span>
                          {draftSettings.searchScope === 'master_tree_only' && (
                            <span className="text-[10px] font-black bg-sky-500 text-white px-1.5 py-0.2 rounded-md">
                              선택됨
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                          앱에 정립된 69개 마스터 트리 포지션 분류 목록 위주로 정석 순환하며 수업을 편성합니다.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3-B. 동일 기술 중복 방지 기간 + 실시간 제외 카운트 (Requirement 6) */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="font-extrabold text-slate-900 text-xs">
                      3-B. 동일 기술 중복 방지 기간
                    </label>
                    <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>현재 중복 제외된 수업일지 기술:</span>
                      <span className="underline font-black">{dedupExcludedCount}개</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { val: '30', label: '1개월' },
                      { val: '90', label: '3개월 (기본)' },
                      { val: '180', label: '6개월' },
                      { val: '365', label: '1년 (365일)' },
                      { val: 'custom', label: '직접 입력' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() =>
                          setDraftSettings((s) => ({
                            ...s,
                            dedupPeriod: item.val as any,
                          }))
                        }
                        className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                          draftSettings.dedupPeriod === item.val
                            ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-200 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {draftSettings.dedupPeriod === 'custom' && (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={draftSettings.customDedupDays || 90}
                        onChange={(e) =>
                          setDraftSettings((s) => ({
                            ...s,
                            customDedupDays: parseInt(e.target.value, 10) || 90,
                          }))
                        }
                        className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                      />
                      <span className="text-xs font-bold text-slate-600">
                        일 동안 동일 기술 재추천 제외
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4) 하루 수업 목표 기술 수 설정 (Requirement 6) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-900 text-xs">
                    4. 하루 수업 목표 기술 수 설정
                  </label>
                  <span className="text-[11px] text-slate-500">
                    설정한 개수만큼 카드와 달력 후보가 정확히 노출됩니다
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 1, label: '1개 (원포인트 집중 - 후보 1개)' },
                    { val: 2, label: '2개 (연계 기술 - 후보 2개)' },
                    { val: 3, label: '3개 (입체 드릴 - 후보 3개 / 기본)' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() =>
                        setDraftSettings((s) => ({
                          ...s,
                          dailyGoalCount: item.val as 1 | 2 | 3,
                        }))
                      }
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        draftSettings.dailyGoalCount === item.val
                          ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-200 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer"
                style={{ backgroundColor: themeColor }}
              >
                설정 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: [▶️ 영상 미리보기 모달]                                 */}
      {/* ============================================================ */}
      {previewingVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <h4 className="text-sm font-bold truncate max-w-lg">
                  {previewingVideo.candidate.techniqueName}
                </h4>
                <span className="text-xs text-amber-400 font-extrabold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                  ⏱️ 시작 구간: {previewingVideo.timeLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingVideo(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-black">
              <div className="w-full aspect-video rounded-2xl overflow-hidden">
                <VideoPlayer16x9
                  youtubeId={previewingVideo.candidate.youtubeId}
                  videoUrl={previewingVideo.candidate.youtubeUrl}
                  initialSeekTime={previewingVideo.startSec}
                  autoPlay={true}
                  showPrecisionControls={true}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>채널: {previewingVideo.candidate.channelName}</span>
                <span>·</span>
                <span>시작 포지션: {previewingVideo.candidate.startPosition}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.youtube.com/watch?v=${previewingVideo.candidate.youtubeId}${previewingVideo.startSec > 0 ? `&t=${previewingVideo.startSec}s` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>YouTube에서 보기</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewingVideo(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// SUB-COMPONENT: DayRecommendationSection
// ============================================================
interface DayRecommendationSectionProps {
  dateStr: string;
  data: {
    startPosition: string;
    dayStyle: AiRecommendDayStyle;
    candidates: AiRecommendedVideoCandidate[];
  };
  recommendSettings: AiRecommendSettings;
  availablePositions: string[];
  techniqueCategories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onSelectPosition: (pos: string) => void;
  onRefreshAll: () => void;
  onSwapSingleCard: (idx: number, candidate: AiRecommendedVideoCandidate) => void;
  onRegisterCard: (idx: number, candidate: AiRecommendedVideoCandidate) => void;
  startTimeEdits: Record<string, string>;
  onStartTimeChange: (idx: number, timeVal: string) => void;
  onPreviewVideo: (candidate: AiRecommendedVideoCandidate, sec: number, label: string) => void;
  isRegistered: (candidate: AiRecommendedVideoCandidate) => boolean;
  registeredCount: number;
  themeColor: string;
  parseMMSS: (val: string) => number;
  formatSecToMMSS: (sec: number) => string;
  getStyleBadgeInfo: (style: AiRecommendDayStyle) => { label: string; bg: string };
  onNavigateToClassJournal: () => void;
}

const DayRecommendationSection: React.FC<DayRecommendationSectionProps> = ({
  dateStr,
  data,
  recommendSettings,
  availablePositions,
  techniqueCategories,
  selectedCategory,
  onSelectCategory,
  onSelectPosition,
  onRefreshAll,
  onSwapSingleCard,
  onRegisterCard,
  startTimeEdits,
  onStartTimeChange,
  onPreviewVideo,
  isRegistered,
  registeredCount,
  themeColor,
  parseMMSS,
  formatSecToMMSS,
  getStyleBadgeInfo,
  onNavigateToClassJournal,
}) => {
  const dayOfWeek = getDayOfWeekFromDateStr(dateStr);
  const dayNameKorean = DAY_NAMES_KOREAN[dayOfWeek];
  const styleInfo = getStyleBadgeInfo(data.dayStyle);
  const targetGoalCount = recommendSettings.dailyGoalCount;

  return (
    <div className="p-4 sm:p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
      {/* Date Header & Unified Position Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              📅 {dateStr} ({dayNameKorean}요일)
            </h2>
            <span
              className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${styleInfo.bg}`}
            >
              {styleInfo.label}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>동일 시작 포지션: <strong>{data.startPosition}</strong></span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            오늘 배정 현황:{' '}
            <strong className={registeredCount >= targetGoalCount ? 'text-emerald-600' : 'text-slate-800'}>
              {registeredCount} / {targetGoalCount}개 완료
            </strong>{' '}
            {data.candidates.length === 0
              ? '(오늘은 정기 휴관일로 수업이 없습니다)'
              : `(${data.candidates.length}개 후보 중 원하는 기술을 선택해 수업일지에 배정하세요)`}
          </p>
        </div>

        {/* Dropdowns & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1) 요일별 카테고리(포지션/테마) 강제 지정 드롭다운 (Requirement 3) */}
          <div className="relative">
            <select
              value={data.startPosition}
              onChange={(e) => onSelectPosition(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs"
            >
              <optgroup label="🌟 추천 특집 및 자유 테마 (분류 외 신기술·연계)">
                <option value="자유 테마 (분류 외 신기술 & 시퀀스)">✨ 자유 테마 (분류 외 신기술 & 시퀀스)</option>
                <option value="유도 메치기 & 깃싸움">🥋 유도 메치기 연계 (업어치기/허벅다리/발기술)</option>
                <option value="레슬링 & 스탠딩 테이크다운">🤼 레슬링 & 스탠딩 테이크다운 (더블렉/싱글렉)</option>
                <option value="서브미션 스페셜 (초크 & 관절기)">💥 서브미션 스페셜 (초크/암바/기무라)</option>
                <option value="이스케이프 / 생존 특집">🛡️ 이스케이프 / 생존 특집 (탈출&방어)</option>
                <option value="가드 리텐션 & 리커버리">🔄 가드 리텐션 (가드 유지 & 리커버리)</option>
                <option value="압박 패스 & 스매시">⚡ 압박 패스 & 스매시</option>
                <option value="모던 가드 & 베림보로">🌪️ 모던 가드 & 베림보로</option>
              </optgroup>
              <optgroup label="📂 앱 포지션 분류 직접 선택 (69개 마스터 트리)">
                {availablePositions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* 2) 기술 성격 필터 드롭다운 (스윕, 패스, 서브미션, 이스케이프) */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs"
            >
              <optgroup label="🎯 기술 성격 필터">
                {techniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === '전체' ? '성격: 전체' : cat}
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* 3) 전체 새로고침 버튼 */}
          <button
            type="button"
            onClick={onRefreshAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-all cursor-pointer shadow-2xs shrink-0"
            title="이 포지션의 다른 영상 다시 찾기"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>🔄 다른 영상 {data.candidates.length > 0 ? `${data.candidates.length}개` : '찾기'}</span>
          </button>
        </div>
      </div>

      {/* Candidate Cards Grid or Off Day Empty State */}
      {data.candidates.length === 0 ? (
        <div className="py-12 px-6 bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center text-2xl font-black">
            🚫
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-800">
              해당 요일은 도장 휴관일 (수업 없음)로 설정되어 있습니다
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              체육관 운영 일정에 따라 휴관일에는 추천 기술을 생성하지 않습니다. 상단 [⚙️ 추천 설정]에서 요일별 수업 스타일을 변경하시면 AI 추천을 활성화할 수 있습니다.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 ${
            data.candidates.length === 1
              ? 'max-w-md mx-auto'
              : data.candidates.length === 2
              ? 'md:grid-cols-2 max-w-3xl mx-auto'
              : 'md:grid-cols-3'
          } gap-5`}
        >
          {data.candidates.map((candidate, idx) => {
          const registered = isRegistered(candidate);
          const timeKey = `${dateStr}-${idx}`;
          const currentStartTime =
            startTimeEdits[timeKey] !== undefined
              ? startTimeEdits[timeKey]
              : candidate.recommendedStartTime || '00:00';
          const currentStartSec = parseMMSS(currentStartTime);

          return (
            <div
              key={`${candidate.id}-${idx}`}
              className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                registered
                  ? 'border-emerald-300 ring-2 ring-emerald-100 bg-emerald-50/20'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs hover:shadow-xs'
              }`}
            >
              {/* Card Top: 16:9 Thumbnail Preview with Play Overlay */}
              <div>
                <div className="relative w-full aspect-video bg-slate-900 group overflow-hidden">
                  <img
                    src={candidate.thumbnailUrl}
                    alt={candidate.techniqueName}
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.src.includes('mqdefault')) {
                        img.src = `https://i.ytimg.com/vi/${candidate.youtubeId}/mqdefault.jpg`;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-slate-950/25 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => onPreviewVideo(candidate, currentStartSec, currentStartTime)}
                      className="w-12 h-12 rounded-full bg-slate-900/80 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-sky-600 transition-all cursor-pointer"
                      title="시작 구간부터 미리보기"
                    >
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </button>
                  </div>

                  {/* Channel tag */}
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-slate-950/80 px-2 py-0.5 rounded-md backdrop-blur-xs">
                    {candidate.channelName}
                  </span>

                  {/* Duration tag */}
                  {candidate.duration && (
                    <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-slate-950/80 px-1.5 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-0.5">
                      <Clock className="w-3 h-3 text-slate-300" />
                      {candidate.duration}
                    </span>
                  )}
                </div>

                {/* Card Content & Metadata */}
                <div className="p-4 space-y-3">
                  {/* Category & Difficulty quiet metadata */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
                    <span className="font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[11px] border border-sky-200">
                      후보 #{idx + 1}
                    </span>
                    <span>{candidate.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{candidate.giType}</span>
                    {candidate.difficulty && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold ${
                            candidate.difficulty === '초급'
                              ? 'text-emerald-600'
                              : candidate.difficulty === '고급'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {candidate.difficulty}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Technique Title */}
                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-2">
                    {candidate.techniqueName}
                  </h3>

                  {/* Start Position & Key detail */}
                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">시작 포지션</span>
                      <strong className="text-slate-800">{candidate.startPosition}</strong>
                    </div>
                    {candidate.keyDetailTag && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">핵심 포인트</span>
                        <span className="font-semibold text-sky-700 truncate max-w-[170px]">
                          {candidate.keyDetailTag}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Timecode specification UI: [⏱️ 시작 구간(분:초) 지정] */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>⏱️ 시작 구간 지정</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          onPreviewVideo(candidate, currentStartSec, currentStartTime)
                        }
                        className="text-[10px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        미리보기
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={currentStartTime}
                        onChange={(e) => onStartTimeChange(idx, e.target.value)}
                        placeholder="00:00"
                        className="w-20 px-2.5 py-1 text-xs font-mono font-bold text-center rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                      />
                      {/* Quick preset chips */}
                      <div className="flex items-center gap-1 flex-1 overflow-x-auto py-0.5">
                        {['00:00', '00:45', '01:30', '02:15'].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => onStartTimeChange(idx, chip)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border transition-colors cursor-pointer shrink-0 ${
                              currentStartTime === chip
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Buttons: [🔍 이 카드만 다른 영상으로 교체] & [📅 수업일지에 등록] */}
              <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSwapSingleCard(idx, candidate)}
                  className="flex-1 py-2 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer text-center truncate shadow-2xs"
                  title="이 카드만 다른 영상으로 교체"
                >
                  🔍 영상 교체
                </button>

                {registered ? (
                  <button
                    type="button"
                    onClick={onNavigateToClassJournal}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 shadow-xs truncate"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>등록됨 (확인)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRegisterCard(idx, candidate)}
                    className="flex-1 py-2 px-2.5 rounded-xl text-white text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 shadow-xs hover:opacity-95 truncate"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>📅 수업일지 등록</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
