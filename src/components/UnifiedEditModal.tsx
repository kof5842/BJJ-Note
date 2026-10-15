import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Edit3,
  Check,
  Plus,
  Trash2,
  Clock,
  Languages,
  Sliders,
  Sparkles,
  Play,
  Calendar,
  BookOpen,
  ChevronRight,
  BookmarkCheck,
  Image as ImageIcon,
  ZoomIn,
  FileText,
  Flame,
  Loader2,
  Tag,
} from 'lucide-react';
import {
  AppSettings,
  MetadataConfig,
  SubmissionGroupId,
  TechniqueVideo,
  TimelineFrame,
  JournalMemo,
} from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { translatePosition, translateCategory, translateSubmissionGroup, translateSubmissionDetail, translateGiType, translateDifficulty } from '../utils/taxonomyTranslation';
import { VideoPlayer16x9 } from './VideoPlayer16x9';
import { ProficiencyRater } from './ProficiencyRater';
import { SubmissionMultiSelect } from './SubmissionMultiSelect';
import { EndPositionMultiSelect } from './EndPositionMultiSelect';
import { PositionMultiSelect } from './PositionMultiSelect';
import { CategorySelect } from './CategorySelect';
import { HashtagTechniqueInput, TaxonomyTechniqueItem } from './HashtagTechniqueInput';
import { saveSharedVideoClassification } from '../services/archiveService';
import { getSavedPositionGroupOrder, getSavedPositionGroupTitles } from '../data/bjjTaxonomy';
import {
  extractUrlsFromText,
  extractYoutubeId,
  extractInstagramReelId,
  isInstagramUrl,
  getInstagramThumbnail,
  formatDateKorean,
  formatSecondsToKoreanLabel,
  formatSecondsToMMSS,
  extractTechniqueTagsFromMemo,
  getYoutubeThumbnail,
  translateBjjTitle,
  translateBjjTitleAsync,
  getScoreColorStyle,
  getEndPositionsArray,
} from '../utils/bjjAnalyzer';

interface UnifiedEditModalProps {
  video: TechniqueVideo | null;
  mode: 'view' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: TechniqueVideo, closeModal?: boolean) => void;
  onDelete?: (videoId: string) => void;
  metadata: MetadataConfig;
  allVideos: TechniqueVideo[];
  onOpenMetadataManager: (
    tab?: 'positions' | 'categories' | 'submissions' | 'gi_diff'
  ) => void;
  activeJournalDate?: string;
  settings?: AppSettings;
  initialSeekSeconds?: number;
}

