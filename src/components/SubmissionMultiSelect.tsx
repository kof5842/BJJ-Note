import { useLanguage } from '../i18n/LanguageContext';
import { translateSubmissionDetail, translateSubmissionGroup } from '../utils/taxonomyTranslation';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Check, Search, RotateCcw } from 'lucide-react';
import { MetadataConfig, SubmissionGroupId } from '../types';
import { formatSubmissionDetails, parseSubmissionDetails, matchesChosungOrQuery } from '../utils/bjjAnalyzer';

interface SubmissionMultiSelectProps {
  selectedGroup: SubmissionGroupId | 'none';
  selectedDetail: string;
  metadata: MetadataConfig;
  onChange: (group: SubmissionGroupId | 'none', detailStr: string) => void;
  compact?: boolean;
}

export const SubmissionMultiSelect: React.FC<SubmissionMultiSelectProps> = ({
  selectedGroup,
  selectedDetail,
  metadata,
  onChange,
  compact = false,
}) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedList = parseSubmissionDetails(selectedDetail);

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

  const handleToggleItem = (group: SubmissionGroupId, item: string) => {
    const isSelected = selectedList.includes(item);
    let nextList: string[];

    if (isSelected) {
      nextList = selectedList.filter((x) => x !== item);
    } else {
      nextList = [...selectedList, item];
    }

    if (nextList.length === 0) {
      onChange('none', '미지정');
    } else {
      // Find the group of the first item
      let activeGroup: SubmissionGroupId = group;
      for (const grp of metadata.submissions) {
        if (grp.items.includes(nextList[0])) {
          activeGroup = grp.id;
          break;
        }
      }
      onChange(activeGroup, formatSubmissionDetails(nextList));
    }
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('none', '미지정');
  };

  const handleRemoveSingle = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const nextList = selectedList.filter((x) => x !== item);
    if (nextList.length === 0) {
      onChange('none', '미지정');
    } else {
      let activeGroup: SubmissionGroupId = selectedGroup === 'none' ? 'choke' : selectedGroup;
      for (const grp of metadata.submissions) {
        if (grp.items.includes(nextList[0])) {
          activeGroup = grp.id;
          break;
        }
      }
      onChange(activeGroup, formatSubmissionDetails(nextList));
    }
  };

  // Filter submission groups and items by search query (with Chosung support)
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return metadata.submissions;

    return metadata.submissions
      .map((grp) => {
        const matchingItems = grp.items.filter((item) =>
          matchesChosungOrQuery(item, query) || matchesChosungOrQuery(translateSubmissionDetail(item, language), query)
        );
        return {
          ...grp,
          items: matchingItems,
        };
      })
      .filter((grp) => grp.items.length > 0);
  }, [metadata.submissions, searchQuery, language]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button - Clean wrapping tags without text cutoffs */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1.5 ${
          compact
            ? 'px-2 py-1 text-xs min-h-[30px] rounded-lg'
            : 'px-3 py-2 text-xs min-h-[38px] rounded-xl'
        } border cursor-pointer transition-all ${
          selectedList.length > 0
            ? 'bg-rose-50/70 border-rose-300 text-rose-950 shadow-2xs hover:border-rose-400'
            : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1 min-w-0 flex-1">
          {selectedList.length === 0 ? (
            <span className="text-slate-400 font-medium select-none truncate whitespace-nowrap text-xs">
              {language === 'ko' ? '서브미션 피니시 선택' : 'Select Submission'}
            </span>
          ) : (
            selectedList.map((item) => (
              <span
                key={item}
                className={`inline-flex items-center gap-1 ${
                  compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'
                } rounded-md bg-white border border-rose-300 text-rose-950 font-bold shadow-2xs break-keep leading-tight shrink-0`}
              >
                <span>{translateSubmissionDetail(item, language)}</span>
                <span
                  role="button"
                  onClick={(e) => handleRemoveSingle(e, item)}
                  className="hover:text-rose-600 hover:bg-rose-100 rounded p-0.5 transition-colors cursor-pointer"
                  title={language === 'ko' ? "선택 해제" : "Remove"}
                >
                  <X className="w-3 h-3" />
                </span>
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-0.5">
          {selectedList.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[10px] sm:text-[11px] text-rose-600 hover:text-rose-800 font-bold px-1 py-0.5 rounded hover:bg-rose-100/80 transition-colors cursor-pointer whitespace-nowrap"
              title={language === 'ko' ? "선택한 서브미션 전체 {language === 'ko' ? '초기화' : 'Reset'}" : "Reset all selected"}
            >
              초기화
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-rose-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Multi-Select Modal Overlay - Fixed Overlay for 100% Unclipped View */}
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
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="font-bold text-slate-900 text-sm">
                  {language === 'ko' ? '서브미션 피니시 다중선택' : 'Select Submissions'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
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
                  placeholder={language === 'ko' ? "서브미션 검색 (예: ㅇㅂ, 트라이앵글, 리어네이키드...)" : "Search submissions (e.g. Triangle, Armbar, RNC...)"}
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors"
                />
              </div>

              {/* Quick TOP 5 Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                <span className="text-[10px] font-bold text-slate-400 shrink-0">🔥 인기 TOP 5:</span>
                {[
                  { name: '암바', grp: 'armlock' },
                  { name: '리어네이키드 초크', grp: 'choke' },
                  { name: '트라이앵글 초크', grp: 'choke' },
                  { name: '길로틴 초크', grp: 'choke' },
                  { name: '기무라락 / 숄더락', grp: 'armlock' },
                ].map((preset) => {
                  const isSelected = selectedList.includes(preset.name);
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleToggleItem(preset.grp, preset.name)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-600 shadow-3xs'
                          : 'bg-rose-50/70 hover:bg-rose-100 text-rose-900 border-rose-200/80'
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preset Groups */}
            <div className="space-y-3.5 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0 py-1">
              {filteredGroups.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {language === 'ko' ? `'${searchQuery}'에 일치하는 서브미션 항목이 없습니다.` : `No submissions match '${searchQuery}'.`}
                </div>
              ) : (
                filteredGroups.map((grp) => (
                  <div key={grp.id} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 px-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>
                        {grp.directionLabel} {translateSubmissionGroup(grp.id, language)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">
                        ({grp.items.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {grp.items.map((subItem) => {
                        const isChecked = selectedList.includes(subItem);
                        return (
                          <button
                            key={`${grp.id}-${translateSubmissionDetail(subItem, language)}`}
                            type="button"
                            onClick={() => handleToggleItem(grp.id, subItem)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border break-keep leading-tight ${
                              isChecked
                                ? 'bg-rose-50 text-rose-950 border-rose-400 shadow-2xs ring-1 ring-rose-300 font-bold'
                                : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="flex-1 pr-1 break-keep truncate">
                              {subItem}
                            </span>
                            {isChecked ? (
                              <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 ml-1 shadow-2xs">
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
                className="text-xs text-slate-500 hover:text-rose-600 font-semibold cursor-pointer transition-colors"
              >
                {language === 'ko' ? '미지정으로 전체 해제' : 'Unassign All'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-colors shadow-xs"
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
