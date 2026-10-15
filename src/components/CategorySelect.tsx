import React, { useState, useEffect, useMemo, useRef } from 'react';
import { STANDARD_CATEGORY_GROUPS, getSavedCategoryGroups, getSavedCategoryGroupTitles, CategoryFolderGroup } from '../data/bjjTaxonomy';
import { useLanguage } from '../i18n/LanguageContext';
import { translateCategory, translateCategoryGroup } from '../utils/taxonomyTranslation';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { SubmissionCompassGroup, SubmissionGroupId } from '../types';

export interface CategoryRow {
  group: string;
  detail: string;
}

export interface CategorySelectProps {
  value?: string;
  categories?: string[];
  onChange: (primaryCategory: string, allCategories?: string[]) => void;
  metadataCategories?: string[];
  metadataSubmissions?: SubmissionCompassGroup[];
  submissionDetail?: string;
  onSubmissionChange?: (group: SubmissionGroupId | 'none', detail: string) => void;
  compact?: boolean;
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  categories = [],
  onChange,
  metadataCategories = [],
  metadataSubmissions = [],
  submissionDetail = '',
  onSubmissionChange,
  compact = false,
  className = '',
  showIcon = false,
  label,
}) => {
  const { language } = useLanguage();
  const [categoryGroups, setCategoryGroups] = useState<CategoryFolderGroup[]>(() => getSavedCategoryGroups());
  const [customGroupTitles, setCustomGroupTitles] = useState<Record<string, string>>(() => getSavedCategoryGroupTitles());

  useEffect(() => {
    const handleSync = () => {
      setCategoryGroups(getSavedCategoryGroups());
      setCustomGroupTitles(getSavedCategoryGroupTitles());
    };
    window.addEventListener('bjj_taxonomy_groups_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('bjj_taxonomy_groups_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const matchGroupObj = (groupName: string): CategoryFolderGroup | undefined => {
    if (!groupName) return undefined;
    const trimmed = groupName.trim();
    // 1. Exact match by name or id
    const exact = categoryGroups.find((g) => g.name === trimmed || g.id === trimmed);
    if (exact) return exact;
    // 2. Match custom title
    for (const [id, customTitle] of Object.entries(customGroupTitles)) {
      if (trimmed === customTitle) {
        return categoryGroups.find((g) => g.id === id);
      }
    }
    // 3. Normalized keyword match
    if (trimmed.includes('테이크다운')) return categoryGroups.find((g) => g.id.includes('takedown'));
    if (trimmed.includes('패스')) return categoryGroups.find((g) => g.id.includes('pass'));
    if (trimmed.includes('스윕')) return categoryGroups.find((g) => g.id.includes('sweep'));
    if (trimmed.includes('이스케이프')) return categoryGroups.find((g) => g.id.includes('escape'));
    if (trimmed.includes('기타')) return categoryGroups.find((g) => g.id.includes('core'));
    return categoryGroups.find((g) => g.name.includes(trimmed) || trimmed.includes(g.name));
  };

  const parseCategoryString = (catStr: string): CategoryRow => {
    let trimmed = (catStr || '').trim();
    if (trimmed === '핵심 연계 및 기타 속성' || trimmed === '핵심 연계 및 기타') {
      trimmed = '기타';
    }
    if (trimmed === '서브미션') {
      return { group: '서브미션', detail: submissionDetail || '' };
    }
    // Check if trimmed matches any custom group title
    for (const [id, customTitle] of Object.entries(customGroupTitles)) {
      if (trimmed === customTitle) {
        const matchedGrp = categoryGroups.find((g) => g.id === id);
        return { group: matchedGrp ? matchedGrp.name : customTitle, detail: '' };
      }
    }
    const matchMain = categoryGroups.find((g) => g.name === trimmed);
    if (matchMain) {
      return { group: matchMain.name, detail: '' };
    }
    for (const group of categoryGroups) {
      if (group.items.includes(trimmed)) {
        return { group: group.name, detail: trimmed };
      }
    }
    const subItems = metadataSubmissions ? metadataSubmissions.flatMap((g) => g.items) : [];
    if (subItems.includes(trimmed)) {
      return { group: '서브미션', detail: trimmed };
    }
    return { group: '기타', detail: metadataCategories.includes(trimmed) ? trimmed : '' };
  };

  const initialRows = useMemo<CategoryRow[]>(() => {
    if (categories && categories.length > 0) {
      return categories.map((c) => parseCategoryString(c));
    }
    if (value) {
      return [parseCategoryString(value)];
    }
    return [{ group: categoryGroups[0]?.name || '테이크다운', detail: '' }];
  }, [value, categories, submissionDetail, metadataSubmissions, metadataCategories, categoryGroups]);

  const [rows, setRows] = useState<CategoryRow[]>(initialRows);
  const categoriesKey = (categories && categories.length > 0)
    ? categories.join('|||')
    : (value || '');
  const lastSyncKeyRef = useRef<string>(categoriesKey);

  useEffect(() => {
    if (categoriesKey === lastSyncKeyRef.current) return;
    lastSyncKeyRef.current = categoriesKey;

    if (categories && categories.length > 0) {
      const parsed = categories.map((c) => parseCategoryString(c));
      setRows(parsed);
    } else if (value) {
      const parsed = parseCategoryString(value);
      setRows([parsed]);
    } else {
      setRows([{ group: categoryGroups[0]?.name || '테이크다운', detail: '' }]);
    }
  }, [categoriesKey, categoryGroups]);

  const notifyChange = (updatedRows: CategoryRow[]) => {
    const categoryStrings = updatedRows.map((r) => (r.detail ? r.detail : r.group));
    const primaryCat = categoryStrings[0] || '기타';
    lastSyncKeyRef.current = categoryStrings.length > 0 ? categoryStrings.join('|||') : primaryCat;
    onChange(primaryCat, categoryStrings);
  };

  const handleGroupChange = (index: number, newGroup: string) => {
    const updated = rows.map((r, idx) => (idx === index ? { group: newGroup, detail: '' } : r));
    setRows(updated);
    notifyChange(updated);
  };

  const handleDetailChange = (index: number, newDetail: string) => {
    const updated = rows.map((r, idx) => (idx === index ? { ...r, detail: newDetail } : r));
    setRows(updated);
    notifyChange(updated);

    if (index === 0 && updated[0].group === '서브미션' && onSubmissionChange) {
      if (!newDetail) {
        onSubmissionChange('none', '');
      } else {
        let foundGrpId: SubmissionGroupId = 'choke';
        for (const grp of metadataSubmissions) {
          if (grp.items.includes(newDetail)) {
            foundGrpId = grp.id;
            break;
          }
        }
        onSubmissionChange(foundGrpId, newDetail);
      }
    }
  };

  const handleAddRow = () => {
    const updated = [...rows, { group: categoryGroups[0]?.name || '기타', detail: '' }];
    setRows(updated);
    notifyChange(updated);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return;
    const updated = rows.filter((_, idx) => idx !== index);
    setRows(updated);
    notifyChange(updated);
  };

  return (
    <div className={`${compact ? 'space-y-1' : 'space-y-2'} ${className}`}>
      {label && (
        <div className="flex items-center justify-between h-5 mb-1">
          <label className={`block ${compact ? 'text-[10px]' : 'text-[11px]'} font-bold text-slate-500 flex items-center gap-1 truncate`}>
            {showIcon && <Tag className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
            <span className="truncate">{label}</span>
          </label>
          <button
            type="button"
            onClick={handleAddRow}
            className={`flex items-center gap-0.5 ${compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'} font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors cursor-pointer shrink-0`}
          >
            <Plus className="w-2.5 h-2.5" />
            <span>{language === 'ko' ? '+ 기술 추가' : '+ Add'}</span>
          </button>
        </div>
      )}

      <div className={`${compact ? 'space-y-1' : 'space-y-2'}`}>
        {rows.map((row, index) => {
          let availableItems: string[] = [];
          if (row.group === '서브미션') {
            availableItems = metadataSubmissions ? metadataSubmissions.flatMap((g) => g.items) : [];
          } else {
            const grpObj = matchGroupObj(row.group);
            if (grpObj) {
              availableItems = [...grpObj.items];
            } else {
              availableItems = [];
            }
          }

          return (
            <div
              key={index}
              className={
                compact
                  ? 'flex items-center gap-1'
                  : 'flex items-center gap-1.5 bg-slate-50/70 p-1.5 rounded-xl border border-slate-200/90 shadow-3xs'
              }
            >
              <div className="grid grid-cols-2 gap-1 flex-1">
                <select
                  value={row.group}
                  onChange={(e) => handleGroupChange(index, e.target.value)}
                  className={`w-full ${
                    compact ? 'h-8 px-2 py-1 text-xs' : 'px-2 py-1 text-xs'
                  } font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-sky-500 truncate cursor-pointer`}
                  title={language === 'ko' ? '대주제 기술' : 'Main Technique'}
                >
                  {categoryGroups.map((grp) => {
                    const title = customGroupTitles[grp.id] || customGroupTitles[grp.name] || translateCategoryGroup(grp.name, language);
                    return (
                      <option key={grp.id} value={grp.name}>
                        📁 {title}
                      </option>
                    );
                  })}
                  <option value="서브미션">
                    📁 {customGroupTitles['cat-grp-submission'] || (language === 'ko' ? '서브미션' : 'Submissions')}
                  </option>
                </select>

                <select
                  value={row.detail}
                  onChange={(e) => handleDetailChange(index, e.target.value)}
                  className={`w-full ${
                    compact ? 'h-8 px-2 py-1 text-xs' : 'px-2 py-1 text-xs'
                  } font-semibold rounded-lg focus:outline-none truncate cursor-pointer ${
                    row.detail
                      ? 'bg-sky-50 text-sky-900 border border-sky-300 font-bold'
                      : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-white'
                  }`}
                  title={row.group === '서브미션' ? (language === 'ko' ? '서브미션 세부 피니시' : 'Submission Finish') : (language === 'ko' ? '세부 디테일 기술 (옵션)' : 'Optional Sub-Category')}
                >
                  <option value="">
                    {row.group === '서브미션' 
                      ? (language === 'ko' ? '서브미션 선택...' : 'Select Submission...') 
                      : (language === 'ko' ? '세부 선택 안함 (기본)' : 'No Detail (Default)')}
                  </option>
                  {row.group === '서브미션' ? (
                    metadataSubmissions.map((grp) => (
                      <optgroup key={grp.id} label={`📁 ${grp.name}`}>
                        {grp.items.map((item) => (
                          <option key={item} value={item}>
                            └ {item}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  ) : (
                    availableItems.map((item) => (
                      <option key={item} value={item}>
                        └ {translateCategory(item, language)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveRow(index)}
                  className={`${
                    compact ? 'h-8 w-6' : 'p-1'
                  } flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0`}
                  title={language === 'ko' ? '삭제' : 'Delete'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
