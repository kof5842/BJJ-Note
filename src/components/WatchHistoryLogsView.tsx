import React, { useState, useMemo } from 'react';
import {
  History,
  Play,
  Search,
  Trash2,
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  FolderOpen,
  ArrowRight,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Video,
  Eye,
  AlertCircle,
  Sliders,
  X,
} from 'lucide-react';
import { TechniqueVideo, WatchHistoryLog } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface WatchHistoryLogsViewProps {
  logs: WatchHistoryLog[];
  videos: TechniqueVideo[];
  userEmail?: string;
  primaryColor?: string;
  onOpenVideo: (video: TechniqueVideo) => void;
  onDeleteLog: (logId: string) => void;
  onClearAllLogs: () => void;
  onRefreshLogs?: () => void;
  onNavigateToFolder: () => void;
}

type DateFilterRange = 'ALL' | 'TODAY' | '3DAYS' | '7DAYS' | 'MONTH';

export const WatchHistoryLogsView: React.FC<WatchHistoryLogsViewProps> = ({
  logs,
  videos,
  userEmail,
  primaryColor = '#0ea5e9',
  onOpenVideo,
  onDeleteLog,
  onClearAllLogs,
  onRefreshLogs,
  onNavigateToFolder,
}) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterRange>('ALL');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);

  const videoMap = useMemo(() => {
    const map = new Map<string, TechniqueVideo>();
    for (const v of videos) {
      map.set(v.id, v);
    }
    return map;
  }, [videos]);

  const uniquePositions = useMemo(() => {
    const set = new Set<string>();
    for (const log of logs) {
      if (log.position) set.add(log.position);
    }
    return Array.from(set).sort();
  }, [logs]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCount = logs.length;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const todayCount = logs.filter((l) => l.watchedAt.slice(0, 10) === todayStr).length;

    // Most viewed position
    const posCounts: Record<string, number> = {};
    const videoCounts: Record<string, number> = {};

    for (const l of logs) {
      posCounts[l.position] = (posCounts[l.position] || 0) + 1;
      const title = language === 'en' ? (l.videoTitleEn || l.videoTitleKo) : l.videoTitleKo;
      videoCounts[title] = (videoCounts[title] || 0) + 1;
    }

    let topPosition = language === 'ko' ? '없음' : 'None';
    let maxPosCount = 0;
    for (const [pos, cnt] of Object.entries(posCounts)) {
      if (cnt > maxPosCount) {
        maxPosCount = cnt;
        topPosition = pos;
      }
    }

    let topVideo = language === 'ko' ? '없음' : 'None';
    let maxVidCount = 0;
    for (const [vid, cnt] of Object.entries(videoCounts)) {
      if (cnt > maxVidCount) {
        maxVidCount = cnt;
        topVideo = vid;
      }
    }

    return {
      totalCount,
      todayCount,
      topPosition: maxPosCount > 0 ? `${topPosition} (${maxPosCount}${language === 'ko' ? '회' : 'x'})` : (language === 'ko' ? '기록 없음' : 'No history'),
      topVideo: maxVidCount > 0 ? `${topVideo} (${maxVidCount}${language === 'ko' ? '회' : 'x'})` : (language === 'ko' ? '기록 없음' : 'No history'),
    };
  }, [logs, language]);

  // Format date helper: YYYY년 MM월 DD일 오전/오후 HH시 mm분
  const formatDetailedDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampmKo = hours >= 12 ? '오후' : '오전';
      const ampmEn = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;

      if (language === 'en') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[month - 1]} ${day}, ${year} ${displayHours}:${displayMinutes} ${ampmEn}`;
      }

      return `${year}년 ${month}월 ${day}일 ${ampmKo} ${displayHours}시 ${displayMinutes}분`;
    } catch {
      return isoString;
    }
  };

  // Compact Mobile Date helper: MM.DD HH:mm
  const formatMobileDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const padM = minutes < 10 ? `0${minutes}` : minutes;
      const padH = hours < 10 ? `0${hours}` : hours;
      return `${month}.${day} ${padH}:${padM}`;
    } catch {
      return isoString;
    }
  };

  const getTimeAgo = (isoString: string) => {
    try {
      const now = Date.now();
      const past = new Date(isoString).getTime();
      const diffMs = now - past;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return language === 'ko' ? '방금 전' : 'Just now';
      if (diffMins < 60) return language === 'ko' ? `${diffMins}분 전` : `${diffMins}m ago`;
      if (diffHours < 24) return language === 'ko' ? `${diffHours}시간 전` : `${diffHours}h ago`;
      if (diffDays === 1) return language === 'ko' ? '어제' : 'Yesterday';
      if (diffDays < 7) return language === 'ko' ? `${diffDays}일 전` : `${diffDays}d ago`;
      return language === 'ko' ? `${Math.floor(diffDays / 7)}주 전` : `${Math.floor(diffDays / 7)}w ago`;
    } catch {
      return '';
    }
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = Date.now();

    return logs.filter((log) => {
      // 1. Search Query filter
      if (q) {
        const matchKo = log.videoTitleKo.toLowerCase().includes(q);
        const matchEn = (log.videoTitleEn || '').toLowerCase().includes(q);
        const matchPos = log.position.toLowerCase().includes(q);
        const matchCat = log.category.toLowerCase().includes(q);
        const matchSub = (log.submissionDetail || '').toLowerCase().includes(q);
        if (!matchKo && !matchEn && !matchPos && !matchCat && !matchSub) {
          return false;
        }
      }

      // 2. Position Filter
      if (selectedPosition !== 'ALL' && log.position !== selectedPosition) {
        return false;
      }

      // 3. Date range filter
      if (dateFilter !== 'ALL') {
        const logTime = new Date(log.watchedAt).getTime();
        const diffMs = now - logTime;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (dateFilter === 'TODAY') {
          const todayStr = new Date().toISOString().slice(0, 10);
          if (log.watchedAt.slice(0, 10) !== todayStr) return false;
        } else if (dateFilter === '3DAYS') {
          if (diffDays > 3) return false;
        } else if (dateFilter === '7DAYS') {
          if (diffDays > 7) return false;
        } else if (dateFilter === 'MONTH') {
          if (diffDays > 30) return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery, selectedPosition, dateFilter]);

  const handleVideoClick = (log: WatchHistoryLog) => {
    // Look up real TechniqueVideo if available
    const existingVideo = videoMap.get(log.videoId);
    if (existingVideo) {
      onOpenVideo(existingVideo);
    } else {
      // Create lightweight playable fallback
      const fallbackVideo: TechniqueVideo = {
        id: log.videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${log.videoId}`,
        youtubeId: log.videoId.length === 11 ? log.videoId : 'xK2y2p3G5wM',
        titleKo: log.videoTitleKo,
        titleEn: log.videoTitleEn || '',
        thumbnailUrl: log.thumbnailUrl || '',
        position: log.position,
        category: log.category,
        giType: (log.giType as any) || 'Gi',
        difficulty: (log.difficulty as any) || '미분류',
        submissionGroup: (log.submissionGroup as any) || 'none',
        submissionDetail: log.submissionDetail || '',
        proficiencyScore: log.proficiencyScore || 0,
        timelineFrames: [],
        journalMemos: [],
        generalNotes: '',
        practiceDates: [log.watchedAt.slice(0, 10)],
        nextTechniqueIds: [],
        isFavorite: false,
        createdAt: log.watchedAt,
        updatedAt: log.watchedAt,
      };
      onOpenVideo(fallbackVideo);
    }
  };

  const handleDeleteSingle = (e: React.MouseEvent, logId: string, title: string) => {
    e.stopPropagation();
    onDeleteLog(logId);
    setActionFeedback(
      language === 'ko'
        ? `"${title}" 시청 기록을 삭제했습니다.`
        : `Removed "${title}" from watch history.`
    );
    setTimeout(() => setActionFeedback(null), 2500);
  };

  const handleConfirmClearAll = () => {
    onClearAllLogs();
    setShowClearConfirm(false);
    setActionFeedback(
      language === 'ko'
        ? '모든 시청 로그 기록이 초기화되었습니다.'
        : 'All watch history logs have been cleared.'
    );
    setTimeout(() => setActionFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 2. Top Summary KPI Cards (2x2 Grid on Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: 총 누적 시청 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 flex flex-col justify-between shadow-2xs min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-500">
            <span className="text-[11px] sm:text-xs font-bold truncate whitespace-nowrap">
              {language === 'ko' ? '총 누적 시청' : 'Total Plays'}
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-base sm:text-2xl font-black text-slate-900 font-mono tabular-nums truncate whitespace-nowrap">
            {stats.totalCount}
            <span className="text-xs font-semibold text-slate-500 ml-0.5">{language === 'ko' ? '회' : ''}</span>
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400 truncate">
            {language === 'ko' ? '앱에서 틀었던 모든 영상 기록' : 'All watched videos recorded in the app'}
          </p>
        </div>

        {/* Card 2: 오늘 시청한 영상 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 flex flex-col justify-between shadow-2xs min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-500">
            <span className="text-[11px] sm:text-xs font-bold truncate whitespace-nowrap">
              {language === 'ko' ? '오늘 시청한 영상' : 'Watched Today'}
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-base sm:text-2xl font-black text-emerald-600 font-mono tabular-nums truncate whitespace-nowrap">
            {stats.todayCount}
            <span className="text-xs font-semibold text-slate-500 ml-0.5">{language === 'ko' ? '회' : ''}</span>
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400 truncate">
            {language === 'ko' ? '오늘 날짜 수련 및 학습 기록' : "Today's training & study history"}
          </p>
        </div>

        {/* Card 3: 최다 시청 포지션 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 flex flex-col justify-between shadow-2xs min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-500">
            <span className="text-[11px] sm:text-xs font-bold truncate whitespace-nowrap">
              {language === 'ko' ? '최다 시청 포지션' : 'Most Watched Position'}
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-bold text-slate-900 truncate whitespace-nowrap" title={stats.topPosition}>
            {stats.topPosition}
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400 truncate">
            {language === 'ko' ? '가장 많이 학습한 포지션 구역' : 'Most reviewed position area'}
          </p>
        </div>

        {/* Card 4: 가장 많이 본 기술 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 flex flex-col justify-between shadow-2xs min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-500">
            <span className="text-[11px] sm:text-xs font-bold truncate whitespace-nowrap">
              {language === 'ko' ? '가장 많이 본 기술' : 'Most Watched Technique'}
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-bold text-slate-900 truncate whitespace-nowrap" title={stats.topVideo}>
            {stats.topVideo}
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400 truncate">
            {language === 'ko' ? '반복 복습 우선순위 기술' : 'Top reviewed priority move'}
          </p>
        </div>
      </div>

      {/* Action Toast Feedback */}
      {actionFeedback && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-semibold shadow-xs"
          style={{ backgroundColor: primaryColor }}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 3. Search & Filter Bar (Mobile Toolbox Drawer vs Desktop Inline Bar) */}
      {/* Mobile Version: Search bar + Sliders Toolbox Toggle Icon Button */}
      <div className="lg:hidden relative">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-600 px-0.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ko' ? '기술명, 포지션, 피니시 검색...' : 'Search technique, position, finish...'}
              className="w-full pl-8 pr-3 py-2 bg-slate-100/90 hover:bg-slate-200/60 focus:bg-white border border-transparent focus:border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all shadow-3xs truncate whitespace-nowrap"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toolbox Sliders Toggle Button (Icon Only) */}
          <button
            type="button"
            onClick={() => setIsToolboxOpen(!isToolboxOpen)}
            className={`flex items-center justify-center p-2 rounded-xl border transition-colors cursor-pointer shrink-0 shadow-3xs ${
              isToolboxOpen
                ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
            title={isToolboxOpen ? (language === 'ko' ? '도구함 닫기' : 'Close Toolbox') : (language === 'ko' ? '필터 도구함 열기' : 'Open Filters')}
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Mobile Toolbox Overlay */}
        {isToolboxOpen && (
          <div className="mt-2.5 p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-150 z-20">
            {/* Position Filter */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Filter className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="text-xs font-bold text-slate-600 shrink-0">
                  {language === 'ko' ? '포지션:' : 'Position:'}
                </span>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-none cursor-pointer truncate"
                >
                  <option value="ALL">{language === 'ko' ? '전체 포지션' : 'All Positions'}</option>
                  {uniquePositions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsToolboxOpen(false)}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {language === 'ko' ? '닫기 ✕' : 'Close ✕'}
              </button>
            </div>

            {/* Date Range Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto custom-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 pl-2 pr-1 shrink-0 whitespace-nowrap">
                {language === 'ko' ? '기간:' : 'Period:'}
              </span>
              <button
                type="button"
                onClick={() => setDateFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  dateFilter === 'ALL'
                    ? 'text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={dateFilter === 'ALL' ? { backgroundColor: primaryColor } : undefined}
              >
                {language === 'ko' ? '전체' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('TODAY')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  dateFilter === 'TODAY'
                    ? 'text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={dateFilter === 'TODAY' ? { backgroundColor: primaryColor } : undefined}
              >
                {language === 'ko' ? '오늘' : 'Today'}
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('3DAYS')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  dateFilter === '3DAYS'
                    ? 'text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={dateFilter === '3DAYS' ? { backgroundColor: primaryColor } : undefined}
              >
                {language === 'ko' ? '3일' : '3 Days'}
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('7DAYS')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  dateFilter === '7DAYS'
                    ? 'text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={dateFilter === '7DAYS' ? { backgroundColor: primaryColor } : undefined}
              >
                {language === 'ko' ? '7일' : '7 Days'}
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('MONTH')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  dateFilter === 'MONTH'
                    ? 'text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={dateFilter === 'MONTH' ? { backgroundColor: primaryColor } : undefined}
              >
                {language === 'ko' ? '30일' : '30 Days'}
              </button>
            </div>

            {/* Result Count & Action Buttons */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <div className="text-[11px] font-mono text-slate-500 tabular-nums whitespace-nowrap">
                {language === 'ko' ? '조회: ' : 'Count: '}
                <strong className="text-slate-900 font-bold">{filteredLogs.length}</strong>
                {language === 'ko' ? '건' : ''}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {onRefreshLogs && (
                  <button
                    type="button"
                    onClick={onRefreshLogs}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    title={language === 'ko' ? '새로고침' : 'Refresh'}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}

                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] transition-colors cursor-pointer"
                    title={language === 'ko' ? '전체 시청 기록 삭제' : 'Clear all watch logs'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'ko' ? '비우기' : 'Clear'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Version: Full Inline Search & Filter Bar */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
        {/* Row 1: Search & Position Filter */}
        <div className="flex flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ko' ? '기술명, 포지션, 피니시 검색...' : 'Search technique, position, finish...'}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-sky-500 font-medium truncate"
            />
          </div>

          {/* Position Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer truncate"
            >
              <option value="ALL">{language === 'ko' ? '전체 포지션' : 'All Positions'}</option>
              {uniquePositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Date Range Filter Pills & Results/Actions Bar */}
        <div className="flex flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {/* Date Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto custom-scrollbar min-w-0">
            <span className="text-xs text-slate-400 px-1.5 font-bold shrink-0 whitespace-nowrap">
              {language === 'ko' ? '기간:' : 'Period:'}
            </span>
            <button
              type="button"
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                dateFilter === 'ALL'
                  ? 'text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              style={dateFilter === 'ALL' ? { backgroundColor: primaryColor } : undefined}
            >
              {language === 'ko' ? '전체' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('TODAY')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                dateFilter === 'TODAY'
                  ? 'text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              style={dateFilter === 'TODAY' ? { backgroundColor: primaryColor } : undefined}
            >
              {language === 'ko' ? '오늘' : 'Today'}
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('3DAYS')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                dateFilter === '3DAYS'
                  ? 'text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              style={dateFilter === '3DAYS' ? { backgroundColor: primaryColor } : undefined}
            >
              {language === 'ko' ? '3일' : '3 Days'}
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('7DAYS')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                dateFilter === '7DAYS'
                  ? 'text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              style={dateFilter === '7DAYS' ? { backgroundColor: primaryColor } : undefined}
            >
              {language === 'ko' ? '7일' : '7 Days'}
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('MONTH')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                dateFilter === 'MONTH'
                  ? 'text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              style={dateFilter === 'MONTH' ? { backgroundColor: primaryColor } : undefined}
            >
              {language === 'ko' ? '30일' : '30 Days'}
            </button>
          </div>

          {/* Result Count & Action Buttons */}
          <div className="flex items-center justify-end gap-2 text-xs shrink-0">
            <div className="text-xs font-mono text-slate-500 tabular-nums whitespace-nowrap">
              {language === 'ko' ? '조회: ' : 'Count: '}
              <strong className="text-slate-900 font-bold">{filteredLogs.length}</strong>
              {language === 'ko' ? '건' : ''}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onRefreshLogs && (
                <button
                  type="button"
                  onClick={onRefreshLogs}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                  title={language === 'ko' ? '로그 새로고침' : 'Refresh logs'}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}

              {logs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'ko' ? '전체 로그 비우기' : 'Clear All Logs'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Logs List */}
      {logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mx-auto">
            <Video className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {language === 'ko' ? '아직 시청한 영상 로그 기록이 없습니다' : 'No watched video logs yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {language === 'ko'
                ? '영상 폴더, 다이어그램, 학습일지에서 기술 영상을 클릭하여 시청하면 몇 년 몇 월 몇 일 몇 시 몇 분에 보았는지가 여기에 자동으로 실시간 누적 기록됩니다.'
                : 'Whenever you watch a technique video from Video Folders, Diagram, or Training Journal, the exact timestamp is recorded here in real-time.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToFolder}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <FolderOpen className="w-4 h-4" />
            <span>{language === 'ko' ? '영상 폴더에서 기술 둘러보기' : 'Browse Videos in Folder'}</span>
          </button>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
          <History className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-800">
            {language === 'ko' ? '검색 및 필터 조건에 일치하는 시청 로그가 없습니다' : 'No watch logs match your search and filter criteria'}
          </div>
          <p className="text-xs text-slate-400">
            {language === 'ko' ? "검색어를 지우거나 기간 필터를 '전체 기간'으로 변경해 보세요." : "Try clearing search keywords or switching date filter to 'All'."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const timeAgo = getTimeAgo(log.watchedAt);
            const detailedTime = formatDetailedDateTime(log.watchedAt);
            const mobileTime = formatMobileDateTime(log.watchedAt);
            const displayTitle = language === 'en' ? (log.videoTitleEn || log.videoTitleKo) : log.videoTitleKo;

            return (
              <article
                key={log.id}
                onClick={() => handleVideoClick(log)}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-sky-300 p-2.5 sm:p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs hover:bg-sky-50/20 overflow-hidden"
              >
                {/* Mobile View Layout (sm:hidden) - Ultra Simple 1-Line Row Design */}
                <div className="sm:hidden flex items-center gap-2.5 min-w-0">
                  {/* Left Compact Thumbnail with Play Button */}
                  <div className="relative w-16 h-14 bg-slate-900 rounded-xl overflow-hidden shrink-0 shadow-3xs">
                    {log.thumbnailUrl ? (
                      <img
                        src={log.thumbnailUrl}
                        alt={displayTitle}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/50">
                        <Video className="w-4 h-4" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div
                        className="w-5 h-5 rounded-full text-white flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: 3 Clean Rows (Strictly 1-Line Each) */}
                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Row 1: Compact Date/Time & Relative Time */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 min-w-0">
                      <div className="flex items-center gap-1 text-sky-700 truncate whitespace-nowrap min-w-0">
                        <Clock className="w-3 h-3 text-sky-500 shrink-0" />
                        <span className="truncate whitespace-nowrap font-mono">{mobileTime}</span>
                      </div>
                      {timeAgo && (
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono ml-1 whitespace-nowrap">
                          {timeAgo}
                        </span>
                      )}
                    </div>

                    {/* Row 2: Title (Strict 1-Line) */}
                    <h3 className="text-xs font-black text-slate-900 group-hover:text-sky-600 transition-colors truncate whitespace-nowrap leading-tight">
                      {displayTitle}
                    </h3>

                    {/* Row 3: Tags & Trash Button (Strict 1-Line) */}
                    <div className="flex items-center justify-between gap-1 text-[10px] font-semibold">
                      <div className="flex items-center gap-1 truncate whitespace-nowrap min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 truncate whitespace-nowrap">
                          {log.position}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 truncate whitespace-nowrap">
                          {log.category}
                        </span>
                        {log.submissionDetail && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold truncate whitespace-nowrap">
                            {log.submissionDetail}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSingle(e, log.id, displayTitle)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors shrink-0"
                        title={language === 'ko' ? '시청 기록 삭제' : 'Delete log'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desktop View Layout (hidden sm:flex) */}
                <div className="hidden sm:flex flex-row items-center justify-between gap-4 w-full">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Left Thumbnail with Play Overlay */}
                    <div className="relative w-36 aspect-video bg-slate-900 rounded-xl overflow-hidden shrink-0 shadow-2xs">
                      {log.thumbnailUrl ? (
                        <img
                          src={log.thumbnailUrl}
                          alt={displayTitle}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50">
                          <Video className="w-6 h-6" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div
                          className="w-9 h-9 rounded-full text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Middle Information */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      {/* Timestamp & Time ago */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold font-mono tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-sky-600" />
                          <span>{detailedTime}</span>
                        </div>
                        {timeAgo && (
                          <span className="text-[11px] font-semibold text-slate-400 font-mono">
                            ({timeAgo})
                          </span>
                        )}
                      </div>

                      {/* Video Title */}
                      <div>
                        <h3 className="text-base font-black text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                          {displayTitle}
                        </h3>
                        {log.videoTitleEn && log.videoTitleKo && language === 'ko' && (
                          <p className="text-xs text-slate-400 font-mono line-clamp-1">
                            {log.videoTitleEn}
                          </p>
                        )}
                        {log.videoTitleEn && log.videoTitleKo && language === 'en' && (
                          <p className="text-xs text-slate-400 font-mono line-clamp-1">
                            {log.videoTitleKo}
                          </p>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold pt-0.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {log.position}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700">
                          {log.category}
                        </span>
                        {log.giType && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                            {log.giType}
                          </span>
                        )}
                        {log.submissionDetail && (
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold">
                            {language === 'ko' ? `피니시: ${log.submissionDetail}` : `Finish: ${log.submissionDetail}`}
                          </span>
                        )}
                        {log.difficulty && (
                          <span className="text-slate-400 font-normal">
                            {language === 'ko' ? `· 난이도 ${log.difficulty}` : `· Diff: ${log.difficulty}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Bar */}
                  <div
                    className="flex items-center justify-end gap-2.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleVideoClick(log)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap hover:opacity-95"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{language === 'ko' ? '다시 재생' : 'Play Again'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSingle(e, log.id, displayTitle)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title={language === 'ko' ? '이 시청 기록 삭제' : 'Delete this log'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {language === 'ko' ? '전체 시청 로그 기록을 비우시겠습니까?' : 'Clear all watch history logs?'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'ko'
                ? `지금까지 저장된 총 ${logs.length}건의 시청 로그 기록이 영구적으로 삭제됩니다. 실제 등록된 영상 라이브러리 데이터는 안전하게 유지됩니다.`
                : `All ${logs.length} watch logs will be permanently deleted. Your stored video library data will remain safe.`}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {language === 'ko' ? '취소' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                {language === 'ko' ? '기록 모두 비우기' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
