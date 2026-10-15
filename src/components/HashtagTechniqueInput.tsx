import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Tag, Sparkles, Folder, Check, Hash } from 'lucide-react';
import { MetadataConfig } from '../types';
import { matchesChosungOrQuery } from '../utils/bjjAnalyzer';
import { STANDARD_CATEGORY_GROUPS } from '../data/bjjTaxonomy';

export interface TaxonomyTechniqueItem {
  id: string;
  name: string;
  nameEn?: string;
  type: 'position' | 'category' | 'submission';
  groupName: string;
  badgeLabel: string;
  badgeColorClass: string;
  subGroupId?: string;
}

export function getAllTaxonomyTechniques(metadata: MetadataConfig): TaxonomyTechniqueItem[] {
  const items: TaxonomyTechniqueItem[] = [];
  const seen = new Set<string>();

  const addItem = (
    name: string,
    type: 'position' | 'category' | 'submission',
    groupName: string,
    badgeLabel: string,
    badgeColorClass: string,
    nameEn?: string,
    subGroupId?: string
  ) => {
    if (!name || name === '미분류' || seen.has(name.trim())) return;
    const cleanName = name.trim();
    seen.add(cleanName);
    items.push({
      id: `${type}-${items.length}-${cleanName}`,
      name: cleanName,
      nameEn,
      type,
      groupName,
      badgeLabel,
      badgeColorClass,
      subGroupId,
    });
  };

  // 1. Starting Positions & Position SubCategories from metadata (e.g. 이스케이프 & 리커버리 -> 암바, 새우빼기 등)
  (metadata.positions || []).forEach((pos) => {
    if (pos.name) {
      addItem(
        pos.name,
        'position',
        pos.group || '포지션',
        '포지션',
        'bg-indigo-100 text-indigo-700 border-indigo-200',
        pos.nameEn
      );
    }
    if (pos.subCategories && Array.isArray(pos.subCategories)) {
      pos.subCategories.forEach((sub) => {
        if (sub) {
          addItem(
            sub,
            'category',
            `${pos.name} 세부 기술`,
            pos.name.length > 8 ? '세부 기술' : pos.name,
            'bg-sky-100 text-sky-700 border-sky-200'
          );
        }
      });
    }
  });

  // 2. Action Category Techniques from standard groups
  STANDARD_CATEGORY_GROUPS.forEach((grp) => {
    grp.items.forEach((item) => {
      const isPass = grp.id.includes('pass');
      const isSweep = grp.id.includes('sweep');
      const isTakedown = grp.id.includes('takedown');
      const isEscape = grp.id.includes('escape');

      const colorClass = isPass
        ? 'bg-sky-100 text-sky-700 border-sky-200'
        : isSweep
        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
        : isTakedown
        ? 'bg-amber-100 text-amber-700 border-amber-200'
        : isEscape
        ? 'bg-orange-100 text-orange-700 border-orange-200'
        : 'bg-slate-100 text-slate-700 border-slate-200';

      addItem(item, 'category', grp.name, grp.name, colorClass);
    });
  });

  // 3. Custom Categories from metadata
  (metadata.categories || []).forEach((cat) => {
    addItem(
      cat,
      'category',
      '기술 분류',
      '기술',
      'bg-sky-100 text-sky-700 border-sky-200'
    );
  });

  // 4. Submissions from metadata
  (metadata.submissions || []).forEach((grp) => {
    (grp.items || []).forEach((sub) => {
      addItem(
        sub,
        'submission',
        grp.name,
        '서브미션',
        'bg-rose-100 text-rose-700 border-rose-200',
        undefined,
        grp.id
      );
    });
  });

  // 5. Guaranteed Core BJJ Techniques & Submissions (e.g. 암바, 기무라, 키무라, 트라이앵글 등)
  const CORE_TECHNIQUES = [
    { name: '암바', grp: 'armlock', label: '서브미션 > 암락' },
    { name: '암바 이스케이프', grp: 'escape', label: '이스케이프' },
    { name: '기무라', grp: 'armlock', label: '서브미션 > 암락' },
    { name: '키무라', grp: 'armlock', label: '서브미션 > 암락' },
    { name: '트라이앵글 초크', grp: 'choke', label: '서브미션 > 초크' },
    { name: '리버스 트라이앵글 초크', grp: 'choke', label: '서브미션 > 초크' },
    { name: '길로틴 초크', grp: 'choke', label: '서브미션 > 초크' },
    { name: '리어 네이키드 초크', grp: 'choke', label: '서브미션 > 초크' },
    { name: '오모플라타', grp: 'armlock', label: '서브미션 > 암락' },
    { name: '아킬레스 건 락', grp: 'leglock', label: '서브미션 > 레그락' },
    { name: '힐훅', grp: 'leglock', label: '서브미션 > 레그락' },
    { name: '토홀드', grp: 'leglock', label: '서브미션 > 레그락' },
    { name: '안클락', grp: 'leglock', label: '서브미션 > 레그락' },
  ];

  CORE_TECHNIQUES.forEach((s) => {
    addItem(
      s.name,
      s.grp === 'escape' ? 'category' : 'submission',
      s.label,
      s.grp === 'escape' ? '이스케이프' : '서브미션',
      s.grp === 'escape'
        ? 'bg-orange-100 text-orange-700 border-orange-200'
        : 'bg-rose-100 text-rose-700 border-rose-200',
      undefined,
      s.grp
    );
  });

  return items;
}

