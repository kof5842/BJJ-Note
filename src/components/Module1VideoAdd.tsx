import React, { useState } from 'react';
import {
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Trash2,
  Sliders,
  Clock,
  ArrowRight,
  Link2,
  Loader2,
  Play,
  FolderCheck,
  BookmarkCheck,
  X,
  ListVideo,
} from 'lucide-react';
import {
  MetadataConfig,
  SubmissionGroupId,
  TechniqueVideo,
} from '../types';
import {
  detectMetadataFromTitle,
  detectSubmissionFromTitle,
  extractUrlsFromText,
  extractYoutubeId,
  extractInstagramReelId,
  isInstagramUrl,
  getInstagramThumbnail,
  fetchYoutubeVideoTitle,
  fetchInstagramVideoTitle,
  getYoutubeThumbnail,
  translateBjjTitle,
  translateBjjTitleAsync,
  getEndPositionsArray,
  getScoreColorStyle,
} from '../utils/bjjAnalyzer';
import { useLanguage } from '../i18n/LanguageContext';
import { translatePosition, translateCategory, translateSubmissionDetail, translateGiType, translateDifficulty } from '../utils/taxonomyTranslation';
import { ProficiencyRater } from './ProficiencyRater';
import { SubmissionMultiSelect } from './SubmissionMultiSelect';
import { CategorySelect } from './CategorySelect';
import { fetchSharedVideoClassification, saveSharedVideoClassification } from '../services/archiveService';
import { getSavedPositionGroupOrder, getSavedPositionGroupTitles } from '../data/bjjTaxonomy';

interface Module1VideoAddProps {
  queueItems: TechniqueVideo[];
  existingVideos?: TechniqueVideo[];
  onUpdateQueue: (nextQueue: TechniqueVideo[]) => void;
  onCommitToArchive: (itemsToCommit: TechniqueVideo[]) => void;
  metadata: MetadataConfig;
  onOpenMetadataManager: (
    tab?: 'positions' | 'categories' | 'submissions' | 'gi_diff'
  ) => void;
  onOpenUnifiedEditor: (video: TechniqueVideo, isQueueItem: boolean) => void;
  primaryColor?: string;
}

