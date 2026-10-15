import { useLanguage } from '../i18n/LanguageContext';
import { translatePosition, translateCategory, translateSubmissionGroup, translateSubmissionDetail } from '../utils/taxonomyTranslation';
import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  ArrowUp,
  ArrowDown,
  FolderCog,
  Compass,
  Layers,
  Award,
  Shield,
  Crown,
  Zap,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Folder,
} from 'lucide-react';
import { MetadataConfig, SubmissionGroupId } from '../types';
import {
  BJJ_CORE_TAXONOMY,
  applyCoreTaxonomyToMetadata,
  STANDARD_CATEGORY_GROUPS,
} from '../data/bjjTaxonomy';

interface MetadataManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: MetadataConfig;
  onUpdateMetadata: (
    next: MetadataConfig,
    renamedMap?: { type: 'position' | 'category' | 'submission'; oldName: string; newName: string }
  ) => void;
  initialTab?: 'positions' | 'categories' | 'submissions' | 'gi_diff' | 'taxonomy';
  primaryColor?: string;
}

export const MetadataManagerModal: React.FC<MetadataManagerModalProps> = ({
  isOpen,
  onClose,
  metadata,
  onUpdateMetadata,
  initialTab = 'positions',
  primaryColor,
}) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    'positions' | 'categories' | 'submissions' | 'gi_diff' | 'taxonomy'
  >(initialTab);

  const [newPosName, setNewPosName] = useState('');
  const [newPosNameEn, setNewPosNameEn] = useState('');
  const [newPosGroup, setNewPosGroup] = useState<string>('가드');
  const [selectedPosFilterGroup, setSelectedPosFilterGroup] = useState<string>('ALL');
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [editingPosValue, setEditingPosValue] = useState('');

  const [taxonomyFeedback, setTaxonomyFeedback] = useState<string | null>(null);
  const [highlightedItemName, setHighlightedItemName] = useState<string | null>(null);
  const [expandedTaxSections, setExpandedTaxSections] = useState<Record<string, boolean>>({
    'sec-positions-standing': true,
    'sec-positions-dominant': true,
    'sec-positions-guard': true,
    'sec-takedown': true,
    'sec-pass': true,
    'sec-sweep': true,
    'sec-escape': true,
    'sec-upper-sub': true,
    'sec-lower-sub': true,
  });

  const handleNavigateToTaxonomyItem = (
    sec: typeof BJJ_CORE_TAXONOMY[0],
    item: { name: string; nameEn?: string; targetSubGroup?: string }
  ) => {
    const itemName = item.name;

    // Check 1: Position match
    const matchedPos = metadata.positions.find(
      (p) => p.name === itemName || p.name.includes(itemName) || itemName.includes(p.name)
    );
    if (matchedPos || sec.category === 'positions') {
      setActiveTab('positions');
      setSelectedPosFilterGroup('ALL');
      setHighlightedItemName(matchedPos?.name || itemName);
      setTimeout(() => {
        const targetId = matchedPos?.id || `modal-pos-card-${itemName}`;
        const el = document.getElementById(`modal-pos-${targetId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      return;
    }

    // Check 2: Submission match
    const matchedSubGroup = metadata.submissions.find((grp) =>
      grp.items.some((i) => i === itemName || i.includes(itemName) || itemName.includes(i))
    );
    if (
      matchedSubGroup ||
      item.targetSubGroup ||
      sec.category === 'upper_sub' ||
      sec.category === 'lower_sub'
    ) {
      const subGroupId =
        matchedSubGroup?.id ||
        item.targetSubGroup ||
        (sec.category === 'upper_sub' ? 'choke' : 'leglock');
      setActiveTab('submissions');
      setSelectedSubGroup(subGroupId as SubmissionGroupId);
      setHighlightedItemName(itemName);
      setTimeout(() => {
        const el = document.getElementById(`modal-sub-${itemName}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      return;
    }

    // Check 3: Category match
    setActiveTab('categories');
    setHighlightedItemName(itemName);
    setTimeout(() => {
      const el = document.getElementById(`modal-cat-${itemName}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const [selectedCatFolder, setSelectedCatFolder] = useState<string>('ALL');
  const [newCategory, setNewCategory] = useState('');
  const [editingCatIdx, setEditingCatIdx] = useState<number | null>(null);
  const [editingCatValue, setEditingCatValue] = useState('');

  const [newGi, setNewGi] = useState('');
  const [newDiff, setNewDiff] = useState('');

  const [selectedSubGroup, setSelectedSubGroup] =
    useState<SubmissionGroupId>('choke');
  const [newSubItem, setNewSubItem] = useState('');
  const [editingSubItem, setEditingSubItem] = useState<string | null>(null);
  const [editingSubValue, setEditingSubValue] = useState('');

  if (!isOpen) return null;

  const handleApplyTaxonomy = () => {
    const next = applyCoreTaxonomyToMetadata();
    onUpdateMetadata(next);
    setTaxonomyFeedback(
      '기술 체계 공식 데이터(시작 포지션 37종, 기술 성격 5대 폴더 46종, 서브미션 4대 폴더 41종)가 완벽하게 동기화되었습니다!'
    );
    setTimeout(() => setTaxonomyFeedback(null), 5000);
  };

  const handleAddPosition = () => {
    const trimmed = newPosName.trim();
    if (!trimmed) return;
    if (metadata.positions.some((p) => p.name === trimmed)) return;
    const next: MetadataConfig = {
      ...metadata,
      positions: [
        ...metadata.positions,
        {
          id: `pos-${Date.now()}`,
          name: trimmed,
          nameEn: newPosNameEn.trim() || trimmed,
          group: newPosGroup,
          subCategories: [...metadata.categories],
        },
      ],
    };
    onUpdateMetadata(next);
    setNewPosName('');
    setNewPosNameEn('');
  };

  const handleSavePositionRename = (posId: string, oldName: string) => {
    const trimmed = editingPosValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingPosId(null);
      return;
    }
    const next: MetadataConfig = {
      ...metadata,
      positions: metadata.positions.map((p) =>
        p.id === posId ? { ...p, name: trimmed } : p
      ),
    };
    onUpdateMetadata(next, {
      type: 'position',
      oldName,
      newName: trimmed,
    });
    setEditingPosId(null);
  };

  const handleMovePosition = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= metadata.positions.length) return;
    const copy = [...metadata.positions];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    onUpdateMetadata({ ...metadata, positions: copy });
  };

  const handleDeletePosition = (posId: string, posName: string) => {
    if (posName === '미분류') return;
    const next: MetadataConfig = {
      ...metadata,
      positions: metadata.positions.filter((p) => p.id !== posId),
    };
    onUpdateMetadata(next, {
      type: 'position',
      oldName: posName,
      newName: '미분류',
    });
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed || metadata.categories.includes(trimmed)) return;
    const nextCategories = [...metadata.categories, trimmed];
    const nextPositions = metadata.positions.map((p) => ({
      ...p,
      subCategories: p.subCategories.includes(trimmed)
        ? p.subCategories
        : [...p.subCategories, trimmed],
    }));
    onUpdateMetadata({
      ...metadata,
      categories: nextCategories,
      positions: nextPositions,
    });
    setNewCategory('');
  };

  const handleSaveCategoryRename = (idx: number, oldName: string) => {
    const trimmed = editingCatValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingCatIdx(null);
      return;
    }
    const nextCategories = metadata.categories.map((c, i) =>
      i === idx ? trimmed : c
    );
    const nextPositions = metadata.positions.map((p) => ({
      ...p,
      subCategories: p.subCategories.map((sc) =>
        sc === oldName ? trimmed : sc
      ),
    }));
    onUpdateMetadata(
      {
        ...metadata,
        categories: nextCategories,
        positions: nextPositions,
      },
      { type: 'category', oldName, newName: trimmed }
    );
    setEditingCatIdx(null);
  };

  const handleDeleteCategory = (catName: string) => {
    const nextCategories = metadata.categories.filter((c) => c !== catName);
    const nextPositions = metadata.positions.map((p) => ({
      ...p,
      subCategories: p.subCategories.filter((sc) => sc !== catName),
    }));
    onUpdateMetadata({
      ...metadata,
      categories: nextCategories,
      positions: nextPositions,
    });
  };

  const handleAddSubmissionItem = () => {
    const trimmed = newSubItem.trim();
    if (!trimmed) return;
    const nextSubmissions = metadata.submissions.map((group) => {
      if (group.id !== selectedSubGroup) return group;
      if (group.items.includes(trimmed)) return group;
      return {
        ...group,
        items: [...group.items, trimmed],
      };
    });
    onUpdateMetadata({ ...metadata, submissions: nextSubmissions });
    setNewSubItem('');
  };

  const handleSaveSubItemRename = (oldItem: string) => {
    const trimmed = editingSubValue.trim();
    if (!trimmed || trimmed === oldItem) {
      setEditingSubItem(null);
      return;
    }
    const nextSubmissions = metadata.submissions.map((group) => {
      if (group.id !== selectedSubGroup) return group;
      return {
        ...group,
        items: group.items.map((it) => (it === oldItem ? trimmed : it)),
      };
    });
    onUpdateMetadata(
      { ...metadata, submissions: nextSubmissions },
      { type: 'submission', oldName: oldItem, newName: trimmed }
    );
    setEditingSubItem(null);
  };

  const handleDeleteSubItem = (item: string) => {
    const nextSubmissions = metadata.submissions.map((group) => {
      if (group.id !== selectedSubGroup) return group;
      return {
        ...group,
        items: group.items.filter((it) => it !== item),
      };
    });
    onUpdateMetadata({ ...metadata, submissions: nextSubmissions });
  };

  const currentSubGroupObj = metadata.submissions.find(
    (s) => s.id === selectedSubGroup
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <FolderCog className="w-5 h-5 text-slate-800" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'ko' ? '메타데이터 & 포지션 분류 트리 커스텀 관리' : 'Taxonomy & Folder Tree Management'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ko' ? '나의 주짓수 스타일에 맞춰 시작 포지션, 기술 성격, 서브미션 종류, 도복/난이도 체계를 자유롭게 편집합니다.' : 'Customize starting positions, categories, submissions, and gi/difficulty standards.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 bg-white overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('taxonomy')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'taxonomy'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'ko' ? '기술 체계' : 'Core Taxonomy'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'positions'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderCog className="w-3.5 h-3.5" />
            <span>{language === 'ko' ? `포지션 (${metadata.positions.length})` : `Positions (${metadata.positions.length})`}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{language === 'ko' ? `기술 (${metadata.categories.length})` : `Techniques (${metadata.categories.length})`}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'submissions'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{language === 'ko' ? `서브미션 (${metadata.submissions.length})` : `Submissions (${metadata.submissions.length})`}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gi_diff')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'gi_diff'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{language === 'ko' ? '도복 구분 & 난이도 단계' : 'Gi & Difficulty'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Feedback Banner */}
          {taxonomyFeedback && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl animate-fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{taxonomyFeedback}</span>
            </div>
          )}

          {/* TAB 1: 8대 핵심 기술 체계 트리 */}
          {activeTab === 'taxonomy' && (
            <div className="space-y-4">
              {/* Top Banner with 1-click sync */}
              <div className="p-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <h3 className="text-sm font-black tracking-tight text-white">
                      {language === 'ko' ? '주짓수 8대 핵심 기술 체계 공식 정리본' : 'Official BJJ 8 Core Taxonomy Reference'}
                    </h3>
                  </div>
                  <p className="text-xs text-indigo-200 mt-1 max-w-xl leading-relaxed">
                    {language === 'ko' ? '시작 포지션 37종, 기술 성격 5대 폴더 46종, 서브미션 4대 폴더 41종의 완벽하고 체계적인 연결망입니다.' : '37 Positions, 5 Category Folders (46 items), 4 Submission Folders (41 items).'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleApplyTaxonomy}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>{language === 'ko' ? '8대 체계 전체 즉시 동기화' : 'Sync All 8 Core Systems'}</span>
                </button>
              </div>

              {/* 8 Pillar Sections */}
              <div className="space-y-3">
                {BJJ_CORE_TAXONOMY.map((sec) => {
                  const isExpanded = !!expandedTaxSections[sec.id];
                  return (
                    <div
                      key={sec.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs transition-all"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTaxSections((prev) => ({
                            ...prev,
                            [sec.id]: !prev[sec.id],
                          }))
                        }
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100/80 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {(sec.category as string) === 'positions' && (
                            <Shield className="w-4 h-4 text-blue-600" />
                          )}
                          {(sec.category as string) === 'takedown' && (
                            <Crown className="w-4 h-4 text-amber-600" />
                          )}
                          {(sec.category as string) === 'pass' && (
                            <Zap className="w-4 h-4 text-orange-600" />
                          )}
                          {(sec.category as string) === 'escape' && (
                            <X className="w-4 h-4 text-rose-600" />
                          )}
                          {(sec.category as string) === 'sweep' && (
                            <ArrowUp className="w-4 h-4 text-teal-600" />
                          )}
                          {(sec.category as string) === 'upper_sub' && (
                            <Compass className="w-4 h-4 text-indigo-600" />
                          )}
                          {(sec.category as string) === 'lower_sub' && (
                            <Award className="w-4 h-4 text-purple-600" />
                          )}
                          <div>
                            <span className="text-xs font-black text-slate-900">
                              {sec.title}
                            </span>
                            <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              {sec.badge}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="hidden md:inline text-xs text-slate-500 font-medium">
                            {sec.description}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 bg-white border-t border-slate-100">
                          <div className="text-xs text-slate-600 mb-3 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <strong>개념:</strong> {sec.description}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {sec.items.map((it, idx) => (
                              <button
                                key={it.name}
                                type="button"
                                onClick={() => handleNavigateToTaxonomyItem(sec, it)}
                                className="group flex items-center gap-2 p-2 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-indigo-50/60 hover:border-indigo-300 transition-all text-left cursor-pointer active:scale-95"
                                title={`클릭시 ${it.name} 편집 및 관리 위치로 이동합니다`}
                              >
                                <span className="w-5 text-right font-mono text-[11px] font-bold text-slate-400 group-hover:text-indigo-600">
                                  {idx + 1}.
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 truncate">
                                    {it.name}
                                  </div>
                                  {it.nameEn && (
                                    <div className="text-[10px] text-slate-400 truncate">
                                      {it.nameEn}
                                    </div>
                                  )}
                                </div>
                                <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs">
                                  →
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: 시작 포지션 폴더 */}
          {activeTab === 'positions' && (
            <div className="space-y-4">
              {/* Group Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 rounded-xl">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedPosFilterGroup('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      selectedPosFilterGroup === 'ALL'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    전체 ({metadata.positions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPosFilterGroup('스탠딩')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      selectedPosFilterGroup === '스탠딩'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    <span>스탠딩/특수 ({metadata.positions.filter((p) => p.group === '스탠딩 및 특수 포지션' || ['스탠딩', '레슬링', '터틀', '트럭', '아시', '새들'].some((k) => p.name.includes(k))).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPosFilterGroup('선점')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      selectedPosFilterGroup === '선점'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Crown className="w-3 h-3" />
                    <span>탑/도미넌트 ({metadata.positions.filter((p) => p.group === '탑 & 도미넌트 (상위)' || ['마운트', '사이드', '니온밸리', '노스 사우스', '곁누르기', '케사', '크루시픽스', '헤드쿼터'].some((k) => p.name.includes(k))).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPosFilterGroup('가드')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      selectedPosFilterGroup === '가드'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    <span>가드 포지션 ({metadata.positions.filter((p) => p.group === '가드 포지션 (하위)' || p.group === '가드' || p.name.includes('가드') || p.name.includes('록다운')).length})</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleApplyTaxonomy}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  title="37종 시작 포지션, 9대 기술 속성, 41종 서브미션 즉시 자동 채우기"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>새 기술체계 전체 동기화</span>
                </button>
              </div>

              {/* Add New Position Row */}
              <div className="flex flex-wrap gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 items-center">
                <select
                  value={newPosGroup}
                  onChange={(e) => setNewPosGroup(e.target.value)}
                  className="px-2.5 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  <option value="가드 포지션 (하위)">🛡️ 가드 포지션 (23종)</option>
                  <option value="탑 & 도미넌트 (상위)">👑 탑 & 도미넌트 (8종)</option>
                  <option value="스탠딩 및 특수 포지션">🤼 스탠딩 및 특수 포지션 (6종)</option>
                </select>
                <input
                  type="text"
                  value={newPosName}
                  onChange={(e) => setNewPosName(e.target.value)}
                  placeholder="새 포지션 명칭 (예: 웜 가드, 초이 바 셋업)"
                  className="flex-1 min-w-[160px] px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
                <input
                  type="text"
                  value={newPosNameEn}
                  onChange={(e) => setNewPosNameEn(e.target.value)}
                  placeholder="영문 표기 (선택, 예: Worm Guard)"
                  className="w-40 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAddPosition}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>포지션 추가</span>
                </button>
              </div>

              {/* Positions List */}
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto custom-scrollbar">
                {metadata.positions
                  .filter((pos) => {
                    if (selectedPosFilterGroup === 'ALL') return true;
                    if (selectedPosFilterGroup === '스탠딩') {
                      return (
                        pos.group === '스탠딩 및 특수 포지션' ||
                        ['스탠딩', '레슬링', '터틀', '트럭', '아시', '새들'].some((k) =>
                          pos.name.includes(k)
                        )
                      );
                    }
                    if (selectedPosFilterGroup === '선점') {
                      return (
                        pos.group === '탑 & 도미넌트 (상위)' ||
                        ['마운트', '사이드', '니온밸리', '노스 사우스', '곁누르기', '케사', '크루시픽스', '헤드쿼터'].some((k) =>
                          pos.name.includes(k)
                        )
                      );
                    }
                    if (selectedPosFilterGroup === '가드') {
                      return (
                        pos.group === '가드 포지션 (하위)' ||
                        pos.group === '가드' ||
                        pos.name.includes('가드') ||
                        pos.name.includes('록다운')
                      );
                    }
                    return true;
                  })
                  .map((pos, idx) => {
                    const isGuard =
                      pos.group === '가드 포지션 (하위)' ||
                      pos.group === '가드' ||
                      pos.name.includes('가드') ||
                      pos.name.includes('록다운');
                    const isDom =
                      pos.group === '탑 & 도미넌트 (상위)' ||
                      ['마운트', '사이드', '니온밸리', '노스 사우스', '곁누르기', '케사', '크루시픽스', '헤드쿼터'].some((k) =>
                        pos.name.includes(k)
                      );

                    return (
                      <div
                        key={pos.id}
                        className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-slate-50 transition-colors"
                      >
                        {editingPosId === pos.id ? (
                          <div className="flex items-center gap-2 flex-1 mr-4">
                            <input
                              type="text"
                              value={editingPosValue}
                              onChange={(e) => setEditingPosValue(e.target.value)}
                              className="flex-1 px-2.5 py-1 text-xs border border-slate-400 rounded-md"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleSavePositionRename(pos.id, pos.name)
                              }
                              className="px-2.5 py-1 bg-emerald-600 text-white text-xs rounded-md flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              저장
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                            <span className="text-xs font-mono tabular-nums text-slate-400 w-6">
                              {idx + 1}.
                            </span>

                            {isGuard ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                가드
                              </span>
                            ) : isDom ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                탑/도미넌트
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                스탠딩/특수
                              </span>
                            )}

                            <span className="text-sm font-semibold text-slate-800 truncate">
                              {pos.name}
                            </span>
                            {pos.nameEn && pos.nameEn !== pos.name && (
                              <span className="text-xs text-slate-400 truncate hidden sm:inline">
                                · {pos.nameEn}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMovePosition(idx, -1)}
                            disabled={idx === 0}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMovePosition(idx, 1)}
                            disabled={idx === metadata.positions.length - 1}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPosId(pos.id);
                              setEditingPosValue(pos.name);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {pos.name !== '미분류' && (
                            <button
                              type="button"
                              onClick={() => handleDeletePosition(pos.id, pos.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-indigo-600" />
                    <span>기술 성격 및 세부 기술 폴더</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    5대 핵심 기술 성격 폴더별로 총 {metadata.categories.length}개의 세부 기술이 체계적으로 분류되어 있습니다.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="새 기술 명칭..."
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>추가</span>
                  </button>
                </div>
              </div>

              {/* Folder Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCatFolder('ALL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    selectedCatFolder === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  전체 폴더 ({metadata.categories.length})
                </button>
                {STANDARD_CATEGORY_GROUPS.map((grp) => {
                  const count = grp.items.filter((it) => metadata.categories.includes(it)).length;
                  return (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => setSelectedCatFolder(grp.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        selectedCatFolder === grp.id
                          ? 'bg-indigo-600 text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {grp.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Folder Cards */}
              <div className="space-y-3">
                {STANDARD_CATEGORY_GROUPS
                  .filter((grp) => selectedCatFolder === 'ALL' || selectedCatFolder === grp.id)
                  .map((grp) => {
                    const grpItems = grp.items.filter((it) => metadata.categories.includes(it));
                    return (
                      <div
                        key={grp.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                          <div className="flex items-center gap-2">
                            <Folder className="w-3.5 h-3.5 text-indigo-600" />
                            <h5 className="text-xs font-black text-slate-800">{grp.name}</h5>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-700">
                              {grpItems.length}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                            {grp.description}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {grpItems.map((cat) => {
                            const idx = metadata.categories.indexOf(cat);
                            return (
                              <div
                                key={cat}
                                id={`modal-cat-${cat}`}
                                className={`flex items-center justify-between px-3 py-2 bg-white border rounded-xl transition-all ${
                                  highlightedItemName === cat
                                    ? 'border-indigo-600 ring-2 ring-indigo-500/50 bg-indigo-50/30'
                                    : 'border-slate-200'
                                }`}
                              >
                                {editingCatIdx === idx ? (
                                  <div className="flex items-center gap-1.5 flex-1">
                                    <input
                                      type="text"
                                      value={editingCatValue}
                                      onChange={(e) => setEditingCatValue(e.target.value)}
                                      className="flex-1 px-2 py-1 text-xs border border-indigo-400 rounded"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveCategoryRename(idx, cat)}
                                      className="px-2 py-1 bg-emerald-600 text-white text-xs rounded cursor-pointer"
                                    >
                                      저장
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs font-semibold text-slate-800 truncate">
                                    {cat}
                                  </span>
                                )}

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCatIdx(idx);
                                      setEditingCatValue(cat);
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(cat)}
                                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {metadata.submissions.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedSubGroup(group.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedSubGroup === group.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-[11px] opacity-75 font-mono">
                      {group.directionLabel}
                    </div>
                    <div className="text-xs font-bold mt-0.5 truncate">
                      {group.name}
                    </div>
                    <div className="text-[11px] opacity-75 mt-1 font-mono tabular-nums">
                      {group.items.length}개 피니시
                    </div>
                  </button>
                ))}
              </div>

              {currentSubGroupObj && (
                <div className="space-y-3">
                  <div className="flex gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={newSubItem}
                      onChange={(e) => setNewSubItem(e.target.value)}
                      placeholder={`${currentSubGroupObj.name} 하위 피니시 기술명 추가...`}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubmissionItem}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>세부 서브미션 추가</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentSubGroupObj.items.map((item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between px-3.5 py-2 bg-white border border-slate-200 rounded-lg"
                      >
                        {editingSubItem === item ? (
                          <div className="flex items-center gap-1.5 flex-1">
                            <input
                              type="text"
                              value={editingSubValue}
                              onChange={(e) =>
                                setEditingSubValue(e.target.value)
                              }
                              className="flex-1 px-2 py-1 text-xs border border-slate-400 rounded"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveSubItemRename(item)}
                              className="px-2 py-1 bg-emerald-600 text-white text-xs rounded cursor-pointer"
                            >
                              저장
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-800">
                            {item}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubItem(item);
                              setEditingSubValue(item);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubItem(item)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gi_diff' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>도복 구분 관리 (Gi / No-Gi / 룰셋)</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGi}
                    onChange={(e) => setNewGi(e.target.value)}
                    placeholder="예: 레슬링 슈즈, ADCC 룰셋"
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const t = newGi.trim();
                      if (!t || metadata.giTypes.includes(t)) return;
                      onUpdateMetadata({
                        ...metadata,
                        giTypes: [...metadata.giTypes, t],
                      });
                      setNewGi('');
                    }}
                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    추가
                  </button>
                </div>
                <div className="space-y-1.5">
                  {metadata.giTypes.map((gi) => (
                    <div
                      key={gi}
                      className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                    >
                      <span>{gi}</span>
                      {metadata.giTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateMetadata({
                              ...metadata,
                              giTypes: metadata.giTypes.filter((g) => g !== gi),
                            })
                          }
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>난이도 및 벨트 단계 커스텀</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDiff}
                    onChange={(e) => setNewDiff(e.target.value)}
                    placeholder="예: 블루벨트 필수, 실전 주력"
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const t = newDiff.trim();
                      if (!t || metadata.difficulties.includes(t)) return;
                      onUpdateMetadata({
                        ...metadata,
                        difficulties: [...metadata.difficulties, t],
                      });
                      setNewDiff('');
                    }}
                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    추가
                  </button>
                </div>
                <div className="space-y-1.5">
                  {metadata.difficulties.map((diff) => (
                    <div
                      key={diff}
                      className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                    >
                      <span>{diff}</span>
                      {metadata.difficulties.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateMetadata({
                              ...metadata,
                              difficulties: metadata.difficulties.filter(
                                (d) => d !== diff
                              ),
                            })
                          }
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50">
          <span className="text-xs text-slate-500">
            모든 변경 사항은 LocalStorage에 즉시 반영됩니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            완료 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
