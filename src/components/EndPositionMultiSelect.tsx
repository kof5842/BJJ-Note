import { useLanguage } from '../i18n/LanguageContext';
import { translatePosition } from '../utils/taxonomyTranslation';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Check, Search, Sparkles } from 'lucide-react';
import { MetadataConfig } from '../types';
import { getEndPositionsArray, matchesChosungOrQuery } from '../utils/bjjAnalyzer';

interface EndPositionMultiSelectProps {
  draft: any;
  setDraft: (d: any) => void;
  metadata: MetadataConfig;
  compact?: boolean;
}

export const EndPositionMultiSelect: React.FC<EndPositionMultiSelectProps> = ({
  draft,
  setDraft,
  metadata,
  compact = false,
}) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedList = useMemo(() => getEndPositionsArray(draft), [draft]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleItem = (posName: string) => {
    const isSelected = selectedList.includes(posName);
    const nextArr = isSelected
      ? selectedList.filter((x) => x !== posName)
      : [...selectedList, posName];
    setDraft({
      ...draft,
      endPositions: nextArr,
      endPosition: nextArr.join(', '),
    });
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft({
      ...draft,
      endPositions: [],
      endPosition: '',
    });
  };

  const handleRemoveSingle = (e: React.MouseEvent, posName: string) => {
    e.stopPropagation();
    const nextArr = selectedList.filter((x) => x !== posName);
    setDraft({
      ...draft,
      endPositions: nextArr,
      endPosition: nextArr.join(', '),
    });
  };

  // Grouped and filtered positions with Chosung search support
  const groupedPositions = useMemo(() => {
    const query = searchQuery.trim();
    const positionsToUse = query
      ? metadata.positions.filter((p) => matchesChosungOrQuery(p.name, query))
      : metadata.positions;

    const groups: Record<string, typeof metadata.positions> = {};
    positionsToUse.forEach((p) => {
      const gName = p.group || (language === 'ko' ? '기타 포지션' : 'Other Positions');
      if (!groups[gName]) groups[gName] = [];
      groups[gName].push(p);
    });

    return Object.entries(groups).map(([groupName, items]) => ({
      groupName,
      items,
    }));
  }, [metadata.positions, searchQuery, language]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button - Clean wrapping tags */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1.5 ${
          compact
            ? 'h-8 px-2 text-xs rounded-lg'
            : 'px-3 py-2 text-xs min-h-[38px] rounded-xl'
        } border cursor-pointer transition-all ${
          selectedList.length > 0
            ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 shadow-2xs hover:border-indigo-400'
            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-sky-500'
        }`}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
          {selectedList.length === 0 ? (
            <span className="text-slate-400 font-medium select-none truncate whitespace-nowrap text-xs">
              {language === 'ko' ? '도착 포지션 선택' : 'Select End Position'}
            </span>
          ) : compact ? (
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="font-bold text-indigo-900 truncate text-xs">
                {translatePosition(selectedList[0], language, metadata.positions)}
              </span>
              {selectedList.length > 1 && (
                <span className="px-1 py-0.2 text-[9px] font-black bg-indigo-200 text-indigo-800 rounded shrink-0">
                  +{selectedList.length - 1}
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1 min-w-0 flex-1">
              {selectedList.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-white border border-indigo-300 text-indigo-950 font-bold shadow-2xs break-keep leading-tight shrink-0"
                >
                  <span>{translatePosition(item, language, metadata.positions)}</span>
                  <span
                    role="button"
                    onClick={(e) => handleRemoveSingle(e, item)}
                    className="hover:text-indigo-600 hover:bg-indigo-100 rounded p-0.5 transition-colors cursor-pointer"
                    title={language === 'ko' ? "선택 해제" : "Remove"}
                  >
                    <X className="w-3 h-3" />
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-0.5">
          {selectedList.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[10px] text-indigo-600 hover:text-rose-600 font-bold px-1 py-0.5 rounded hover:bg-indigo-100 transition-colors cursor-pointer whitespace-nowrap"
              title={language === 'ko' ? "선택 해제" : "Reset all"}
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu - Fixed Modal Overlay for 100% Unclipped View */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full sm:w-[480px] md:w-[520px] max-h-[85vh] bg-white rounded-2xl border border-slate-300 shadow-2xl p-4 space-y-3 text-slate-900 animate-in zoom-in-95 duration-150 overflow-hidden flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="font-bold text-slate-900 text-sm">
                  {language === 'ko' ? '최종 포지션 다중선택' : 'Select End Positions'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {language === 'ko' ? `선택됨: ${selectedList.length}개` : `Selected: ${selectedList.length}`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title={language === 'ko' ? "닫기" : "Close"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative shrink-0 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'ko' ? "포지션 검색 (예: ㅁㅇㅌ, 사이드, 가드...)" : "Search positions (e.g. Mount, Side, Guard...)"}
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                />
              </div>

              {/* Quick TOP Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                <span className="text-[10px] font-bold text-slate-400 shrink-0">자주 쓰는 포지션:</span>
                {[
                  '풀 마운트',
                  '백 컨트롤 / 백 마운트',
                  '사이드 컨트롤',
                  '클로즈드 가드',
                  '하프 가드',
                ].map((preset) => {
                  const isSelected = selectedList.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleToggleItem(preset)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-3xs'
                          : 'bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 border-indigo-200/80'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preset Groups */}
            <div className="space-y-3.5 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0 py-1">
              {groupedPositions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {language === 'ko' ? `'${searchQuery}'에 일치하는 포지션 항목이 없습니다.` : `No positions match '${searchQuery}'.`}
                </div>
              ) : (
                groupedPositions.map((grp) => (
                  <div key={grp.groupName} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 px-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>{language === 'ko' ? grp.groupName : (grp.groupName === '스탠딩 및 특수 포지션' ? 'Standing & Special' : grp.groupName === '탑 & 도미넌트 (상위)' ? 'Top & Dominant' : grp.groupName === '가드 포지션 (하위)' ? 'Guard Positions' : grp.groupName)}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">
                        ({grp.items.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {grp.items.map((p) => {
                        const isChecked = selectedList.includes(p.name);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleToggleItem(p.name)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border break-keep leading-tight ${
                              isChecked
                                ? 'bg-indigo-50 text-indigo-950 border-indigo-400 shadow-2xs ring-1 ring-indigo-300 font-bold'
                                : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="flex-1 pr-1 break-keep truncate">{translatePosition(p.name, language, metadata.positions)}</span>
                            {isChecked ? (
                              <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 ml-1 shadow-2xs">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            ) : (
                              <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0 ml-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Controls */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-slate-500 hover:text-indigo-600 font-semibold cursor-pointer transition-colors"
              >
                {language === 'ko' ? '전체 해제' : 'Clear All'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-colors shadow-xs"
              >
                {language === 'ko' ? `선택 완료 (${selectedList.length}개)` : `Done (${selectedList.length} selected)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