export const Module1VideoAdd: React.FC<Module1VideoAddProps> = ({
  queueItems,
  existingVideos = [],
  onUpdateQueue,
  onCommitToArchive,
  metadata,
  onOpenMetadataManager,
  onOpenUnifiedEditor,
  primaryColor,
}) => {
  const { t, language } = useLanguage();
  const themeColor = primaryColor || '#0ea5e9';
  const [bulkInput, setBulkInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionFeedback, setExtractionFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
    duplicateTitles?: string[];
  } | null>(null);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // Synchronize with custom position group order & titles
  const [posGroupOrderVersion, setPosGroupOrderVersion] = useState(0);
  React.useEffect(() => {
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

  const handleExtractUrlsToQueue = async () => {
    // 1. Automatically filter out any non-URL text and only keep valid URLs
    const extractedUrls = extractUrlsFromText(bulkInput);
    if (extractedUrls.length === 0) {
      setExtractionFeedback({
        type: 'error',
        message: language === 'ko' ? '입력된 내용에서 유효한 영상 URL을 찾지 못했습니다. 유튜브(youtube.com, youtu.be) 또는 인스타그램 릴스 링크를 입력해주세요.' : 'No valid video URLs found. Please enter YouTube or Instagram Reels links.',
      });
      return;
    }

    // Auto-clean input field to only display filtered valid URLs
    setBulkInput(extractedUrls.join(' '));
    setIsExtracting(true);
    setExtractionFeedback(null);

    try {
      const newItems: TechniqueVideo[] = [];
      const duplicateTitles: string[] = [];
      const seenIds = new Set<string>();

      for (const url of extractedUrls) {
        const ytId = extractYoutubeId(url);
        const igId = extractInstagramReelId(url);
        const isInstagram = !!igId || isInstagramUrl(url);
        const effectiveId = ytId || (igId ? `ig-${igId}` : `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);

        // Clean canonical URL for registration (automatically strips non-URL text and messy query noise)
        const cleanRegistrationUrl = ytId
          ? `https://www.youtube.com/watch?v=${ytId}`
          : igId
            ? `https://www.instagram.com/reel/${igId}/`
            : url.trim();

        // 1. 영상 폴더(existingVideos) 내 동일 URL/ID 중복 검사
        const isDuplicateInArchive = existingVideos.find(
          (v) =>
            (ytId && v.youtubeId === ytId) ||
            (igId && (v.youtubeId === igId || v.youtubeId === `ig-${igId}`)) ||
            (v.youtubeUrl && (v.youtubeUrl.trim() === cleanRegistrationUrl || v.youtubeUrl.trim() === url.trim()))
        );

        // 2. 이미 대기 큐(queueItems)에 있는 경우 검사
        const isDuplicateInQueue = queueItems.find(
          (q) =>
            (ytId && q.youtubeId === ytId) ||
            (igId && (q.youtubeId === igId || q.youtubeId === `ig-${igId}`)) ||
            (q.youtubeUrl && (q.youtubeUrl.trim() === cleanRegistrationUrl || q.youtubeUrl.trim() === url.trim()))
        );

        // 3. 이번 일괄 입력 목록 내 중복 검사
        const isDuplicateInBatch = seenIds.has(effectiveId);

        if (isDuplicateInArchive || isDuplicateInQueue || isDuplicateInBatch) {
          const dupName = isDuplicateInArchive
            ? (language === 'ko' ? `[기존 영상 폴더] ${isDuplicateInArchive.titleKo} (${cleanRegistrationUrl})` : `[In Folders] ${isDuplicateInArchive.titleEn || isDuplicateInArchive.titleKo} (${cleanRegistrationUrl})`)
            : isDuplicateInQueue
              ? (language === 'ko' ? `[대기열 중복] ${isDuplicateInQueue.titleKo} (${cleanRegistrationUrl})` : `[In Queue] ${isDuplicateInQueue.titleEn || isDuplicateInQueue.titleKo} (${cleanRegistrationUrl})`)
              : (language === 'ko' ? `[동일 입력 중복] ${cleanRegistrationUrl}` : `[Duplicate Input] ${cleanRegistrationUrl}`);
          duplicateTitles.push(dupName);
          continue; // 중복 건은 등록 큐에 추가하지 않고 스킵!
        }

        seenIds.add(effectiveId);

        // ALWAYS fetch the real YouTube / Instagram title from the URL!
        let sourceTitle = '';
        if (isInstagram) {
          sourceTitle = await fetchInstagramVideoTitle(url, igId);
        } else {
          sourceTitle = await fetchYoutubeVideoTitle(url);
        }

        // Translate title into 100% natural Korean terminology (AI powered with local fallback)
        const { titleKo, titleEn } = await translateBjjTitleAsync(sourceTitle);
        const combinedTitleForAnalysis = `${sourceTitle} ${titleKo} ${titleEn}`;
        const subDetection = detectSubmissionFromTitle(
          combinedTitleForAnalysis,
          metadata
        );
        const metaDetection = detectMetadataFromTitle(
          combinedTitleForAnalysis,
          metadata
        );

        const thumbnailUrl = isInstagram
          ? getInstagramThumbnail(igId || effectiveId, titleKo)
          : getYoutubeThumbnail(effectiveId);

        // 4. Check if other users already classified this same video URL!
        const sharedClass = await fetchSharedVideoClassification(effectiveId);

        const positionToUse = (sharedClass?.position && sharedClass.position !== '미지정' && sharedClass.position !== '미분류')
          ? sharedClass.position
          : metaDetection.position;

        const categoryToUse = (sharedClass?.category && sharedClass.category !== '미분류' && sharedClass.category !== '미지정')
          ? sharedClass.category
          : metaDetection.category;

        const giTypeToUse = (sharedClass?.giType && sharedClass.giType !== '미분류')
          ? sharedClass.giType
          : metaDetection.giType;

        const difficultyToUse = (sharedClass?.difficulty && sharedClass.difficulty !== '미분류')
          ? sharedClass.difficulty
          : '미분류';

        const subGroupToUse = (sharedClass?.submissionGroup && sharedClass.submissionGroup !== 'none')
          ? sharedClass.submissionGroup
          : subDetection.submissionGroup;

        const subDetailToUse = (sharedClass?.submissionDetail && sharedClass.submissionDetail !== '미지정')
          ? sharedClass.submissionDetail
          : subDetection.submissionDetail;

        const endPositionToUse = sharedClass?.endPosition || '';
        const endPositionsToUse = sharedClass?.endPositions || [];

        newItems.push({
          id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          youtubeUrl: cleanRegistrationUrl,
          youtubeId: effectiveId,
          titleKo,
          titleEn,
          thumbnailUrl,
          position: positionToUse,
          category: categoryToUse,
          giType: giTypeToUse,
          difficulty: difficultyToUse,
          endPosition: endPositionToUse,
          endPositions: endPositionsToUse,
          submissionGroup: subGroupToUse,
          submissionDetail: subDetailToUse,
          proficiencyScore: 0,
          isFavorite: false,
          generalNotes: isInstagram ? '인스타그램 릴스 수련 영상' : '',
          timelineFrames: [],
          journalMemos: [],
          practiceDates: [],
          nextTechniqueIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      if (newItems.length > 0) {
        onUpdateQueue([...newItems, ...queueItems]);
        setBulkInput('');
        if (duplicateTitles.length > 0) {
          setExtractionFeedback({
            type: 'warning',
            message: language === 'ko' ? `총 ${newItems.length}개의 새로운 영상을 큐에 추가했습니다. (유튜브 제목/한글·영문 기술명 자동 연동 완료, 중복된 ${duplicateTitles.length}개 영상 제외)` : `Added ${newItems.length} new videos to queue. (Auto-translated, ${duplicateTitles.length} duplicates excluded)`,
            duplicateTitles,
          });
        } else {
          setExtractionFeedback({
            type: 'success',
            message: language === 'ko' ? `총 ${newItems.length}개의 영상 URL을 성공적으로 추출하여 등록 큐에 추가했습니다. (유튜브 영상 제목 및 한글·영문 기술명 자동 연동 완료)` : `Extracted ${newItems.length} video URLs to queue. (Title & metadata auto-synced)`,
          });
        }
      } else if (duplicateTitles.length > 0) {
        setExtractionFeedback({
          type: 'error',
          message: language === 'ko' ? `입력하신 모든 영상 URL(${duplicateTitles.length}건)이 이미 영상 폴더 또는 대기열에 등록되어 있어 중복 등록이 차단되었습니다.` : `All ${duplicateTitles.length} entered video URLs are already registered in folders or queue.`,
          duplicateTitles,
        });
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUpdateQueueItem = (
    id: string,
    patch: Partial<TechniqueVideo>
  ) => {
    onUpdateQueue(
      queueItems.map((item) =>
        item.id === id
          ? { ...item, ...patch, updatedAt: new Date().toISOString() }
          : item
      )
    );
  };

  const handleDeleteQueueItem = (id: string) => {
    onUpdateQueue(queueItems.filter((item) => item.id !== id));
  };

  const handleCommitSingle = (item: TechniqueVideo) => {
    const isDup = existingVideos.find(
      (v) =>
        (item.youtubeId && v.youtubeId === item.youtubeId) ||
        (item.youtubeUrl && v.youtubeUrl.trim() === item.youtubeUrl.trim())
    );
    if (isDup) {
      alert(language === 'ko' ? `이미 영상 폴더에 등록되어 있는 영상입니다:\n[${isDup.titleKo}]` : `This video is already in your video folders:\n[${isDup.titleEn || isDup.titleKo}]`);
      return;
    }
    saveSharedVideoClassification(item);
    onCommitToArchive([item]);
    setSaveNotification(language === 'ko' ? `'${item.titleKo}' 영상이 저장되었습니다.` : `Saved '${item.titleEn || item.titleKo}'.`);
    setTimeout(() => {
      setSaveNotification(null);
    }, 3500);
  };

  const handleCommitAll = () => {
    if (queueItems.length === 0) return;
    const count = queueItems.length;
    queueItems.forEach((item) => saveSharedVideoClassification(item));
    onCommitToArchive(queueItems);
    setSaveNotification(language === 'ko' ? `대기 중인 ${count}개 영상이 성공적으로 저장되었습니다.` : `Successfully saved ${count} queued videos.`);
    setTimeout(() => {
      setSaveNotification(null);
    }, 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification when Saved (does not navigate away) */}
      {saveNotification && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg font-bold text-sm">
          <BookmarkCheck className="w-5 h-5 text-emerald-200" />
          <span>{saveNotification}</span>
        </div>
      )}

      <div className="flex flex-row items-center justify-between gap-2">
        <div className="flex-1 flex items-center bg-white border border-slate-300 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-2xs focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition-all min-w-0">
          <span
            className="text-[11px] font-black px-2 py-0.5 rounded-lg border shrink-0 mr-2"
            style={{
              backgroundColor: `${themeColor}15`,
              color: themeColor,
              borderColor: `${themeColor}35`,
            }}
          >
            URL
          </span>
          <input
            type="text"
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            onPaste={(e) => {
              const pastedText = e.clipboardData.getData('text');
              const urls = extractUrlsFromText(pastedText);
              if (urls.length > 0) {
                e.preventDefault();
                // Automatically filter out non-URL text and keep only valid URLs!
                setBulkInput((prev) => {
                  const existing = extractUrlsFromText(prev);
                  const combined = Array.from(new Set([...existing, ...urls]));
                  return combined.join(' ');
                });
              }
            }}
            onBlur={() => {
              if (bulkInput.trim()) {
                const urls = extractUrlsFromText(bulkInput);
                if (urls.length > 0) {
                  setBulkInput(urls.join(' '));
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleExtractUrlsToQueue();
              }
            }}
            placeholder=""
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 focus:outline-none font-mono placeholder:text-slate-400 min-w-0"
          />
          {bulkInput.trim() && (
            <button
              type="button"
              onClick={() => setBulkInput('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer shrink-0 transition-colors ml-1"
              title={language === 'ko' ? "입력 내용 지우기" : "Clear Input"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleExtractUrlsToQueue}
          disabled={isExtracting || !bulkInput.trim()}
          className="flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 text-white text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-xs disabled:opacity-40 shrink-0"
          style={{ backgroundColor: themeColor }}
        >
          {isExtracting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-white" />
          )}
          <span>{language === 'ko' ? '추출' : 'Extract'}</span>
        </button>
      </div>

      {extractionFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
            extractionFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : extractionFeedback.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {extractionFeedback.type === 'error' ? (
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            ) : extractionFeedback.type === 'warning' ? (
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{extractionFeedback.message}</span>
          </div>
          {extractionFeedback.duplicateTitles && extractionFeedback.duplicateTitles.length > 0 && (
            <div className="pl-4 space-y-1 text-[11px] opacity-90">
              <div className="font-semibold">{language === 'ko' ? '제외된 중복 URL/영상 목록:' : 'Excluded duplicate URLs:'}</div>
              <ul className="list-disc list-inside space-y-0.5">
                {extractionFeedback.duplicateTitles.map((t, idx) => (
                  <li key={idx} className="truncate">{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900">
              {language === 'ko' ? '등록 대기' : 'Pending Queue'}
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-slate-800 rounded-full">
              {queueItems.length}
            </span>
          </div>

          {queueItems.length > 0 && (
            <button
              type="button"
              onClick={handleCommitAll}
              className="flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-xs hover:opacity-95"
              style={{ backgroundColor: themeColor }}
            >
              <FolderCheck className="w-4 h-4" />
              <span>{language === 'ko' ? '전체 저장' : 'Save All'}</span>
            </button>
          )}
        </div>

        {queueItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2.5 flex flex-col items-center justify-center">
            <PlusCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-800">
              {language === 'ko' ? '현재 등록 대기 큐가 비어 있습니다' : 'Queue is currently empty'}
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {language === 'ko' ? '위 입력창에 유튜브 또는 인스타그램 릴스 기술 영상 URL을 붙여넣고 상단의 [추출] 버튼을 눌러보세요.' : 'Paste YouTube or Instagram Reel URLs in the input above and click [Extract Videos].'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {queueItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4.5 transition-all hover:border-slate-300 shadow-2xs overflow-hidden"
              >
                {/* MOBILE VIEW (lg:hidden) - Clean, Compact & Perfectly Aligned */}
                <div className="lg:hidden space-y-3">
                  {/* Top: Thumbnail & Direct Inline Title Inputs */}
                  <div className="flex items-start gap-2.5">
                    <div
                      onClick={() => onOpenUnifiedEditor(item, true)}
                      className="group relative w-24 aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-200 cursor-pointer shrink-0 shadow-3xs"
                    >
                      {item.thumbnailUrl && (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.titleKo}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {(item.youtubeId?.startsWith('ig-') || isInstagramUrl(item.youtubeUrl || '')) && (
                        <span className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white text-[7px] font-bold">
                          Reels
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-5.5 h-5.5 rounded-full bg-black/60 text-white flex items-center justify-center shadow-xs">
                          <Play className="w-2.5 h-2.5 fill-white ml-0.2" />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <input
                        type="text"
                        value={item.titleKo}
                        onChange={(e) =>
                          handleUpdateQueueItem(item.id, {
                            titleKo: e.target.value,
                          })
                        }
                        placeholder={language === 'ko' ? "한글 기술명 입력..." : "Korean technique name..."}
                        className="w-full h-8 px-2.5 py-1 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-sky-500 truncate"
                      />
                      <input
                        type="text"
                        value={item.titleEn}
                        onChange={(e) =>
                          handleUpdateQueueItem(item.id, {
                            titleEn: e.target.value,
                          })
                        }
                        placeholder={language === 'ko' ? "영문 기술명 (선택)..." : "English technique name (opt)..."}
                        className="w-full h-7 px-2.5 py-0.5 text-[11px] font-mono text-slate-500 bg-slate-50/70 border border-slate-200/80 rounded-lg focus:bg-white focus:outline-none focus:border-sky-500 truncate"
                      />
                    </div>
                  </div>

                  {/* Score Rating Bar (Compact 1~10 Slim Row) */}
                  <div className="flex items-center gap-1.5 bg-slate-50/80 p-1.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 shrink-0 pl-0.5">
                      {language === 'ko' ? '숙련도:' : 'Score:'}
                    </span>
                    <div className="grid grid-cols-10 gap-0.5 flex-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                        const isSelected = item.proficiencyScore === val;
                        const isFilled = item.proficiencyScore >= val;
                        const color = getScoreColorStyle(val);
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              handleUpdateQueueItem(item.id, {
                                proficiencyScore: isSelected ? 0 : val,
                              })
                            }
                            className={`h-6 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                              isFilled
                                ? `${color.bgClass} ${color.borderClass} ${color.textClass} font-black shadow-3xs`
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            } ${isSelected ? 'ring-1.5 ring-slate-900 border-slate-900 scale-105 z-10' : ''}`}
                            title={language === 'ko' ? `${val}점` : `${val} pts`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                    {item.proficiencyScore > 0 ? (
                      <span className="text-[10px] font-black text-emerald-600 shrink-0 font-mono pr-0.5">
                        {item.proficiencyScore}{language === 'ko' ? '점' : ' pts'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 shrink-0 pr-0.5">
                        {language === 'ko' ? '미부여' : 'Unrated'}
                      </span>
                    )}
                  </div>

                  {/* Form Grid: Row 1 - 포지션 & 도착 포지션 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="h-4.5 flex items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-500 truncate">
                          {language === 'ko' ? '포지션' : 'Position'}
                        </label>
                      </div>
                      <select
                        value={item.position || ''}
                        onChange={(e) =>
                          handleUpdateQueueItem(item.id, {
                            position: e.target.value,
                            positions: e.target.value ? [e.target.value] : [],
                          })
                        }
                        className="w-full h-8 px-2 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-sky-500 truncate cursor-pointer"
                      >
                        <option value="">{language === 'ko' ? '포지션 선택' : 'Select Position'}</option>
                        {groupedPositions.map(([groupName, items]) => (
                          <optgroup key={groupName} label={`📁 ${groupName}`}>
                            {items.map((pos) => (
                              <option key={pos.name} value={pos.name}>
                                {translatePosition(pos.name, language, metadata.positions)}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="h-4.5 flex items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-500 truncate">
                          {language === 'ko' ? '도착 포지션' : 'Arrival Position'}
                        </label>
                      </div>
                      <select
                        value={item.endPosition || ''}
                        onChange={(e) =>
                          handleUpdateQueueItem(item.id, {
                            endPosition: e.target.value,
                            endPositions: e.target.value ? [e.target.value] : [],
                          })
                        }
                        className="w-full h-8 px-2 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-sky-500 truncate cursor-pointer"
                      >
                        <option value="">{language === 'ko' ? '도착 포지션 (선택)' : 'Arrival Position (Optional)'}</option>
                        {groupedPositions.map(([groupName, items]) => (
                          <optgroup key={groupName} label={`📁 ${groupName}`}>
                            {items.map((pos) => (
                              <option key={pos.name} value={pos.name}>
                                {translatePosition(pos.name, language, metadata.positions)}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Form Grid: Row 2 - 기술 (Full Width with compact category selector) */}
                  <div>
                    <CategorySelect
                      value={item.category}
                      categories={item.categories}
                      onChange={(cat, cats) =>
                        handleUpdateQueueItem(item.id, {
                          category: cat,
                          categories: cats,
                        })
                      }
                      metadataCategories={metadata.categories}
                      metadataSubmissions={metadata.submissions}
                      submissionDetail={item.submissionDetail}
                      onSubmissionChange={(grp, det) =>
                        handleUpdateQueueItem(item.id, {
                          submissionGroup: grp,
                          submissionDetail: det,
                        })
                      }
                      compact={true}
                      label={language === 'ko' ? '기술' : 'Technique'}
                    />
                  </div>

                  {/* Form Grid: Row 3 - 도복 구분 & 난이도 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="h-4.5 flex items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-500 truncate">
                          {language === 'ko' ? '도복 구분' : 'Gi / No-Gi'}
                        </label>
                      </div>
                      <select
                        value={item.giType}
                        onChange={(e) =>
                          handleUpdateQueueItem(item.id, {
                            giType: e.target.value,
                          })
                        }
                        className="w-full h-8 px-2 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-sky-500 truncate cursor-pointer"
                      >
                        {metadata.giTypes.map((gi) => (
                          <option key={gi} value={gi}>
                            {translateGiType(gi, language)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="h-4.5 flex items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-500 truncate">
                          {language === 'ko' ? '난이도' : 'Difficulty'}
                        </label>
                      </div>
                      <select
                        value={item.difficulty}
                        onChange={(e) =>
                          handleUpdateQueueItem(item.id, {
                            difficulty: e.target.value,
                          })
                        }
                        className="w-full h-8 px-2 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-sky-500 truncate cursor-pointer"
                      >
                        {metadata.difficulties.map((diff) => (
                          <option key={diff} value={diff}>
                            {translateDifficulty(diff, language)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleDeleteQueueItem(item.id)}
                      className="h-8 px-3 flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'ko' ? '삭제' : 'Delete'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCommitSingle(item)}
                      className="h-8 px-4 flex items-center gap-1.5 text-white text-xs font-black rounded-lg transition-colors cursor-pointer shadow-xs hover:opacity-95"
                      style={{ backgroundColor: themeColor }}
                    >
                      <FolderCheck className="w-3.5 h-3.5" />
                      <span>{language === 'ko' ? '영상 폴더 저장' : 'Save to Folders'}</span>
                    </button>
                  </div>
                </div>

                {/* DESKTOP VIEW (hidden lg:flex) - Streamlined, Aligned & High-Density */}
                <div className="hidden lg:flex items-start gap-4">
                  {/* Left: Compact Thumbnail */}
                  <div
                    onClick={() => onOpenUnifiedEditor(item, true)}
                    className="group relative w-44 xl:w-52 aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shrink-0 shadow-2xs"
                  >
                    {item.thumbnailUrl && (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.titleKo}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    )}
                    {(item.youtubeId?.startsWith('ig-') || isInstagramUrl(item.youtubeUrl || '')) && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white text-[9px] font-bold shadow-xs z-10">
                        Reels
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/15 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-black/60 group-hover:bg-sky-500 text-white flex items-center justify-center transition-colors shadow-xs">
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Right: Clean High-Density Form Controls */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Row 1: Titles & Action Buttons */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.titleKo}
                        onChange={(e) =>
                          handleUpdateQueueItem(item.id, {
                            titleKo: e.target.value,
                          })
                        }
                        placeholder={language === 'ko' ? "한글 기술명 입력..." : "Korean technique name..."}
                        className="h-8.5 flex-1 min-w-0 px-2.5 py-1 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-sky-500 truncate"
                      />
                      <input
                        type="text"
                        value={item.titleEn}
                        onChange={(e) =>
                          handleUpdateQueueItem(item.id, {
                            titleEn: e.target.value,
                          })
                        }
                        placeholder={language === 'ko' ? "영문 기술명 (선택)..." : "English technique name (opt)..."}
                        className="h-8.5 w-48 xl:w-60 px-2.5 py-1 text-[11px] font-mono text-slate-500 bg-slate-50/70 border border-slate-200/80 rounded-lg focus:bg-white focus:outline-none focus:border-sky-500 truncate"
                      />

                      <div className="flex items-center gap-1.5 shrink-0 pl-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteQueueItem(item.id)}
                          className="h-8.5 w-8.5 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={language === 'ko' ? "삭제" : "Delete"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCommitSingle(item)}
                          className="h-8.5 flex items-center gap-1.5 px-3.5 text-white text-xs font-black rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs hover:opacity-95"
                          style={{ backgroundColor: themeColor }}
                        >
                          <FolderCheck className="w-3.5 h-3.5" />
                          <span>{language === 'ko' ? '저장' : 'Save'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Metadata Grid (6 Columns: 1 + 2 + 1 + 1 + 1 = 6) */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
                      <div>
                        <div className="h-5 flex items-center mb-1">
                          <label className="block text-[10px] font-bold text-slate-500 truncate">
                            {language === 'ko' ? '포지션' : 'Position'}
                          </label>
                        </div>
                        <select
                          value={item.position || ''}
                          onChange={(e) =>
                            handleUpdateQueueItem(item.id, {
                              position: e.target.value,
                              positions: e.target.value ? [e.target.value] : [],
                            })
                          }
                          className="w-full h-8 px-2 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-sky-500 truncate cursor-pointer"
                        >
                          <option value="">{language === 'ko' ? '포지션 선택' : 'Select Position'}</option>
                          {groupedPositions.map(([groupName, items]) => (
                            <optgroup key={groupName} label={`📁 ${groupName}`}>
                              {items.map((pos) => (
                                <option key={pos.name} value={pos.name}>
                                  {translatePosition(pos.name, language, metadata.positions)}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <CategorySelect
                          value={item.category}
                          categories={item.categories}
                          onChange={(cat, cats) =>
                            handleUpdateQueueItem(item.id, {
                              category: cat,
                              categories: cats,
                            })
                          }
                          metadataCategories={metadata.categories}
                          metadataSubmissions={metadata.submissions}
                          submissionDetail={item.submissionDetail}
                          onSubmissionChange={(grp, det) =>
                            handleUpdateQueueItem(item.id, {
                              submissionGroup: grp,
                              submissionDetail: det,
                            })
                          }
                          compact={true}
                          label={language === 'ko' ? '기술' : 'Technique'}
                        />
                      </div>

                      <div>
                        <div className="h-5 flex items-center mb-1">
                          <label className="block text-[10px] font-bold text-slate-500 truncate">
                            {language === 'ko' ? '도착 포지션' : 'Arrival Position'}
                          </label>
                        </div>
                        <select
                          value={item.endPosition || ''}
                          onChange={(e) =>
                            handleUpdateQueueItem(item.id, {
                              endPosition: e.target.value,
                              endPositions: e.target.value ? [e.target.value] : [],
                            })
                          }
                          className="w-full h-8 px-2 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-sky-500 truncate cursor-pointer"
                        >
                          <option value="">{language === 'ko' ? '도착 포지션 (선택)' : 'Arrival Position (Optional)'}</option>
                          {groupedPositions.map(([groupName, items]) => (
                            <optgroup key={groupName} label={`📁 ${groupName}`}>
                              {items.map((pos) => (
                                <option key={pos.name} value={pos.name}>
                                  {translatePosition(pos.name, language, metadata.positions)}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="h-5 flex items-center mb-1">
                          <label className="block text-[10px] font-bold text-slate-500 truncate">
                            {language === 'ko' ? '도복 구분' : 'Gi / No-Gi'}
                          </label>
                        </div>
                        <select
                          value={item.giType}
                          onChange={(e) =>
                            handleUpdateQueueItem(item.id, {
                              giType: e.target.value,
                            })
                          }
                          className="w-full h-8 px-2 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-sky-500 truncate cursor-pointer"
                        >
                          {metadata.giTypes.map((gi) => (
                            <option key={gi} value={gi}>
                              {translateGiType(gi, language)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="h-5 flex items-center mb-1">
                          <label className="block text-[10px] font-bold text-slate-500 truncate">
                            {language === 'ko' ? '난이도' : 'Difficulty'}
                          </label>
                        </div>
                        <select
                          value={item.difficulty}
                          onChange={(e) =>
                            handleUpdateQueueItem(item.id, {
                              difficulty: e.target.value,
                            })
                          }
                          className="w-full h-8 px-2 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-sky-500 truncate cursor-pointer"
                        >
                          {metadata.difficulties.map((diff) => (
                            <option key={diff} value={diff}>
                              {translateDifficulty(diff, language)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 3: Slim Proficiency Rating & Finish Indicator */}
                    <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">
                          {language === 'ko' ? '숙련도:' : 'Score:'}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                            const isSelected = item.proficiencyScore === val;
                            const isFilled = item.proficiencyScore >= val;
                            const color = getScoreColorStyle(val);
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() =>
                                  handleUpdateQueueItem(item.id, {
                                    proficiencyScore: isSelected ? 0 : val,
                                  })
                                }
                                className={`w-5.5 h-5.5 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                                  isFilled
                                    ? `${color.bgClass} ${color.borderClass} ${color.textClass} font-black shadow-3xs`
                                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                                } ${isSelected ? 'ring-1.5 ring-slate-900 border-slate-900 scale-105 z-10' : ''}`}
                                title={language === 'ko' ? `${val}점` : `${val} pts`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                        {item.proficiencyScore > 0 ? (
                          <span className="text-[10px] font-black text-emerald-600 shrink-0 font-mono pl-1">
                            {item.proficiencyScore}{language === 'ko' ? '점' : ' pts'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 shrink-0 pl-1">
                            {language === 'ko' ? '미부여' : 'Unrated'}
                          </span>
                        )}
                      </div>

                      {item.submissionGroup !== 'none' && item.submissionDetail !== '미지정' && (
                        <div className="text-[11px] font-semibold text-rose-600 truncate max-w-xs shrink-0">
                          ✓ {language === 'ko' ? '피니시' : 'Finish'}: {translateSubmissionDetail(item.submissionDetail, language)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
