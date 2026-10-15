import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Check,
  ChevronLeft,
  X,
  Sliders,
  Star,
  Calendar as CalendarIcon,
  ArrowUpDown,
  Folder,
  FolderOpen,
  LayoutGrid,
  List,
  Play,
  Eye,
  EyeOff,
  Flame,
  ChevronDown,
  ChevronRight,
  Filter,
  Tag,
  Crosshair,
  Trash2,
} from 'lucide-react';
import {
  AppSettings,
  MetadataConfig,
  SubmissionGroupId,
  TechniqueVideo,
} from '../types';
import { STANDARD_CATEGORY_GROUPS, isCategoryInGroup } from '../data/bjjTaxonomy';
import { formatDateKorean, formatDateDot, isInstagramUrl } from '../utils/bjjAnalyzer';
import { ProficiencyRater } from './ProficiencyRater';
import { useLanguage } from '../i18n/LanguageContext';

interface JournalAssignmentViewProps {
  videos: TechniqueVideo[];
  metadata: MetadataConfig;
  settings: AppSettings;
  targetDate: string;
  onClose: () => void;
  onToggleDateAssignment: (videoId: string, dateStr: string) => void;
  onOpenReviewPopup?: (video: TechniqueVideo, dateStr: string) => void;
  onUpdateVideo?: (updated: TechniqueVideo) => void;
  isModal?: boolean;
}

type SortOption =
  | 'newest_added'
  | 'recent_practiced'
  | 'oldest_practiced'
  | 'alphabetical'
  | 'score_desc'
  | 'score_asc';

type ScoreFilterMode = 'all' | 'high' | 'low' | 'unrated';

