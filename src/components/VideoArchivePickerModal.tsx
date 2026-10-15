import React, { useState, useMemo } from 'react';
import {
  Search,
  Check,
  ChevronLeft,
  X,
  Star,
  ArrowUpDown,
  Folder,
  FolderOpen,
  LayoutGrid,
  List,
  Play,
  Filter,
  Video,
  ChevronRight,
  ChevronDown,
  Sliders,
} from 'lucide-react';
import {
  MetadataConfig,
  TechniqueVideo,
  SubmissionGroupId,
} from '../types';
import { STANDARD_CATEGORY_GROUPS, isCategoryInGroup } from '../data/bjjTaxonomy';
import { useLanguage } from '../i18n/LanguageContext';

interface VideoArchivePickerModalProps {
  videos: TechniqueVideo[];
  metadata: MetadataConfig;
  primaryColor?: string;
  onSelectVideo: (video: TechniqueVideo) => void;
  onClose: () => void;
}

type SortOption =
  | 'newest_added'
  | 'alphabetical'
  | 'score_desc'
  | 'score_asc';

type ScoreFilterMode = 'all' | 'high' | 'low' | 'unrated';

export const VideoArchivePickerModal: React.FC<VideoArchivePickerModalProps> = ({
  videos,
  metadata,
  primaryColor = '#0284c7',
  onSelectVideo,
  onClose,
}) => {
  const { t, language } = useLanguage();
  // Sidebar navigation state (PC Desktop)
  const [sidebarBrowseMode, setSidebarBrowseMode] = useState<'positions' | 'categories' | 'submissions'>('positions');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedSubmissionFilter, setSelectedSubmissionFilter] = useState<{
    group?: SubmissionGroupId;
    detail?: string;
  } | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<{
    groupId?: string;
    detail?: string;
  } | null>(null);

  const [expandedCatGroups, setExpandedCatGroups] = useState<Record<string, boolean>>({
    'cat-grp-takedown': true,
    'cat-grp-pass': true,
    'cat-grp-sweep': true,
    'cat-grp-escape': true,
    'cat-grp-core': true,
  });

  const [expandedSubGroups, setExpandedSubGroups] = useState<Record<string, boolean>>({
    choke: true,
    armlock: true,
    leglock: true,
    compression: true,
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [giFilter, setGiFilter] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [scoreFilterMode, setScoreFilterMode] = useState<ScoreFilterMode>('all');
  const [favoriteOnly, setFavoriteOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest_added');
  const [viewLayoutMode, setViewLayoutMode] = useState<'grid' | 'fileList'>('grid');
  const [isMobileToolboxOpen, setIsMobileToolboxOpen] = useState<boolean>(false);

  // Filter Logic
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
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

      // 1. PC Sidebar Browse Filter
      if (sidebarBrowseMode === 'positions') {
        if (selectedPosition !== 'ALL' && !allPositions.has(selectedPosition)) {
          return false;
        }
      } else if (sidebarBrowseMode === 'categories') {
        if (selectedCategoryFilter) {
          if (selectedCategoryFilter.detail) {
            if (!allCategories.has(selectedCategoryFilter.detail)) return false;
          } else if (selectedCategoryFilter.groupId) {
            const group = STANDARD_CATEGORY_GROUPS.find((g) => g.id === selectedCategoryFilter.groupId);
            if (group && !Array.from(allCategories).some((c) => isCategoryInGroup(c, group))) return false;
          }
        }
      } else if (sidebarBrowseMode === 'submissions') {
        if (selectedSubmissionFilter) {
          if (selectedSubmissionFilter.group && v.submissionGroup !== selectedSubmissionFilter.group) {
            return false;
          }
          if (selectedSubmissionFilter.detail && v.submissionDetail !== selectedSubmissionFilter.detail) {
            return false;
          }
        }
      }

      // 2. Gi Filter
      if (giFilter !== 'ALL' && v.giType !== giFilter) {
        return false;
      }

      // 3. Difficulty Filter
      if (difficultyFilter !== 'ALL' && v.difficulty !== difficultyFilter) {
        return false;
      }

      // 4. Score Filter
      if (scoreFilterMode === 'high' && (v.proficiencyScore || 0) < 8) return false;
      if (scoreFilterMode === 'low' && ((v.proficiencyScore || 0) === 0 || (v.proficiencyScore || 0) > 4)) return false;
      if (scoreFilterMode === 'unrated' && (v.proficiencyScore || 0) > 0) return false;

      // 5. Favorite
      if (favoriteOnly && !v.isFavorite) return false;

      // 6. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.titleKo?.toLowerCase().includes(q) ||
          v.titleEn?.toLowerCase().includes(q) ||
          v.position?.toLowerCase().includes(q) ||
          v.category?.toLowerCase().includes(q) ||
          v.submissionDetail?.toLowerCase().includes(q) ||
          v.generalNotes?.toLowerCase().includes(q)
        );
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return (a.titleKo || '').localeCompare(b.titleKo || '');
      }
      if (sortBy === 'score_desc') {
        return (b.proficiencyScore || 0) - (a.proficiencyScore || 0);
      }
      if (sortBy === 'score_asc') {
        return (a.proficiencyScore || 0) - (b.proficiencyScore || 0);
      }
      // 'newest_added' default
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [
    videos,
    sidebarBrowseMode,
    selectedPosition,
    selectedCategoryFilter,
    selectedSubmissionFilter,
    giFilter,
    difficultyFilter,
    scoreFilterMode,
    favoriteOnly,
    searchQuery,
    sortBy,
  ]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-[1300px] h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden">
        {/* ================================================================ */}
        {/* TOP HEADER                                                       */}
        {/* ================================================================ */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  {language === 'ko' ? '영상 보관함에서 기술 선택' : 'Select Video from Archive'}
                </h2>
                <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                  {language === 'ko' ? `총 ${filteredVideos.length}개` : `${filteredVideos.length} videos`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {language === 'ko'
                  ? '학습 게시글에 첨부할 기술 영상을 선택하세요. 클릭하면 즉시 첨부됩니다.'
                  : 'Select a technique video to attach to your post. Click to attach.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title={language === 'ko' ? '닫기' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* PC DESKTOP TOP FILTER BAR (hidden on mobile, lg:block)           */}
        {/* ================================================================ */}
        <div className="hidden lg:block shrink-0 bg-slate-50 border-b border-slate-200 p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Gi Filter */}
              <div className="flex items-center gap-1 p-0.5 bg-white border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setGiFilter('ALL')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    giFilter === 'ALL'
                      ? 'text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  style={giFilter === 'ALL' ? { backgroundColor: primaryColor } : undefined}
                >
                  전체 도복
                </button>
                {['Gi', 'No-Gi'].map((gi) => (
                  <button
                    key={gi}
                    type="button"
                    onClick={() => setGiFilter(gi)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      giFilter === gi
                        ? 'text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    style={giFilter === gi ? { backgroundColor: primaryColor } : undefined}
                  >
                    {gi === 'Gi' ? '도복' : '노기'}
                  </button>
                ))}
              </div>

              {/* Score Filter */}
              <div className="flex items-center gap-1 p-0.5 bg-white border border-slate-200 rounded-xl text-xs">
                <span className="text-[11px] font-bold text-slate-400 pl-2 pr-1">숙련도:</span>
                <button
                  type="button"
                  onClick={() => setScoreFilterMode('all')}
                  className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    scoreFilterMode === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600'
                  }`}
                >
                  전체
                </button>
                <button
                  type="button"
                  onClick={() => setScoreFilterMode('high')}
                  className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    scoreFilterMode === 'high' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                  }`}
                >
                  높음 (8+)
                </button>
                <button
                  type="button"
                  onClick={() => setScoreFilterMode('low')}
                  className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    scoreFilterMode === 'low' ? 'bg-amber-600 text-white' : 'text-slate-600'
                  }`}
                >
                  낮음 (1~4)
                </button>
              </div>

              {/* Favorite */}
              <button
                type="button"
                onClick={() => setFavoriteOnly(!favoriteOnly)}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                  favoriteOnly
                    ? 'bg-amber-50 border-amber-300 text-amber-500'
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                }`}
                title="즐겨찾기 필터"
              >
                <Star className={`w-4 h-4 ${favoriteOnly ? 'fill-amber-400' : ''}`} />
              </button>
            </div>

            {/* Right: Search + Sorting + Layout Switcher */}
            <div className="flex items-center gap-2">
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="기술명, 포지션 검색..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewLayoutMode('grid')}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    viewLayoutMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="그리드 뷰"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayoutMode('fileList')}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    viewLayoutMode === 'fileList' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="리스트 뷰"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* MOBILE TOP BAR (lg:hidden)                                       */}
        {/* ================================================================ */}
        <div className="lg:hidden shrink-0 bg-slate-50 border-b border-slate-200 p-2.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="기술 검색..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMobileToolboxOpen(!isMobileToolboxOpen)}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                isMobileToolboxOpen
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-slate-300 text-slate-600'
              }`}
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Position Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedPosition('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 cursor-pointer ${
                selectedPosition === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              전체 ({videos.length})
            </button>
            {metadata.positions.map((pos) => {
              const count = videos.filter((v) => v.position === pos.name).length;
              return (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setSelectedPosition(pos.name)}
                  className={`px-2.5 py-1 rounded-lg font-medium shrink-0 cursor-pointer whitespace-nowrap ${
                    selectedPosition === pos.name
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {pos.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Mobile Overlay Options */}
          {isMobileToolboxOpen && (
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2 animate-in slide-in-from-top-1 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-bold mr-1">도복:</span>
                {['ALL', 'Gi', 'No-Gi'].map((gi) => (
                  <button
                    key={gi}
                    type="button"
                    onClick={() => setGiFilter(gi)}
                    className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${
                      giFilter === gi ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {gi === 'ALL' ? '전체' : gi === 'Gi' ? '도복' : '노기'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* MAIN BODY: SIDEBAR + CONTENT (PC) / PURE LIST (MOBILE)          */}
        {/* ================================================================ */}
        <div className="flex-1 flex overflow-hidden">
          {/* PC DESKTOP LEFT SIDEBAR (hidden on mobile, lg:flex) */}
          <div className="hidden lg:flex w-64 border-r border-slate-200 flex-col bg-slate-50/70 shrink-0 overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="p-2.5 border-b border-slate-200 grid grid-cols-3 gap-1 bg-white">
              <button
                type="button"
                onClick={() => setSidebarBrowseMode('positions')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center ${
                  sidebarBrowseMode === 'positions'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                포지션
              </button>
              <button
                type="button"
                onClick={() => setSidebarBrowseMode('categories')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center ${
                  sidebarBrowseMode === 'categories'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                기술성격
              </button>
              <button
                type="button"
                onClick={() => setSidebarBrowseMode('submissions')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center ${
                  sidebarBrowseMode === 'submissions'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                서브미션
              </button>
            </div>

            {/* Sidebar Folder Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
              {sidebarBrowseMode === 'positions' && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedPosition('ALL')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      selectedPosition === 'ALL'
                        ? 'bg-sky-50 text-sky-800 border border-sky-200'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 text-sky-600" />
                      <span>전체 포지션</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{videos.length}</span>
                  </button>

                  {metadata.positions.map((pos) => {
                    const count = videos.filter((v) => v.position === pos.name).length;
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setSelectedPosition(pos.name)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                          selectedPosition === pos.name
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-700 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder className={`w-3.5 h-3.5 shrink-0 ${selectedPosition === pos.name ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{pos.name}</span>
                        </div>
                        <span className={`text-[11px] font-mono shrink-0 ${selectedPosition === pos.name ? 'text-white/90' : 'text-slate-400'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}

              {sidebarBrowseMode === 'categories' && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter(null)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      !selectedCategoryFilter
                        ? 'bg-sky-50 text-sky-800 border border-sky-200'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 text-sky-600" />
                      <span>전체 기술 성격</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{videos.length}</span>
                  </button>

                  {STANDARD_CATEGORY_GROUPS.map((grp) => (
                    <div key={grp.id} className="space-y-0.5 pt-1">
                      <div className="flex items-center justify-between px-2 py-1 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                        <span>{grp.name}</span>
                      </div>
                      {grp.items.map((catName) => {
                        const count = videos.filter((v) => v.category === catName).length;
                        const isSelected = selectedCategoryFilter?.detail === catName;
                        return (
                          <button
                            key={catName}
                            type="button"
                            onClick={() => setSelectedCategoryFilter({ detail: catName })}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer pl-4 ${
                              isSelected
                                ? 'bg-sky-600 text-white font-bold'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{catName}</span>
                            <span className={`text-[10px] font-mono ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}

              {sidebarBrowseMode === 'submissions' && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedSubmissionFilter(null)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      !selectedSubmissionFilter
                        ? 'bg-sky-50 text-sky-800 border border-sky-200'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 text-sky-600" />
                      <span>전체 서브미션</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{videos.length}</span>
                  </button>

                  {(['choke', 'armlock', 'leglock', 'compression'] as SubmissionGroupId[]).map((grpId) => {
                    const groupName =
                      grpId === 'choke' ? '초크 계열' : grpId === 'armlock' ? '암락 계열' : grpId === 'leglock' ? '레그락 계열' : '압박/기타';
                    const count = videos.filter((v) => v.submissionGroup === grpId).length;
                    const isSelected = selectedSubmissionFilter?.group === grpId && !selectedSubmissionFilter.detail;
                    return (
                      <button
                        key={grpId}
                        type="button"
                        onClick={() => setSelectedSubmissionFilter({ group: grpId })}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                          isSelected ? 'bg-sky-600 text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{groupName}</span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* ================================================================ */}
          {/* MAIN VIDEO LIST / GRID AREA                                      */}
          {/* ================================================================ */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar bg-white">
            {filteredVideos.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <Video className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold">조건에 일치하는 기술 영상이 없습니다.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPosition('ALL');
                    setSelectedCategoryFilter(null);
                    setSelectedSubmissionFilter(null);
                    setSearchQuery('');
                    setGiFilter('ALL');
                    setScoreFilterMode('all');
                    setFavoriteOnly(false);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  필터 초기화
                </button>
              </div>
            ) : viewLayoutMode === 'grid' ? (
              /* GRID VIEW (PC & Mobile Responsive) */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => {
                      onSelectVideo(video);
                      onClose();
                    }}
                    className="group rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col bg-white"
                  >
                    {/* 16:9 Thumbnail */}
                    <div className="relative aspect-video bg-black overflow-hidden">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Video className="w-8 h-8" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold backdrop-blur-xs">
                          {video.position || '미분류'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-sky-600/90 text-white text-[10px] font-bold">
                          {video.giType || 'Gi'}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold truncate">
                          {video.category} • {video.difficulty || '초급'}
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 mt-0.5 leading-snug">
                          {video.titleKo || video.titleEn}
                        </h3>
                        {video.titleEn && video.titleKo && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                            {video.titleEn}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="text-[10px] font-bold text-emerald-600">
                          숙련도: {video.proficiencyScore || 0}/10
                        </div>
                        <button
                          type="button"
                          className="px-2.5 py-1 bg-sky-600 group-hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                        >
                          선택
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* FILE LIST VIEW (PC & Mobile Table) */
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => {
                      onSelectVideo(video);
                      onClose();
                    }}
                    className="p-2.5 sm:p-3 hover:bg-sky-50/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-9 sm:w-16 sm:h-10 rounded-lg overflow-hidden bg-black shrink-0 relative border border-slate-200">
                        {video.thumbnailUrl ? (
                          <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white">
                            <Video className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded text-[10px] font-bold">
                            {video.position}
                          </span>
                          <span className="text-[10px] text-slate-400">{video.category}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {video.giType || 'Gi'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                          {video.titleKo || video.titleEn}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 bg-sky-600 group-hover:bg-sky-500 text-white text-xs font-bold rounded-xl shrink-0 transition-colors shadow-2xs"
                    >
                      선택
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