interface HashtagTechniqueInputProps {
  value: string;
  onChange: (newValue: string) => void;
  onSelectTechniqueTag?: (item: TaxonomyTechniqueItem) => void;
  metadata: MetadataConfig;
  placeholder?: string;
  rows?: number;
  className?: string;
  autoFocus?: boolean;
}

export const HashtagTechniqueInput: React.FC<HashtagTechniqueInputProps> = ({
  value,
  onChange,
  onSelectTechniqueTag,
  metadata,
  placeholder,
  rows = 2,
  className = '',
  autoFocus = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [hashtagStartIndex, setHashtagStartIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // All taxonomy techniques pool
  const allTechniques = useMemo(() => {
    return getAllTaxonomyTechniques(metadata);
  }, [metadata]);

  // Filtered technique items based on hashtagQuery
  const filteredTechniques = useMemo(() => {
    if (!isOpen) return [];
    const q = hashtagQuery.trim().toLowerCase();

    if (!q) {
      // If user just typed '#' without text, return popular top techniques across positions, categories, and submissions
      return allTechniques.slice(0, 16);
    }

    const matched = allTechniques.filter((item) => {
      if (matchesChosungOrQuery(item.name, q)) return true;
      if (item.nameEn && item.nameEn.toLowerCase().includes(q)) return true;
      if (item.groupName.toLowerCase().includes(q)) return true;
      return false;
    });

    const exactMatch = matched.some(
      (m) => m.name.toLowerCase().trim() === q.toLowerCase()
    );

    if (!exactMatch && q.length > 0) {
      const customItem: TaxonomyTechniqueItem = {
        id: `custom-tag-${q}`,
        name: hashtagQuery.trim(),
        type: 'category',
        groupName: '커스텀 해시태그',
        badgeLabel: '신규 태그',
        badgeColorClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      };
      return [customItem, ...matched].slice(0, 18);
    }

    return matched.slice(0, 18);
  }, [allTechniques, isOpen, hashtagQuery]);

  // Check cursor position and detect '#' query
  const checkHashtagTrigger = useCallback(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.slice(0, cursorPos);

    // Look for '#' followed by non-whitespace characters right at cursor
    const match = textBeforeCursor.match(/#([^\s#]*)$/);
    if (match) {
      const query = match[1];
      const startIndex = match.index ?? -1;
      setHashtagQuery(query);
      setHashtagStartIndex(startIndex);
      setIsOpen(true);
      setSelectedIndex(0);
    } else {
      setIsOpen(false);
      setHashtagQuery('');
      setHashtagStartIndex(-1);
    }
  }, []);

  const handleSelectTechnique = useCallback(
    (item: TaxonomyTechniqueItem) => {
      if (!textareaRef.current || hashtagStartIndex < 0) return;
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;

      const beforeHash = value.slice(0, hashtagStartIndex);
      const afterCursor = value.slice(cursorPos);
      const insertedTag = `#${item.name} `;
      const nextValue = `${beforeHash}${insertedTag}${afterCursor}`;

      onChange(nextValue);
      setIsOpen(false);
      setHashtagQuery('');
      setHashtagStartIndex(-1);

      if (onSelectTechniqueTag) {
        onSelectTechniqueTag(item);
      }

      // Re-focus and set cursor position after inserted hashtag
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeHash.length + insertedTag.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    },
    [value, hashtagStartIndex, onChange, onSelectTechniqueTag]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isOpen || filteredTechniques.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredTechniques.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + filteredTechniques.length) % filteredTechniques.length
      );
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const target = filteredTechniques[selectedIndex];
      if (target) {
        handleSelectTechnique(target);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll active item into view inside dropdown
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;
    const activeEl = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          checkHashtagTrigger();
        }}
        onKeyUp={checkHashtagTrigger}
        onClick={checkHashtagTrigger}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className={className}
      />

      {/* Floating Hashtag Suggestions Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-indigo-200/90 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-64 flex flex-col"
          style={{ minWidth: '280px' }}
        >
          {/* Header */}
          <div className="px-3 py-2 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-indigo-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900">
              <Hash className="w-3.5 h-3.5 text-indigo-600" />
              <span>포지션 분류 기술 태그</span>
              {hashtagQuery && (
                <span className="font-mono text-[11px] text-indigo-600 font-bold bg-indigo-100/70 px-1.5 py-0.2 rounded">
                  #{hashtagQuery}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              선택 시 해당 폴더로 자동 분류
            </span>
          </div>

          {/* List of Suggestions */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-1">
            {filteredTechniques.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                "{hashtagQuery}"와 일치하는 기술이 없습니다.
              </div>
            ) : (
              filteredTechniques.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    data-index={idx}
                    type="button"
                    onMouseDown={(e) => {
                      // Prevent blur so selection works smoothly
                      e.preventDefault();
                      handleSelectTechnique(item);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 text-xs rounded-xl transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/90 text-indigo-950 font-bold'
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${item.badgeColorClass}`}
                      >
                        {item.badgeLabel}
                      </span>
                      <span className="truncate">{item.name}</span>
                      {item.nameEn && (
                        <span className="text-[11px] text-slate-400 font-normal truncate hidden sm:inline">
                          ({item.nameEn})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-slate-400">
                      <span className="hidden sm:inline font-mono">
                        {item.groupName}
                      </span>
                      <Folder className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Guide */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
            <span>↑↓ 이동 · Enter / Tab 선택</span>
            <span>Esc 닫기</span>
          </div>
        </div>
      )}
    </div>
  );
};