export const JournalAssignmentView: React.FC<JournalAssignmentViewProps> = ({
  videos,
  metadata,
  settings,
  targetDate,
  onClose,
  onToggleDateAssignment,
  onOpenReviewPopup,
  onUpdateVideo,
  isModal = false,
}) => {
  const { t, language } = useLanguage();
  // Sidebar navigation states (PC Desktop 1:1 match with Module2VideoFolder)
  const [sidebarBrowseMode, setSidebarBrowseMode] = useState<
    'positions' | 'categories' | 'submissions'
  >('positions');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('ALL');
  const [selectedSubmissionFilter, setSelectedSubmissionFilter] = useState<{
    group?: SubmissionGroupId;
    detail?: string;
  } | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<{
    groupId?: string;
    detail?: string;
  } | null>(null);

  const [expandedPositions, setExpandedPositions] = useState<
    Record<string, boolean>
  >({});
  const [expandedCatGroups, setExpandedCatGroups] = useState<
    Record<string, boolean>
  >({
    'cat-grp-takedown': true,
    'cat-grp-pass': true,
    'cat-grp-sweep': true,
    'cat-grp-escape': true,
    'cat-grp-core': true,
  });
  const [expandedSubGroups, setExpandedSubGroups] = useState<
    Record<string, boolean>
  >({
    choke: true,
    armlock: true,
    leglock: true,
    compression: true,
  });
  const [expandedPosCatFolders, setExpandedPosCatFolders] = useState<
    Record<string, boolean>
  >({});

  const [searchQuery, setSearchQuery] = useState('');
  const [giFilter, setGiFilter] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [scoreFilterMode, setScoreFilterMode] =
    useState<ScoreFilterMode>('all');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest_added');
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);
  const [viewLayoutMode, setViewLayoutMode] = useState<'grid' | 'fileList'>('grid');
  const [activeRatingVideoId, setActiveRatingVideoId] = useState<string | null>(null);
  const [posGroupFilter, setPosGroupFilter] = useState<'ALL' | '스탠딩' | '선점' | '가드'>('ALL');

  // Empty Folder Hiding Preference
  const [hideEmptyPositions, setHideEmptyPositions] = useState<boolean>(
    () => settings.hideEmptyFolders ?? false
  );

  const themeColor = settings.primaryColor || '#059669';

  const togglePositionExpand = (posName: string) => {
    setExpandedPositions((prev) => ({
      ...prev,
      [posName]: !prev[posName],
    }));
  };

  const toggleCatGroupExpand = (grpId: string) => {
    setExpandedCatGroups((prev) => ({
      ...prev,
      [grpId]: !prev[grpId],
    }));
  };

  const toggleSubGroupExpand = (grpId: string) => {
    setExpandedSubGroups((prev) => ({
      ...prev,
      [grpId]: !prev[grpId],
    }));
  };

  const togglePosCatFolderExpand = (key: string) => {
    setExpandedPosCatFolders((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Calculate detailed folder counts across all hierarchies
  const folderCounts = useMemo(() => {
    const posCounts: Record<string, number> = {};
    const posSubCatCounts: Record<string, Record<string, number>> = {};
    const subGroupCounts: Record<string, number> = {};
    const subDetailCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const categoryGroupCounts: Record<string, number> = {};

    for (const v of videos) {
      const allPositions = new Set<string>();
      if (v.positions && v.positions.length > 0) {
        v.positions.forEach((p) => { if (p) allPositions.add(p); });
      } else if (v.position) {
        allPositions.add(v.position);
      }
      if (v.endPositions && v.endPositions.length > 0) {
        v.endPositions.forEach((p) => { if (p) allPositions.add(p); });
      } else if (v.endPosition) {
        allPositions.add(v.endPosition);
      }

      const allCategories = new Set<string>();
      if (v.categories && v.categories.length > 0) {
        v.categories.forEach((c) => { if (c) allCategories.add(c); });
      } else if (v.category) {
        allCategories.add(v.category);
      }

      for (const pos of allPositions) {
        posCounts[pos] = (posCounts[pos] || 0) + 1;
        if (!posSubCatCounts[pos]) {
          posSubCatCounts[pos] = {};
        }
        for (const cat of allCategories) {
          posSubCatCounts[pos][cat] = (posSubCatCounts[pos][cat] || 0) + 1;
        }
      }

      for (const cat of allCategories) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }

      if (v.submissionGroup !== 'none') {
        subGroupCounts[v.submissionGroup] =
          (subGroupCounts[v.submissionGroup] || 0) + 1;
        subDetailCounts[v.submissionDetail] =
          (subDetailCounts[v.submissionDetail] || 0) + 1;
      }
    }

    for (const grp of STANDARD_CATEGORY_GROUPS) {
      categoryGroupCounts[grp.id] = videos.filter((v) => {
        const allCats = new Set<string>();
        if (v.categories && v.categories.length > 0) {
          v.categories.forEach((c) => { if (c) allCats.add(c); });
        } else if (v.category) {
          allCats.add(v.category);
        }
        return Array.from(allCats).some((c) => isCategoryInGroup(c, grp));
      }).length;
    }

    return {
      posCounts,
      posSubCatCounts,
      subGroupCounts,
      subDetailCounts,
      categoryCounts,
      categoryGroupCounts,
    };
  }, [videos]);

  // Set of video IDs assigned to this target date
  const assignedVideoIds = useMemo(() => {
    const set = new Set<string>();
    for (const v of videos) {
      if (v.practiceDates.includes(targetDate)) {
        set.add(v.id);
      }
    }
    return set;
  }, [videos, targetDate]);

  // Visible positions based on hideEmptyPositions
  const visiblePositions = useMemo(() => {
    return metadata.positions.filter((pos) => {
      if (hideEmptyPositions && (folderCounts.posCounts[pos.name] || 0) === 0) {
        return false;
      }
      return true;
    });
  }, [metadata.positions, hideEmptyPositions, folderCounts.posCounts]);

  // Filtered and sorted videos (Identical to Module2VideoFolder logic)
  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return videos
      .filter((v) => {
        const allPositions = new Set<string>();
        if (v.positions && v.positions.length > 0) {
          v.positions.forEach((p) => { if (p) allPositions.add(p); });
        } else if (v.position) {
          allPositions.add(v.position);
        }
        if (v.endPositions && v.endPositions.length > 0) {
          v.endPositions.forEach((p) => { if (p) allPositions.add(p); });
        } else if (v.endPosition) {
          allPositions.add(v.endPosition);
        }

        const allCategories = new Set<string>();
        if (v.categories && v.categories.length > 0) {
          v.categories.forEach((c) => { if (c) allCategories.add(c); });
        } else if (v.category) {
          allCategories.add(v.category);
        }

        if (selectedSubmissionFilter) {
          if (
            selectedSubmissionFilter.detail &&
            v.submissionDetail !== selectedSubmissionFilter.detail
          ) {
            return false;
          }
          if (
            selectedSubmissionFilter.group &&
            v.submissionGroup !== selectedSubmissionFilter.group
          ) {
            return false;
          }
        } else if (selectedCategoryFilter) {
          if (selectedCategoryFilter.detail) {
            if (!allCategories.has(selectedCategoryFilter.detail)) return false;
          } else if (selectedCategoryFilter.groupId) {
            const catGrp = STANDARD_CATEGORY_GROUPS.find(
              (g) => g.id === selectedCategoryFilter.groupId
            );
            if (catGrp && !Array.from(allCategories).some((c) => isCategoryInGroup(c, catGrp))) return false;
          }
          if (selectedPosition !== 'ALL' && !allPositions.has(selectedPosition)) {
            return false;
          }
        } else {
          if (selectedPosition !== 'ALL' && !allPositions.has(selectedPosition)) {
            return false;
          }
          if (
            selectedSubCategory !== 'ALL' &&
            !allCategories.has(selectedSubCategory)
          ) {
            return false;
          }
        }

        if (giFilter !== 'ALL') {
          if (giFilter === 'Gi') {
            if (v.giType !== 'Gi' && v.giType !== 'Both' && v.giType !== 'All') return false;
          } else if (giFilter === 'No-Gi') {
            if (v.giType !== 'No-Gi' && v.giType !== 'Both' && v.giType !== 'All') return false;
          } else if (giFilter === 'Both') {
            if (v.giType !== 'Both' && v.giType !== 'All') return false;
          } else if (v.giType !== giFilter) {
            return false;
          }
        }

        if (difficultyFilter !== 'ALL' && v.difficulty !== difficultyFilter) {
          return false;
        }

        if (favoriteOnly && !v.isFavorite) {
          return false;
        }

        if (scoreFilterMode === 'high') {
          if (
            v.proficiencyScore === 0 ||
            v.proficiencyScore < (settings.highScoreThreshold ?? 8)
          ) {
            return false;
          }
        } else if (scoreFilterMode === 'low') {
          if (
            v.proficiencyScore === 0 ||
            v.proficiencyScore > (settings.lowScoreThreshold ?? 4)
          ) {
            return false;
          }
        } else if (scoreFilterMode === 'unrated') {
          if (v.proficiencyScore > 0) {
            return false;
          }
        }

        if (q) {
          const hay = `${v.titleKo} ${v.titleEn} ${v.position} ${v.category} ${
            v.submissionDetail || ''
          } ${v.generalNotes || ''}`.toLowerCase();
          return hay.includes(q);
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent_practiced') {
          const aDate =
            a.practiceDates.length > 0
              ? [...a.practiceDates].sort().slice(-1)[0]
              : '';
          const bDate =
            b.practiceDates.length > 0
              ? [...b.practiceDates].sort().slice(-1)[0]
              : '';
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return bDate.localeCompare(aDate);
        }
        if (sortBy === 'oldest_practiced') {
          const aDate =
            a.practiceDates.length > 0
              ? [...a.practiceDates].sort().slice(-1)[0]
              : '';
          const bDate =
            b.practiceDates.length > 0
              ? [...b.practiceDates].sort().slice(-1)[0]
              : '';
          if (!aDate && !bDate) return 0;
          if (!aDate) return -1;
          if (!bDate) return 1;
          return aDate.localeCompare(bDate);
        }
        if (sortBy === 'score_desc') {
          return b.proficiencyScore - a.proficiencyScore;
        }
        if (sortBy === 'score_asc') {
          return a.proficiencyScore - b.proficiencyScore;
        }
        if (sortBy === 'alphabetical') {
          return a.titleKo.localeCompare(b.titleKo);
        }
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      });
  }, [
    videos,
    selectedPosition,
    selectedSubCategory,
    selectedSubmissionFilter,
    selectedCategoryFilter,
    giFilter,
    difficultyFilter,
    favoriteOnly,
    scoreFilterMode,
    searchQuery,
    sortBy,
    settings.highScoreThreshold,
    settings.lowScoreThreshold,
  ]);

  const assignedCount = assignedVideoIds.size;
  const isInsideFolder =
    selectedPosition !== 'ALL' ||
    selectedSubmissionFilter !== null ||
    selectedCategoryFilter !== null;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div
      className={`flex flex-col h-full w-full ${
        isModal ? 'space-y-3' : 'min-h-[70vh] pb-32 space-y-3.5 animate-in fade-in duration-150'
      }`}
    >
      {/* 1. Header Bar: Date Indicator, Assigned Count, and Close/Complete button */}
      <div className="shrink-0 bg-white rounded-2xl border border-slate-200 p-2.5 sm:p-3 shadow-2xs flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-4 h-4" style={{ color: themeColor }} />
          <span>{language === 'ko' ? '달력으로 돌아가기' : 'Back to Calendar'}</span>
        </button>

        <div className="flex items-center gap-3 min-w-0">
          <div className="text-right truncate">
            <div className="text-xs sm:text-sm font-black text-slate-900 flex items-center justify-end gap-1.5">
              <CalendarIcon className="w-4 h-4 shrink-0" style={{ color: themeColor }} />
              <span className="truncate">{targetDate} {language === 'ko' ? '학습 배정' : 'Assignment'}</span>
            </div>
            <div className="text-[11px] font-bold" style={{ color: themeColor }}>
              {assignedCount > 0 ? (
                <span>{language === 'ko' ? `현재 배정됨: ${assignedCount}개 기술` : `Assigned: ${assignedCount} items`}</span>
              ) : (
                <span className="text-slate-400 font-normal">{language === 'ko' ? '배정된 기술 없음 (기술을 클릭하여 배정)' : 'No techniques assigned (click to assign)'}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs"
          >
            {language === 'ko' ? '완료' : 'Done'}
          </button>
        </div>
      </div>

      {/* 2. DESKTOP-ONLY TOP FILTER BAR (1:1 with Module2VideoFolder and user image) */}
      <div className="hidden lg:block shrink-0 bg-white rounded-2xl border border-slate-200 p-3.5 space-y-3 shadow-3xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Gi Filters */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full custom-scrollbar">
              <button
                type="button"
                onClick={() => setGiFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  giFilter === 'ALL'
                    ? 'text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={giFilter === 'ALL' ? { backgroundColor: themeColor } : undefined}
              >
                {language === 'ko' ? '전체' : 'All'}
              </button>
              {metadata.giTypes
                .filter((gi) => gi !== 'All')
                .map((gi) => (
                  <button
                    key={gi}
                    type="button"
                    onClick={() => setGiFilter(gi)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      giFilter === gi
                        ? 'text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    style={giFilter === gi ? { backgroundColor: themeColor } : undefined}
                  >
                    {gi === 'Gi'
                      ? (language === 'ko' ? '도복' : 'Gi')
                      : gi === 'No-Gi'
                        ? (language === 'ko' ? '노기' : 'No-Gi')
                        : gi === 'Both'
                          ? (language === 'ko' ? '공용' : 'Both')
                          : gi}
                  </button>
                ))}
            </div>

            {/* Proficiency Score Filter */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full custom-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 pl-2 pr-1 shrink-0 flex items-center gap-1">
                <Filter className="w-3 h-3 text-indigo-500" />
                {language === 'ko' ? '숙련도:' : 'Score:'}
              </span>
              <button
                type="button"
                onClick={() => setScoreFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  scoreFilterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'ko' ? '전체' : 'All'} ({videos.length})
              </button>
              <button
                type="button"
                onClick={() => setScoreFilterMode('high')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  scoreFilterMode === 'high'
                    ? 'text-white font-extrabold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={scoreFilterMode === 'high' ? { backgroundColor: themeColor } : undefined}
              >
                {language === 'ko' ? '높음' : 'High'} ({videos.filter((v) => v.proficiencyScore >= (settings.highScoreThreshold ?? 8)).length})
              </button>
              <button
                type="button"
                onClick={() => setScoreFilterMode('low')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  scoreFilterMode === 'low'
                    ? 'text-white font-extrabold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={scoreFilterMode === 'low' ? { backgroundColor: themeColor } : undefined}
              >
                {language === 'ko' ? '낮음' : 'Low'} ({videos.filter((v) => v.proficiencyScore > 0 && v.proficiencyScore <= (settings.lowScoreThreshold ?? 4)).length})
              </button>
              <button
                type="button"
                onClick={() => setScoreFilterMode('unrated')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  scoreFilterMode === 'unrated'
                    ? 'text-white font-extrabold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={scoreFilterMode === 'unrated' ? { backgroundColor: themeColor } : undefined}
              >
                {language === 'ko' ? '미부여' : 'Unrated'} ({videos.filter((v) => v.proficiencyScore === 0).length})
              </button>
            </div>
          </div>

          {/* Right Area: Search Bar + View Mode Switcher + Favorite Star */}
          <div className="flex items-center gap-2.5 shrink-0 self-end xl:self-auto">
            {/* Desktop Search Input */}
            <div className="relative w-56 sm:w-64 xl:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ko' ? `총 ${filteredVideos.length}개 기술 검색...` : `Search ${filteredVideos.length} techniques...`}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 hover:bg-slate-200/60 focus:bg-white border border-transparent focus:border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all shadow-3xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* View Layout Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setViewLayoutMode('fileList')}
                className={`flex items-center justify-center p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewLayoutMode === 'fileList'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title={language === 'ko' ? '파일 리스트 뷰' : 'List View'}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayoutMode('grid')}
                className={`flex items-center justify-center p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewLayoutMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title={language === 'ko' ? '카드 그리드 뷰' : 'Grid View'}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Favorite Filter Star Button */}
            <button
              type="button"
              onClick={() => setFavoriteOnly(!favoriteOnly)}
              className={`flex items-center justify-center p-2 rounded-xl border transition-colors cursor-pointer shrink-0 shadow-3xs ${
                favoriteOnly
                  ? 'bg-amber-50 border-amber-400 text-amber-500 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
              title={language === 'ko' ? '즐겨찾기 필터' : 'Favorite Filter'}
            >
              <Star
                className={`w-4 h-4 ${
                  favoriteOnly ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Difficulty Filter & Smart Sorting Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto custom-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 pl-2 shrink-0">
              {language === 'ko' ? '난이도:' : 'Diff:'}
            </span>
            <button
              type="button"
              onClick={() => setDifficultyFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                difficultyFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'ko' ? '전체' : 'All'}
            </button>
            {metadata.difficulties.map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficultyFilter(diff)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  difficultyFilter === diff
                    ? 'text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={difficultyFilter === diff ? { backgroundColor: themeColor } : undefined}
              >
                {diff === '초급(하)'
                  ? (language === 'ko' ? '초급' : 'Novice')
                  : diff === '중급(중)'
                    ? (language === 'ko' ? '중급' : 'Interm.')
                    : diff === '고급(상)'
                      ? (language === 'ko' ? '고급' : 'Adv.')
                      : diff}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              {language === 'ko' ? '정렬:' : 'Sort:'}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent focus:outline-none text-xs font-bold text-slate-800 cursor-pointer w-full py-0.5"
            >
              <option value="newest_added">{language === 'ko' ? '최신 등록순' : 'Newest Added'}</option>
              <option value="recent_practiced">{language === 'ko' ? '최근 수련순' : 'Recently Practiced'}</option>
              <option value="oldest_practiced">{language === 'ko' ? '장기 미수련순' : 'Least Practiced'}</option>
              <option value="alphabetical">{language === 'ko' ? '가나다순 (기술명)' : 'Alphabetical'}</option>
              <option value="score_desc">{language === 'ko' ? '숙련도 높은순' : 'Highest Score'}</option>
              <option value="score_asc">{language === 'ko' ? '숙련도 낮은순' : 'Lowest Score'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. MOBILE-ONLY TOP SEARCH & FLOATING OVERLAY ROW */}
      <div className="lg:hidden relative shrink-0">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-600 px-1">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ko' ? `총 ${videos.length}개 기술 검색...` : `Search ${videos.length} techniques...`}
                className="w-full pl-8 pr-3 py-2 bg-slate-100/90 hover:bg-slate-200/60 focus:bg-white border border-transparent focus:border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all shadow-3xs"
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

            <button
              type="button"
              onClick={() => setHideEmptyPositions(!hideEmptyPositions)}
              className={`flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer shrink-0 shadow-3xs ${
                hideEmptyPositions
                  ? 'text-white shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
              style={
                hideEmptyPositions
                  ? { backgroundColor: themeColor, borderColor: themeColor }
                  : undefined
              }
              title={
                hideEmptyPositions
                  ? (language === 'ko' ? '모든 포지션 표시 (빈 폴더 숨김 해제)' : 'Show all folders (unhide empty)')
                  : (language === 'ko' ? '영상이 없는 빈 포지션 폴더 숨기기' : 'Hide empty folders')
              }
            >
              {hideEmptyPositions ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setViewLayoutMode('fileList')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewLayoutMode === 'fileList'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title={language === 'ko' ? '파일 리스트 뷰' : 'List View'}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayoutMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewLayoutMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title={language === 'ko' ? '카드 그리드 뷰' : 'Grid View'}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsToolboxOpen(!isToolboxOpen)}
              className={`flex items-center justify-center p-2 rounded-xl border transition-colors cursor-pointer ${
                isToolboxOpen
                  ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
              title={isToolboxOpen ? (language === 'ko' ? '도구함 닫기' : 'Close Toolbox') : (language === 'ko' ? '도구함 열기' : 'Open Toolbox')}
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Floating Overlay Toolbox */}
        {isToolboxOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-white/98 backdrop-blur-md rounded-2xl border border-slate-200 p-3.5 space-y-2.5 shadow-xl animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto custom-scrollbar">
                <span className="text-[11px] font-bold text-slate-400 pl-2 pr-1 shrink-0">
                  {language === 'ko' ? '도복:' : 'Gi:'}
                </span>
                <button
                  type="button"
                  onClick={() => setGiFilter('ALL')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    giFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'ko' ? '전체' : 'All'}
                </button>
                {['Gi', 'No-Gi'].map((gi) => (
                  <button
                    key={gi}
                    type="button"
                    onClick={() => setGiFilter(gi)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      giFilter === gi
                        ? 'text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    style={
                      giFilter === gi ? { backgroundColor: themeColor } : undefined
                    }
                  >
                    {gi === 'Gi' ? (language === 'ko' ? '도복' : 'Gi') : (language === 'ko' ? '노기' : 'No-Gi')}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={() => setFavoriteOnly(!favoriteOnly)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    favoriteOnly
                      ? 'bg-amber-50 border-amber-400 text-amber-500'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
                  }`}
                  title={language === 'ko' ? '즐겨찾기 기술만 보기' : 'Show favorites only'}
                >
                  <Star
                    className={`w-4 h-4 ${
                      favoriteOnly ? 'fill-amber-400 text-amber-400' : ''
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setIsToolboxOpen(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow-3xs"
                >
                  {language === 'ko' ? '닫기 ✕' : 'Close ✕'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto custom-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 pl-2 pr-1 shrink-0">
                {language === 'ko' ? '숙련도:' : 'Score:'}
              </span>
              <button
                type="button"
                onClick={() => setScoreFilterMode('all')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  scoreFilterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'ko' ? '전체' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setScoreFilterMode('high')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  scoreFilterMode === 'high'
                    ? 'text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={
                  scoreFilterMode === 'high'
                    ? { backgroundColor: themeColor }
                    : undefined
                }
              >
                {language === 'ko' ? '높음' : 'High'}
              </button>
              <button
                type="button"
                onClick={() => setScoreFilterMode('low')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  scoreFilterMode === 'low'
                    ? 'text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={
                  scoreFilterMode === 'low'
                    ? { backgroundColor: themeColor }
                    : undefined
                }
              >
                {language === 'ko' ? '낮음' : 'Low'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. MAIN BODY CONTAINER: Mobile View vs Desktop 12-Column Grid */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {/* === MOBILE ONLY VIEWS (Untouched for Mobile) === */}
        <div className="lg:hidden flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {/* Mobile Folder Grid View when at root and not searching */}
          {!isInsideFolder && !isSearching ? (
            <div className="space-y-3.5 animate-in fade-in duration-200 px-0.5 pb-4">
              <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-2xl space-y-3 shadow-3xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                  <h4 className="text-[11px] font-black text-slate-600 tracking-wider flex items-center gap-1.5 uppercase">
                    <Folder className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{language === 'ko' ? '시작 포지션 폴더 선택' : 'Select Start Position Folder'}</span>
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {language === 'ko' ? `총 ${visiblePositions.length}개` : `Total ${visiblePositions.length}`}
                  </span>
                </div>

                {visiblePositions.length === 0 ? (
                  <div className="text-center py-6 space-y-2 bg-white rounded-2xl border border-dashed border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500">
                      {language === 'ko' ? '선택한 필터 조건에 부합하는 포지션 폴더가 없습니다.' : 'No position folders match the selected filters.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setGiFilter('ALL');
                        setDifficultyFilter('ALL');
                        setFavoriteOnly(false);
                        setScoreFilterMode('all');
                        setSearchQuery('');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      {language === 'ko' ? '필터 초기화' : 'Reset Filters'}
                    </button>
                  </div>
                ) : viewLayoutMode === 'fileList' ? (
                  /* Thin & Horizontally Long Folder Cards (Red Box Selected) */
                  <div className="space-y-2">
                    {visiblePositions.map((pos) => {
                      const count = folderCounts.posCounts[pos.name] || 0;
                      return (
                        <button
                          key={pos.id || pos.name}
                          type="button"
                          onClick={() => {
                            setSelectedPosition(pos.name);
                            setSelectedSubCategory('ALL');
                            setSelectedSubmissionFilter(null);
                            setSelectedCategoryFilter(null);
                          }}
                          className="w-full bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between transition-all cursor-pointer group shadow-3xs hover:shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Small Folder Icon */}
                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="w-5.5 h-5.5 group-hover:scale-105 transition-transform"
                                style={{ color: themeColor, fill: themeColor }}
                              >
                                <path d="M2.5 19V7C2.5 5.89543 3.39543 5 4.5 5H9.17157C9.70201 5 10.2107 5.21071 10.5858 5.58579L12.4142 7.41421C12.7893 7.78929 13.298 8 13.8284 8H19.5C20.6046 8 21.5 8.89543 21.5 10V19C21.5 20.1046 20.6046 21 19.5 21H4.5C3.39543 21 2.5 20.1046 2.5 19Z" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {pos.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono tabular-nums text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 shadow-3xs">
                              {count}{language === 'ko' ? '개' : ''}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* 3-Column Folder Grid Cards (Blue Box Selected) */
                  <div className="grid grid-cols-3 gap-3">
                    {visiblePositions.map((pos) => {
                      const count = folderCounts.posCounts[pos.name] || 0;
                      return (
                        <button
                          key={pos.id || pos.name}
                          type="button"
                          onClick={() => {
                            setSelectedPosition(pos.name);
                            setSelectedSubCategory('ALL');
                            setSelectedSubmissionFilter(null);
                            setSelectedCategoryFilter(null);
                          }}
                          className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer group shadow-3xs hover:shadow-2xs relative min-h-[105px]"
                        >
                          <span className="absolute top-1.5 right-1.5 font-mono tabular-nums text-[8px] font-black text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200/60 shadow-3xs">
                            {count}
                          </span>

                          <div className="w-11 h-11 flex items-center justify-center mb-1 shrink-0">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="w-10 h-10 group-hover:scale-105 transition-transform"
                              style={{ color: themeColor, fill: themeColor }}
                            >
                              <path d="M2.5 19V7C2.5 5.89543 3.39543 5 4.5 5H9.17157C9.70201 5 10.2107 5.21071 10.5858 5.58579L12.4142 7.41421C12.7893 7.78929 13.298 8 13.8284 8H19.5C20.6046 8 21.5 8.89543 21.5 10V19C21.5 20.1046 20.6046 21 19.5 21H4.5C3.39543 21 2.5 20.1046 2.5 19Z" />
                            </svg>
                          </div>

                          <span className="text-[10px] font-bold text-slate-800 line-clamp-2 leading-tight break-all">
                            {pos.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Mobile Video List / Grid with Breadcrumb Back Bar */
            <div className="space-y-3 pb-6">
              <div className="flex items-center gap-2 pb-1 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPosition('ALL');
                    setSelectedSubCategory('ALL');
                    setSelectedSubmissionFilter(null);
                    setSelectedCategoryFilter(null);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-black text-slate-700 transition-colors shadow-3xs cursor-pointer"
                >
                  <span className="font-extrabold text-[12px]" style={{ color: themeColor }}>
                    ←
                  </span>
                  <span>{language === 'ko' ? '전체 폴더 보기' : 'View All Folders'}</span>
                </button>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 truncate">
                  <span>/</span>
                  <span className="text-slate-800 font-black truncate bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/60 shadow-3xs">
                    {selectedPosition !== 'ALL' ? selectedPosition : (language === 'ko' ? '검색 결과' : 'Search Results')} ({filteredVideos.length})
                  </span>
                </div>
              </div>

              {/* Mobile Videos Render (fileList vs grid) */}
              {viewLayoutMode === 'fileList' ? (
                /* Compact File List View */
                <div className="space-y-2">
                  {filteredVideos.map((v) => {
                    const isAssigned = assignedVideoIds.has(v.id);
                    return (
                      <article
                        key={v.id}
                        onClick={() => onToggleDateAssignment(v.id, targetDate)}
                        className={`group bg-white rounded-xl border p-2.5 flex items-center gap-3 transition-all cursor-pointer shadow-3xs ${
                          isAssigned
                            ? 'border-emerald-500 ring-2 ring-emerald-500/80 bg-emerald-50/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="relative w-20 h-14 bg-slate-900 rounded-lg overflow-hidden shrink-0 shadow-3xs">
                          {v.thumbnailUrl && (
                            <img
                              src={v.thumbnailUrl}
                              alt={language === 'en' ? (v.titleEn || v.titleKo) : v.titleKo}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          )}
                          {isAssigned && (
                            <span className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-emerald-600 text-white text-[8px] font-bold">
                              {language === 'ko' ? '배정됨' : 'Assigned'}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1 text-[10px] font-bold truncate">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 truncate">
                              {v.position}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 truncate">
                              {v.category}
                            </span>
                          </div>
                          <h3 className="text-xs font-black text-slate-900 truncate whitespace-nowrap">
                            {language === 'en' ? (v.titleEn || v.titleKo) : v.titleKo}
                          </h3>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>{language === 'ko' ? `수련 ${v.practiceDates.length}회` : `Practiced ${v.practiceDates.length}x`}</span>
                            {isAssigned ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[9px] flex items-center gap-1">
                                <Check className="w-3 h-3" /> {language === 'ko' ? '배정됨' : 'Assigned'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[9px]">
                                {language === 'ko' ? '+ 배정' : '+ Assign'}
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                /* Card Grid View */
                <div className="grid grid-cols-1 gap-3">
                  {filteredVideos.map((v) => {
                    const isAssigned = assignedVideoIds.has(v.id);
                    return (
                      <article
                        key={v.id}
                        onClick={() => onToggleDateAssignment(v.id, targetDate)}
                        className={`group bg-white rounded-2xl border transition-all cursor-pointer overflow-hidden shadow-2xs ${
                          isAssigned
                            ? 'border-emerald-500 ring-2 ring-emerald-500/80 bg-emerald-50/20'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                          {v.thumbnailUrl && (
                            <img
                              src={v.thumbnailUrl}
                              alt={language === 'en' ? (v.titleEn || v.titleKo) : v.titleKo}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900/85 text-[10px] font-bold text-white">
                              {v.position}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
                              style={{ backgroundColor: themeColor }}
                            >
                              {v.category}
                            </span>
                          </div>

                          {isAssigned && (
                            <div
                              className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-[11px] font-black shadow-md"
                              style={{ backgroundColor: themeColor }}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{language === 'ko' ? '배정됨' : 'Assigned'}</span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 space-y-2">
                          <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                            {language === 'en' ? (v.titleEn || v.titleKo) : v.titleKo}
                          </h3>
                          <p className="text-xs text-slate-400 font-mono line-clamp-1">
                            {v.titleEn}
                          </p>
                          <button
                            type="button"
                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isAssigned
                                ? 'text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                            style={isAssigned ? { backgroundColor: themeColor } : undefined}
                          >
                            {isAssigned ? (language === 'ko' ? '✓ 배정됨 (해제하려면 클릭)' : '✓ Assigned (click to unassign)') : `+ ${targetDate} ${language === 'ko' ? '일지에 배정' : 'Assign to Journal'}`}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* === DESKTOP 12-COLUMN GRID (1:1 with Module2VideoFolder & screenshot) === */}
        <div className="hidden lg:grid grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
          {/* LEFT SIDEBAR: Natural scrolling folder hierarchy */}
          <aside className="col-span-3 xl:col-span-3 flex flex-col bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4" style={{ color: themeColor }} />
                <span className="text-xs font-black text-slate-900">
                  {sidebarBrowseMode === 'positions'
                    ? (language === 'ko' ? '시작 포지션 폴더' : 'Start Position Folders')
                    : sidebarBrowseMode === 'categories'
                      ? (language === 'ko' ? '기술 성격 폴더' : 'Category Folders')
                      : (language === 'ko' ? '서브미션 피니시 폴더' : 'Submission Folders')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHideEmptyPositions(!hideEmptyPositions)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  hideEmptyPositions
                    ? 'text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={hideEmptyPositions ? { backgroundColor: themeColor } : undefined}
                title={hideEmptyPositions ? (language === 'ko' ? '모든 포지션 표시 (빈 폴더 숨김 해제)' : 'Show all folders (unhide empty)') : (language === 'ko' ? '영상이 없는 빈 포지션 폴더 숨기기' : 'Hide empty folders')}
              >
                {hideEmptyPositions ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                <span className="text-[10px] font-semibold">
                  {hideEmptyPositions ? (language === 'ko' ? '빈폴더 숨김' : 'Empty Hidden') : (language === 'ko' ? '빈폴더 숨기기' : 'Hide Empty')}
                </span>
              </button>
            </div>

            {/* 3 Main Folder Classification Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl mb-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSidebarBrowseMode('positions');
                  setSelectedSubmissionFilter(null);
                  setSelectedCategoryFilter(null);
                }}
                className={`py-1.5 px-1 text-center rounded-lg text-[11px] font-black transition-all cursor-pointer truncate ${
                  sidebarBrowseMode === 'positions'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'ko' ? '포지션' : 'Positions'} ({metadata.positions.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setSidebarBrowseMode('categories');
                  setSelectedPosition('ALL');
                  setSelectedSubmissionFilter(null);
                }}
                className={`py-1.5 px-1 text-center rounded-lg text-[11px] font-black transition-all cursor-pointer truncate ${
                  sidebarBrowseMode === 'categories'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'ko' ? `기술성격 (${STANDARD_CATEGORY_GROUPS.length}대)` : `Categories (${STANDARD_CATEGORY_GROUPS.length})`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSidebarBrowseMode('submissions');
                  setSelectedPosition('ALL');
                  setSelectedCategoryFilter(null);
                }}
                className={`py-1.5 px-1 text-center rounded-lg text-[11px] font-black transition-all cursor-pointer truncate ${
                  sidebarBrowseMode === 'submissions'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'ko' ? `서브미션 (${metadata.submissions.length}대)` : `Submissions (${metadata.submissions.length})`}
              </button>
            </div>

            {/* FOLDER TREES (Scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
              {/* MODE 1: POSITIONS */}
              {sidebarBrowseMode === 'positions' && (
                <div className="space-y-2">
                  {/* Position Group Chips */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setPosGroupFilter('ALL')}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
                        posGroupFilter === 'ALL'
                          ? 'text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      style={posGroupFilter === 'ALL' ? { backgroundColor: themeColor } : undefined}
                    >
                      {language === 'ko' ? '전체' : 'All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosGroupFilter('스탠딩')}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
                        posGroupFilter === '스탠딩'
                          ? 'bg-blue-600 text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'ko' ? '스탠딩/특수' : 'Standing'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosGroupFilter('선점')}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
                        posGroupFilter === '선점'
                          ? 'bg-amber-600 text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'ko' ? '탑/도미넌트' : 'Top/Dominant'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosGroupFilter('가드')}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
                        posGroupFilter === '가드'
                          ? 'bg-emerald-600 text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'ko' ? '가드' : 'Guard'}
                    </button>
                  </div>

                  {/* Root "All Positions" Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPosition('ALL');
                      setSelectedSubCategory('ALL');
                      setSelectedSubmissionFilter(null);
                      setSelectedCategoryFilter(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      selectedPosition === 'ALL' && !selectedSubmissionFilter && !selectedCategoryFilter
                        ? 'text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    style={
                      selectedPosition === 'ALL' && !selectedSubmissionFilter && !selectedCategoryFilter
                        ? { backgroundColor: themeColor }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                      <Folder className="w-3.5 h-3.5" />
                      <span>{language === 'ko' ? '전체 포지션' : 'All Positions'}</span>
                    </div>
                    <span className="font-mono tabular-nums text-[11px] opacity-90">
                      {videos.length}
                    </span>
                  </button>

                  {/* Position Items List */}
                  {metadata.positions
                    .filter((pos) => {
                      if (hideEmptyPositions && (folderCounts.posCounts[pos.name] || 0) === 0) {
                        return false;
                      }
                      if (posGroupFilter === 'ALL') return true;
                      if (posGroupFilter === '스탠딩') {
                        return (
                          pos.group === '스탠딩 및 특수 포지션' ||
                          ['스탠딩', '레슬링', '터틀', '트럭', '아시', '새들'].some((k) =>
                            pos.name.includes(k)
                          )
                        );
                      }
                      if (posGroupFilter === '선점') {
                        return (
                          pos.group === '탑 & 도미넌트 (상위)' ||
                          ['마운트', '사이드', '니온밸리', '노스 사우스', '곁누르기', '케사', '크루시픽스', '헤드쿼터'].some((k) =>
                            pos.name.includes(k)
                          )
                        );
                      }
                      if (posGroupFilter === '가드') {
                        return (
                          pos.group === '가드 포지션 (하위)' ||
                          pos.group === '가드' ||
                          pos.name.includes('가드') ||
                          pos.name.includes('록다운')
                        );
                      }
                      return true;
                    })
                    .map((pos) => {
                      const posTotal = folderCounts.posCounts[pos.name] || 0;
                      const isSelectedPos =
                        selectedPosition === pos.name && !selectedSubmissionFilter && !selectedCategoryFilter;
                      const isExpanded = !!expandedPositions[pos.name];

                      let groupKey: 'guard' | 'dominant' | 'standing' | 'other' = 'other';
                      let groupBadge = language === 'ko' ? '스탠딩/특수' : 'Standing/Special';
                      if (pos.group === '가드 포지션 (하위)' || pos.group === '가드' || pos.name.includes('가드') || pos.name.includes('록다운')) {
                        groupKey = 'guard';
                        groupBadge = language === 'ko' ? '가드' : 'Guard';
                      } else if (
                        pos.group === '탑 & 도미넌트 (상위)' ||
                        ['마운트', '사이드', '니온밸리', '노스 사우스', '곁누르기', '케사', '크루시픽스', '헤드쿼터'].some((k) =>
                          pos.name.includes(k)
                        )
                      ) {
                        groupKey = 'dominant';
                        groupBadge = language === 'ko' ? '탑/도미넌트' : 'Top/Dominant';
                      } else {
                        groupKey = 'standing';
                        groupBadge = language === 'ko' ? '스탠딩/특수' : 'Standing/Special';
                      }

                      const defaultColors = {
                        guard: '#059669',
                        dominant: '#d97706',
                        standing: '#2563eb',
                        other: '#6366f1',
                      };
                      const groupColor = defaultColors[groupKey];

                      return (
                        <div key={pos.id || pos.name} className="space-y-0.5">
                          <div
                            onClick={() => {
                              setSelectedPosition(pos.name);
                              setSelectedSubCategory('ALL');
                              setSelectedSubmissionFilter(null);
                              setSelectedCategoryFilter(null);
                              if (!expandedPositions[pos.name]) {
                                togglePositionExpand(pos.name);
                              }
                            }}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                              isSelectedPos && selectedSubCategory === 'ALL'
                                ? 'text-white font-bold shadow-xs'
                                : isSelectedPos
                                  ? 'border font-bold'
                                  : 'text-slate-700 hover:bg-slate-100 font-medium'
                            }`}
                            style={
                              isSelectedPos && selectedSubCategory === 'ALL'
                                ? { backgroundColor: themeColor }
                                : isSelectedPos
                                  ? {
                                      backgroundColor: `${themeColor}12`,
                                      borderColor: `${themeColor}40`,
                                      color: themeColor,
                                    }
                                  : undefined
                            }
                          >
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePositionExpand(pos.name);
                                }}
                                className="p-0.5 rounded hover:bg-black/10 cursor-pointer"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                                )}
                              </button>
                              {isExpanded ? (
                                <FolderOpen
                                  className="w-3.5 h-3.5 shrink-0"
                                  style={{ color: isSelectedPos && selectedSubCategory === 'ALL' ? '#ffffff' : groupColor }}
                                />
                              ) : (
                                <Folder
                                  className="w-3.5 h-3.5 shrink-0"
                                  style={{ color: isSelectedPos && selectedSubCategory === 'ALL' ? '#ffffff' : groupColor }}
                                />
                              )}
                              <span className="truncate">{language === 'en' ? (pos.nameEn || pos.name) : pos.name}</span>
                              <span
                                className="px-1.5 py-0.2 rounded text-[9px] font-extrabold shrink-0"
                                style={{
                                  backgroundColor: isSelectedPos && selectedSubCategory === 'ALL' ? 'rgba(255,255,255,0.2)' : `${groupColor}18`,
                                  color: isSelectedPos && selectedSubCategory === 'ALL' ? '#ffffff' : groupColor,
                                }}
                              >
                                {groupBadge}
                              </span>
                            </div>
                            <span className="font-mono tabular-nums text-[11px] opacity-80 ml-2">
                              {posTotal}
                            </span>
                          </div>

                          {/* Expanded Position: Grouped into Category Sub-folders */}
                          {isExpanded && (
                            <div className="pl-5 pr-1 py-1 space-y-1 border-l-2 border-slate-200/80 ml-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPosition(pos.name);
                                  setSelectedSubCategory('ALL');
                                  setSelectedSubmissionFilter(null);
                                  setSelectedCategoryFilter(null);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer ${
                                  isSelectedPos && selectedSubCategory === 'ALL'
                                    ? 'font-bold'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                                style={
                                  isSelectedPos && selectedSubCategory === 'ALL'
                                    ? { backgroundColor: `${themeColor}20`, color: themeColor }
                                    : undefined
                                }
                              >
                                <span className="flex items-center gap-1.5">
                                  <Folder className="w-3 h-3 opacity-60 text-sky-500" />
                                  {language === 'ko' ? '전체 기술 성격' : 'All Categories'}
                                </span>
                                <span className="font-mono tabular-nums">
                                  {posTotal}
                                </span>
                              </button>

                              {STANDARD_CATEGORY_GROUPS.map((grp) => {
                                const posCatKey = `${pos.name}::${grp.id}`;
                                const isPosCatExpanded = !!expandedPosCatFolders[posCatKey];
                                const grpTotalInPos = grp.items.reduce(
                                  (sum, it) => sum + (folderCounts.posSubCatCounts[pos.name]?.[it] || 0),
                                  0
                                );

                                return (
                                  <div key={grp.id} className="space-y-0.5">
                                    <div
                                      onClick={() => {
                                        setSelectedPosition(pos.name);
                                        setSelectedSubCategory('ALL');
                                        setSelectedSubmissionFilter(null);
                                        setSelectedCategoryFilter({ groupId: grp.id });
                                        setExpandedPosCatFolders((prev) => ({
                                          ...prev,
                                          [posCatKey]: (selectedPosition === pos.name && selectedCategoryFilter?.groupId === grp.id) ? !prev[posCatKey] : true,
                                        }));
                                      }}
                                      className={`flex items-center justify-between px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                        selectedPosition === pos.name && selectedCategoryFilter?.groupId === grp.id
                                          ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                                          : 'text-slate-700 hover:bg-slate-100'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <ChevronRight
                                          className={`w-3 h-3 text-slate-400 transition-transform ${
                                            isPosCatExpanded ? 'rotate-90' : ''
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            togglePosCatFolderExpand(posCatKey);
                                          }}
                                        />
                                        <Folder className="w-3 h-3 text-indigo-500 shrink-0" />
                                        <span className="truncate">{grp.name}</span>
                                        <span className="text-[9px] text-slate-400 font-mono">
                                          ({grp.badge})
                                        </span>
                                      </div>
                                      <span className="font-mono tabular-nums text-[10px] text-slate-500">
                                        {grpTotalInPos}
                                      </span>
                                    </div>

                                    {isPosCatExpanded && (
                                      <div className="pl-4 space-y-0.5 border-l border-indigo-100 ml-3">
                                        {grp.items
                                          .filter((it) => metadata.categories.includes(it))
                                          .map((catName) => {
                                            const catCount =
                                              folderCounts.posSubCatCounts[pos.name]?.[catName] || 0;
                                            const isCatSelected =
                                              isSelectedPos && selectedSubCategory === catName;

                                            return (
                                              <button
                                                key={catName}
                                                type="button"
                                                onClick={() => {
                                                  setSelectedPosition(pos.name);
                                                  setSelectedSubCategory(catName);
                                                  setSelectedSubmissionFilter(null);
                                                  setSelectedCategoryFilter(null);
                                                }}
                                                className={`w-full flex items-center justify-between px-2 py-1 rounded text-[10.5px] transition-colors cursor-pointer ${
                                                  isCatSelected
                                                    ? 'text-white font-bold shadow-xs'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                                style={
                                                  isCatSelected
                                                    ? { backgroundColor: themeColor }
                                                    : undefined
                                                }
                                              >
                                                <span className="truncate">{catName}</span>
                                                <span className="font-mono tabular-nums opacity-80 text-[10px]">
                                                  {catCount}
                                                </span>
                                              </button>
                                            );
                                          })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* MODE 2: CATEGORIES */}
              {sidebarBrowseMode === 'categories' && (
                <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPosition('ALL');
                      setSelectedSubCategory('ALL');
                      setSelectedSubmissionFilter(null);
                      setSelectedCategoryFilter(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      !selectedCategoryFilter && selectedPosition === 'ALL' && !selectedSubmissionFilter
                        ? 'text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    style={
                      !selectedCategoryFilter && selectedPosition === 'ALL' && !selectedSubmissionFilter
                        ? { backgroundColor: themeColor }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 opacity-70" />
                      <span>{language === 'ko' ? '전체 기술 성격' : 'All Categories'}</span>
                    </div>
                    <span className="font-mono tabular-nums text-[11px] opacity-90">
                      {videos.length}
                    </span>
                  </button>

                  {STANDARD_CATEGORY_GROUPS.map((grp) => {
                    const isGrpExpanded = !!expandedCatGroups[grp.id];
                    const grpTotal = folderCounts.categoryGroupCounts[grp.id] || 0;
                    const isGrpSelected =
                      selectedCategoryFilter?.groupId === grp.id && !selectedCategoryFilter?.detail;

                    return (
                      <div
                        key={grp.id}
                        className="border border-slate-200 rounded-xl p-2.5 space-y-1.5 bg-slate-50/40"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPosition('ALL');
                              setSelectedSubCategory('ALL');
                              setSelectedSubmissionFilter(null);
                              setSelectedCategoryFilter({ groupId: grp.id });
                              setExpandedCatGroups((prev) => ({
                                ...prev,
                                [grp.id]: isGrpSelected ? !prev[grp.id] : true,
                              }));
                            }}
                            className={`flex items-center gap-2 flex-1 min-w-0 text-xs font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer text-left ${
                              isGrpSelected
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <Folder className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate">{grp.name}</span>
                            <span className="text-[10px] font-mono opacity-70">
                              ({grp.badge})
                            </span>
                          </button>

                          <div className="flex items-center gap-1">
                            <span className="font-mono tabular-nums text-[11px] font-bold text-slate-500 px-1">
                              {grpTotal}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleCatGroupExpand(grp.id)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-400 cursor-pointer"
                            >
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${
                                  isGrpExpanded ? '' : '-rotate-90'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {isGrpExpanded && (
                          <div className="flex flex-wrap gap-1 pt-1 pl-2 border-l border-indigo-100 ml-2">
                            {grp.items
                              .filter((it) => metadata.categories.includes(it))
                              .map((catName) => {
                                const cnt = folderCounts.categoryCounts[catName] || 0;
                                const isDetSelected =
                                  selectedCategoryFilter?.groupId === grp.id &&
                                  selectedCategoryFilter?.detail === catName;

                                return (
                                  <button
                                    key={catName}
                                    type="button"
                                    onClick={() => {
                                      setSelectedPosition('ALL');
                                      setSelectedSubCategory('ALL');
                                      setSelectedSubmissionFilter(null);
                                      setSelectedCategoryFilter({
                                        groupId: grp.id,
                                        detail: catName,
                                      });
                                    }}
                                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer text-left ${
                                      isDetSelected
                                        ? 'bg-indigo-600 text-white font-semibold'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    {catName}{' '}
                                    <span className="font-mono tabular-nums opacity-75">
                                      ({cnt})
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MODE 3: SUBMISSIONS */}
              {sidebarBrowseMode === 'submissions' && (
                <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPosition('ALL');
                      setSelectedSubCategory('ALL');
                      setSelectedSubmissionFilter(null);
                      setSelectedCategoryFilter(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      !selectedSubmissionFilter && selectedPosition === 'ALL' && !selectedCategoryFilter
                        ? 'text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    style={
                      !selectedSubmissionFilter && selectedPosition === 'ALL' && !selectedCategoryFilter
                        ? { backgroundColor: themeColor }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Crosshair className="w-3.5 h-3.5 opacity-70" />
                      <span>{language === 'ko' ? '전체 서브미션' : 'All Submissions'}</span>
                    </div>
                    <span className="font-mono tabular-nums text-[11px] opacity-90">
                      {videos.filter((v) => v.submissionGroup && v.submissionGroup !== 'none').length}
                    </span>
                  </button>

                  {metadata.submissions.map((group) => {
                    const grpCount = folderCounts.subGroupCounts[group.id] || 0;
                    const isGrpSelected =
                      selectedSubmissionFilter?.group === group.id &&
                      !selectedSubmissionFilter?.detail;
                    const isSubGrpExpanded = !!expandedSubGroups[group.id];

                    return (
                      <div
                        key={group.id}
                        className="border border-slate-200 rounded-xl p-2.5 space-y-1.5 bg-slate-50/40"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPosition('ALL');
                              setSelectedSubCategory('ALL');
                              setSelectedCategoryFilter(null);
                              setSelectedSubmissionFilter({ group: group.id });
                            }}
                            className={`flex items-center gap-2 flex-1 min-w-0 text-xs font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer text-left ${
                              isGrpSelected
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <Folder className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{group.name}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <span className="font-mono tabular-nums text-[11px] font-bold text-slate-500 px-1">
                              {grpCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleSubGroupExpand(group.id)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-400 cursor-pointer"
                            >
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${
                                  isSubGrpExpanded ? '' : '-rotate-90'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {isSubGrpExpanded && (
                          <div className="flex flex-wrap gap-1 pt-1 pl-2 border-l border-rose-100 ml-2">
                            {group.items.map((subItem) => {
                              const cnt = folderCounts.subDetailCounts[subItem] || 0;
                              const isDetSelected =
                                selectedSubmissionFilter?.group === group.id &&
                                selectedSubmissionFilter?.detail === subItem;

                              return (
                                <button
                                  key={subItem}
                                  type="button"
                                  onClick={() => {
                                    setSelectedPosition('ALL');
                                    setSelectedSubCategory('ALL');
                                    setSelectedCategoryFilter(null);
                                    setSelectedSubmissionFilter({
                                      group: group.id,
                                      detail: subItem,
                                    });
                                  }}
                                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer text-left ${
                                    isDetSelected
                                      ? 'bg-rose-600 text-white font-semibold'
                                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {subItem}{' '}
                                  <span className="font-mono tabular-nums opacity-75">
                                    ({cnt})
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT MAIN SECTION: Video Cards Grid */}
          <section className="col-span-9 xl:col-span-9 flex flex-col min-h-0 overflow-hidden space-y-3">
            {/* Scrollable Videos Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
              {filteredVideos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-800">
                    {language === 'ko' ? '조건에 해당하는 기술 영상이 없습니다' : 'No technique videos match the conditions'}
                  </div>
                </div>
              ) : viewLayoutMode === 'fileList' ? (
                /* File List View Layout */
                <div className="space-y-2.5">
                  {filteredVideos.map((video) => {
                    const isAssigned = assignedVideoIds.has(video.id);
                    const lastPracticed =
                      video.practiceDates.length > 0
                        ? [...video.practiceDates].sort().slice(-1)[0]
                        : undefined;

                    return (
                      <article
                        key={video.id}
                        onClick={() => onToggleDateAssignment(video.id, targetDate)}
                        className={`group bg-white rounded-2xl border p-3 sm:p-4 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs hover:shadow-xs ${
                          isAssigned
                            ? 'border-emerald-500 ring-2 ring-emerald-500/80 bg-emerald-50/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                          <div className="relative w-28 sm:w-36 aspect-video bg-slate-900 rounded-xl overflow-hidden shrink-0 shadow-2xs">
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={language === 'en' ? (video.titleEn || video.titleKo) : video.titleKo}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/50">
                                <Folder className="w-6 h-6" />
                              </div>
                            )}
                            {isAssigned && (
                              <span
                                className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-white text-[9px] font-black shadow-xs flex items-center gap-0.5"
                                style={{ backgroundColor: themeColor }}
                              >
                                <Check className="w-3 h-3" /> {language === 'ko' ? '배정됨' : 'Assigned'}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {video.position}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700">
                                {video.category}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                                {video.giType}
                              </span>
                              {video.submissionGroup !== 'none' && (
                                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold">
                                  {language === 'ko' ? `피니시: ${video.submissionDetail}` : `Finish: ${video.submissionDetail}`}
                                </span>
                              )}
                            </div>

                            <div>
                              <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                                {language === 'en' ? (video.titleEn || video.titleKo) : video.titleKo}
                              </h3>
                              <p className="text-xs text-slate-400 line-clamp-1 font-mono">
                                {video.titleEn}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5 font-mono tabular-nums">
                              <span>{language === 'ko' ? `수련 ${video.practiceDates.length}회` : `Practiced ${video.practiceDates.length}x`}</span>
                              {lastPracticed && (
                                <span>{language === 'ko' ? `최근 수련: ${formatDateKorean(lastPracticed)}` : `Recent: ${lastPracticed}`}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Assignment Action Button */}
                        <div className="shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleDateAssignment(video.id, targetDate);
                            }}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-3xs ${
                              isAssigned
                                ? 'text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                            style={isAssigned ? { backgroundColor: themeColor } : undefined}
                          >
                            {isAssigned ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>{language === 'ko' ? '✓ 배정됨' : '✓ Assigned'}</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>{language === 'ko' ? '+ 일지에 배정' : '+ Assign to Journal'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                /* Card Grid View (3 Columns on Desktop matching attached image) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-4">
                  {filteredVideos.map((video) => {
                    const isAssigned = assignedVideoIds.has(video.id);
                    const lastPracticed =
                      video.practiceDates.length > 0
                        ? [...video.practiceDates].sort().slice(-1)[0]
                        : undefined;

                    return (
                      <article
                        key={video.id}
                        onClick={() => onToggleDateAssignment(video.id, targetDate)}
                        className={`group bg-white rounded-2xl border overflow-hidden transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                          isAssigned
                            ? 'border-emerald-500 ring-2 ring-emerald-500/80 bg-emerald-50/15'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          {/* Video Thumbnail with Badges */}
                          <div className="relative w-full aspect-video bg-slate-900 overflow-hidden">
                            {video.thumbnailUrl && (
                              <img
                                src={video.thumbnailUrl}
                                alt={language === 'en' ? (video.titleEn || video.titleKo) : video.titleKo}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            )}

                            {/* Top-Left Tag Badges (Matching image) */}
                            <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[70%]">
                              <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs">
                                {video.position}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-sky-500/80 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs">
                                {video.category}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/80 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs">
                                {video.giType}
                              </span>
                            </div>

                            {/* Top-Right Assigned Status Pill */}
                            {isAssigned && (
                              <div
                                className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-[11px] font-black shadow-md animate-in zoom-in-95 duration-150"
                                style={{ backgroundColor: themeColor }}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{language === 'ko' ? '배정됨' : 'Assigned'}</span>
                              </div>
                            )}
                          </div>

                          {/* Card Content */}
                          <div className="p-3 space-y-2">
                            <div>
                              <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 leading-snug">
                                {language === 'en' ? (video.titleEn || video.titleKo) : video.titleKo}
                              </h3>
                              <p className="text-xs text-slate-400 font-mono line-clamp-1 mt-0.5">
                                {video.titleEn}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums pt-1 border-t border-slate-100">
                              <span>{language === 'ko' ? `수련 ${video.practiceDates.length}회` : `Practiced ${video.practiceDates.length}x`}</span>
                              {lastPracticed && (
                                <span>{language === 'ko' ? `최근: ${formatDateKorean(lastPracticed)}` : `Recent: ${lastPracticed}`}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Assignment Quick Button & Proficiency/Favorite */}
                        <div className="p-3 pt-0 space-y-2">
                          <div
                            className="flex items-center justify-between pt-1 border-t border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ProficiencyRater
                              score={video.proficiencyScore}
                              onChange={(newScore) => {
                                if (onUpdateVideo) {
                                  onUpdateVideo({
                                    ...video,
                                    proficiencyScore: newScore,
                                    updatedAt: new Date().toISOString(),
                                  });
                                }
                              }}
                              compact={true}
                            />

                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateVideo) {
                                  onUpdateVideo({
                                    ...video,
                                    isFavorite: !video.isFavorite,
                                    updatedAt: new Date().toISOString(),
                                  });
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  video.isFavorite
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleDateAssignment(video.id, targetDate);
                            }}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs flex items-center justify-center gap-1.5 ${
                              isAssigned
                                ? 'text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                            style={isAssigned ? { backgroundColor: themeColor } : undefined}
                          >
                            {isAssigned ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>{language === 'ko' ? '✓ 배정됨 (해제하려면 클릭)' : '✓ Assigned (click to unassign)'}</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                <span>+ {targetDate} {language === 'ko' ? '일지에 배정' : 'Assign to Journal'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
