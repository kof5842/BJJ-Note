import React, { useState, useMemo, useCallback } from 'react';
import {
  Folder,
  FolderOpen,
  Settings,
  Search,
  Star,
  Plus,
  Play,
  ChevronRight,
  ChevronDown,
  CalendarPlus,
  Edit3,
  Trash2,
  GripHorizontal,
  ArrowUpDown,
  Filter,
  Check,
  LayoutGrid,
  List,
  Video,
  Eye,
  EyeOff,
  Sliders,
  X,
  Tag,
  Shield,
  Crown,
  Zap,
  Flame,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import {
  AppSettings,
  MetadataConfig,
  SubmissionGroupId,
  TechniqueVideo,
} from '../types';
import { formatDateKorean, isInstagramUrl, extractTechniqueTagsFromMemo } from '../utils/bjjAnalyzer';
import { ProficiencyRater } from './ProficiencyRater';
import { STANDARD_CATEGORY_GROUPS, isCategoryInGroup } from '../data/bjjTaxonomy';
import { useLanguage } from '../i18n/LanguageContext';
import { translatePosition, translateCategory, translateCategoryGroup, translateSubmissionGroup, translateSubmissionDetail, translateGiType, translateDifficulty } from '../utils/taxonomyTranslation';

interface Module2VideoFolderProps {
  videos: TechniqueVideo[];
  metadata: MetadataConfig;
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onUpdateVideo: (updated: TechniqueVideo) => void;
  onDeleteVideo: (videoId: string) => void;
  onOpenModal: (
    video: TechniqueVideo,
    mode: 'view' | 'edit',
    initialSeekSeconds?: number
  ) => void;
  onOpenMetadataManager: (
    tab?: 'positions' | 'categories' | 'submissions' | 'gi_diff'
  ) => void;
  onQuickAssignDate: (videoId: string, dateStr: string) => void;
}

type SortOption =
  | 'recent_practiced'
  | 'oldest_practiced'
  | 'newest_added'
  | 'alphabetical'
  | 'score_desc'
  | 'score_asc';

type ScoreFilterMode = 'all' | 'high' | 'low' | 'unrated';

export const Module2VideoFolder: React.FC<Module2VideoFolderProps> = ({
  videos,
  metadata,
  settings,
  onUpdateSettings,
  onUpdateVideo,
  onDeleteVideo,
  onOpenModal,
  onOpenMetadataManager,
  onQuickAssignDate,
}) => {
  const { t, language } = useLanguage();
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] =
    useState<string>('ALL');
  const [selectedSubmissionFilter, setSelectedSubmissionFilter] = useState<{
    group?: SubmissionGroupId;
    detail?: string;
  } | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<{
    groupId?: string;
    detail?: string;
  } | null>(null);

  const [sidebarBrowseMode, setSidebarBrowseMode] = useState<
    'positions' | 'categories' | 'submissions'
  >('positions');
  const [folderGridTab, setFolderGridTab] = useState<
    'positions' | 'categories' | 'submissions'
  >('positions');

  const [expandedPositions, setExpandedPositions] = useState<
    Record<string, boolean>
  >({});
  const [expandedCatGroups, setExpandedCatGroups] = useState<Record<string, boolean>>({
    'cat-grp-takedown': true,
    'cat-grp-pass': true,
    'cat-grp-sweep': true,
    'cat-grp-escape': true,
    'cat-grp-core': true,
  });
  const [expandedSubGroups, setExpandedSubGroups] = useState<Record<string, boolean>>({});
  const [expandedPosCatFolders, setExpandedPosCatFolders] = useState<
    Record<string, boolean>
  >({});
  const [isSubmissionTreeOpen, setIsSubmissionTreeOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [giFilter, setGiFilter] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [scoreFilterMode, setScoreFilterMode] =
    useState<ScoreFilterMode>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest_added');
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);
  const [viewLayoutMode, setViewLayoutMode] = useState<'fileList' | 'grid'>('grid');
  const [activeRatingVideoId, setActiveRatingVideoId] = useState<string | null>(null);

  const [draggedVideoId, setDraggedVideoId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [dropFeedback, setDropFeedback] = useState<string | null>(null);
  const [posGroupFilter, setPosGroupFilter] = useState<'ALL' | '스탠딩' | '기타' | '선점' | '가드'>('ALL');
  
  // Persistent Empty Folder Hiding (User Request: 저장되어서 다음번에 볼 때도 기억)
  const [hideEmptyPositions, setHideEmptyPositions] = useState<boolean>(
    () => settings.hideEmptyFolders ?? false
  );
  const [isMobileFolderDrawerOpen, setIsMobileFolderDrawerOpen] = useState(false);
  const themeColor = settings.primaryColor || '#0ea5e9';

  const isInsideFolder =
    selectedPosition !== 'ALL' ||
    selectedSubmissionFilter !== null ||
    selectedCategoryFilter !== null;
  const isSearching = searchQuery.trim().length > 0;

  React.useEffect(() => {
    if (settings.hideEmptyFolders !== undefined) {
      setHideEmptyPositions(settings.hideEmptyFolders);
    }
  }, [settings.hideEmptyFolders]);

  const handleToggleHideEmptyPositions = () => {
    const nextVal = !hideEmptyPositions;
    setHideEmptyPositions(nextVal);
    onUpdateSettings({ hideEmptyFolders: nextVal });
  };

  const [assigningVideoId, setAssigningVideoId] = useState<string | null>(null);
  const [assignDateInput, setAssignDateInput] = useState<string>('2026-10-02');

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

      const allSubmissions = new Set<string>();
      if (v.submissionDetail && v.submissionDetail !== '미분류') {
        allSubmissions.add(v.submissionDetail);
      }

      // Also extract any hashtag or techniqueTag from journalMemos so video is categorized in all tagged folders
      (v.journalMemos || []).forEach((m) => {
        const memoTags = extractTechniqueTagsFromMemo(m, metadata);
        memoTags.forEach((tag) => {
          allPositions.add(tag);
          allCategories.add(tag);
          allSubmissions.add(tag);
        });
      });

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

      for (const sub of allSubmissions) {
        subDetailCounts[sub] = (subDetailCounts[sub] || 0) + 1;
        const grp = metadata.submissions.find((g) => g.items.includes(sub));
        if (grp) {
          subGroupCounts[grp.id] = (subGroupCounts[grp.id] || 0) + 1;
        } else if (v.submissionGroup && v.submissionGroup !== 'none') {
          subGroupCounts[v.submissionGroup] = (subGroupCounts[v.submissionGroup] || 0) + 1;
        }
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

  const hasActiveMobileFilters = useMemo(() => {
    return (
      giFilter !== 'ALL' ||
      difficultyFilter !== 'ALL' ||
      favoriteOnly ||
      scoreFilterMode !== 'all' ||
      searchQuery.trim().length > 0
    );
  }, [giFilter, difficultyFilter, favoriteOnly, scoreFilterMode, searchQuery]);

  const mobileFilteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return videos.filter((v) => {
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
          v.proficiencyScore < settings.highScoreThreshold
        ) {
          return false;
        }
      } else if (scoreFilterMode === 'low') {
        if (
          v.proficiencyScore === 0 ||
          v.proficiencyScore > settings.lowScoreThreshold
        ) {
          return false;
        }
      } else if (scoreFilterMode === 'unrated') {
        if (v.proficiencyScore > 0) {
          return false;
        }
      }

      if (q) {
        const hay =
          `${v.titleKo} ${v.titleEn} ${v.position} ${v.category} ${v.submissionDetail} ${v.generalNotes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [
    videos,
    giFilter,
    difficultyFilter,
    favoriteOnly,
    scoreFilterMode,
    searchQuery,
    settings.highScoreThreshold,
    settings.lowScoreThreshold,
  ]);

  const mobileFolderCounts = useMemo(() => {
    const posCounts: Record<string, number> = {};
    for (const v of mobileFilteredVideos) {
      const allPos = new Set<string>();
      if (v.positions && v.positions.length > 0) {
        v.positions.forEach((p) => { if (p) allPos.add(p); });
      } else if (v.position) {
        allPos.add(v.position);
      }
      if (v.endPositions && v.endPositions.length > 0) {
        v.endPositions.forEach((p) => { if (p) allPos.add(p); });
      } else if (v.endPosition) {
        allPos.add(v.endPosition);
      }
      allPos.forEach((pos) => {
        posCounts[pos] = (posCounts[pos] || 0) + 1;
      });
    }
    return posCounts;
  }, [mobileFilteredVideos]);

  const mobileVisiblePositions = useMemo(() => {
    return metadata.positions.filter((pos) => {
      const count = mobileFolderCounts[pos.name] || 0;
      if (hasActiveMobileFilters && count === 0) {
        return false;
      }
      if (hideEmptyPositions && count === 0) {
        return false;
      }
      return true;
    });
  }, [metadata.positions, hideEmptyPositions, mobileFolderCounts, hasActiveMobileFilters]);

  const visiblePositions = useMemo(() => {
    return metadata.positions.filter((pos) => {
      if (hideEmptyPositions && (folderCounts.posCounts[pos.name] || 0) === 0) {
        return false;
      }
      return true;
    });
  }, [metadata.positions, hideEmptyPositions, folderCounts.posCounts]);

  // Active target folder/technique name for timeline seeking
  const activeFolderName = useMemo(() => {
    if (selectedSubCategory && selectedSubCategory !== 'ALL') {
      return selectedSubCategory;
    }
    if (selectedCategoryFilter?.detail) {
      return selectedCategoryFilter.detail;
    }
    if (selectedSubmissionFilter?.detail) {
      return selectedSubmissionFilter.detail;
    }
    if (selectedPosition && selectedPosition !== 'ALL') {
      return selectedPosition;
    }
    return null;
  }, [selectedPosition, selectedSubCategory, selectedCategoryFilter, selectedSubmissionFilter]);

  // Helper to find matching timeline memo for a video in the current folder context
  const getMatchingMemo = useCallback(
    (video: TechniqueVideo) => {
      if (!video.journalMemos || video.journalMemos.length === 0) return null;

      if (activeFolderName) {
        const cleanTarget = activeFolderName.toLowerCase().trim();
        const targetNoSpace = cleanTarget.replace(/\s+/g, '');

        // 1. Exact or space-insensitive match in extracted tags
        const matchByExtract = video.journalMemos.find((m) => {
          const tags = extractTechniqueTagsFromMemo(m, metadata);
          return tags.some((t) => {
            const tClean = t.toLowerCase().trim();
            const tNoSpace = tClean.replace(/\s+/g, '');
            return (
              tClean === cleanTarget ||
              tNoSpace === targetNoSpace ||
              tClean.includes(cleanTarget) ||
              cleanTarget.includes(tClean)
            );
          });
        });
        if (matchByExtract) return matchByExtract;

        // 2. Content contains target text or space-insensitive match
        const contentContainsTarget = video.journalMemos.find((m) => {
          const c = (m.content || '').toLowerCase();
          const cNoSpace = c.replace(/\s+/g, '');
          return c.includes(cleanTarget) || cNoSpace.includes(targetNoSpace);
        });
        if (contentContainsTarget) return contentContainsTarget;
      }

      // 3. Fallback: Any memo with hashtag or techniqueTag
      const anyTagged = video.journalMemos.find((m) => {
        const tags = extractTechniqueTagsFromMemo(m, metadata);
        return tags.length > 0;
      });
      return anyTagged || null;
    },
    [activeFolderName, metadata]
  );

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = videos.filter((v) => {
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

      const allSubmissions = new Set<string>();
      if (v.submissionDetail && v.submissionDetail !== '미분류') {
        allSubmissions.add(v.submissionDetail);
      }

      // Also extract any hashtag or techniqueTag from journalMemos so video is categorized
      (v.journalMemos || []).forEach((m) => {
        const memoTags = extractTechniqueTagsFromMemo(m, metadata);
        memoTags.forEach((tag) => {
          allPositions.add(tag);
          allCategories.add(tag);
          allSubmissions.add(tag);
        });
      });

      if (selectedSubmissionFilter) {
        if (selectedSubmissionFilter.detail) {
          const targetDetail = selectedSubmissionFilter.detail.toLowerCase().trim();
          const hasDetail =
            allSubmissions.has(selectedSubmissionFilter.detail) ||
            v.submissionDetail === selectedSubmissionFilter.detail ||
            Array.from(allSubmissions).some(
              (s) =>
                s.toLowerCase().trim() === targetDetail ||
                s.toLowerCase().trim().includes(targetDetail) ||
                targetDetail.includes(s.toLowerCase().trim())
            );
          if (!hasDetail) return false;
        } else if (selectedSubmissionFilter.group) {
          const grp = metadata.submissions.find((g) => g.id === selectedSubmissionFilter.group);
          if (grp) {
            const hasAnyInGrp =
              v.submissionGroup === selectedSubmissionFilter.group ||
              Array.from(allSubmissions).some((s) => grp.items.includes(s));
            if (!hasAnyInGrp) return false;
          } else if (v.submissionGroup !== selectedSubmissionFilter.group) {
            return false;
          }
        }
      } else if (selectedCategoryFilter) {
        if (selectedCategoryFilter.detail) {
          if (!allCategories.has(selectedCategoryFilter.detail)) return false;
        } else if (selectedCategoryFilter.groupId) {
          const catGrp = STANDARD_CATEGORY_GROUPS.find((g) => g.id === selectedCategoryFilter.groupId);
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
          v.proficiencyScore < settings.highScoreThreshold
        ) {
          return false;
        }
      } else if (scoreFilterMode === 'low') {
        if (
          v.proficiencyScore === 0 ||
          v.proficiencyScore > settings.lowScoreThreshold
        ) {
          return false;
        }
      } else if (scoreFilterMode === 'unrated') {
        if (v.proficiencyScore > 0) {
          return false;
        }
      }

      if (q) {
        const hay =
          `${v.titleKo} ${v.titleEn} ${v.position} ${v.category} ${v.submissionDetail} ${v.generalNotes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      const aLastDate =
        a.practiceDates.length > 0
          ? [...a.practiceDates].sort().slice(-1)[0]
          : '';
      const bLastDate =
        b.practiceDates.length > 0
          ? [...b.practiceDates].sort().slice(-1)[0]
          : '';

      if (sortBy === 'recent_practiced') {
        if (!aLastDate && bLastDate) return 1;
        if (aLastDate && !bLastDate) return -1;
        if (aLastDate !== bLastDate) {
          return bLastDate.localeCompare(aLastDate);
        }
        return b.practiceDates.length - a.practiceDates.length;
      }

      if (sortBy === 'oldest_practiced') {
        if (!aLastDate && bLastDate) return -1;
        if (aLastDate && !bLastDate) return 1;
        if (aLastDate !== bLastDate) {
          return aLastDate.localeCompare(bLastDate);
        }
        return a.practiceDates.length - b.practiceDates.length;
      }

      if (sortBy === 'newest_added') {
        return b.createdAt.localeCompare(a.createdAt);
      }

      if (sortBy === 'alphabetical') {
        return a.titleKo.localeCompare(b.titleKo, 'ko');
      }

      if (sortBy === 'score_desc') {
        return b.proficiencyScore - a.proficiencyScore;
      }

      if (sortBy === 'score_asc') {
        const aScore = a.proficiencyScore === 0 ? 99 : a.proficiencyScore;
        const bScore = b.proficiencyScore === 0 ? 99 : b.proficiencyScore;
        return aScore - bScore;
      }

      return 0;
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
    settings.highScoreThreshold,
    settings.lowScoreThreshold,
    searchQuery,
    sortBy,
  ]);

  const handleDropOnPosition = (
    targetPosition: string,
    targetCategory?: string
  ) => {
    if (!draggedVideoId) return;
    const targetVideo = videos.find((v) => v.id === draggedVideoId);
    if (!targetVideo) return;

    const updated: TechniqueVideo = {
      ...targetVideo,
      position: targetPosition,
      category: targetCategory || targetVideo.category,
      updatedAt: new Date().toISOString(),
    };
    onUpdateVideo(updated);
    setDraggedVideoId(null);
    setDragOverTarget(null);
    const targetTitle = language === 'en' ? (targetVideo.titleEn || targetVideo.titleKo) : targetVideo.titleKo;
    setDropFeedback(
      language === 'ko'
        ? `"${targetTitle}" 기술을 [${targetPosition}${targetCategory ? ` > ${targetCategory}` : ''}] 폴더로 이동했습니다.`
        : `Moved "${targetTitle}" to [${targetPosition}${targetCategory ? ` > ${targetCategory}` : ''}] folder.`
    );
    setTimeout(() => setDropFeedback(null), 3500);
  };

  const handleDropOnCategory = (catName: string) => {
    if (!draggedVideoId) return;
    const targetVideo = videos.find((v) => v.id === draggedVideoId);
    if (!targetVideo) return;

    const updated: TechniqueVideo = {
      ...targetVideo,
      category: catName,
      updatedAt: new Date().toISOString(),
    };
    onUpdateVideo(updated);
    setDraggedVideoId(null);
    setDragOverTarget(null);
    const targetTitle = language === 'en' ? (targetVideo.titleEn || targetVideo.titleKo) : targetVideo.titleKo;
    setDropFeedback(
      language === 'ko'
        ? `"${targetTitle}" 기술의 속성을 [${catName}] 폴더로 변경했습니다.`
        : `Changed attribute of "${targetTitle}" to [${catName}].`
    );
    setTimeout(() => setDropFeedback(null), 3500);
  };

  const handleDropOnSubmission = (
    group: SubmissionGroupId,
    detail: string
  ) => {
    if (!draggedVideoId) return;
    const targetVideo = videos.find((v) => v.id === draggedVideoId);
    if (!targetVideo) return;

    const updated: TechniqueVideo = {
      ...targetVideo,
      category: '서브미션',
      submissionGroup: group,
      submissionDetail: detail,
      updatedAt: new Date().toISOString(),
    };
    onUpdateVideo(updated);
    setDraggedVideoId(null);
    setDragOverTarget(null);
    const targetTitle = language === 'en' ? (targetVideo.titleEn || targetVideo.titleKo) : targetVideo.titleKo;
    setDropFeedback(
      language === 'ko'
        ? `"${targetTitle}" 기술의 피니시를 [${detail}]로 연결했습니다.`
        : `Linked finish of "${targetTitle}" to [${detail}].`
    );
    setTimeout(() => setDropFeedback(null), 3500);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* 1. Desktop-Only Top Filter Bar (Untouched for PC version) */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 lg:shadow-3xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
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

            {/* Inline Proficiency Score Filter */}
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

          {/* Right Area: Search Bar + View Mode Switcher + Favorite Star (Moved as requested) */}
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
                title={language === 'ko' ? "파일 리스트 뷰" : "List View"}
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
                title={language === 'ko' ? "카드 그리드 뷰" : "Grid View"}
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
              title={language === 'ko' ? "즐겨찾기 필터" : "Favorites Filter"}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto custom-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 pl-2 shrink-0">
              {language === 'ko' ? '난이도:' : 'Difficulty:'}
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
                  ? (language === 'ko' ? '하' : 'Beg')
                  : diff === '중급(중)'
                    ? (language === 'ko' ? '중' : 'Int')
                    : diff === '고급(상)'
                      ? (language === 'ko' ? '상' : 'Adv')
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
              <option value="recent_practiced">{language === 'ko' ? '최근 수련순' : 'Recently Practiced'}</option>
              <option value="oldest_practiced">{language === 'ko' ? '장기 미수련순' : 'Least Practiced'}</option>
              <option value="newest_added">{language === 'ko' ? '최신 등록순' : 'Newest'}</option>
              <option value="alphabetical">{language === 'ko' ? '가나다순 (기술명)' : 'Alphabetical'}</option>
              <option value="score_desc">{language === 'ko' ? '숙련도 높은순' : 'Highest Score'}</option>
              <option value="score_asc">{language === 'ko' ? '숙련도 낮은순' : 'Lowest Score'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Mobile-Only Top Search, Hide-Empty-Folders, View Mode & Sliders Row (With Absolute Floating Toolbox Overlay) */}
      <div className="lg:hidden relative">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-600 px-1">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ko' ? "기술 검색..." : "Search technique..."}
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

            {/* Hide Empty Folders Toggle Icon Button (Green rounded square with eye icon) */}
            <button
              type="button"
              onClick={handleToggleHideEmptyPositions}
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
                  ? '모든 포지션 표시 (빈 폴더 숨김 해제)'
                  : '영상이 없는 빈 포지션 폴더 숨기기'
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
            {/* View Layout Mode Switcher */}
            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setViewLayoutMode('fileList')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewLayoutMode === 'fileList'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title={language === 'ko' ? "파일 리스트 뷰" : "List View"}
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
                title={language === 'ko' ? "카드 그리드 뷰" : "Grid View"}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Sliders/Filter toggle button right next to it */}
            <button
              type="button"
              onClick={() => setIsToolboxOpen(!isToolboxOpen)}
              className={`flex items-center justify-center p-2 rounded-xl border transition-colors cursor-pointer ${
                isToolboxOpen
                  ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
              title={isToolboxOpen ? (language === 'ko' ? '도구함 닫기' : 'Close Tools') : (language === 'ko' ? '도구함 열기' : 'Open Tools')}
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Filter Toolbox Floating Overlay (Does NOT push folders down!) */}
        {isToolboxOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-white/98 backdrop-blur-md rounded-2xl border border-slate-200 p-3.5 space-y-2.5 shadow-xl animate-in slide-in-from-top-2 duration-150">
            {/* Gi Type Filter & Favorite / Close Action */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto custom-scrollbar">
                <span className="text-[11px] font-bold text-slate-400 pl-2 pr-1 shrink-0">
                  {language === 'ko' ? '도복:' : 'Gi Type:'}
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
                  title={language === 'ko' ? "즐겨찾기 기술만 보기" : "Favorites Only"}
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

            {/* Score Filter */}
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

            {/* Difficulty Filter & Smart Sorting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                <span className="text-[11px] font-bold text-slate-400 pl-2 shrink-0">
                  {language === 'ko' ? '난이도:' : 'Difficulty:'}
                </span>
                <button
                  type="button"
                  onClick={() => setDifficultyFilter('ALL')}
                  className={`px-2 py-0.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    difficultyFilter === 'ALL'
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  {language === 'ko' ? '전체' : 'All'}
                </button>
                {['초급(하)', '중급(중)', '고급(상)'].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-2 py-0.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      difficultyFilter === diff
                        ? 'text-white font-bold shadow-2xs'
                        : 'text-slate-600'
                    }`}
                    style={
                      difficultyFilter === diff
                        ? { backgroundColor: themeColor }
                        : undefined
                    }
                  >
                    {diff === '초급(하)' ? (language === 'ko' ? '하' : 'Beg') : diff === '중급(중)' ? (language === 'ko' ? '중' : 'Int') : (language === 'ko' ? '상' : 'Adv')}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 shrink-0">
                  {language === 'ko' ? '정렬:' : 'Sort:'}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent focus:outline-none text-xs font-bold text-slate-800 cursor-pointer w-full py-0.5"
                >
                  <option value="newest_added">{language === 'ko' ? '최신 등록순' : 'Newest'}</option>
                  <option value="recent_practiced">{language === 'ko' ? '최근 수련순' : 'Recently Practiced'}</option>
                  <option value="oldest_practiced">{language === 'ko' ? '장기 미수련순' : 'Least Practiced'}</option>
                  <option value="alphabetical">{language === 'ko' ? '가나다순 (기술명)' : 'Alphabetical'}</option>
                  <option value="score_desc">{language === 'ko' ? '숙련도 높은순' : 'Highest Score'}</option>
                  <option value="score_asc">{language === 'ko' ? '숙련도 낮은순' : 'Lowest Score'}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {dropFeedback && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 text-white text-xs font-semibold shadow-sm">
          <Check className="w-4 h-4" />
          <span>{dropFeedback}</span>
        </div>
      )}

      {/* 3. Mobile-Only FOLDER GRID SELECTION VIEW (Filters apply to folders on mobile!) */}
      {!isInsideFolder && (
        <div className="lg:hidden space-y-3.5 animate-in fade-in duration-200 px-0.5">
          <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-2xl space-y-3 shadow-3xs">
            {/* Header: 시작 포지션 폴더 선택 + 총 N개 + Active Filter indicator */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-slate-200/60">
              <h4 className="text-[11px] font-black text-slate-600 tracking-wider flex items-center gap-1.5 uppercase">
                <Folder className="w-3.5 h-3.5 text-indigo-500" />
                <span>{language === 'ko' ? '시작 포지션 폴더 선택' : 'Select Starting Position Folder'}</span>
              </h4>
              <div className="flex items-center gap-1.5">
                {hasActiveMobileFilters && (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-3xs">
                    {language === 'ko' ? `필터 적용 (${mobileFilteredVideos.length}개 영상)` : `Filtered (${mobileFilteredVideos.length} videos)`}
                  </span>
                )}
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  {language === 'ko' ? `총 ${mobileVisiblePositions.length}개` : `Total ${mobileVisiblePositions.length}`}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenMetadataManager('positions')}
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all cursor-pointer shadow-3xs flex items-center justify-center"
                  title={language === 'ko' ? "새 포지션 폴더 추가" : "Add Position Folder"}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Empty state when active filters match 0 folders */}
            {mobileVisiblePositions.length === 0 ? (
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
              /* Thin & Horizontally Long Folder List Cards (Red Box Button Selected) */
              <div className="space-y-2">
                {mobileVisiblePositions.map((pos) => {
                  const count = mobileFolderCounts[pos.name] || 0;
                  return (
                    <button
                      key={pos.name}
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
                          {language === 'en' ? (pos.nameEn || pos.name) : pos.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-sans font-bold tabular-nums text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 shadow-3xs">
                          {count}{language === 'ko' ? '개' : ''}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* 3-Column Folder Grid Cards (Blue Box Button Selected) */
              <div className="grid grid-cols-3 gap-3">
                {mobileVisiblePositions.map((pos) => {
                  const count = mobileFolderCounts[pos.name] || 0;
                  return (
                    <button
                      key={pos.name}
                      type="button"
                      onClick={() => {
                        setSelectedPosition(pos.name);
                        setSelectedSubCategory('ALL');
                        setSelectedSubmissionFilter(null);
                        setSelectedCategoryFilter(null);
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer group shadow-3xs hover:shadow-2xs relative min-h-[105px]"
                    >
                      {/* Count Badge at top-right */}
                      <span className="absolute top-1.5 right-1.5 font-sans font-bold tabular-nums text-[9px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200/60 shadow-3xs">
                        {count}
                      </span>

                      {/* Theme color Folder Icon SVG */}
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
                        {translatePosition(pos.name, language, metadata.positions)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Desktop 12-Column Grid + Mobile Inside-Folder Views */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Natural Scrolling Position Folder Sidebar (Visible only on PC) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4" style={{ color: themeColor }} />
                <span className="text-xs font-black text-slate-900">
                  {sidebarBrowseMode === 'positions'
                    ? (language === 'ko' ? '시작 포지션 폴더' : 'Starting Positions')
                    : sidebarBrowseMode === 'categories'
                      ? (language === 'ko' ? '기술 성격 폴더' : 'Technique Categories')
                      : (language === 'ko' ? '서브미션 피니시 폴더' : 'Submission Finishes')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onOpenMetadataManager(
                      sidebarBrowseMode === 'positions'
                        ? 'positions'
                        : sidebarBrowseMode === 'categories'
                          ? 'categories'
                          : 'submissions'
                    )
                  }
                  className="p-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer shadow-3xs flex items-center justify-center hover:scale-105 active:scale-95"
                  title={
                    sidebarBrowseMode === 'positions'
                      ? '새 포지션 폴더 추가'
                      : sidebarBrowseMode === 'categories'
                        ? '새 기술 성격 폴더 추가'
                        : '새 서브미션 폴더 추가'
                  }
                  aria-label="새 폴더 추가"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={handleToggleHideEmptyPositions}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    hideEmptyPositions
                      ? 'text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={hideEmptyPositions ? { backgroundColor: themeColor } : undefined}
                  title={hideEmptyPositions ? '모든 포지션 표시 (빈 폴더 숨김 해제)' : '영상이 없는 빈 포지션 폴더 숨기기'}
                >
                  {hideEmptyPositions ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[10px] font-semibold">
                    {hideEmptyPositions ? (language === 'ko' ? '빈폴더 숨김' : 'Hide Empty') : (language === 'ko' ? '빈폴더 숨기기' : 'Hide Empty')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onOpenMetadataManager(
                      sidebarBrowseMode === 'positions'
                        ? 'positions'
                        : sidebarBrowseMode === 'categories'
                          ? 'categories'
                          : 'submissions'
                    )
                  }
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                  style={{ ':hover': { color: themeColor } } as any}
                  title={language === 'ko' ? "분류 및 폴더 체계 관리 (⚙️)" : "Manage Taxonomy & Folders (⚙️)"}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3 Main Folder Classification Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
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
                {language === 'ko' ? '기술성격' : 'Categories'} ({STANDARD_CATEGORY_GROUPS.length})
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
                {language === 'ko' ? '서브미션' : 'Submissions'} ({metadata.submissions.length})
              </button>
            </div>

            {/* MODE 1: STARTING POSITIONS */}
            {sidebarBrowseMode === 'positions' && (
              <div className="space-y-3">
                {/* Group Filter Pills */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setPosGroupFilter('ALL')}
                    className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
                      posGroupFilter === 'ALL'
                        ? 'text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    style={posGroupFilter === 'ALL' ? { backgroundColor: themeColor } : undefined}
                  >
                    전체
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosGroupFilter('스탠딩')}
                    className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
                      posGroupFilter === '스탠딩'
                        ? 'bg-blue-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'ko' ? '스탠딩' : 'Standing'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosGroupFilter('기타')}
                    className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
                      posGroupFilter === '기타'
                        ? 'bg-indigo-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'ko' ? '기타' : 'Other'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosGroupFilter('선점')}
                    className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
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
                    className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
                      posGroupFilter === '가드'
                        ? 'bg-emerald-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'ko' ? '가드' : 'Guard'}
                  </button>
                </div>

                <div className="space-y-1">
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
                    style={selectedPosition === 'ALL' && !selectedSubmissionFilter && !selectedCategoryFilter ? { backgroundColor: themeColor } : undefined}
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

                  {metadata.positions
                    .filter((pos) => {
                      if (hideEmptyPositions && (folderCounts.posCounts[pos.name] || 0) === 0) {
                        return false;
                      }
                      if (posGroupFilter === 'ALL') return true;
                      if (posGroupFilter === '스탠딩') {
                        return (
                          pos.group === '스탠딩' ||
                          ['스탠딩', '레슬링'].some((k) =>
                            pos.name.includes(k)
                          )
                        );
                      }
                      if (posGroupFilter === '기타') {
                        return (
                          pos.group === '기타' ||
                          ['터틀', '트럭', '아시', '새들'].some((k) =>
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
                      const isDragTarget = dragOverTarget === `pos::${pos.name}`;

                      // Calculate group-based dynamic folder color
                      const customColors = settings.folderColors || {};
                      let groupKey: 'guard' | 'dominant' | 'standing' | 'other' = 'other';
                      let groupBadge = language === 'ko' ? '스탠딩' : 'Standing';
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
                      } else if (pos.group === '기타' || ['터틀', '트럭', '아시', '새들'].some((k) => pos.name.includes(k))) {
                        groupKey = 'other';
                        groupBadge = language === 'ko' ? '기타' : 'Other';
                      } else {
                        groupKey = 'standing';
                        groupBadge = language === 'ko' ? '스탠딩' : 'Standing';
                      }

                      const defaultColors = {
                        guard: '#059669',
                        dominant: '#d97706',
                        standing: '#2563eb',
                        other: '#6366f1',
                      };
                      const groupColor = (customColors as any)[groupKey] || defaultColors[groupKey];

                      return (
                        <div key={pos.id} className="space-y-0.5">
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverTarget(`pos::${pos.name}`);
                            }}
                            onDragLeave={() => setDragOverTarget(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleDropOnPosition(pos.name);
                            }}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                              isDragTarget
                                ? 'ring-2 bg-slate-50 font-bold'
                                : isSelectedPos && selectedSubCategory === 'ALL'
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
                                  : isDragTarget
                                    ? {
                                        borderColor: themeColor,
                                        color: themeColor,
                                      }
                                    : undefined
                            }
                          >
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
                              className="flex items-center gap-1.5 flex-1 min-w-0"
                            >
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
                            <span className="font-sans font-bold tabular-nums text-[11px] opacity-80 ml-2">
                              {posTotal}
                            </span>
                          </div>

                          {/* Expanded Position: Grouped into 5 Technical Category Folders */}
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
                                <span className="font-sans font-bold tabular-nums text-[11px]">
                                  {posTotal}
                                </span>
                              </button>

                              {/* 5 Technical Category Groups inside position */}
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
                                        <span className="truncate">{translateCategoryGroup(grp.id, language)}</span>
                                        <span className="text-[9px] text-slate-400 font-mono">
                                          ({grp.badge})
                                        </span>
                                      </div>
                                      <span className="font-sans font-bold tabular-nums text-[10px] text-slate-500">
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
                                            const isSubDragTarget =
                                              dragOverTarget === `pos::${pos.name}::${catName}`;

                                            return (
                                              <button
                                                key={catName}
                                                type="button"
                                                onDragOver={(e) => {
                                                  e.preventDefault();
                                                  setDragOverTarget(`pos::${pos.name}::${catName}`);
                                                }}
                                                onDragLeave={() => setDragOverTarget(null)}
                                                onDrop={(e) => {
                                                  e.preventDefault();
                                                  handleDropOnPosition(pos.name, catName);
                                                }}
                                                onClick={() => {
                                                  setSelectedPosition(pos.name);
                                                  setSelectedSubCategory(catName);
                                                  setSelectedSubmissionFilter(null);
                                                  setSelectedCategoryFilter(null);
                                                }}
                                                className={`w-full flex items-center justify-between px-2 py-1 rounded text-[10.5px] transition-colors cursor-pointer ${
                                                  isSubDragTarget
                                                    ? 'ring-2 font-bold'
                                                    : isCatSelected
                                                      ? 'text-white font-bold shadow-xs'
                                                      : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                                style={
                                                  isCatSelected
                                                    ? { backgroundColor: themeColor }
                                                    : isSubDragTarget
                                                      ? { borderColor: themeColor, color: themeColor }
                                                      : undefined
                                                }
                                              >
                                                <span className="truncate">{translateCategory(catName, language)}</span>
                                                <span className="font-sans font-bold tabular-nums opacity-80 text-[10px]">
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

                              <button
                                type="button"
                                onClick={() => onOpenMetadataManager('categories')}
                                className="w-full flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>{language === 'ko' ? '+ 세부 기술 추가/관리' : '+ Manage Techniques'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenMetadataManager('positions')}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-sky-200 hover:border-sky-300 rounded-xl text-xs font-semibold text-sky-600 hover:bg-sky-50/50 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'ko' ? '+ 새 포지션 폴더 추가' : '+ Add Position Folder'}</span>
                </button>
              </div>
            )}

            {/* MODE 2: TECHNICAL CATEGORIES (5 Core Folders) */}
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
                  <span className="font-sans font-bold tabular-nums text-[11px] opacity-90">
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
                          <span className="truncate">{translateCategoryGroup(grp.id, language)}</span>
                          <span className="text-[10px] font-sans font-medium opacity-70">
                            ({grp.badge})
                          </span>
                        </button>

                        <div className="flex items-center gap-1">
                          <span className="font-sans font-bold tabular-nums text-[11px] text-slate-500 px-1">
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
                              const isSubDrop = dragOverTarget === `cat::${catName}`;

                              return (
                                <button
                                  key={catName}
                                  type="button"
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOverTarget(`cat::${catName}`);
                                  }}
                                  onDragLeave={() => setDragOverTarget(null)}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    handleDropOnCategory(catName);
                                  }}
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
                                    isSubDrop
                                      ? 'ring-2 ring-indigo-500 bg-indigo-50 text-indigo-900 font-bold'
                                      : isDetSelected
                                        ? 'bg-indigo-600 text-white font-semibold'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {translateCategory(catName, language)}{' '}
                                  <span className="font-sans font-bold tabular-nums opacity-75">
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

                <button
                  type="button"
                  onClick={() => onOpenMetadataManager('categories')}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-indigo-200 hover:border-indigo-300 rounded-xl text-xs font-semibold text-indigo-600 hover:bg-indigo-50/50 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'ko' ? '+ 기술 성격/속성 관리' : '+ Manage Categories'}</span>
                </button>
              </div>
            )}

            {/* MODE 3: SUBMISSIONS (4 Core Compass Groups) */}
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
                  <span className="font-sans font-bold tabular-nums text-[11px] opacity-90">
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
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          <span className="truncate">{translateSubmissionGroup(group.id, language)}</span>
                          <span className="text-[10px] font-sans font-medium opacity-70">
                            ({group.items.length}{language === 'ko' ? '종' : ' types'})
                          </span>
                        </button>

                        <div className="flex items-center gap-1">
                          <span className="font-sans font-bold tabular-nums text-[11px] text-slate-500 px-1">
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
                            const isSubDrop =
                              dragOverTarget === `sub::${group.id}::${subItem}`;

                            return (
                              <button
                                key={subItem}
                                type="button"
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setDragOverTarget(
                                    `sub::${group.id}::${subItem}`
                                  );
                                }}
                                onDragLeave={() => setDragOverTarget(null)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  handleDropOnSubmission(group.id, subItem);
                                }}
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
                                  isSubDrop
                                    ? 'ring-2 ring-rose-500 bg-rose-50 text-rose-900 font-bold'
                                    : isDetSelected
                                      ? 'bg-rose-600 text-white font-semibold'
                                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {translateSubmissionDetail(subItem, language)}{' '}
                                <span className="font-sans font-bold tabular-nums opacity-75">
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

                <button
                  type="button"
                  onClick={() => onOpenMetadataManager('submissions')}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-rose-200 hover:border-rose-300 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50/50 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'ko' ? '+ 서브미션 종류 관리' : '+ Manage Submissions'}</span>
                </button>
              </div>
            )}
          </div>
        </aside>

        <section className="lg:col-span-9 space-y-4">
          {/* Breadcrumb Back Bar (Visible on mobile/tablet when inside a folder or searching) */}
          {(isInsideFolder || (isSearching && selectedPosition !== 'ALL')) && (
            <div className="lg:hidden flex items-center justify-between gap-2 py-1 px-1 animate-in fade-in duration-150 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedPosition('ALL');
                  setSelectedSubCategory('ALL');
                  setSelectedSubmissionFilter(null);
                  setSelectedCategoryFilter(null);
                  setSearchQuery('');
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-colors cursor-pointer shrink-0"
              >
                <span className="text-sky-500 font-extrabold">←</span>
                <span>{language === 'ko' ? '전체 폴더' : 'All Folders'}</span>
              </button>
              <div className="flex items-center gap-1 text-xs font-black text-slate-800 truncate min-w-0 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-3xs">
                <Folder className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate whitespace-nowrap">
                  {selectedSubmissionFilter
                    ? `${translateSubmissionDetail(selectedSubmissionFilter.detail, language) || translateSubmissionGroup(selectedSubmissionFilter.group, language) || (language === 'ko' ? '서브미션' : 'Submission')}`
                    : selectedPosition !== 'ALL'
                      ? translatePosition(selectedPosition, language, metadata.positions)
                      : selectedCategoryFilter
                        ? `${translateCategory(selectedCategoryFilter.detail, language) || translateCategoryGroup(selectedCategoryFilter.groupId, language)}`
                        : (language === 'ko' ? '검색 결과' : 'Search Results')}
                </span>
              </div>
            </div>
          )}

          {/* Videos Grid Container (Hidden on mobile when at root folder and not searching) */}
          <div className={`${
            !isInsideFolder && !isSearching ? 'hidden lg:block' : 'block'
          }`}>
            {videos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
                <Video className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="text-base font-bold text-slate-800">
                  {language === 'ko' ? '아직 등록된 기술 영상이 없습니다' : 'No technique videos registered yet'}
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {language === 'ko'
                    ? '유튜브 영상 URL을 등록하여 나만의 포지션별 수련 아카이브를 직접 구축해 보세요. 등록된 영상은 순환 마인드맵과 통계 분석에 실시간 연동됩니다.'
                    : 'Add YouTube video URLs to build your personal training archive. Added videos are linked to diagrams and analytics in real time.'}
                </p>
              </div>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">
                {language === 'ko' ? '조건에 해당하는 기술 영상이 없습니다' : 'No technique videos match the criteria'}
              </div>
            </div>
          ) : viewLayoutMode === 'fileList' ? (
            /* File List View: Thumbnail on Left, Title on Right */
            <div className="space-y-2.5">
              {filteredVideos.map((video) => {
                const matchingMemo = getMatchingMemo(video);
                const lastPracticed =
                  video.practiceDates.length > 0
                    ? [...video.practiceDates].sort().slice(-1)[0]
                    : undefined;

                const allCardStartPositions = (video.positions && video.positions.length > 0)
                  ? video.positions
                  : (video.position ? [video.position] : []);

                const allCardArrivalPositions = (video.endPositions && video.endPositions.length > 0)
                  ? video.endPositions
                  : (video.endPosition ? [video.endPosition] : []);

                const allCardCategories = (video.categories && video.categories.length > 0)
                  ? video.categories
                  : (video.category ? [video.category] : []);

                return (
                  <article
                    key={video.id}
                    draggable
                    onDragStart={() => setDraggedVideoId(video.id)}
                    onDragEnd={() => {
                      setDraggedVideoId(null);
                      setDragOverTarget(null);
                    }}
                    onClick={() => onOpenModal(video, 'view', matchingMemo?.timeSeconds)}
                    className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-3 lg:p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs overflow-hidden"
                  >
                    {/* Mobile View Layout (lg:hidden) - Ultra Simple 3-Row Single-Line Design */}
                    <div className="lg:hidden flex items-center gap-3 min-w-0">
                      {/* Left Compact Thumbnail */}
                      <div className="relative w-22 h-16 bg-slate-900 rounded-xl overflow-hidden shrink-0 shadow-3xs">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={language === 'en' ? (video.titleEn || video.titleKo) : video.titleKo}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50">
                            <Folder className="w-5 h-5" />
                          </div>
                        )}
                        {(video.youtubeId?.startsWith('ig-') || isInstagramUrl(video.youtubeUrl || '')) && (
                          <span className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white text-[8px] font-bold">
                            Reels
                          </span>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-white text-[8px] font-mono">
                          {video.timelineFrames.length}F
                        </span>
                      </div>

                      {/* Right Column: 3 Clean Single Lines */}
                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Row 1: Position & Category Badges (All Multi-Selected tags) */}
                        <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold">
                          {matchingMemo && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenModal(video, 'view', matchingMemo.timeSeconds);
                              }}
                              className="px-1.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] truncate max-w-[150px] flex items-center gap-1 shadow-3xs cursor-pointer"
                              title={`${matchingMemo.techniqueTag || activeFolderName || '기술'} 시점으로 바로 재생`}
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>⏱️ {matchingMemo.timeLabel}부터</span>
                            </span>
                          )}
                          {allCardStartPositions.map((pos) => (
                            <span key={`m-pos-${pos}`} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 truncate max-w-[120px]">
                              {translatePosition(pos, language, metadata.positions)}
                            </span>
                          ))}
                          {allCardArrivalPositions.map((endPos) => (
                            <span key={`m-end-${endPos}`} className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 truncate max-w-[120px] flex items-center gap-0.5">
                              <span className="text-[9px] text-indigo-400 font-extrabold">→</span>
                              {translatePosition(endPos, language, metadata.positions)}
                            </span>
                          ))}
                          {allCardCategories.map((cat) => (
                            <span key={`m-cat-${cat}`} className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 truncate max-w-[120px]">
                              {translateCategory(cat, language)}
                            </span>
                          ))}
                          {video.giType && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 shrink-0">
                              {translateGiType(video.giType, language)}
                            </span>
                          )}
                          {video.submissionGroup !== 'none' && video.submissionDetail && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold truncate max-w-[120px]">
                              {translateSubmissionDetail(video.submissionDetail, language)}
                            </span>
                          )}
                        </div>

                        {/* Row 2: Korean Title (1 line) */}
                        <h3 className="text-xs font-black text-slate-900 group-hover:text-sky-600 transition-colors truncate whitespace-nowrap">
                          {language === 'en' ? (video.titleEn || video.titleKo) : video.titleKo}
                        </h3>

                        {/* Row 3: Practice Stats, Score Rating (Red Box area) & Action Buttons (1 line) */}
                        <div className="flex items-center justify-between gap-1 text-[10px] font-mono tabular-nums text-slate-500 pt-0.5">
                          <div className="truncate shrink min-w-0">
                            <span>{language === 'ko' ? `수련 ${video.practiceDates.length}회` : `Practiced ${video.practiceDates.length}x`}</span>
                            {lastPracticed && (
                              <span className="ml-1 text-slate-400">· {formatDateKorean(lastPracticed).replace(/202\d년\s*/, '')}</span>
                            )}
                          </div>

                          {/* Score Rating + Compact Action Icons */}
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <ProficiencyRater
                              score={video.proficiencyScore || 0}
                              onChange={(newScore) =>
                                onUpdateVideo({
                                  ...video,
                                  proficiencyScore: newScore,
                                  updatedAt: new Date().toISOString(),
                                })
                              }
                              compact={true}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                onUpdateVideo({
                                  ...video,
                                  isFavorite: !video.isFavorite,
                                })
                              }
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 cursor-pointer ml-0.5"
                              title={language === 'ko' ? "즐겨찾기" : "Favorite"}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  video.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenModal(video, 'edit')}
                              className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"
                              title={language === 'ko' ? "수정" : "Edit"}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteVideo(video.id)}
                              className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title={language === 'ko' ? "삭제" : "Delete"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop View Layout (hidden lg:flex) */}
                    <div className="hidden lg:flex flex-row items-center justify-between gap-4 w-full">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Left: Small Video Thumbnail */}
                        <div className="relative w-36 aspect-video bg-slate-900 rounded-xl overflow-hidden shrink-0 shadow-2xs">
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
                          {(video.youtubeId?.startsWith('ig-') || isInstagramUrl(video.youtubeUrl || '')) && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white text-[9px] font-bold shadow-xs">
                              Reels
                            </span>
                          )}
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-mono font-medium">
                            {video.timelineFrames.length} {language === 'ko' ? '프레임' : 'Frames'}
                          </span>
                        </div>

                        {/* Right: Video Title & Metadata */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                            {matchingMemo && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenModal(video, 'view', matchingMemo.timeSeconds);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95"
                                title={`${matchingMemo.techniqueTag || activeFolderName || '기술'} 시점으로 바로 재생`}
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>⏱️ {matchingMemo.timeLabel}부터 재생</span>
                                <span className="text-indigo-200 text-[9px]">
                                  #{matchingMemo.techniqueTag || extractTechniqueTagsFromMemo(matchingMemo, metadata)[0] || activeFolderName}
                                </span>
                              </button>
                            )}
                            {allCardStartPositions.map((pos) => (
                              <span key={`d-pos-${pos}`} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {translatePosition(pos, language, metadata.positions)}
                              </span>
                            ))}
                            {allCardArrivalPositions.map((endPos) => (
                              <span key={`d-end-${endPos}`} className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-0.5">
                                <span className="text-[9px] text-indigo-400 font-extrabold">→</span>
                                {translatePosition(endPos, language, metadata.positions)}
                              </span>
                            ))}
                            {allCardCategories.map((cat) => (
                              <span key={`d-cat-${cat}`} className="px-2 py-0.5 rounded bg-sky-50 text-sky-700">
                                {translateCategory(cat, language)}
                              </span>
                            ))}
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                              {translateGiType(video.giType, language)}
                            </span>
                            {video.submissionGroup !== 'none' && video.submissionDetail && (
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold">
                                {language === 'ko' ? '피니시' : 'Finish'}: {translateSubmissionDetail(video.submissionDetail, language)}
                              </span>
                            )}
                            <span className="text-slate-400 font-normal">
                              · {language === 'ko' ? '난이도' : 'Diff'} {translateDifficulty(video.difficulty, language)}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                              {language === 'en' ? (video.titleEn || video.titleKo) : video.titleKo}
                            </h3>
                            <p className="text-xs text-slate-400 line-clamp-1 font-mono">
                              {video.titleEn}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5 font-mono tabular-nums">
                            <span>{language === 'ko' ? `수련 ${video.practiceDates.length}회` : `Practiced ${video.practiceDates.length}x`}</span>
                            {lastPracticed && (
                              <span>{language === 'ko' ? `최근 수련: ${formatDateKorean(lastPracticed)}` : `Last: ${lastPracticed}`}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Bar */}
                      <div
                        className="flex items-center justify-end gap-3 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ProficiencyRater
                          score={video.proficiencyScore}
                          onChange={(newScore) =>
                            onUpdateVideo({
                              ...video,
                              proficiencyScore: newScore,
                              updatedAt: new Date().toISOString(),
                            })
                          }
                          compact={true}
                        />

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateVideo({
                                ...video,
                                isFavorite: !video.isFavorite,
                              })
                            }
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
                          <button
                            type="button"
                            onClick={() => onOpenModal(video, 'edit')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{language === 'ko' ? '수정' : 'Edit'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteVideo(video.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* Card Grid View: Mobile 1-Column with thumbnail icons / Desktop 3-Column */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 md:gap-5">
              {filteredVideos.map((video) => {
                const matchingMemo = getMatchingMemo(video);
                const lastPracticed =
                  video.practiceDates.length > 0
                    ? [...video.practiceDates].sort().slice(-1)[0]
                    : undefined;
                const isRatingOpen = activeRatingVideoId === video.id;

                return (
                  <article
                    key={video.id}
                    draggable
                    onDragStart={() => setDraggedVideoId(video.id)}
                    onDragEnd={() => {
                      setDraggedVideoId(null);
                      setDragOverTarget(null);
                    }}
                    onClick={() => onOpenModal(video, 'view', matchingMemo?.timeSeconds)}
                    className="group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 overflow-hidden transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs"
                  >
                    <div>
                      {/* Video Thumbnail with Badges & Mobile Bottom-Right Rating/Favorite Icons */}
                      <div className="relative w-full aspect-video bg-slate-900 overflow-hidden">
                        {video.thumbnailUrl && (
                          <img
                            src={video.thumbnailUrl}
                            alt={language === 'en' ? (video.titleEn || video.titleKo) : video.titleKo}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        )}

                        {/* Top-Left Badges (Mobile & Desktop) */}
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[80%]">
                          <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs">
                            {translatePosition(video.position, language, metadata.positions)}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-sky-500/80 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs">
                            {translateCategory(video.category, language)}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/80 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs">
                            {translateGiType(video.giType, language)}
                          </span>
                        </div>

                        {/* Timeline Seek Button / Reels Badge */}
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          {matchingMemo && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenModal(video, 'view', matchingMemo.timeSeconds);
                              }}
                              className="px-2 py-0.8 rounded-lg bg-indigo-600/90 hover:bg-indigo-700 backdrop-blur-md text-white text-[10px] font-bold shadow-md z-10 flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                              title={`${matchingMemo.techniqueTag || activeFolderName || '기술'} 시점으로 바로 재생`}
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>⏱️ {matchingMemo.timeLabel}부터</span>
                            </button>
                          )}
                          {(video.youtubeId?.startsWith('ig-') || isInstagramUrl(video.youtubeUrl || '')) && (
                            <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white text-[9px] font-bold shadow-xs">
                              Reels
                            </span>
                          )}
                        </div>

                        {/* Bottom-Left Thumbnail Badge: Training Count (Blue Box area) */}
                        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-xl bg-black/65 backdrop-blur-md text-white text-[10px] font-bold font-mono shadow-md z-10 flex items-center gap-1">
                          <span>{language === 'ko' ? `수련 ${video.practiceDates.length}회` : `Practiced ${video.practiceDates.length}x`}</span>
                        </div>

                        {/* Bottom-Right Action Icons: Score, Favorite, Edit, Delete in exact order (Red Box area) */}
                        <div
                          className="absolute bottom-2 right-2 flex items-center gap-1 z-10 p-1 rounded-xl bg-black/65 backdrop-blur-md border border-white/10 shadow-md"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* 1. Score Icon (🔥) - Icon only when unrated */}
                          <ProficiencyRater
                            score={video.proficiencyScore || 0}
                            onChange={(newScore) =>
                              onUpdateVideo({
                                ...video,
                                proficiencyScore: newScore,
                                updatedAt: new Date().toISOString(),
                              })
                            }
                            compact={true}
                          />

                          {/* 2. Favorite Star (⭐) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateVideo({
                                ...video,
                                isFavorite: !video.isFavorite,
                                updatedAt: new Date().toISOString(),
                              });
                            }}
                            className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-white/80 hover:text-white"
                            title={video.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                video.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-white/80'
                              }`}
                            />
                          </button>

                          {/* 3. Edit Pencil (✏️) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenModal(video, 'edit');
                            }}
                            className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-white/80 hover:text-white"
                            title={language === 'ko' ? "수정" : "Edit"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Delete Trash (🗑️) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteVideo(video.id);
                            }}
                            className="p-1 rounded-lg hover:bg-rose-500/80 transition-colors cursor-pointer text-white/80 hover:text-white"
                            title={language === 'ko' ? "삭제" : "Delete"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-3 sm:p-3.5 space-y-1">
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 leading-snug">
                            {language === 'en' ? (video.titleEn || video.titleKo) : video.titleKo}
                          </h3>
                          <p className="text-xs text-slate-400 font-mono line-clamp-1 mt-0.5">
                            {video.titleEn}
                          </p>
                        </div>
                      </div>
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
  );
};