export const UnifiedEditModal: React.FC<UnifiedEditModalProps> = ({
  video,
  mode: initialMode,
  isOpen,
  onClose,
  onSave,
  onDelete,
  metadata,
  allVideos,
  onOpenMetadataManager,
  activeJournalDate,
  settings,
  initialSeekSeconds,
}) => {
  const { t, language } = useLanguage();
  const [currentMode, setCurrentMode] = useState<'view' | 'edit'>(initialMode);
  const [draft, setDraft] = useState<TechniqueVideo | null>(video);
  const [currentPlaySeconds, setCurrentPlaySeconds] = useState<number>(0);
  const [seekTrigger, setSeekTrigger] = useState<{
    time: number;
    nonce: number;
  } | null>(null);

  const [isWritingMemo, setIsWritingMemo] = useState(false);
  const [capturedMemoSeconds, setCapturedMemoSeconds] = useState<number>(0);
  const [memoText, setMemoText] = useState('');
  const [memoImage, setMemoImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [memoSavedToast, setMemoSavedToast] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const memoImageInputRef = useRef<HTMLInputElement | null>(null);
  const timelineRailRef = useRef<HTMLDivElement | null>(null);

  // Synchronize with custom position group order & titles
  const [posGroupOrderVersion, setPosGroupOrderVersion] = useState(0);
  useEffect(() => {
    const handleSync = () => setPosGroupOrderVersion((v) => v + 1);
    window.addEventListener('bjj_taxonomy_groups_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('bjj_taxonomy_groups_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Grouped Starting Positions ordered by saved position group order (optgroup)
  const groupedPositions = React.useMemo(() => {
    const savedOrder = getSavedPositionGroupOrder();
    const savedTitles = getSavedPositionGroupTitles();
    const groups: Record<string, typeof metadata.positions> = {};

    metadata.positions.forEach((p) => {
      const rawGName = p.group || (language === 'ko' ? '기타 포지션' : 'Other Positions');
      const gName = savedTitles[rawGName] || rawGName;
      if (!groups[gName]) groups[gName] = [];
      groups[gName].push(p);
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
    });

    // Follow saved order first, mapped through savedTitles
    const orderedKeys: string[] = [];
    savedOrder.forEach((rawKey) => {
      const resolvedKey = savedTitles[rawKey] || rawKey;
      if (groups[resolvedKey] && !orderedKeys.includes(resolvedKey)) {
        orderedKeys.push(resolvedKey);
      } else if (groups[rawKey] && !orderedKeys.includes(rawKey)) {
        orderedKeys.push(rawKey);
      }
    });

    // Append any groups not explicitly present in savedOrder
    Object.keys(groups).forEach((key) => {
      if (!orderedKeys.includes(key)) {
        orderedKeys.push(key);
      }
    });

    return orderedKeys.map((key) => [key, groups[key]] as [string, typeof metadata.positions]);
  }, [metadata.positions, language, posGroupOrderVersion]);

  // Synchronize draft state when isOpen or video changes
  useEffect(() => {
    if (isOpen && video) {
      setDraft({
        ...video,
        timelineFrames: [...(video.timelineFrames || [])],
        journalMemos: [...(video.journalMemos || [])],
        practiceDates: [...(video.practiceDates || [])],
        nextTechniqueIds: [...(video.nextTechniqueIds || [])],
      });
      setCurrentMode(initialMode);
      setIsConfirmingDelete(false);
      setIsWritingMemo(false);
      setMemoText('');
      setMemoSavedToast(null);

      if (typeof initialSeekSeconds === 'number' && initialSeekSeconds > 0) {
        setSeekTrigger({ time: initialSeekSeconds, nonce: Date.now() });
        setCurrentPlaySeconds(initialSeekSeconds);
        setMemoSavedToast(`⏱️ ${formatSecondsToKoreanLabel(initialSeekSeconds)} 타임라인부터 재생합니다.`);
        setTimeout(() => setMemoSavedToast(null), 3200);
      } else {
        setCurrentPlaySeconds(0);
      }
    } else if (!isOpen) {
      setDraft(null);
    }
  }, [isOpen, video, initialMode, initialSeekSeconds]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !draft) return null;

  const handleSeek = (seconds: number) => {
    setSeekTrigger({ time: seconds, nonce: Date.now() });
  };

  const handleHorizontalWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!timelineRailRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      timelineRailRef.current.scrollLeft += e.deltaY;
    }
  };

  // Instant timestamp capture: clicking creates timestamp immediately without dialog
  const handleQuickAddTimestampMemo = (seconds?: number) => {
    const targetSec =
      typeof seconds === 'number' ? Math.max(0, Math.floor(seconds)) : Math.max(0, Math.floor(currentPlaySeconds));
    const todayStr =
      activeJournalDate || new Date().toISOString().slice(0, 10);
    const newMemo: JournalMemo = {
      id: `jm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: todayStr,
      timeSeconds: targetSec,
      timeLabel: formatSecondsToKoreanLabel(targetSec),
      content: '',
      createdAt: new Date().toISOString(),
    };
    // Sort by timestamp
    const updatedMemos = [...draft.journalMemos, newMemo].sort(
      (a, b) => a.timeSeconds - b.timeSeconds
    );
    const updated: TechniqueVideo = {
      ...draft,
      journalMemos: updatedMemos,
      updatedAt: new Date().toISOString(),
    };
    setDraft(updated);
    onSave(updated, false);
    setMemoSavedToast(`⏱️ ${formatSecondsToKoreanLabel(targetSec)} 타임 기록 완료! 아래 메모장에서 자유롭게 작성하세요.`);
    setTimeout(() => {
      setMemoSavedToast(null);
    }, 2200);
  };

  const handleSelectTechniqueTagForMemo = (
    memoId: string,
    item: TaxonomyTechniqueItem
  ) => {
    if (!draft) return;
    const tagName = item.name;

    const currentPositions = draft.positions && draft.positions.length > 0
      ? [...draft.positions]
      : (draft.position && draft.position !== '미분류' ? [draft.position] : []);

    const currentCategories = draft.categories && draft.categories.length > 0
      ? [...draft.categories]
      : (draft.category && draft.category !== '미분류' ? [draft.category] : []);

    let newPosition = draft.position;
    let newCategory = draft.category;
    let newSubmissionDetail = draft.submissionDetail;
    let newSubmissionGroup = draft.submissionGroup;

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

    const updatedMemos = draft.journalMemos.map((m) =>
      m.id === memoId ? { ...m, techniqueTag: tagName } : m
    );

    const updated: TechniqueVideo = {
      ...draft,
      position: newPosition || (currentPositions[0] || '미분류'),
      positions: currentPositions,
      category: newCategory || (currentCategories[0] || '미분류'),
      categories: currentCategories,
      submissionDetail: newSubmissionDetail,
      submissionGroup: newSubmissionGroup,
      journalMemos: updatedMemos,
      updatedAt: new Date().toISOString(),
    };

    setDraft(updated);
    onSave(updated, false);

    const folderName =
      item.type === 'position'
        ? `${tagName} 포지션`
        : item.type === 'submission'
        ? `서브미션 > ${tagName}`
        : `${item.groupName} > ${tagName}`;

    setMemoSavedToast(`✨ #${tagName} 태그 등록 완료! '${folderName}' 폴더에 분류되었습니다.`);
    setTimeout(() => {
      setMemoSavedToast(null);
    }, 3200);
  };

  const handleUpdateMemoContent = (memoId: string, newContent: string) => {
    if (!draft) return;
    const detectedTags = extractTechniqueTagsFromMemo({ content: newContent }, metadata);
    const primaryTag = detectedTags.length > 0 ? detectedTags[0] : undefined;

    const updatedMemos = draft.journalMemos.map((m) =>
      m.id === memoId
        ? {
            ...m,
            content: newContent,
            ...(primaryTag ? { techniqueTag: primaryTag } : {}),
          }
        : m
    );
    const updated: TechniqueVideo = {
      ...draft,
      journalMemos: updatedMemos,
      updatedAt: new Date().toISOString(),
    };
    setDraft(updated);
    onSave(updated, false);
  };

  const handleUpdateMemoImage = (memoId: string, imgData: string | undefined) => {
    const updatedMemos = draft.journalMemos.map((m) =>
      m.id === memoId ? { ...m, imageUrl: imgData } : m
    );
    const updated: TechniqueVideo = {
      ...draft,
      journalMemos: updatedMemos,
      updatedAt: new Date().toISOString(),
    };
    setDraft(updated);
    onSave(updated, false);
  };

  const handleDeleteMemo = (memoId: string) => {
    const updated: TechniqueVideo = {
      ...draft,
      journalMemos: draft.journalMemos.filter((m) => m.id !== memoId),
      updatedAt: new Date().toISOString(),
    };
    setDraft(updated);
    onSave(updated, false);
  };

  const handleUpdateGeneralNotes = (newNotes: string) => {
    const updated: TechniqueVideo = {
      ...draft,
      generalNotes: newNotes,
      updatedAt: new Date().toISOString(),
    };
    setDraft(updated);
    onSave(updated, false);
  };

  const handleScoreChange = (newScore: number) => {
    const updated: TechniqueVideo = {
      ...draft,
      proficiencyScore: newScore,
      updatedAt: new Date().toISOString(),
    };
    setDraft(updated);
    onSave(updated, false);
  };

  const handleCaptureTimelineFrame = (seconds: number) => {
    const stepIndex = draft.timelineFrames.length + 1;
    const newFrame: TimelineFrame = {
      id: `tf-${Date.now()}`,
      timeSeconds: Math.round(seconds * 10) / 10,
      timeLabel: formatSecondsToMMSS(seconds),
      stepTitle: `${stepIndex}단계: 핵심 동작 포착`,
      detailNote: '',
    };
    const sorted = [...draft.timelineFrames, newFrame].sort(
      (a, b) => a.timeSeconds - b.timeSeconds
    );
    setDraft({
      ...draft,
      timelineFrames: sorted,
    });
  };

  const handleAutoTranslate = async () => {
    const source = draft.titleKo.trim() || draft.titleEn.trim();
    if (!source) return;

    // Fast immediate translation using enhanced dictionary
    const syncResult = translateBjjTitle(source);
    setDraft((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        titleKo: syncResult.titleKo,
        titleEn: syncResult.titleEn,
      };
    });

    // If source or result contains Latin letters, run server-side AI translation for 100% natural Korean
    if (/[a-zA-Z]{3,}/.test(source) || /[a-zA-Z]{3,}/.test(syncResult.titleKo)) {
      setIsTranslating(true);
      try {
        const aiResult = await translateBjjTitleAsync(source);
        if (aiResult.titleKo) {
          setDraft((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              titleKo: aiResult.titleKo,
              titleEn: aiResult.titleEn || prev.titleEn,
            };
          });
        }
      } catch {
        // Fallback already applied
      } finally {
        setIsTranslating(false);
      }
    }
  };

  const handleSaveEdit = () => {
    const finalVideo: TechniqueVideo = {
      ...draft,
      titleKo: draft.titleKo.trim() || '이름 없는 주짓수 기술',
      titleEn: draft.titleEn.trim() || 'Untitled BJJ Technique',
      updatedAt: new Date().toISOString(),
    };
    saveSharedVideoClassification(finalVideo);
    onSave(finalVideo, true);
    setCurrentMode('view');
  };

  const lastPracticedDate =
    draft.practiceDates.length > 0
      ? [...draft.practiceDates].sort().slice(-1)[0]
      : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white lg:bg-slate-950/75 lg:backdrop-blur-xs lg:p-4 overflow-hidden">
      <div className="bg-white w-full h-full lg:h-auto lg:rounded-3xl lg:border lg:border-slate-200 shadow-none lg:shadow-2xl lg:max-w-[1400px] lg:max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar - Pinned at top */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {currentMode !== 'view' && (
              <>
                <span className="text-xs font-bold text-slate-700 shrink-0 whitespace-nowrap">
                  {language === 'ko' ? '통합 정밀 기술 편집 작업대' : 'Unified Technique Editor'}
                </span>
                <span className="text-slate-300 shrink-0" aria-hidden="true">
                  ·
                </span>
              </>
            )}
            {currentMode === 'view' ? (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 min-w-0 font-semibold leading-none">
                <span className="font-bold text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded-md">
                  {draft.position}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-700">
                  {draft.category}
                </span>
                <span aria-hidden="true">·</span>
                <span>{draft.giType}</span>
                <span aria-hidden="true">·</span>
                <span>{language === 'ko' ? '난이도' : 'Diff'}: {translateDifficulty(draft.difficulty, language)}</span>
                {draft.submissionGroup !== 'none' && draft.submissionDetail !== '미지정' && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      {language === 'ko' ? '피니시' : 'Finish'}: {translateSubmissionDetail(draft.submissionDetail, language)}
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-indigo-600 font-semibold">
                  누적 수련 {draft.practiceDates.length}회 (최근: {formatDateKorean(lastPracticedDate)})
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 truncate font-medium">
                {draft.position} / {draft.category} / {draft.giType}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentMode === 'view' ? (
              <button
                type="button"
                onClick={() => setCurrentMode('edit')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>수정</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{language === 'ko' ? '수정사항 저장' : 'Save Changes'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body - Single clean vertical scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 pb-24 lg:pb-6">
          {currentMode === 'view' ? (
            /* YouTube Style 2-Column Responsive Layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: 16:9 Video Player & Core Technique Information (approx 62% width) */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                {/* 16:9 Aspect Video Player */}
                <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden bg-black shadow-xs">
                  <VideoPlayer16x9
                    youtubeId={draft.youtubeId}
                    videoUrl={draft.youtubeUrl}
                    title={draft.titleKo}
                    externalSeekTime={seekTrigger}
                    initialSeekTime={initialSeekSeconds}
                    onTimeChange={setCurrentPlaySeconds}
                    showPrecisionControls={true}
                    onCaptureTimecode={(sec) => handleQuickAddTimestampMemo(sec)}
                    captureButtonLabel="+ 타임스탬프 기록"
                  />
                </div>

                {/* Video Titles placed UNDER the video player */}
                <div className="px-1 lg:px-0 py-2 space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {draft.titleKo}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    {draft.titleEn}
                  </p>
                </div>

              </div>

              {/* Right Column: YouTube-style Dedicated Timeline Memo Sidebar (approx 38% width) */}
              <div className="lg:col-span-5 xl:col-span-4 bg-slate-50/90 rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col space-y-4 lg:sticky lg:top-0">
                {/* 1~10 숙련도 자가진단 (Score Buttons only) */}
                <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                      const isSelected = draft.proficiencyScore === val;
                      const isFilled = draft.proficiencyScore >= val;
                      const color = getScoreColorStyle(val);
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleScoreChange(isSelected ? 0 : val)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border text-xs sm:text-sm font-bold font-mono tabular-nums flex items-center justify-center transition-all cursor-pointer ${
                            isFilled
                              ? `${color.bgClass} ${color.borderClass} ${color.textClass} font-black shadow-2xs`
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          } ${isSelected ? 'ring-2 ring-slate-900 ring-offset-1 border-slate-900 shadow-xs scale-105' : ''}`}
                          title={`숙련도 점수 ${val}점 (다시 누르면 해제)`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-200 pt-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      타임라인 메모
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700">
                      {draft.journalMemos.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickAddTimestampMemo(currentPlaySeconds)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                    title="현재 재생 시점의 타임스탬프를 즉시 기록합니다"
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

                {/* Memos List: Inline Notepad Cards */}
                <div className="space-y-3 overflow-y-auto max-h-[580px] custom-scrollbar pr-1">
                  {draft.journalMemos.length > 0 ? (
                    draft.journalMemos.map((memo) => {
                      const isMatchingSeek =
                        typeof initialSeekSeconds === 'number'
                          ? Math.abs(initialSeekSeconds - memo.timeSeconds) < 2
                          : Math.abs(currentPlaySeconds - memo.timeSeconds) < 1.5;

                      const tagText =
                        memo.techniqueTag ||
                        memo.content.match(/#([가-힣a-zA-Z0-9_\/·\-]+)/)?.[1];

                      return (
                        <div
                          key={memo.id}
                          className={`p-3.5 rounded-2xl bg-white border transition-all shadow-2xs space-y-2 ${
                            isMatchingSeek
                              ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSeek(memo.timeSeconds)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 transition-colors font-mono text-xs font-bold cursor-pointer"
                                title="이 시점으로 영상 이동 (Seek)"
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

                          {/* Inline Notepad Hashtag Textarea: Type anytime with # hashtag autocomplete */}
                          <div>
                            <HashtagTechniqueInput
                              value={memo.content}
                              onChange={(val) =>
                                handleUpdateMemoContent(memo.id, val)
                              }
                              onSelectTechniqueTag={(item) =>
                                handleSelectTechniqueTagForMemo(memo.id, item)
                              }
                              metadata={metadata}
                              placeholder={
                                language === 'ko'
                                  ? "기술 디테일, 주의점 작성 (#기술명 입력 시 해당 폴더로 자동 분류)..."
                                  : "Write technique details (#hashtag to categorize into folder)..."
                              }
                              rows={Math.max(2, (memo.content || '').split('\n').length)}
                              className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-xl focus:outline-none transition-colors resize-y leading-relaxed font-sans placeholder:text-slate-400"
                            />
                          </div>

                        {/* Image Attachment (if enabled by admin) */}
                        {settings?.allowTimelineMemoImages !== false && (
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
                                {language === 'ko' ? '사진 삭제' : 'Delete Photo'}
                              </button>
                            )}
                          </div>
                        )}

                        {memo.imageUrl && (
                          <div
                            onClick={() => setPreviewImage(memo.imageUrl!)}
                            className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-zoom-in max-h-40 flex items-center justify-center shadow-2xs"
                            title="클릭하여 원본 크기로 확대 보기"
                          >
                            <img
                              src={memo.imageUrl}
                              alt="타임라인 메모 첨부 사진"
                              className="w-full h-36 object-contain"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-300 text-center space-y-2 bg-white/60">
                      <Clock className="w-8 h-8 text-indigo-400 mx-auto" />
                      <div className="text-xs font-bold text-slate-700">
                        {language === 'ko' ? '기록된 타임라인 메모가 없습니다' : 'No timeline notes recorded yet'}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                        영상 재생 중 상단의 <strong>[+ 메모 작성]</strong> 버튼을 누르면
                        {language === 'ko' ? '시간(타임스탬프)이 즉시 기록되며, 메모장처럼 언제든 자유롭게 내용을 작성할 수 있습니다.' : 'Timestamp is recorded immediately and you can write notes anytime.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* General Notes - Notepad placed at the bottom of the right sidebar */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 mt-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>{language === 'ko' ? '메모' : 'Notes'}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 font-medium">
                      상시 자유 메모
                    </span>
                  </div>
                  <textarea
                    value={draft.generalNotes || ''}
                    onChange={(e) => handleUpdateGeneralNotes(e.target.value)}
                    rows={3}
                    placeholder={language === 'ko' ? "기술 디테일, 상대 베이스 방향, 체중 실리는 각도 등 메모를 자유롭게 입력하세요..." : "Write general technique notes, weight distribution cues, counter angles..."}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-xl focus:outline-none transition-colors leading-relaxed text-slate-800 resize-y"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: YouTube Video Player */}
              <div className="lg:col-span-5 xl:col-span-6 space-y-4">
                <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden bg-black shadow-xs">
                  <VideoPlayer16x9
                    youtubeId={extractYoutubeId(draft.youtubeUrl) || draft.youtubeId}
                    videoUrl={draft.youtubeUrl}
                    title={draft.titleKo}
                    externalSeekTime={seekTrigger}
                    onTimeChange={setCurrentPlaySeconds}
                    showPrecisionControls={true}
                    onCaptureTimecode={(sec) => handleQuickAddTimestampMemo(sec)}
                    captureButtonLabel="+ 타임스탬프 기록"
                  />
                </div>
              </div>

              {/* Right Column: Input fields and classifications */}
              <div className="lg:col-span-7 xl:col-span-6 space-y-4 px-0 lg:px-0">
                {/* URLs & Titles Container */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-0 sm:p-4 bg-transparent sm:bg-slate-50 rounded-none sm:rounded-2xl border-0 sm:border sm:border-slate-200">
                  <div className="md:col-span-12">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'ko' ? '유튜브 / 인스타그램 릴스 URL' : 'YouTube / Instagram Reel URL'}
                    </label>
                    <input
                      type="text"
                      value={draft.youtubeUrl}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData('text');
                        const urls = extractUrlsFromText(pasted);
                        if (urls.length > 0) {
                          e.preventDefault();
                          const cleanUrl = urls[0];
                          const ytId = extractYoutubeId(cleanUrl);
                          const igId = extractInstagramReelId(cleanUrl);
                          setDraft((prev) => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              youtubeUrl: cleanUrl,
                              youtubeId: ytId || (igId ? `ig-${igId}` : prev.youtubeId),
                              thumbnailUrl: ytId
                                ? getYoutubeThumbnail(ytId)
                                : igId
                                  ? getInstagramThumbnail(igId, prev.titleKo)
                                  : prev.thumbnailUrl,
                            };
                          });
                        }
                      }}
                      onChange={(e) => {
                        const url = e.target.value;
                        const ytId = extractYoutubeId(url);
                        const igId = extractInstagramReelId(url);
                        setDraft({
                          ...draft,
                          youtubeUrl: url,
                          youtubeId: ytId || (igId ? `ig-${igId}` : draft.youtubeId),
                          thumbnailUrl: ytId
                            ? getYoutubeThumbnail(ytId)
                            : igId
                              ? getInstagramThumbnail(igId, draft.titleKo)
                              : draft.thumbnailUrl,
                        });
                      }}
                      placeholder="https://www.youtube.com/watch?v=... 또는 https://www.instagram.com/reel/..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="md:col-span-12 lg:col-span-5">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'ko' ? '한글 기술명 (Korean Title)' : 'Korean Title'}
                    </label>
                    <input
                      type="text"
                      value={draft.titleKo}
                      onChange={(e) =>
                        setDraft({ ...draft, titleKo: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="md:col-span-12 lg:col-span-5">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'ko' ? '영문 기술명 (English Title)' : 'English Title'}
                    </label>
                    <input
                      type="text"
                      value={draft.titleEn}
                      onChange={(e) =>
                        setDraft({ ...draft, titleEn: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="md:col-span-12 lg:col-span-2 flex items-end">
                    <button
                      type="button"
                      disabled={isTranslating}
                      onClick={handleAutoTranslate}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {isTranslating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Languages className="w-3.5 h-3.5" />
                      )}
                      <span>{isTranslating ? (language === 'ko' ? 'AI 번역 중...' : 'Translating...') : (language === 'ko' ? '한↔영 번역' : 'Translate')}</span>
                    </button>
                  </div>
                </div>

                {/* Metadata Settings Card */}
                <div className="space-y-4 p-0 sm:p-4 bg-transparent sm:bg-white rounded-none sm:rounded-2xl border-0 sm:border sm:border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {language === 'ko' ? '기술 분류 메타데이터 지정' : 'Technique Taxonomy & Metadata'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenMetadataManager('positions')}
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{language === 'ko' ? '분류 항목 추가/수정/삭제 관리' : 'Manage Taxonomy'}</span>
                    </button>
                  </div>

                  {/* Grid fields layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Row 1: {language === 'ko' ? '시작 포지션' : 'Starting Position'} & 최종 포지션 */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {language === 'ko' ? '시작 포지션' : 'Starting Position'}
                      </label>
                      <PositionMultiSelect
                        values={draft.positions || (draft.position ? [draft.position] : [])}
                        value={draft.position}
                        onChange={(selectedList, primary) =>
                          setDraft({
                            ...draft,
                            position: primary,
                            positions: selectedList,
                          })
                        }
                        metadata={metadata}
                        variant="starting"
                        placeholder={language === 'ko' ? '시작 포지션 선택' : 'Select Starting Position'}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {language === 'ko' ? '도착 포지션' : 'Arrival Position'}
                      </label>
                      <EndPositionMultiSelect
                        draft={draft}
                        setDraft={setDraft}
                        metadata={metadata}
                      />
                    </div>

                    {/* Row 2: 기술 성격 (속성) */}
                    <div className="col-span-1 sm:col-span-2">
                      <CategorySelect
                        value={draft.category}
                        categories={draft.categories}
                        onChange={(cat, cats) =>
                          setDraft({ ...draft, category: cat, categories: cats })
                        }
                        metadataCategories={metadata.categories}
                        metadataSubmissions={metadata.submissions}
                        submissionDetail={draft.submissionDetail}
                        onSubmissionChange={(grp, det) =>
                          setDraft({
                            ...draft,
                            submissionGroup: grp,
                            submissionDetail: det,
                          })
                        }
                        showIcon={true}
                        label={language === 'ko' ? '기술 성격 (중복 선택 가능)' : 'Category'}
                      />
                    </div>

                    {/* Row 3: 도복구분 & 난이도 (밑으로 이동) */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        도복 구분
                      </label>
                      <select
                        value={draft.giType}
                        onChange={(e) =>
                          setDraft({ ...draft, giType: e.target.value })
                        }
                        className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-400"
                      >
                        {metadata.giTypes.map((gi) => (
                          <option key={gi} value={gi}>
                            {gi}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        난이도
                      </label>
                      <select
                        value={draft.difficulty}
                        onChange={(e) =>
                          setDraft({ ...draft, difficulty: e.target.value })
                        }
                        className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-400"
                      >
                        {metadata.difficulties.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                {onDelete ? (
                  isConfirmingDelete ? (
                    <div className="flex items-center gap-2 p-1 bg-rose-50 border border-rose-200 rounded-xl">
                      <span className="text-xs font-bold text-rose-700 px-2">정말 삭제하시겠습니까?</span>
                      <button
                        type="button"
                        onClick={() => onDelete(draft.id)}
                        className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        삭제 확인
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>영상 완전 삭제</span>
                    </button>
                  )
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentMode('view')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>수정사항 저장 후 완료</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enlarged Memo Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[88vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl p-2 flex flex-col"
          >
            <div className="flex items-center justify-between p-2 text-white border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300">
                타임라인 메모 첨부 이미지 확대
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto">
              <img
                src={previewImage}
                alt="확대 이미지"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
