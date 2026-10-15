import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Check, Search } from 'lucide-react';
import { MetadataConfig } from '../types';
import { matchesChosungOrQuery } from '../utils/bjjAnalyzer';
import { useLanguage } from '../i18n/LanguageContext';
import { translatePosition } from '../utils/taxonomyTranslation';
import { getSavedPositionGroupOrder, getSavedPositionGroupTitles } from '../data/bjjTaxonomy';

interface PositionMultiSelectProps {
  values?: string[];
  value?: string;
  onChange: (selected: string[], primary: string) => void;
  metadata: MetadataConfig;
  compact?: boolean;
  placeholder?: string;
  variant?: 'starting' | 'arrival';
  className?: string;
}

export const PositionMultiSelect: React.FC<PositionMultiSelectProps> = ({
  values,
  value,
  onChange,
  metadata,
  compact = false,
  placeholder,
  variant = 'starting',
  className = '',
}) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Normalize selected list from values or single value
  const selectedList = useMemo<string[]>(() => {
    if (values && Array.isArray(values) && values.length > 0) {
      return values.filter((p) => p && p !== 'none' && p !== '미지정');
    }
    if (value && value !== 'none' && value !== '미지정') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && s !== 'none' && s !== '미지정');
    }
    return [];
  }, [values, value]);

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
    onChange(nextArr, nextArr[0] || '');
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([], '');
  };

  const handleRemoveSingle = (e: React.MouseEvent, posName: string) => {
    e.stopPropagation();
    const nextArr = selectedList.filter((x) => x !== posName);
    onChange(nextArr, nextArr[0] || '');
  };

  // Grouped and filtered positions with Chosung search and saved group order
  const groupedPositions = useMemo(() => {
    const query = searchQuery.trim();
    const positionsToUse = query
      ? metadata.positions.filter((p) => matchesChosungOrQuery(p.name, query))
      : metadata.positions;

    const savedOrder = getSavedPositionGroupOrder();
    const savedTitles = getSavedPositionGroupTitles();
    const groups: Record<string, typeof metadata.positions> = {};

    positionsToUse.forEach((p) => {
      const rawGName = p.group || (language === 'ko' ? '기타 포지션' : 'Other Positions');
      const gName = savedTitles[rawGName] || rawGName;
      if (!groups[gName]) groups[gName] = [];
      groups[gName].push(p);
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
    });

    const orderedKeys: string[] = [];
    savedOrder.forEach((rawKey) => {
      const resolvedKey = savedTitles[rawKey] || rawKey;
      if (groups[resolvedKey] && !orderedKeys.includes(resolvedKey)) {
        orderedKeys.push(resolvedKey);
      } else if (groups[rawKey] && !orderedKeys.includes(rawKey)) {
        orderedKeys.push(rawKey);
      }
    });

    Object.keys(groups).forEach((key) => {
      if (!orderedKeys.includes(key)) {
        orderedKeys.push(key);
      }
    });

    return orderedKeys.map((groupName) => ({
      groupName,
      items: groups[groupName] || [],
    }));
  }, [metadata.positions, searchQuery, language, posGroupOrderVersion]);

  const defaultPlaceholder =
    variant === 'arrival'
      ? (language === 'ko' ? '도착 포지션' : 'Arrival Position')
      : (language === 'ko' ? '포지션' : 'Position');

  const activeColorClasses =
    variant === 'arrival'
      ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 hover:border-indigo-400'
      : 'bg-sky-50/80 border-sky-300 text-sky-950 hover:border-sky-400';

  const badgeColorClasses =
    variant === 'arrival'
      ? 'bg-indigo-200 text-indigo-800'
      : 'bg-sky-200 text-sky-800';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1.5 ${
          compact
            ? 'h-8 px-2 text-xs rounded-lg'
            : 'px-3 py-2 text-xs min-h-[38px] rounded-xl'
        } border cursor-pointer transition-all ${
          selectedList.length > 0
            ? `${activeColorClasses} shadow-2xs`
            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
          {selectedList.length === 0 ? (
            <span className="text-slate-400 font-medium select-none truncate whitespace-nowrap text-xs">
              {placeholder || defaultPlaceholder}
            </span>
          ) : compact ? (
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className={`font-bold truncate text-xs ${variant === 'arrival' ? 'text-indigo-950' : 'text-sky-950'}`}>
                {translatePosition(selectedList[0], language, metadata.positions)}
              </span>
              {selectedList.length > 1 && (
                <span className={`px-1 py-0.2 text-[9px] font-black rounded shrink-0 ${badgeColorClasses}`}>
                  +{selectedList.length - 1}
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1 min-w-0 flex-1">
              {selectedList.map((item) => (
                <span
                  key={item}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-white border font-bold shadow-2xs break-keep leading-tight shrink-0 ${
                    variant === 'arrival' ? 'border-indigo-300 text-indigo-950' : 'border-sky-300 text-sky-950'
                  }`}
                >
                  <span>{translatePosition(item, language, metadata.positions)}</span>
                  <span
                    role="button"
                    onClick={(e) => handleRemoveSingle(e, item)}
                    className="hover:text-rose-600 hover:bg-slate-100 rounded p-0.5 transition-colors cursor-pointer"
                    title={language === 'ko' ? '선택 해제' : 'Remove'}
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
              className="text-[10px] text-slate-400 hover:text-rose-600 font-bold p-0.5 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
              title={language === 'ko' ? '전체 해제' : 'Reset all'}
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-sky-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[220px]">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ko' ? '포지션 검색 (초성 ㄱㄷ)...' : 'Search position...'}
                className="w-full pl-7 pr-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                autoFocus
              />
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-2">
            {groupedPositions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {language === 'ko' ? '검색 결과가 없습니다' : 'No positions found'}
              </div>
            ) : (
              groupedPositions.map((group) => {
                if (group.items.length === 0) return null;
                return (
                  <div key={group.groupName} className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-50/60 rounded flex items-center justify-between">
                      <span>📁 {group.groupName}</span>
                      <span className="text-[9px] font-mono">{group.items.length}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-0.5">
                      {group.items.map((pos) => {
                        const isSelected = selectedList.includes(pos.name);
                        return (
                          <div
                            key={pos.id || pos.name}
                            onClick={() => handleToggleItem(pos.name)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                              isSelected
                                ? variant === 'arrival'
                                  ? 'bg-indigo-50 font-bold text-indigo-900'
                                  : 'bg-sky-50 font-bold text-sky-900'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{translatePosition(pos.name, language, metadata.positions)}</span>
                            {isSelected && (
                              <Check
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  variant === 'arrival' ? 'text-indigo-600' : 'text-sky-600'
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Summary / Done */}
          <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              {language === 'ko' ? '선택됨' : 'Selected'}: <strong className="text-slate-900 font-bold">{selectedList.length}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {language === 'ko' ? '완료' : 'Done'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
