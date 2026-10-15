import { translatePosition, translateCategory, translateCategoryGroup, translateSubmissionGroup, translateSubmissionDetail } from '../utils/taxonomyTranslation';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Check,
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
  ChevronRight,
  Folder,
  Tag,
  X,
  Crosshair,
  Flame,
  User,
  Footprints,
  ArrowUp,
  ArrowDown,
  ArrowRightLeft,
} from 'lucide-react';
import { MetadataConfig, PositionFolder, SubmissionCompassGroup, SubmissionGroupId } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import {
  BJJ_CORE_TAXONOMY,
  applyCoreTaxonomyToMetadata,
  STANDARD_CATEGORY_GROUPS,
  BjjTaxonomySection,
  CategoryFolderGroup,
  getSavedCategoryGroups,
  saveCategoryGroups,
  getSavedCategoryGroupTitles,
  saveCategoryGroupTitles,
  getSavedPositionGroupTitles,
  savePositionGroupTitles,
  getSavedPositionGroupOrder,
  savePositionGroupOrder,
  DEFAULT_POSITION_GROUPS,
  getSavedSubmissionGroupTitles,
  saveSubmissionGroupTitles,
  splitKoreanAndEnglish,
} from '../data/bjjTaxonomy';

export type SystemDomain = 'positions' | 'categories' | 'submissions';

export function getSectionTitle(sec: BjjTaxonomySection, lang: string): string {
  if (lang !== 'en') return sec.title;
  switch (sec.category) {
    case 'takedown':
      return 'Takedowns & Standing';
    case 'pass':
      return 'Guard Passes';
    case 'sweep':
      return 'Sweeps';
    case 'escape':
      return 'Escapes & Recovery';
    case 'upper_sub':
      return 'Upper Body Finishes';
    case 'lower_sub':
      return 'Lower Body Finishes';
    case 'positions':
      if (sec.id.includes('standing')) return 'Standing';
      if (sec.id.includes('other')) return 'Others / Special';
      if (sec.id.includes('dominant')) return 'Top & Dominant';
      return 'Guard Positions';
    default:
      return sec.title;
  }
}

interface PositionTaxonomyViewProps {
  metadata: MetadataConfig;
  onUpdateMetadata: (
    next: MetadataConfig,
    renamedMap?: { type: 'position' | 'category' | 'submission'; oldName: string; newName: string }
  ) => void;
  initialTab?: 'taxonomy' | 'positions' | 'categories' | 'submissions' | 'gi_diff';
}

interface MobileTaxonomyStyle {
  iconBg: string;
  iconColor: string;
  countColor: string;
  cardBg: string;
  subtitle: string;
  IconComponent: React.ComponentType<{ className?: string }>;
}

const MOBILE_TAXONOMY_STYLES: Record<string, MobileTaxonomyStyle> = {
  'sec-positions-standing': {
    iconBg: 'bg-blue-500',
    iconColor: 'text-white',
    countColor: 'text-blue-600',
    cardBg: 'from-blue-50/70 via-blue-50/30 to-white border-blue-100',
    subtitle: 'Standing / Open / Tie-up',
    IconComponent: User,
  },
  'sec-positions-other': {
    iconBg: 'bg-indigo-500',
    iconColor: 'text-white',
    countColor: 'text-indigo-600',
    cardBg: 'from-indigo-50/70 via-indigo-50/30 to-white border-indigo-100',
    subtitle: 'Turtle / Truck / Ashi / Saddle',
    IconComponent: Shield,
  },
  'sec-positions-dominant': {
    iconBg: 'bg-emerald-600',
    iconColor: 'text-white',
    countColor: 'text-emerald-600',
    cardBg: 'from-emerald-50/70 via-emerald-50/30 to-white border-emerald-100',
    subtitle: 'Mount / Back Control',
    IconComponent: Crown,
  },
  'sec-positions-guard': {
    iconBg: 'bg-purple-600',
    iconColor: 'text-white',
    countColor: 'text-purple-600',
    cardBg: 'from-purple-50/70 via-purple-50/30 to-white border-purple-100',
    subtitle: 'Closed / Half / Deep / Lock',
    IconComponent: Layers,
  },
  'sec-takedown': {
    iconBg: 'bg-teal-500',
    iconColor: 'text-white',
    countColor: 'text-teal-600',
    cardBg: 'from-teal-50/70 via-teal-50/30 to-white border-teal-100',
    subtitle: 'Single / Double / Attack',
    IconComponent: Zap,
  },
  'sec-pass': {
    iconBg: 'bg-amber-500',
    iconColor: 'text-white',
    countColor: 'text-amber-600',
    cardBg: 'from-amber-50/70 via-amber-50/30 to-white border-amber-100',
    subtitle: 'Knee Cut / Toreando / Pressure',
    IconComponent: Footprints,
  },
  'sec-sweep': {
    iconBg: 'bg-rose-500',
    iconColor: 'text-white',
    countColor: 'text-rose-600',
    cardBg: 'from-rose-50/70 via-rose-50/30 to-white border-rose-100',
    subtitle: 'Hip Bump / Scissors / Hook',
    IconComponent: RotateCcw,
  },
  'sec-escape': {
    iconBg: 'bg-indigo-500',
    iconColor: 'text-white',
    countColor: 'text-indigo-600',
    cardBg: 'from-indigo-50/70 via-indigo-50/30 to-white border-indigo-100',
    subtitle: 'Hip Escape / Bridge / Framing',
    IconComponent: Shield,
  },
  'sec-upper-sub': {
    iconBg: 'bg-violet-600',
    iconColor: 'text-white',
    countColor: 'text-violet-600',
    cardBg: 'from-violet-50/70 via-violet-50/30 to-white border-violet-100',
    subtitle: 'Choke / Armbar / Kimura',
    IconComponent: Sparkles,
  },
  'sec-lower-sub': {
    iconBg: 'bg-red-500',
    iconColor: 'text-white',
    countColor: 'text-red-600',
    cardBg: 'from-red-50/70 via-red-50/30 to-white border-red-100',
    subtitle: 'Heel Hook / Kneebar / Slicer',
    IconComponent: Crosshair,
  },
};

const POSITION_GROUP_STYLES: Record<string, MobileTaxonomyStyle> = {
  '스탠딩': {
    iconBg: 'bg-blue-500',
    iconColor: 'text-white',
    countColor: 'text-blue-600',
    cardBg: 'from-blue-50/70 via-blue-50/30 to-white border-blue-100',
    subtitle: 'Standing / Open / Tie-up',
    IconComponent: User,
  },
  '기타': {
    iconBg: 'bg-indigo-500',
    iconColor: 'text-white',
    countColor: 'text-indigo-600',
    cardBg: 'from-indigo-50/70 via-indigo-50/30 to-white border-indigo-100',
    subtitle: 'Turtle / Truck / Ashi / Saddle',
    IconComponent: Shield,
  },
  '탑 & 도미넌트 (상위)': {
    iconBg: 'bg-emerald-600',
    iconColor: 'text-white',
    countColor: 'text-emerald-600',
    cardBg: 'from-emerald-50/70 via-emerald-50/30 to-white border-emerald-100',
    subtitle: 'Mount / Side / Knee on Belly / HQ',
    IconComponent: Crown,
  },
  '가드 포지션 (하위)': {
    iconBg: 'bg-purple-600',
    iconColor: 'text-white',
    countColor: 'text-purple-600',
    cardBg: 'from-purple-50/70 via-purple-50/30 to-white border-purple-100',
    subtitle: 'Closed / Half / Butterfly / X-Guard',
    IconComponent: Layers,
  },
};

const CATEGORY_FOLDER_STYLES: Record<string, MobileTaxonomyStyle> = {
  'cat-grp-takedown': {
    iconBg: 'bg-teal-500',
    iconColor: 'text-white',
    countColor: 'text-teal-600',
    cardBg: 'from-teal-50/70 via-teal-50/30 to-white border-teal-100',
    subtitle: 'Single / Double / Throws',
    IconComponent: Zap,
  },
  'cat-grp-pass': {
    iconBg: 'bg-amber-500',
    iconColor: 'text-white',
    countColor: 'text-amber-600',
    cardBg: 'from-amber-50/70 via-amber-50/30 to-white border-amber-100',
    subtitle: 'Knee Cut / Toreando / Smash',
    IconComponent: Footprints,
  },
  'cat-grp-sweep': {
    iconBg: 'bg-rose-500',
    iconColor: 'text-white',
    countColor: 'text-rose-600',
    cardBg: 'from-rose-50/70 via-rose-50/30 to-white border-rose-100',
    subtitle: 'Hip Bump / Scissors / Butterfly',
    IconComponent: RotateCcw,
  },
  'cat-grp-escape': {
    iconBg: 'bg-indigo-500',
    iconColor: 'text-white',
    countColor: 'text-indigo-600',
    cardBg: 'from-indigo-50/70 via-indigo-50/30 to-white border-indigo-100',
    subtitle: 'Hip Escape / Bridge / Framing',
    IconComponent: Shield,
  },
  'cat-grp-core': {
    iconBg: 'bg-violet-600',
    iconColor: 'text-white',
    countColor: 'text-violet-600',
    cardBg: 'from-violet-50/70 via-violet-50/30 to-white border-violet-100',
    subtitle: 'Submission / Back Take / Counter',
    IconComponent: Sparkles,
  },
};

const SUBMISSION_GROUP_STYLES: Record<string, MobileTaxonomyStyle> = {
  choke: {
    iconBg: 'bg-violet-600',
    iconColor: 'text-white',
    countColor: 'text-violet-600',
    cardBg: 'from-violet-50/70 via-violet-50/30 to-white border-violet-100',
    subtitle: 'RNC / Triangle / Guillotine',
    IconComponent: Sparkles,
  },
  armlock: {
    iconBg: 'bg-amber-500',
    iconColor: 'text-white',
    countColor: 'text-amber-600',
    cardBg: 'from-amber-50/70 via-amber-50/30 to-white border-amber-100',
    subtitle: 'Armbar / Kimura / Americana',
    IconComponent: Zap,
  },
  leglock: {
    iconBg: 'bg-red-500',
    iconColor: 'text-white',
    countColor: 'text-red-600',
    cardBg: 'from-red-50/70 via-red-50/30 to-white border-red-100',
    subtitle: 'Heel Hook / Kneebar / Ankle Lock',
    IconComponent: Crosshair,
  },
  compression: {
    iconBg: 'bg-teal-500',
    iconColor: 'text-white',
    countColor: 'text-teal-600',
    cardBg: 'from-teal-50/70 via-teal-50/30 to-white border-teal-100',
    subtitle: 'Bicep / Calf / Twister',
    IconComponent: Shield,
  },
};

export const PositionTaxonomyView: React.FC<PositionTaxonomyViewProps> = ({
  metadata,
  onUpdateMetadata,
  initialTab = 'taxonomy',
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    'taxonomy' | 'positions' | 'categories' | 'submissions' | 'gi_diff'
  >(initialTab);

  // Mobile expansion states
  const [mobileExpandedTaxSec, setMobileExpandedTaxSec] = useState<string | null>(null);
  const [mobileExpandedPosGroup, setMobileExpandedPosGroup] = useState<string | null>(null);
  const [mobileExpandedCatFolder, setMobileExpandedCatFolder] = useState<string | null>(null);
  const [mobileExpandedSubGroup, setMobileExpandedSubGroup] = useState<string | null>(null);

  // 1. Position State
  const [newPosName, setNewPosName] = useState('');
  const [newPosNameEn, setNewPosNameEn] = useState('');
  const [newPosGroup, setNewPosGroup] = useState<string>('가드 포지션 (하위)');
  const [selectedPosFilterGroup, setSelectedPosFilterGroup] = useState<string>('ALL');
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [editingPosValue, setEditingPosValue] = useState('');

  // 2. Category State (With persistent folder assignment so added category NEVER goes missing!)
  const [catGroups, setCatGroups] = useState<CategoryFolderGroup[]>(() => getSavedCategoryGroups());
  const [isAddingCatFolder, setIsAddingCatFolder] = useState(false);
  const [newCatFolderName, setNewCatFolderName] = useState('');
  const [selectedCatFolder, setSelectedCatFolder] = useState<string>('ALL');
  const [newCategoryTargetFolder, setNewCategoryTargetFolder] = useState<string>('cat-grp-pass');
  const [newCategory, setNewCategory] = useState('');
  const [editingCatIdx, setEditingCatIdx] = useState<number | null>(null);
  const [editingCatValue, setEditingCatValue] = useState('');
  const [customCategoryFolders, setCustomCategoryFolders] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('bjj_custom_category_folder_map');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // 3. Submission State
  const [selectedSubGroup, setSelectedSubGroup] = useState<SubmissionGroupId>(
    metadata.submissions[0]?.id || 'choke'
  );
  const [newSubGroupName, setNewSubGroupName] = useState('');
  const [newSubItem, setNewSubItem] = useState('');
  const [editingSubItem, setEditingSubItem] = useState<string | null>(null);
  const [editingSubValue, setEditingSubValue] = useState('');

  // 4. Gi & Difficulty State
  const [newGi, setNewGi] = useState('');
  const [newDiff, setNewDiff] = useState('');
  const [editingGiIndex, setEditingGiIndex] = useState<number | null>(null);
  const [editingGiValue, setEditingGiValue] = useState('');
  const [editingDiffIndex, setEditingDiffIndex] = useState<number | null>(null);
  const [editingDiffValue, setEditingDiffValue] = useState('');

  // 5. Major Group Titles State & Inline Editors (대분류 이름 수정 & 연동)
  const [customCategoryGroupTitles, setCustomCategoryGroupTitles] = useState<Record<string, string>>(() => getSavedCategoryGroupTitles());
  const [editingCatGroupId, setEditingCatGroupId] = useState<string | null>(null);
  const [editingCatGroupValue, setEditingCatGroupValue] = useState('');

  const [customPositionGroupTitles, setCustomPositionGroupTitles] = useState<Record<string, string>>(() => getSavedPositionGroupTitles());
  const [editingPosGroupId, setEditingPosGroupId] = useState<string | null>(null);
  const [editingPosGroupValue, setEditingPosGroupValue] = useState('');

  const [editingSubGroupId, setEditingSubGroupId] = useState<string | null>(null);
  const [editingSubGroupValue, setEditingSubGroupValue] = useState('');

  const [editingSecTitleId, setEditingSecTitleId] = useState<string | null>(null);
  const [editingSecTitleValue, setEditingSecTitleValue] = useState('');

  const getCatGroupTitle = (groupId: string, defaultName: string) => {
    return customCategoryGroupTitles[groupId] || customCategoryGroupTitles[defaultName] || defaultName;
  };

  const getPosGroupTitle = (groupId: string, defaultName: string) => {
    return customPositionGroupTitles[groupId] || customPositionGroupTitles[defaultName] || defaultName;
  };

  const handleSavePositionGroupRename = (groupId: string, oldName: string) => {
    const trimmed = editingPosGroupValue.trim();
    if (!trimmed) {
      setEditingPosGroupId(null);
      return;
    }
    if (trimmed === oldName) {
      setEditingPosGroupId(null);
      return;
    }
    const currentName = customPositionGroupTitles[groupId] || oldName;
    const nextPositions = metadata.positions.map((p) => {
      if (
        p.group === currentName ||
        p.group === oldName ||
        p.group === groupId ||
        (groupId === '스탠딩' && (p.group === '스탠딩' || p.group === '스탠딩 포지션')) ||
        (groupId === '기타' && (p.group === '기타' || p.group === '기타 (특수 포지션)')) ||
        (groupId === '탑 & 도미넌트 (상위)' && (p.group === '탑 & 도미넌트 (상위)' || p.group === '포지션 선점')) ||
        (groupId === '가드 포지션 (하위)' && (p.group === '가드 포지션 (하위)' || p.group === '가드'))
      ) {
        return { ...p, group: trimmed };
      }
      return p;
    });

    const nextTitles = {
      ...customPositionGroupTitles,
      [groupId]: trimmed,
      [oldName]: trimmed,
      [currentName]: trimmed,
      [trimmed]: trimmed,
    };
    setCustomPositionGroupTitles(nextTitles);
    savePositionGroupTitles(nextTitles);

    // Update posGroupOrder so the renamed folder updates its key
    const nextOrder = posGroupOrder.map((g) => {
      if (g === groupId || g === oldName || g === currentName) {
        return trimmed;
      }
      return g;
    });
    if (!nextOrder.includes(trimmed)) {
      const idx = nextOrder.indexOf(groupId);
      if (idx !== -1) {
        nextOrder[idx] = trimmed;
      } else {
        nextOrder.push(trimmed);
      }
    }
    const deduplicatedOrder = nextOrder.filter((val, idx, arr) => arr.indexOf(val) === idx);
    setPosGroupOrder(deduplicatedOrder);
    savePositionGroupOrder(deduplicatedOrder);

    if (selectedPosFilterGroup === groupId || selectedPosFilterGroup === oldName || selectedPosFilterGroup === currentName) {
      setSelectedPosFilterGroup(trimmed);
    }
    if (newPosGroup === groupId || newPosGroup === oldName || newPosGroup === currentName) {
      setNewPosGroup(trimmed);
    }

    onUpdateMetadata({ ...metadata, positions: nextPositions });
    setEditingPosGroupId(null);
    showToast(`✅ 포지션 대분류명이 '${trimmed}'(으)로 변경되었습니다. (영상 추가/수정에도 즉시 연동)`);
  };

  // User Request: 상위폴더 위치 변경, 추가, 삭제 기능 및 영상추가 등록 시 순서 연동
  const [posGroupOrder, setPosGroupOrder] = useState<string[]>(() => getSavedPositionGroupOrder());
  const [newParentFolderName, setNewParentFolderName] = useState('');
  const [isAddingParentFolder, setIsAddingParentFolder] = useState(false);

  useEffect(() => {
    const handleSync = () => {
      setPosGroupOrder(getSavedPositionGroupOrder());
      setCustomPositionGroupTitles(getSavedPositionGroupTitles());
      setCatGroups(getSavedCategoryGroups());
      setCustomCategoryGroupTitles(getSavedCategoryGroupTitles());
    };
    window.addEventListener('bjj_taxonomy_groups_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('bjj_taxonomy_groups_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const allParentGroups = useMemo(() => {
    const list: string[] = [];
    posGroupOrder.forEach((rawKey) => {
      const resolved = customPositionGroupTitles[rawKey] || rawKey;
      if (!list.includes(resolved)) {
        list.push(resolved);
      }
    });
    metadata.positions.forEach((p) => {
      const rawG = p.group || '기타';
      const resolvedG = customPositionGroupTitles[rawG] || rawG;
      if (!list.includes(resolvedG)) {
        list.push(resolvedG);
      }
    });
    return list;
  }, [posGroupOrder, customPositionGroupTitles, metadata.positions]);

  const handleMovePosGroup = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= allParentGroups.length) return;
    const next = [...allParentGroups];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setPosGroupOrder(next);
    savePositionGroupOrder(next);
    showToast(
      language === 'ko'
        ? `✅ 상위폴더 '${temp}' 위치가 변경되었습니다. (영상 추가 시 순서도 즉시 동기화)`
        : `✅ Parent folder order updated.`
    );
  };

  const handleAddParentFolder = () => {
    const raw = newParentFolderName.trim();
    if (!raw) return;
    const parsed = splitKoreanAndEnglish(raw);
    const trimmed = parsed.nameKo || raw;
    if (allParentGroups.includes(trimmed)) {
      showToast(language === 'ko' ? '⚠️ 이미 존재하는 상위폴더 명칭입니다.' : 'Folder already exists.');
      return;
    }
    const next = [...allParentGroups, trimmed];
    setPosGroupOrder(next);
    savePositionGroupOrder(next);
    setNewParentFolderName('');
    setIsAddingParentFolder(false);
    showToast(
      language === 'ko'
        ? `✅ 새 상위폴더 '${trimmed}'이(가) 추가되었습니다! (영상 추가 시 즉시 선택 가능)`
        : `✅ Parent folder '${trimmed}' added!`
    );
  };

  const handleDeleteParentFolder = (groupName: string) => {
    if (allParentGroups.length <= 1) {
      showToast(
        language === 'ko'
          ? '⚠️ 최소 1개 이상의 상위폴더가 유지되어야 합니다.'
          : 'At least one parent folder required.'
      );
      return;
    }
    const targetTitle = getPosGroupTitle(groupName, groupName);
    const affectedCount = metadata.positions.filter(
      (p) => p.group === groupName || p.group === targetTitle
    ).length;

    const confirmed = confirm(
      language === 'ko'
        ? `'${targetTitle}' 상위폴더를 삭제하시겠습니까?${
            affectedCount > 0
              ? ` (소속 포지션 ${affectedCount}개는 다른 폴더로 안전하게 이동됩니다)`
              : ''
          }`
        : `Delete parent folder '${targetTitle}'?`
    );
    if (!confirmed) return;

    const fallbackGroup = allParentGroups.find((g) => g !== groupName) || '기타';
    const nextPositions = metadata.positions.map((p) => {
      if (p.group === groupName || p.group === targetTitle) {
        return { ...p, group: fallbackGroup };
      }
      return p;
    });
    const nextOrder = allParentGroups.filter((g) => g !== groupName);
    setPosGroupOrder(nextOrder);
    savePositionGroupOrder(nextOrder);
    onUpdateMetadata({ ...metadata, positions: nextPositions });
    showToast(
      language === 'ko'
        ? `✅ '${targetTitle}' 상위폴더가 삭제되었습니다.`
        : `✅ Parent folder deleted.`
    );
  };

  // User Request: 기술 폴더 추가, 삭제, 순서 변경 기능
  const handleAddCatFolder = () => {
    const raw = newCatFolderName.trim();
    if (!raw) return;
    const parsed = splitKoreanAndEnglish(raw);
    const koName = parsed.nameKo || raw;
    if (catGroups.some((g) => g.name === koName || customCategoryGroupTitles[g.id] === koName)) {
      showToast(language === 'ko' ? '⚠️ 이미 존재하는 기술 폴더 명칭입니다.' : 'Category folder already exists.');
      return;
    }
    const newId = `cat-grp-${Date.now()}`;
    const newGroup: CategoryFolderGroup = {
      id: newId,
      name: koName,
      badge: '0종',
      description: '사용자 정의 기술 폴더',
      items: [],
    };
    const next = [...catGroups, newGroup];
    setCatGroups(next);
    saveCategoryGroups(next);
    setNewCatFolderName('');
    setIsAddingCatFolder(false);
    showToast(
      language === 'ko'
        ? `✅ 새 기술 폴더 '${koName}'이(가) 추가되었습니다!`
        : `✅ Category folder '${koName}' added!`
    );
  };

  const handleDeleteCatFolder = (folderId: string) => {
    if (catGroups.length <= 1) {
      showToast(
        language === 'ko'
          ? '⚠️ 최소 1개 이상의 기술 폴더가 유지되어야 합니다.'
          : 'At least one category folder required.'
      );
      return;
    }
    const target = catGroups.find((g) => g.id === folderId);
    const targetTitle = target ? getCatGroupTitle(target.id, target.name) : '기술 폴더';
    const grpItems = getCategoriesForFolder(folderId);

    const confirmed = confirm(
      language === 'ko'
        ? `'${targetTitle}' 기술 폴더를 삭제하시겠습니까?${
            grpItems.length > 0
              ? ` (소속 기술 ${grpItems.length}개는 다른 폴더로 안전하게 이동됩니다)`
              : ''
          }`
        : `Delete category folder '${targetTitle}'?`
    );
    if (!confirmed) return;

    const fallbackFolder = catGroups.find((g) => g.id !== folderId)?.id || 'cat-grp-pass';
    const updatedMap = { ...customCategoryFolders };
    grpItems.forEach((item) => {
      updatedMap[item] = fallbackFolder;
    });
    setCustomCategoryFolders(updatedMap);
    try {
      localStorage.setItem('bjj_custom_category_folder_map', JSON.stringify(updatedMap));
    } catch {}

    const next = catGroups.filter((g) => g.id !== folderId);
    setCatGroups(next);
    saveCategoryGroups(next);
    if (selectedCatFolder === folderId) {
      setSelectedCatFolder('ALL');
    }
    showToast(
      language === 'ko'
        ? `✅ '${targetTitle}' 기술 폴더가 삭제되었습니다.`
        : `✅ Category folder deleted.`
    );
  };

  const handleMoveCatFolder = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= catGroups.length) return;
    const next = [...catGroups];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setCatGroups(next);
    saveCategoryGroups(next);
    showToast(
      language === 'ko'
        ? `✅ 기술 폴더 순서가 변경되었습니다.`
        : `✅ Category folder order updated.`
    );
  };

  const handleSaveCategoryGroupRename = (groupId: string, oldName: string) => {
    const raw = editingCatGroupValue.trim();
    if (!raw) {
      setEditingCatGroupId(null);
      return;
    }
    const parsed = splitKoreanAndEnglish(raw);
    const trimmed = parsed.nameKo || raw;
    if (trimmed === oldName) {
      setEditingCatGroupId(null);
      return;
    }
    const prevTitle = oldName || customCategoryGroupTitles[groupId] || groupId;
    const nextTitles = {
      ...customCategoryGroupTitles,
      [groupId]: trimmed,
      [prevTitle]: trimmed,
      [trimmed]: trimmed,
    };
    setCustomCategoryGroupTitles(nextTitles);
    saveCategoryGroupTitles(nextTitles);
    setEditingCatGroupId(null);
    showToast(`✅ 기술 대분류명이 '${trimmed}'(으)로 변경되었습니다. (영상 추가/수정에도 즉시 연동)`);
  };

  const handleSaveSubmissionGroupRename = (groupId: string, oldName: string) => {
    const trimmed = editingSubGroupValue.trim();
    if (!trimmed) {
      setEditingSubGroupId(null);
      return;
    }
    if (trimmed === oldName) {
      setEditingSubGroupId(null);
      return;
    }
    const currentTitles = getSavedSubmissionGroupTitles();
    const prevTitle = oldName || currentTitles[groupId] || groupId;
    const nextTitles = {
      ...currentTitles,
      [groupId]: trimmed,
      [prevTitle]: trimmed,
      [trimmed]: trimmed,
    };
    saveSubmissionGroupTitles(nextTitles);

    const nextSubmissions = metadata.submissions.map((g) => {
      if (g.id === groupId || g.name === prevTitle) {
        return { ...g, name: trimmed, hubTitle: trimmed };
      }
      return g;
    });
    onUpdateMetadata(
      { ...metadata, submissions: nextSubmissions },
      { type: 'submission_group' as any, oldName: prevTitle, newName: trimmed }
    );
    setEditingSubGroupId(null);
    showToast(`✅ 서브미션 대분류명이 '${trimmed}'(으)로 변경되었습니다. (영상 추가/수정에도 즉시 연동)`);
  };

  const handleSaveSectionTitleRename = (secId: string, oldTitle: string) => {
    const trimmed = editingSecTitleValue.trim();
    if (!trimmed || trimmed === oldTitle) {
      setEditingSecTitleId(null);
      return;
    }
    const nextSections = taxonomySections.map((sec) =>
      sec.id === secId ? { ...sec, title: trimmed } : sec
    );
    saveTaxonomySections(nextSections);
    setEditingSecTitleId(null);
    showToast(`✅ 기술 체계 박스명이 '${trimmed}'(으)로 변경되었습니다.`);
  };

  // 6. Taxonomy Master Tree State & Handlers
  const [taxonomySections, setTaxonomySections] = useState<BjjTaxonomySection[]>(() => {
    try {
      const saved = localStorage.getItem('bjj_custom_taxonomy_sections');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return BJJ_CORE_TAXONOMY;
  });

  const saveTaxonomySections = (next: BjjTaxonomySection[]) => {
    setTaxonomySections(next);
    try {
      localStorage.setItem('bjj_custom_taxonomy_sections', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const [selectedTaxDomainFilter, setSelectedTaxDomainFilter] = useState<
    'ALL' | 'positions' | 'categories' | 'submissions'
  >('ALL');

  const getDomainInfo = (sec: BjjTaxonomySection) => {
    if (sec.category === 'positions') {
      return {
        domain: 'positions' as SystemDomain,
        label: language === 'ko' ? '포지션 폴더' : 'Positions',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20',
        dotColor: 'bg-blue-500',
        icon: '📁',
      };
    }
    if (['takedown', 'pass', 'sweep', 'escape'].includes(sec.category)) {
      return {
        domain: 'categories' as SystemDomain,
        label: language === 'ko' ? '기술' : 'Techniques',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
        dotColor: 'bg-emerald-500',
        icon: '🗂️',
      };
    }
    return {
      domain: 'submissions' as SystemDomain,
      label: language === 'ko' ? '서브미션' : 'Submissions',
      badgeClass: 'bg-violet-50 text-violet-700 border-violet-200 ring-1 ring-violet-500/20',
      dotColor: 'bg-violet-500',
      icon: '🎯',
    };
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= taxonomySections.length) return;
    const next = [...taxonomySections];
    const [removed] = next.splice(index, 1);
    next.splice(targetIndex, 0, removed);
    saveTaxonomySections(next);
    showToast(
      language === 'ko'
        ? `✅ [${removed.title}] 박스 위치를 ${direction === 'up' ? '위' : '아래'}로 이동했습니다.`
        : `✅ Moved [${removed.title}] card ${direction}.`
    );
  };

  const handleReassignSectionDomain = (sectionId: string, targetDomain: SystemDomain) => {
    const sec = taxonomySections.find((s) => s.id === sectionId);
    if (!sec) return;

    const currentItems = getDynamicSectionItems(sec);
    const itemNames = currentItems.map((i) => i.name);

    let newCategory: BjjTaxonomySection['category'] = sec.category;
    if (targetDomain === 'positions') {
      newCategory = 'positions';
    } else if (targetDomain === 'categories') {
      newCategory = 'pass';
    } else if (targetDomain === 'submissions') {
      newCategory = 'upper_sub';
    }

    const nextSections = taxonomySections.map((s) =>
      s.id === sectionId ? { ...s, category: newCategory } : s
    );
    saveTaxonomySections(nextSections);

    let nextPositions = [...metadata.positions];
    let nextCategories = [...metadata.categories];
    let nextSubmissions = [...metadata.submissions];

    if (targetDomain === 'positions') {
      itemNames.forEach((name) => {
        if (!nextPositions.some((p) => p.name === name)) {
          nextPositions.push({
            id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name,
            nameEn: name,
            group: sec.title,
            subCategories: [...metadata.categories],
          });
        }
      });
    } else if (targetDomain === 'categories') {
      itemNames.forEach((name) => {
        if (!nextCategories.includes(name)) {
          nextCategories.push(name);
        }
      });
      const updatedFolders = { ...customCategoryFolders };
      itemNames.forEach((name) => {
        updatedFolders[name] = 'cat-grp-pass';
      });
      setCustomCategoryFolders(updatedFolders);
      try {
        localStorage.setItem('bjj_custom_category_folder_map', JSON.stringify(updatedFolders));
      } catch {
        // ignore
      }
    } else if (targetDomain === 'submissions') {
      const existingGroup = nextSubmissions.find((g) => g.name === sec.title || g.id === 'choke');
      if (existingGroup) {
        nextSubmissions = nextSubmissions.map((g) =>
          g.id === existingGroup.id
            ? { ...g, items: Array.from(new Set([...g.items, ...itemNames])) }
            : g
        );
      } else {
        nextSubmissions.push({
          id: `sub-${Date.now()}`,
          name: sec.title,
          hubTitle: sec.title,
          items: [...itemNames],
          isCustom: true,
        });
      }
    }

    onUpdateMetadata({
      ...metadata,
      positions: nextPositions,
      categories: nextCategories,
      submissions: nextSubmissions,
    });

    const domainLabel =
      targetDomain === 'positions'
        ? (language === 'ko' ? '포지션 폴더' : 'Positions')
        : targetDomain === 'categories'
        ? (language === 'ko' ? '기술' : 'Techniques')
        : (language === 'ko' ? '서브미션' : 'Submissions');

    showToast(`✅ [${sec.title}] 박스를 [${domainLabel}] 영역으로 소속 변경 및 연동 완료했습니다.`);
  };

  const [addingTaxSectionId, setAddingTaxSectionId] = useState<string | null>(null);
  const [newTaxTechName, setNewTaxTechName] = useState('');
  const [newTaxTechNameEn, setNewTaxTechNameEn] = useState('');
  const [newTaxTargetSubGroup, setNewTaxTargetSubGroup] = useState<SubmissionGroupId>('choke');
  const [draggedTaxItem, setDraggedTaxItem] = useState<{ sourceSectionId: string; itemName: string; category: string } | null>(null);

  const handleDropOnTaxonomySection = (targetSec: BjjTaxonomySection) => {
    if (!draggedTaxItem) return;
    const { sourceSectionId, itemName } = draggedTaxItem;
    if (sourceSectionId === targetSec.id) {
      setDraggedTaxItem(null);
      return;
    }

    const sourceSec = taxonomySections.find((s) => s.id === sourceSectionId);
    const sourceDomain = sourceSec ? getDomainInfo(sourceSec).domain : 'categories';
    const targetDomain = getDomainInfo(targetSec).domain;

    let nextPositions = [...metadata.positions];
    let nextCategories = [...metadata.categories];
    let nextSubmissions = [...metadata.submissions];
    let updatedFolders = { ...customCategoryFolders };

    // 1. Remove from source
    if (sourceDomain === 'positions') {
      nextPositions = nextPositions.filter((p) => p.name !== itemName);
    } else if (sourceDomain === 'categories') {
      nextCategories = nextCategories.filter((c) => c !== itemName);
      delete updatedFolders[itemName];
    } else if (sourceDomain === 'submissions') {
      nextSubmissions = nextSubmissions.map((grp) => ({
        ...grp,
        items: grp.items.filter((i) => i !== itemName),
      }));
    }

    // 2. Add to target
    if (targetDomain === 'positions') {
      const targetGroup = targetSec.title;
      if (!nextPositions.some((p) => p.name === itemName)) {
        nextPositions.push({
          id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: itemName,
          nameEn: itemName,
          group: targetGroup,
          subCategories: [...nextCategories],
        });
      } else {
        nextPositions = nextPositions.map((p) =>
          p.name === itemName ? { ...p, group: targetGroup } : p
        );
      }
    } else if (targetDomain === 'categories') {
      if (!nextCategories.includes(itemName)) {
        nextCategories.push(itemName);
      }
      const targetFolderId =
        targetSec.id === 'sec-takedown' ? 'cat-grp-takedown'
        : targetSec.id === 'sec-pass' ? 'cat-grp-pass'
        : targetSec.id === 'sec-sweep' ? 'cat-grp-sweep'
        : targetSec.id === 'sec-escape' ? 'cat-grp-escape'
        : 'cat-grp-core';
      updatedFolders[itemName] = targetFolderId;
    } else if (targetDomain === 'submissions') {
      const targetSubGroupId =
        targetSec.id === 'sec-upper-sub' ? 'choke'
        : targetSec.id === 'sec-lower-sub' ? 'leglock'
        : (nextSubmissions[0]?.id || 'choke');

      nextSubmissions = nextSubmissions.map((grp) => {
        if (grp.id === targetSubGroupId) {
          return {
            ...grp,
            items: grp.items.includes(itemName) ? grp.items : [...grp.items, itemName],
          };
        }
        return grp;
      });
    }

    setCustomCategoryFolders(updatedFolders);
    try {
      localStorage.setItem('bjj_custom_category_folder_map', JSON.stringify(updatedFolders));
    } catch {
      // ignore
    }

    onUpdateMetadata({
      ...metadata,
      positions: nextPositions,
      categories: nextCategories,
      submissions: nextSubmissions,
    });

    setDraggedTaxItem(null);
    showToast(`✅ '${itemName}'을(를) [${targetSec.title}] 박스로 이동했습니다.`);
  };

  // Feedback toast
  const [taxonomyFeedback, setTaxonomyFeedback] = useState<string | null>(null);
  const [highlightedItemName, setHighlightedItemName] = useState<string | null>(null);

  const [expandedTaxSections, setExpandedTaxSections] = useState<Record<string, boolean>>({
    'sec-positions-standing': true,
    'sec-positions-other': true,
    'sec-positions-dominant': true,
    'sec-positions-guard': true,
    'sec-takedown': true,
    'sec-pass': true,
    'sec-sweep': true,
    'sec-escape': true,
    'sec-upper-sub': true,
    'sec-lower-sub': true,
  });

  const showToast = (msg: string) => {
    setTaxonomyFeedback(msg);
    setTimeout(() => setTaxonomyFeedback(null), 3500);
  };

  const handleNavigateToTaxonomyItem = (
    sec: BjjTaxonomySection,
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
      if (matchedPos?.group) {
        setMobileExpandedPosGroup(matchedPos.group);
      }
      setTimeout(() => {
        const targetId = matchedPos?.id || `pos-card-${itemName}`;
        const el = document.getElementById(`pos-item-${targetId}`);
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
      setMobileExpandedSubGroup(subGroupId);
      setHighlightedItemName(itemName);
      setTimeout(() => {
        const el = document.getElementById(`sub-item-${itemName}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      return;
    }

    // Check 3: Category match
    const matchedCategoryGroup = STANDARD_CATEGORY_GROUPS.find((g) =>
      g.items.some((i) => i === itemName || i.includes(itemName) || itemName.includes(i))
    );
    setActiveTab('categories');
    if (matchedCategoryGroup) {
      setSelectedCatFolder(matchedCategoryGroup.id);
      setMobileExpandedCatFolder(matchedCategoryGroup.id);
    } else {
      setSelectedCatFolder('ALL');
    }
    setHighlightedItemName(itemName);
    setTimeout(() => {
      const el = document.getElementById(`cat-item-${itemName}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const handleApplyTaxonomy = () => {
    const next = applyCoreTaxonomyToMetadata();
    onUpdateMetadata(next);
    showToast(
      '기술 체계 공식 데이터(포지션 37종, 기술 5대 폴더 46종, 서브미션 4대 폴더 41종)가 완벽하게 동기화되었습니다!'
    );
  };

  // Add Position (Single-line) with automatic Korean & English parsing
  const handleAddPosition = (groupOverride?: string) => {
    const raw = newPosName.trim();
    if (!raw) return;
    let ko = raw;
    let en = newPosNameEn.trim();
    if (ko && !en) {
      const parsed = splitKoreanAndEnglish(ko);
      if (parsed.nameKo && parsed.nameEn) {
        ko = parsed.nameKo;
        en = parsed.nameEn;
      }
    }
    if (metadata.positions.some((p) => p.name === ko)) {
      showToast(`⚠️ '${ko}' 포지션은 이미 존재합니다.`);
      return;
    }
    const nextGroup = groupOverride || newPosGroup;
    const next: MetadataConfig = {
      ...metadata,
      positions: [
        ...metadata.positions,
        {
          id: `pos-${Date.now()}`,
          name: ko,
          nameEn: en || ko,
          group: nextGroup,
          subCategories: [...metadata.categories],
        },
      ],
    };
    onUpdateMetadata(next);
    setNewPosName('');
    setNewPosNameEn('');
    showToast(`✅ '${ko}' 포지션이 추가되었습니다!${en && en !== ko ? ` (${en})` : ''}`);
  };

  const handleSavePositionRename = (posId: string, oldName: string) => {
    const raw = editingPosValue.trim();
    if (!raw) {
      setEditingPosId(null);
      return;
    }
    const parsed = splitKoreanAndEnglish(raw);
    const trimmedKo = parsed.nameKo || raw;
    const trimmedEn = parsed.nameEn || '';
    if (trimmedKo === oldName && !trimmedEn) {
      setEditingPosId(null);
      return;
    }
    const next: MetadataConfig = {
      ...metadata,
      positions: metadata.positions.map((p) =>
        p.id === posId ? { ...p, name: trimmedKo, nameEn: trimmedEn || p.nameEn || trimmedKo } : p
      ),
    };
    onUpdateMetadata(next, {
      type: 'position',
      oldName,
      newName: trimmedKo,
    });
    setEditingPosId(null);
    showToast(`수정 완료: '${oldName}' → '${trimmedKo}'${trimmedEn ? ` (${trimmedEn})` : ''}`);
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
    showToast(`🗑️ '${posName}' 포지션이 삭제되었습니다.`);
  };

  // Add Category (Fixed: associates with target folder and updates positions subCategories, with Korean/English auto split)
  const handleAddCategory = (folderOverride?: string) => {
    const raw = newCategory.trim();
    if (!raw) return;
    const parsed = splitKoreanAndEnglish(raw);
    const trimmed = parsed.nameKo || raw;
    const enName = parsed.nameEn || '';
    if (metadata.categories.includes(trimmed)) {
      showToast(`⚠️ '${trimmed}' 기술은 이미 목록에 존재합니다.`);
      return;
    }
    const targetFolder =
      folderOverride ||
      (selectedCatFolder !== 'ALL' ? selectedCatFolder : newCategoryTargetFolder) ||
      catGroups[0]?.id ||
      'cat-grp-pass';

    const updatedFolders = { ...customCategoryFolders, [trimmed]: targetFolder };
    setCustomCategoryFolders(updatedFolders);
    try {
      localStorage.setItem('bjj_custom_category_folder_map', JSON.stringify(updatedFolders));
    } catch {
      // ignore
    }

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
    const targetGroupObj = catGroups.find((g) => g.id === targetFolder) || STANDARD_CATEGORY_GROUPS.find((g) => g.id === targetFolder);
    const grpTitle = targetGroupObj ? getCatGroupTitle(targetGroupObj.id, targetGroupObj.name) : '기술';
    showToast(`✅ [${grpTitle}]에 '${trimmed}' 기술이 추가되었습니다!${enName ? ` (${enName})` : ''}`);
  };

  const handleSaveCategoryRename = (idx: number, oldName: string) => {
    const raw = editingCatValue.trim();
    if (!raw) {
      setEditingCatIdx(null);
      return;
    }
    const parsed = splitKoreanAndEnglish(raw);
    const trimmed = parsed.nameKo || raw;
    if (trimmed === oldName) {
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
    const updatedFolders = { ...customCategoryFolders };
    if (updatedFolders[oldName]) {
      updatedFolders[trimmed] = updatedFolders[oldName];
      delete updatedFolders[oldName];
      setCustomCategoryFolders(updatedFolders);
      try {
        localStorage.setItem('bjj_custom_category_folder_map', JSON.stringify(updatedFolders));
      } catch {
        // ignore
      }
    }
    onUpdateMetadata(
      {
        ...metadata,
        categories: nextCategories,
        positions: nextPositions,
      },
      { type: 'category', oldName, newName: trimmed }
    );
    setEditingCatIdx(null);
    showToast(`수정 완료: '${oldName}' → '${trimmed}'`);
  };

  const handleDeleteCategory = (catName: string) => {
    const nextCategories = metadata.categories.filter((c) => c !== catName);
    const nextPositions = metadata.positions.map((p) => ({
      ...p,
      subCategories: p.subCategories.filter((sc) => sc !== catName),
    }));
    const updatedFolders = { ...customCategoryFolders };
    delete updatedFolders[catName];
    setCustomCategoryFolders(updatedFolders);
    try {
      localStorage.setItem('bjj_custom_category_folder_map', JSON.stringify(updatedFolders));
    } catch {
      // ignore
    }
    onUpdateMetadata({
      ...metadata,
      categories: nextCategories,
      positions: nextPositions,
    });
    showToast(`🗑️ '${catName}' 기술이 삭제되었습니다.`);
  };

  // Helper to reliably get all categories that belong to a folder
  const getCategoriesForFolder = (folderId: string): string[] => {
    const stdGrp = catGroups.find((g) => g.id === folderId) || STANDARD_CATEGORY_GROUPS.find((g) => g.id === folderId);
    const stdItems = stdGrp?.items || [];
    const standardInMeta = stdItems.filter((it) => metadata.categories.includes(it));

    const customItems = metadata.categories.filter((c) => {
      const inAnyStd = catGroups.some((g) => g.items.includes(c));
      if (!inAnyStd) {
        // 1. Explicit folder assignment
        if (customCategoryFolders[c] === folderId) return true;
        // 2. Keyword heuristic
        if (folderId === 'cat-grp-takedown' && (c.includes('테이크다운') || c.includes('메치기') || c.includes('업어치기') || c.includes('후리기') || c.includes('앵클') || c.includes('태클') || c.includes('유도') || c.includes('레슬링'))) return true;
        if (folderId === 'cat-grp-pass' && (c.includes('패스') || c.includes('토레안도') || c.includes('니슬라이드') || c.includes('스매시'))) return true;
        if (folderId === 'cat-grp-sweep' && (c.includes('스윕') || c.includes('시저스') || c.includes('힙범프') || c.includes('버터플라이'))) return true;
        if (folderId === 'cat-grp-escape' && (c.includes('이스케이프') || c.includes('리커버리') || c.includes('탈출') || c.includes('방어') || c.includes('프레임'))) return true;
        if (folderId === 'cat-grp-core' && (c.includes('서브미션') || c.includes('백') || c.includes('초크') || c.includes('암락') || c.includes('트랜지션') || c.includes('카운터') || c.includes('연계'))) return true;
        // 3. Fallback: if not mapped anywhere, put in first folder or 'cat-grp-core' so it's NEVER missing
        const hasOtherExplicit = customCategoryFolders[c] && customCategoryFolders[c] !== folderId;
        if (!hasOtherExplicit && (folderId === 'cat-grp-core' || folderId === catGroups[0]?.id)) {
          return true;
        }
      }
      return false;
    });

    return Array.from(new Set([...standardInMeta, ...customItems]));
  };

  // Add new submission group (Single-line) with Korean/English auto split
  const handleAddSubmissionGroup = () => {
    const raw = newSubGroupName.trim();
    if (!raw) return;
    const parsed = splitKoreanAndEnglish(raw);
    const ko = parsed.nameKo || raw;
    const en = parsed.nameEn || ko;
    const newId = `sub-grp-${Date.now()}`;
    const newGroup: SubmissionCompassGroup = {
      id: newId,
      name: ko,
      hubTitle: ko,
      items: [],
      isCustom: true,
    };
    const nextSubmissions = [...metadata.submissions, newGroup];
    onUpdateMetadata({ ...metadata, submissions: nextSubmissions });
    setSelectedSubGroup(newId);
    setMobileExpandedSubGroup(newId);
    setNewSubGroupName('');
    showToast(`✅ 새 서브미션 그룹 '${ko}' 생성 완료${en && en !== ko ? ` (${en})` : ''}`);
  };

  const handleDeleteSubmissionGroup = (groupId: string) => {
    if (metadata.submissions.length <= 1) return;
    const target = metadata.submissions.find((g) => g.id === groupId);
    const nextSubmissions = metadata.submissions.filter((g) => g.id !== groupId);
    onUpdateMetadata({ ...metadata, submissions: nextSubmissions });
    if (selectedSubGroup === groupId) {
      setSelectedSubGroup(nextSubmissions[0].id);
    }
    showToast(`🗑️ '${target?.name || '서브미션 그룹'}'이 삭제되었습니다.`);
  };

  // Add submission item (Single-line) with Korean/English auto split
  const handleAddSubmissionItem = (targetGroupId?: string) => {
    const targetGroup = targetGroupId || selectedSubGroup;
    const raw = newSubItem.trim();
    if (!raw) return;
    const parsed = splitKoreanAndEnglish(raw);
    const ko = parsed.nameKo || raw;
    const en = parsed.nameEn || '';
    const currentGroup = metadata.submissions.find((s) => s.id === targetGroup);
    if (currentGroup?.items.includes(ko)) {
      showToast(`⚠️ '${ko}' 서브미션은 이미 존재합니다.`);
      return;
    }
    const nextSubmissions = metadata.submissions.map((group) => {
      if (group.id !== targetGroup) return group;
      return {
        ...group,
        items: [...group.items, ko],
      };
    });
    onUpdateMetadata({ ...metadata, submissions: nextSubmissions });
    setNewSubItem('');
    showToast(`✅ [${currentGroup?.name || '서브미션'}]에 '${ko}' 추가 완료${en ? ` (${en})` : ''}`);
  };

  const handleSaveSubItemRename = (oldItem: string, targetGroupId?: string) => {
    const targetGroup = targetGroupId || selectedSubGroup;
    const raw = editingSubValue.trim();
    if (!raw) {
      setEditingSubItem(null);
      return;
    }
    const parsed = splitKoreanAndEnglish(raw);
    const trimmed = parsed.nameKo || raw;
    if (trimmed === oldItem) {
      setEditingSubItem(null);
      return;
    }
    const nextSubmissions = metadata.submissions.map((group) => {
      if (group.id !== targetGroup) return group;
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
    showToast(`수정 완료: '${oldItem}' → '${trimmed}'`);
  };

  const handleDeleteSubItem = (item: string, targetGroupId?: string) => {
    const targetGroup = targetGroupId || selectedSubGroup;
    const nextSubmissions = metadata.submissions.map((group) => {
      if (group.id !== targetGroup) return group;
      return {
        ...group,
        items: group.items.filter((it) => it !== item),
      };
    });
    onUpdateMetadata({ ...metadata, submissions: nextSubmissions });
    showToast(`🗑️ '${item}' 서브미션이 삭제되었습니다.`);
  };

  // Add Gi Type
  const handleAddGi = () => {
    const trimmed = newGi.trim();
    if (!trimmed || metadata.giTypes.includes(trimmed)) return;
    onUpdateMetadata({
      ...metadata,
      giTypes: [...metadata.giTypes, trimmed],
    });
    setNewGi('');
    showToast(`✅ '${trimmed}' 도복 구분이 추가되었습니다.`);
  };

  const handleSaveGiRename = (idx: number, oldName: string) => {
    const trimmed = editingGiValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingGiIndex(null);
      return;
    }
    const next = metadata.giTypes.map((g, i) => (i === idx ? trimmed : g));
    onUpdateMetadata({ ...metadata, giTypes: next });
    setEditingGiIndex(null);
    showToast(`수정 완료: '${oldName}' → '${trimmed}'`);
  };

  const handleDeleteGi = (name: string) => {
    if (metadata.giTypes.length <= 1) return;
    onUpdateMetadata({
      ...metadata,
      giTypes: metadata.giTypes.filter((g) => g !== name),
    });
    showToast(`🗑️ '${name}' 분류가 삭제되었습니다.`);
  };

  // Add Difficulty Level
  const handleAddDiff = () => {
    const trimmed = newDiff.trim();
    if (!trimmed || metadata.difficulties.includes(trimmed)) return;
    onUpdateMetadata({
      ...metadata,
      difficulties: [...metadata.difficulties, trimmed],
    });
    setNewDiff('');
    showToast(`✅ '${trimmed}' 난이도 단계가 추가되었습니다.`);
  };

  const handleSaveDiffRename = (idx: number, oldName: string) => {
    const trimmed = editingDiffValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingDiffIndex(null);
      return;
    }
    const next = metadata.difficulties.map((d, i) => (i === idx ? trimmed : d));
    onUpdateMetadata({ ...metadata, difficulties: next });
    setEditingDiffIndex(null);
    showToast(`수정 완료: '${oldName}' → '${trimmed}'`);
  };

  const handleDeleteDiff = (name: string) => {
    if (metadata.difficulties.length <= 1) return;
    onUpdateMetadata({
      ...metadata,
      difficulties: metadata.difficulties.filter((d) => d !== name),
    });
    showToast(`🗑️ '${name}' 난이도가 삭제되었습니다.`);
  };

  // Add technique directly from "기술 체계"
  const handleAddTechniqueFromTaxonomy = (sec: BjjTaxonomySection) => {
    const trimmedName = newTaxTechName.trim();
    const trimmedEn = newTaxTechNameEn.trim();
    if (!trimmedName) return;

    if (sec.category === 'positions') {
      let targetGroup = '가드 포지션 (하위)';
      if (sec.id === 'sec-positions-standing') {
        targetGroup = '스탠딩 및 특수 포지션';
      } else if (sec.id === 'sec-positions-dominant') {
        targetGroup = '탑 & 도미넌트 (상위)';
      }

      if (metadata.positions.some((p) => p.name === trimmedName)) {
        showToast(`⚠️ '${trimmedName}' 포지션은 이미 존재합니다.`);
        return;
      }

      const nextPositions: PositionFolder[] = [
        ...metadata.positions,
        {
          id: `pos-${Date.now()}`,
          name: trimmedName,
          nameEn: trimmedEn || trimmedName,
          group: targetGroup,
          subCategories: [...metadata.categories],
        },
      ];

      onUpdateMetadata({
        ...metadata,
        positions: nextPositions,
      });

      showToast(`✅ [${getSectionTitle(sec, language)}] '${trimmedName}' ${language === 'ko' ? '포지션 추가 완료' : 'position added'}`);
    } else if (sec.category === 'upper_sub' || sec.category === 'lower_sub') {
      const targetSubGroupId =
        newTaxTargetSubGroup ||
        (sec.category === 'upper_sub' ? 'choke' : 'leglock');

      const targetGroupObj = metadata.submissions.find((s) => s.id === targetSubGroupId);
      if (targetGroupObj?.items.includes(trimmedName)) {
        showToast(language === 'ko' ? `⚠️ '${trimmedName}' 서브미션은 이미 존재합니다.` : `⚠️ '${trimmedName}' already exists.`);
        return;
      }

      const nextSubmissions = metadata.submissions.map((group) => {
        if (group.id !== targetSubGroupId) return group;
        return {
          ...group,
          items: [...group.items, trimmedName],
        };
      });

      onUpdateMetadata({
        ...metadata,
        submissions: nextSubmissions,
      });

      showToast(`✅ [${getSectionTitle(sec, language)}] '${trimmedName}' ${language === 'ko' ? '추가 완료' : 'added'}`);
    } else {
      if (metadata.categories.includes(trimmedName)) {
        showToast(`⚠️ '${trimmedName}' 기술은 이미 등록되어 있습니다.`);
        return;
      }

      const folderMapping: Record<string, string> = {
        takedown: 'cat-grp-takedown',
        pass: 'cat-grp-pass',
        sweep: 'cat-grp-sweep',
        escape: 'cat-grp-escape',
      };
      const catFolder = folderMapping[sec.category] || 'cat-grp-pass';
      setCustomCategoryFolders((prev) => ({ ...prev, [trimmedName]: catFolder }));

      const nextCategories = [...metadata.categories, trimmedName];
      const nextPositions = metadata.positions.map((p) => ({
        ...p,
        subCategories: p.subCategories.includes(trimmedName)
          ? p.subCategories
          : [...p.subCategories, trimmedName],
      }));

      onUpdateMetadata({
        ...metadata,
        categories: nextCategories,
        positions: nextPositions,
      });

      showToast(`✅ [${language === 'en' ? (sec.category === 'takedown' ? 'Takedowns' : sec.category === 'pass' ? 'Guard Passes' : sec.category === 'sweep' ? 'Sweeps' : sec.category === 'escape' ? 'Escapes & Defense' : sec.category === 'upper_sub' ? 'Upper Body Finishes' : sec.category === 'lower_sub' ? 'Lower Body Finishes' : sec.category === 'positions' ? (sec.id.includes('standing') ? 'Standing & Special' : sec.id.includes('dominant') ? 'Top & Dominant' : 'Guard Positions') : sec.title) : sec.title}]에 '${trimmedName}' 기술 추가 완료`);
    }

    setNewTaxTechName('');
    setNewTaxTechNameEn('');
    setAddingTaxSectionId(null);
  };

  // Helper to dynamically get all items for a taxonomy section
  const getDynamicSectionItems = (
    sec: BjjTaxonomySection
  ): Array<{ name: string; nameEn?: string; targetSubGroup?: string }> => {
    if (sec.category === 'positions') {
      let matchingPositions: PositionFolder[] = [];
      if (sec.id === 'sec-positions-standing') {
        matchingPositions = metadata.positions.filter(
          (p) => p.group === '스탠딩' || p.group === '스탠딩 및 특수 포지션'
        );
      } else if (sec.id === 'sec-positions-other') {
        matchingPositions = metadata.positions.filter(
          (p) => p.group === '기타'
        );
      } else if (sec.id === 'sec-positions-dominant') {
        matchingPositions = metadata.positions.filter(
          (p) => p.group === '탑 & 도미넌트 (상위)' || p.group === '포지션 선점'
        );
      } else {
        matchingPositions = metadata.positions.filter(
          (p) =>
            p.group === '가드 포지션 (하위)' ||
            p.group === '가드' ||
            (!['스탠딩', '기타', '스탠딩 및 특수 포지션', '탑 & 도미넌트 (상위)', '포지션 선점'].includes(p.group || ''))
        );
      }

      return matchingPositions.map((p) => ({
        name: p.name,
        nameEn: p.nameEn,
      }));
    }

    if (sec.category === 'upper_sub') {
      const upperGroups = metadata.submissions.filter(
        (g) => g.id === 'choke' || g.id === 'armlock'
      );
      const allUpperItems = upperGroups.flatMap((g) =>
        g.items.map((it) => {
          const original = sec.items.find((orig) => orig.name === it);
          return {
            name: it,
            nameEn: original?.nameEn,
            targetSubGroup: g.id,
          };
        })
      );
      return allUpperItems.length > 0 ? allUpperItems : sec.items;
    }

    if (sec.category === 'lower_sub') {
      const lowerGroups = metadata.submissions.filter(
        (g) => g.id === 'leglock' || g.id === 'compression' || g.isCustom
      );
      const allLowerItems = lowerGroups.flatMap((g) =>
        g.items.map((it) => {
          const original = sec.items.find((orig) => orig.name === it);
          return {
            name: it,
            nameEn: original?.nameEn,
            targetSubGroup: g.id,
          };
        })
      );
      return allLowerItems.length > 0 ? allLowerItems : sec.items;
    }

    const stdGrp = STANDARD_CATEGORY_GROUPS.find((g) => g.id.includes(sec.category));
    if (stdGrp) {
      const matchingCats = getCategoriesForFolder(stdGrp.id);
      return matchingCats.map((c) => {
        const original = sec.items.find((it) => it.name === c);
        return {
          name: c,
          nameEn: original?.nameEn,
        };
      });
    }

    return sec.items;
  };

  const currentSubGroupObj =
    metadata.submissions.find((s) => s.id === selectedSubGroup) ||
    metadata.submissions[0];

  const standingTitle = customPositionGroupTitles['스탠딩'] || '스탠딩';
  const otherTitle = customPositionGroupTitles['기타'] || '기타';
  const dominantTitle = customPositionGroupTitles['탑 & 도미넌트 (상위)'] || '탑 & 도미넌트 (상위)';
  const guardTitle = customPositionGroupTitles['가드 포지션 (하위)'] || '가드 포지션 (하위)';

  const standingPositions = metadata.positions.filter(
    (p) =>
      p.group === standingTitle ||
      p.group === '스탠딩' ||
      (p.group === '스탠딩 및 특수 포지션' && (p.name.includes('스탠딩') || p.name.includes('레슬링') || p.name.includes('오픈 그립') || p.name.includes('클린치')))
  );
  const standingCount = standingPositions.length;

  const otherPositions = metadata.positions.filter(
    (p) =>
      p.group === otherTitle ||
      p.group === '기타' ||
      (p.group === '스탠딩 및 특수 포지션' && ['터틀', '트럭', '아시', '새들'].some((k) => p.name.includes(k)))
  );
  const otherCount = otherPositions.length;

  const dominantPositions = metadata.positions.filter(
    (p) =>
      p.group === dominantTitle ||
      p.group === '탑 & 도미넌트 (상위)' ||
      p.group === '포지션 선점' ||
      ['마운트', '사이드', '니온밸리', '노스 사우스', '곁누르기', '케사', '크루시픽스', '헤드쿼터'].some((k) =>
        p.name.includes(k)
      )
  );
  const dominantCount = dominantPositions.length;

  const guardPositions = metadata.positions.filter(
    (p) =>
      p.group === guardTitle ||
      p.group === '가드 포지션 (하위)' ||
      p.group === '가드' ||
      (![standingTitle, '스탠딩', otherTitle, '기타', dominantTitle, '탑 & 도미넌트 (상위)', '스탠딩 및 특수 포지션', '포지션 선점'].includes(p.group || ''))
  );
  const guardCount = guardPositions.length;

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-200">
      {taxonomyFeedback && (
        <div className="p-3.5 rounded-2xl bg-sky-500 text-white text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>{taxonomyFeedback}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MOBILE-ONLY VIEW                                                       */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-3 pb-8">
        <div className="flex items-center gap-1.5 py-1 px-1 overflow-x-auto custom-scrollbar no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('taxonomy')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'taxonomy'
                ? 'bg-teal-700 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100/80'
            }`}
          >
            {language === 'ko' ? '기술 체계' : 'Taxonomy'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('positions')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'positions'
                ? 'bg-teal-700 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100/80'
            }`}
          >
            {language === 'ko' ? '포지션' : 'Positions'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'categories'
                ? 'bg-teal-700 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100/80'
            }`}
          >
            {language === 'ko' ? '기술' : 'Techniques'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'submissions'
                ? 'bg-teal-700 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100/80'
            }`}
          >
            {language === 'ko' ? '서브미션' : 'Submissions'}
          </button>
        </div>

        {/* Mobile Tab 1: 기술 체계 */}
        {activeTab === 'taxonomy' && (
          <div className="space-y-3">
            {taxonomySections.map((sec, secIdx) => {
              const cfg = MOBILE_TAXONOMY_STYLES[sec.id] || {
                iconBg: 'bg-indigo-600',
                iconColor: 'text-white',
                countColor: 'text-indigo-600',
                cardBg: 'from-indigo-50/70 via-indigo-50/30 to-white border-indigo-100',
                subtitle: sec.badge,
                IconComponent: Shield,
              };
              const Icon = cfg.IconComponent;
              const dynamicItems = getDynamicSectionItems(sec);
              const isExpanded = mobileExpandedTaxSec === sec.id;
              const domainInfo = getDomainInfo(sec);

              return (
                <div
                  key={sec.id}
                  className={`bg-gradient-to-r ${cfg.cardBg} rounded-2xl border p-3.5 shadow-2xs transition-all space-y-2.5`}
                >
                  <div
                    onClick={() => setMobileExpandedTaxSec(isExpanded ? null : sec.id)}
                    className="flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-full ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center shadow-xs shrink-0`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {editingSecTitleId === sec.id ? (
                            <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editingSecTitleValue}
                                onChange={(e) => setEditingSecTitleValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveSectionTitleRename(sec.id, sec.title);
                                  if (e.key === 'Escape') setEditingSecTitleId(null);
                                }}
                                className="px-2 py-0.5 text-xs font-bold border border-indigo-400 rounded-lg flex-1 bg-white text-slate-900"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveSectionTitleRename(sec.id, sec.title)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSecTitleId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <h4 className="text-[13px] font-black text-slate-900 truncate">
                                {sec.title}
                              </h4>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSecTitleId(sec.id);
                                  setEditingSecTitleValue(sec.title);
                                }}
                                className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
                                title="대분류명 수정"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${domainInfo.badgeClass}`}>
                            {domainInfo.icon} {domainInfo.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                          {sec.badge} • {sec.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-black font-mono ${cfg.countColor}`}>
                        {dynamicItems.length}개
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90 text-slate-700' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Mobile Domain Reassign & Move Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 font-bold shrink-0">소속:</span>
                      <select
                        value={domainInfo.domain}
                        onChange={(e) => handleReassignSectionDomain(sec.id, e.target.value as SystemDomain)}
                        className="px-2 py-1 text-[11px] font-bold bg-white border border-slate-200 rounded-lg text-slate-800 shrink-0 focus:outline-none"
                      >
                        <option value="positions">📁 포지션 폴더</option>
                        <option value="categories">🗂️ 기술</option>
                        <option value="submissions">🎯 서브미션</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={secIdx === 0}
                        onClick={() => handleMoveSection(secIdx, 'up')}
                        className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100"
                        title="위로 이동"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={secIdx === taxonomySections.length - 1}
                        onClick={() => handleMoveSection(secIdx, 'down')}
                        className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100"
                        title="아래로 이동"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-2 border-t border-slate-200/80 space-y-2.5 animate-in fade-in">
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 p-1.5 bg-white border border-indigo-200 rounded-xl shadow-2xs"
                      >
                        {(sec.category === 'upper_sub' || sec.category === 'lower_sub') && (
                          <select
                            value={newTaxTargetSubGroup}
                            onChange={(e) => setNewTaxTargetSubGroup(e.target.value as SubmissionGroupId)}
                            className="px-2 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 shrink-0 focus:outline-none"
                          >
                            {sec.category === 'upper_sub' ? (
                              <>
                                <option value="choke">{language === 'ko' ? '초크' : 'Chokes'}</option>
                                <option value="armlock">{language === 'ko' ? '암락' : 'Armlocks'}</option>
                              </>
                            ) : (
                              <>
                                <option value="leglock">{language === 'ko' ? '렉락' : 'Leglocks'}</option>
                                <option value="compression">{language === 'ko' ? '압박' : 'Compressions'}</option>
                              </>
                            )}
                          </select>
                        )}
                        <input
                          type="text"
                          value={newTaxTechName}
                          onChange={(e) => setNewTaxTechName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTechniqueFromTaxonomy(sec);
                          }}
                          placeholder={language === 'ko' ? `[${sec.title}] 새 기술명...` : `New technique in ${getSectionTitle(sec, language)}...`}
                          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTechniqueFromTaxonomy(sec)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'ko' ? '추가' : 'Add'}</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {dynamicItems.map((it, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigateToTaxonomyItem(sec, it);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/95 border border-slate-200/90 text-[11px] font-semibold text-slate-800 hover:text-indigo-700 transition-all cursor-pointer shadow-3xs flex items-center gap-1 active:scale-95"
                          >
                            <span className="font-mono text-slate-400 text-[10px]">
                              {idx + 1}.
                            </span>
                            <span>{language === 'en' ? (it.nameEn || it.name) : it.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile Tab 2: 포지션 */}
        {activeTab === 'positions' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
              <select
                value={newPosGroup}
                onChange={(e) => setNewPosGroup(e.target.value)}
                className="px-2 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 shrink-0 focus:outline-none"
              >
                <option value="스탠딩">{language === 'ko' ? '스탠딩' : 'Standing'}</option>
                <option value="기타">{language === 'ko' ? '기타 (특수)' : 'Others / Special'}</option>
                <option value="탑 & 도미넌트 (상위)">{language === 'ko' ? '탑/상위' : 'Top/Dominant'}</option>
                <option value="가드 포지션 (하위)">{language === 'ko' ? '가드/하위' : 'Guard'}</option>
              </select>
              <input
                type="text"
                value={newPosName}
                onChange={(e) => setNewPosName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddPosition();
                }}
                placeholder={language === 'ko' ? "새 포지션 명칭 (한글/영문)..." : "New position name..."}
                className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-800"
              />
              <button
                type="button"
                onClick={() => handleAddPosition()}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'ko' ? '추가' : 'Add'}</span>
              </button>
            </div>

            {[
              {
                id: '스탠딩',
                title: getPosGroupTitle('스탠딩', language === 'ko' ? '스탠딩' : 'Standing'),
                count: standingCount,
                items: standingPositions,
              },
              {
                id: '기타',
                title: getPosGroupTitle('기타', language === 'ko' ? '기타 (특수 포지션)' : 'Others / Special'),
                count: otherCount,
                items: otherPositions,
              },
              {
                id: '탑 & 도미넌트 (상위)',
                title: getPosGroupTitle('탑 & 도미넌트 (상위)', language === 'ko' ? '탑 & 도미넌트 (상위)' : 'Top & Dominant'),
                count: dominantCount,
                items: dominantPositions,
              },
              {
                id: '가드 포지션 (하위)',
                title: getPosGroupTitle('가드 포지션 (하위)', language === 'ko' ? '가드 포지션 (하위)' : 'Guard Positions'),
                count: guardCount,
                items: guardPositions,
              },
            ].map((grp) => {
              const cfg = POSITION_GROUP_STYLES[grp.id] || {
                iconBg: 'bg-indigo-600',
                iconColor: 'text-white',
                countColor: 'text-indigo-600',
                cardBg: 'from-indigo-50/70 via-indigo-50/30 to-white border-indigo-100',
                subtitle: 'Position Folders',
                IconComponent: Folder,
              };
              const Icon = cfg.IconComponent;
              const isExpanded = mobileExpandedPosGroup === grp.id;

              return (
                <div
                  key={grp.id}
                  className={`bg-gradient-to-r ${cfg.cardBg} rounded-2xl border p-3.5 shadow-2xs transition-all`}
                >
                  <div
                    onClick={() => setMobileExpandedPosGroup(isExpanded ? null : grp.id)}
                    className="flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 rounded-full ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center shadow-xs shrink-0`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {editingPosGroupId === grp.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingPosGroupValue}
                              onChange={(e) => setEditingPosGroupValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSavePositionGroupRename(grp.id, grp.title);
                                if (e.key === 'Escape') setEditingPosGroupId(null);
                              }}
                              className="px-2 py-0.5 text-xs font-bold border border-indigo-400 rounded-lg flex-1 bg-white"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePositionGroupRename(grp.id, grp.title)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPosGroupId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-[13px] font-black text-slate-900 truncate">
                              {grp.title}
                            </h4>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPosGroupId(grp.id);
                                setEditingPosGroupValue(grp.title);
                              }}
                              className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
                              title="대분류명 수정"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                          {cfg.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-black font-mono ${cfg.countColor}`}>
                        {grp.items.length}{language === 'ko' ? '개' : ' items'}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90 text-slate-700' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 animate-in fade-in">
                      <div className="space-y-1.5">
                        {grp.items.map((pos) => (
                          <div
                            key={pos.id}
                            id={`pos-item-${pos.id}`}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                          >
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {language === 'en' ? (pos.nameEn || pos.name) : pos.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeletePosition(pos.id, pos.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile Tab 3: 기술 */}
        {activeTab === 'categories' && (
          <div className="space-y-3">
            <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 flex items-start gap-2 shadow-3xs leading-relaxed">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                {language === 'ko'
                  ? '💡 서브미션은 [서브미션] 탭에서 통합 관리되며, 영상 추가/수정의 기술에서 [서브미션] 선택 시 세부 피니시 기술들이 바로 연동됩니다.'
                  : 'Submissions are centrally managed in the Submissions tab and automatically synced when adding/editing videos.'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
              <select
                value={newCategoryTargetFolder}
                onChange={(e) => setNewCategoryTargetFolder(e.target.value)}
                className="px-2 py-1.5 text-[11px] font-bold bg-white border border-slate-300 rounded-lg text-slate-800 shrink-0 focus:outline-none max-w-[110px] sm:max-w-[140px] truncate"
              >
                <option value="cat-grp-takedown">{getCatGroupTitle('cat-grp-takedown', language === 'ko' ? '테이크다운' : 'Takedowns')}</option>
                <option value="cat-grp-pass">{getCatGroupTitle('cat-grp-pass', language === 'ko' ? '가드 패스' : 'Guard Passes')}</option>
                <option value="cat-grp-sweep">{getCatGroupTitle('cat-grp-sweep', language === 'ko' ? '스윕' : 'Sweeps')}</option>
                <option value="cat-grp-escape">{getCatGroupTitle('cat-grp-escape', language === 'ko' ? '이스케이프 & 리커버리' : 'Escapes & Recovery')}</option>
                <option value="cat-grp-core">{getCatGroupTitle('cat-grp-core', language === 'ko' ? '기타' : 'Others')}</option>
              </select>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCategory();
                }}
                placeholder={language === 'ko' ? "새 기술 명칭 (한글/영문)..." : "New category name..."}
                className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-800"
              />
              <button
                type="button"
                onClick={() => handleAddCategory()}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'ko' ? '추가' : 'Add'}</span>
              </button>
            </div>

            {STANDARD_CATEGORY_GROUPS.filter((grp) => grp.id !== 'cat-grp-submission').map((grp) => {
              const cfg = CATEGORY_FOLDER_STYLES[grp.id] || {
                iconBg: 'bg-indigo-600',
                iconColor: 'text-white',
                countColor: 'text-indigo-600',
                cardBg: 'from-indigo-50/70 via-indigo-50/30 to-white border-indigo-100',
                subtitle: grp.description,
                IconComponent: Folder,
              };
              const Icon = cfg.IconComponent;
              const grpItems = getCategoriesForFolder(grp.id);
              const isExpanded = mobileExpandedCatFolder === grp.id;
              const title = getCatGroupTitle(grp.id, grp.name === '기타' ? '기타' : translateCategoryGroup(grp.id, language));

              return (
                <div
                  key={grp.id}
                  className={`bg-gradient-to-r ${cfg.cardBg} rounded-2xl border p-3.5 shadow-2xs transition-all`}
                >
                  <div
                    onClick={() => setMobileExpandedCatFolder(isExpanded ? null : grp.id)}
                    className="flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 rounded-full ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center shadow-xs shrink-0`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {editingCatGroupId === grp.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingCatGroupValue}
                              onChange={(e) => setEditingCatGroupValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveCategoryGroupRename(grp.id, title);
                                if (e.key === 'Escape') setEditingCatGroupId(null);
                              }}
                              className="px-2 py-0.5 text-xs font-bold border border-indigo-400 rounded-lg flex-1 bg-white"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCategoryGroupRename(grp.id, title)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCatGroupId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-[13px] font-black text-slate-900 truncate">
                              {title}
                            </h4>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCatGroupId(grp.id);
                                setEditingCatGroupValue(title);
                              }}
                              className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
                              title="대분류명 수정"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                          {cfg.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-black font-mono ${cfg.countColor}`}>
                        {grpItems.length}개
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90 text-slate-700' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 animate-in fade-in">
                      <div className="grid grid-cols-1 gap-1.5">
                        {grpItems.map((cat) => (
                          <div
                            key={cat}
                            id={`cat-item-${cat}`}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                          >
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {translateCategory(cat, language)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile Tab 4: 서브미션 */}
        {activeTab === 'submissions' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
              <input
                type="text"
                value={newSubGroupName}
                onChange={(e) => setNewSubGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubmissionGroup();
                }}
                placeholder={language === 'ko' ? "새 서브미션 그룹 명칭 (한글/영문)..." : "New submission group name..."}
                className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-800"
              />
              <button
                type="button"
                onClick={handleAddSubmissionGroup}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'ko' ? '그룹 추가' : 'Add Group'}</span>
              </button>
            </div>

            {metadata.submissions.map((group) => {
              const cfg = SUBMISSION_GROUP_STYLES[group.id] || {
                iconBg: 'bg-indigo-600',
                iconColor: 'text-white',
                countColor: 'text-indigo-600',
                cardBg: 'from-indigo-50/70 via-indigo-50/30 to-white border-indigo-100',
                subtitle: 'Custom Submission Finishes',
                IconComponent: Compass,
              };
              const Icon = cfg.IconComponent;
              const isExpanded = mobileExpandedSubGroup === group.id;

              return (
                <div
                  key={group.id}
                  className={`bg-gradient-to-r ${cfg.cardBg} rounded-2xl border p-3.5 shadow-2xs transition-all`}
                >
                  <div
                    onClick={() => setMobileExpandedSubGroup(isExpanded ? null : group.id)}
                    className="flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-full ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center shadow-xs shrink-0`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {editingSubGroupId === group.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingSubGroupValue}
                              onChange={(e) => setEditingSubGroupValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveSubmissionGroupRename(group.id, group.name);
                                if (e.key === 'Escape') setEditingSubGroupId(null);
                              }}
                              className="px-2 py-0.5 text-xs font-bold border border-indigo-400 rounded-lg flex-1 bg-white"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveSubmissionGroupRename(group.id, group.name)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSubGroupId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-[13px] font-black text-slate-900 truncate">
                              {group.name}
                            </h4>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSubGroupId(group.id);
                                setEditingSubGroupValue(group.name);
                              }}
                              className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
                              title="대분류명 수정"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                          {cfg.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-black font-mono ${cfg.countColor}`}>
                        {group.items.length}개
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90 text-slate-700' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5 animate-in fade-in">
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs"
                      >
                        <input
                          type="text"
                          value={newSubItem}
                          onChange={(e) => setNewSubItem(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddSubmissionItem(group.id);
                          }}
                          placeholder={language === 'ko' ? `[${group.name}] 새 기술명...` : `New technique in ${group.name}...`}
                          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubmissionItem(group.id)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'ko' ? '추가' : 'Add'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        {group.items.map((item) => (
                          <div
                            key={item}
                            id={`sub-item-${item}`}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                          >
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {translateSubmissionDetail(item, language)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubItem(item, group.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP-ONLY VIEW (Clean, Simple, 100% Unified Design Across All Tabs) */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-6">
        {/* Desktop Tab Navigation Bar */}
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('taxonomy')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'taxonomy'
                ? 'bg-slate-900 text-white font-black shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{language === 'ko' ? '기술 체계' : 'Core System'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'positions'
                ? 'bg-slate-900 text-white font-black shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderCog className="w-4 h-4 text-blue-400" />
            <span>{language === 'ko' ? '포지션' : 'Positions'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white">
              {metadata.positions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-slate-900 text-white font-black shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>{language === 'ko' ? '기술' : 'Techniques'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white">
              {metadata.categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'submissions'
                ? 'bg-slate-900 text-white font-black shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4 text-rose-400" />
            <span>{language === 'ko' ? '서브미션' : 'Submissions'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white">
              {metadata.submissions.length} {language === 'ko' ? '개 그룹' : 'groups'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gi_diff')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'gi_diff'
                ? 'bg-slate-900 text-white font-black shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4 text-violet-400" />
            <span>{language === 'ko' ? '도복 구분 & 난이도 단계' : 'Gi & Difficulty'}</span>
          </button>
        </div>

        {/* Desktop Tab Contents: Unified Simple Container */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          {/* TAB 1: 기술 체계 */}
          {activeTab === 'taxonomy' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{language === 'ko' ? '주짓수 핵심 기술체계 마스터 트리' : 'BJJ Core Technique Master Tree'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'ko' ? '각 체계 박스의 소속을 변경하거나, ↑↓ 버튼으로 순서를 조정하고, + 버튼으로 새 기술을 등록할 수 있습니다.' : 'Reassign box domains, reorder cards with ↑↓, and add techniques.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedTaxDomainFilter('ALL')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        selectedTaxDomainFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'ko' ? '전체' : 'All'} ({taxonomySections.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTaxDomainFilter('positions')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        selectedTaxDomainFilter === 'positions'
                          ? 'bg-blue-600 text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📁 {language === 'ko' ? '포지션' : 'Positions'} ({taxonomySections.filter((s) => getDomainInfo(s).domain === 'positions').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTaxDomainFilter('categories')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        selectedTaxDomainFilter === 'categories'
                          ? 'bg-emerald-600 text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🗂️ {language === 'ko' ? '기술' : 'Techniques'} ({taxonomySections.filter((s) => getDomainInfo(s).domain === 'categories').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTaxDomainFilter('submissions')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        selectedTaxDomainFilter === 'submissions'
                          ? 'bg-violet-600 text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🎯 {language === 'ko' ? '서브미션' : 'Submissions'} ({taxonomySections.filter((s) => getDomainInfo(s).domain === 'submissions').length})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyTaxonomy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>{language === 'ko' ? '기본 동기화' : 'Sync'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {taxonomySections
                  .map((sec, originalIdx) => ({ sec, originalIdx }))
                  .filter(({ sec }) => selectedTaxDomainFilter === 'ALL' || getDomainInfo(sec).domain === selectedTaxDomainFilter)
                  .map(({ sec, originalIdx }) => {
                    const isExpanded = expandedTaxSections[sec.id] !== false;
                    const isAdding = addingTaxSectionId === sec.id;
                    const dynamicItems = getDynamicSectionItems(sec);
                    const domainInfo = getDomainInfo(sec);

                    return (
                      <div
                        key={sec.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDropOnTaxonomySection(sec);
                        }}
                        className={`p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-all space-y-3.5 shadow-3xs ${
                          draggedTaxItem ? 'ring-2 ring-indigo-400/40 bg-indigo-50/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {editingSecTitleId === sec.id ? (
                                <div className="flex items-center gap-1 max-w-xs">
                                  <input
                                    type="text"
                                    value={editingSecTitleValue}
                                    onChange={(e) => setEditingSecTitleValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveSectionTitleRename(sec.id, sec.title);
                                      if (e.key === 'Escape') setEditingSecTitleId(null);
                                    }}
                                    className="px-2 py-0.5 text-xs font-bold border border-indigo-400 rounded-lg flex-1 bg-white text-slate-900"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveSectionTitleRename(sec.id, sec.title)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                    title="저장"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSecTitleId(null)}
                                    className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                    title="취소"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-slate-900">
                                    {sec.title}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSecTitleId(sec.id);
                                      setEditingSecTitleValue(sec.title);
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer transition-colors"
                                    title={language === 'ko' ? "박스 대분류명 변경" : "Rename section"}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${domainInfo.badgeClass}`}>
                                {domainInfo.icon} {domainInfo.label}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                ({sec.badge})
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-700">
                                {dynamicItems.length} {language === 'ko' ? '개 기술' : 'techniques'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {sec.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Reorder Buttons */}
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-3xs p-0.5">
                              <button
                                type="button"
                                disabled={originalIdx === 0}
                                onClick={() => handleMoveSection(originalIdx, 'up')}
                                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer"
                                title={language === 'ko' ? '박스 위로 이동' : 'Move card up'}
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={originalIdx === taxonomySections.length - 1}
                                onClick={() => handleMoveSection(originalIdx, 'down')}
                                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer"
                                title={language === 'ko' ? '박스 아래로 이동' : 'Move card down'}
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (isAdding) {
                                  setAddingTaxSectionId(null);
                                } else {
                                  setAddingTaxSectionId(sec.id);
                                  setNewTaxTechName('');
                                  setNewTaxTechNameEn('');
                                  if (sec.category === 'upper_sub') {
                                    setNewTaxTargetSubGroup('choke');
                                  } else if (sec.category === 'lower_sub') {
                                    setNewTaxTargetSubGroup('leglock');
                                  }
                                }
                              }}
                              className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                                isAdding
                                  ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                                  : 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white shadow-xs'
                              }`}
                              title={isAdding ? (language === 'ko' ? '취소' : 'Cancel') : (language === 'ko' ? `[${sec.title}]에 기술 추가` : `Add technique to ${getSectionTitle(sec, language)}`)}
                            >
                              {isAdding ? (
                                <X className="w-3.5 h-3.5" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedTaxSections((prev) => ({
                                  ...prev,
                                  [sec.id]: !prev[sec.id],
                                }))
                              }
                              className="p-1.5 rounded-xl hover:bg-slate-200/70 text-slate-500 cursor-pointer"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Domain Reassignment & Quick Switch Bar */}
                        <div className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200/90 rounded-xl text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <span className="text-[11px] font-bold text-slate-400">연동 소속:</span>
                            <select
                              value={domainInfo.domain}
                              onChange={(e) => handleReassignSectionDomain(sec.id, e.target.value as SystemDomain)}
                              className="px-2 py-1 text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
                            >
                              <option value="positions">📁 포지션 폴더 (Positions)</option>
                              <option value="categories">🗂️ 기술 (Techniques)</option>
                              <option value="submissions">🎯 서브미션 (Submissions)</option>
                            </select>
                          </div>
                          <span className="text-[10px] text-slate-400 hidden sm:inline">
                            {language === 'ko' ? '소속 변경 시 해당 탭과 즉시 연동됩니다' : 'Linked domain synced'}
                          </span>
                        </div>

                        {/* Desktop Unified Single-line Add Bar */}
                        {isAdding && (
                          <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs animate-in fade-in">
                            {(sec.category === 'upper_sub' || sec.category === 'lower_sub') && (
                              <select
                                value={newTaxTargetSubGroup}
                                onChange={(e) => setNewTaxTargetSubGroup(e.target.value as SubmissionGroupId)}
                                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 shrink-0 focus:outline-none"
                              >
                                {sec.category === 'upper_sub' ? (
                                  <>
                                    <option value="choke">{language === 'ko' ? '초크 계열' : 'Chokes'}</option>
                                    <option value="armlock">{language === 'ko' ? '암락 계열' : 'Armlocks'}</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="leglock">{language === 'ko' ? '렉락 계열' : 'Leglocks'}</option>
                                    <option value="compression">{language === 'ko' ? '압박 계열' : 'Compressions'}</option>
                                  </>
                                )}
                              </select>
                            )}
                            <input
                              type="text"
                              value={newTaxTechName}
                              onChange={(e) => setNewTaxTechName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTechniqueFromTaxonomy(sec);
                              }}
                              placeholder={
                                sec.category === 'positions'
                                  ? (language === 'ko' ? '새 포지션 명칭 (한글/영문)...' : 'New position name...')
                                  : sec.category === 'upper_sub' || sec.category === 'lower_sub'
                                  ? (language === 'ko' ? '새 피니시 기술명...' : 'New finish name...')
                                  : (language === 'ko' ? '새 기술 명칭 (한글/영문)...' : 'New technique name...')
                              }
                              className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-800"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleAddTechniqueFromTaxonomy(sec)}
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 shadow-2xs flex items-center gap-1 active:scale-95 transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{language === 'ko' ? '추가' : 'Add'}</span>
                            </button>
                          </div>
                        )}

                        {isExpanded && (
                          <div className="pt-2 border-t border-slate-200/80">
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {dynamicItems.map((it, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  draggable
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    setDraggedTaxItem({ sourceSectionId: sec.id, itemName: it.name, category: sec.category });
                                  }}
                                  onDragEnd={() => setDraggedTaxItem(null)}
                                  onClick={() => handleNavigateToTaxonomyItem(sec, it)}
                                  className="group px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-[11px] font-semibold text-slate-800 transition-all cursor-grab active:cursor-grabbing shadow-3xs flex items-center gap-1 active:scale-95"
                                  title={language === 'ko' ? '드래그하여 다른 박스로 이동 가능' : 'Drag to move to another box'}
                                >
                                  <span className="font-mono text-slate-400 group-hover:text-slate-600">
                                    {idx + 1}.
                                  </span>
                                  <span>{language === 'en' ? (it.nameEn || it.name) : it.name}</span>
                                  {it.nameEn && (
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      ({it.nameEn})
                                    </span>
                                  )}
                                  <span className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 font-bold">
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

          {/* TAB 2: 포지션 */}
          {activeTab === 'positions' && (
            <div className="space-y-5">
              {/* Header & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FolderCog className="w-4 h-4 text-slate-800" />
                    <span>{language === 'ko' ? '포지션 관리' : 'Manage Positions'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'ko' ? `총 ${metadata.positions.length}개의 포지션이 ${allParentGroups.length}대 상위폴더로 체계화되어 있습니다.` : `Total ${metadata.positions.length} positions categorized into ${allParentGroups.length} folders.`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto max-w-full">
                  <button
                    type="button"
                    onClick={() => setSelectedPosFilterGroup('ALL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      selectedPosFilterGroup === 'ALL'
                        ? 'bg-slate-900 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'ko' ? '전체 포지션' : 'All Positions'} ({metadata.positions.length})
                  </button>
                  {allParentGroups.map((grpKey) => {
                    const grpTitle = getPosGroupTitle(grpKey, grpKey);
                    const count = metadata.positions.filter(
                      (p) => p.group === grpKey || p.group === grpTitle
                    ).length;
                    return (
                      <button
                        key={grpKey}
                        type="button"
                        onClick={() => setSelectedPosFilterGroup(grpKey)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                          selectedPosFilterGroup === grpKey
                            ? 'bg-slate-900 text-white shadow-2xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {grpTitle} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Parent Folder Add Bar & Position Add Form */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 p-2 bg-slate-100/70 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <FolderCog className="w-4 h-4 text-slate-700 ml-1" />
                    <span className="text-xs font-bold text-slate-800">
                      {language === 'ko' ? '상위폴더 관리' : 'Parent Folders'} ({allParentGroups.length})
                    </span>
                  </div>

                  {isAddingParentFolder ? (
                    <div className="flex items-center gap-1.5 flex-1 max-w-md">
                      <input
                        type="text"
                        value={newParentFolderName}
                        onChange={(e) => setNewParentFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddParentFolder();
                          if (e.key === 'Escape') setIsAddingParentFolder(false);
                        }}
                        placeholder={language === 'ko' ? "새 상위폴더명 (한글/영문)..." : "New parent folder name..."}
                        className="flex-1 px-3 py-1 text-xs font-bold bg-white border border-indigo-400 rounded-xl text-slate-900 focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddParentFolder}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shrink-0 transition-colors"
                      >
                        {language === 'ko' ? '추가' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingParentFolder(false)}
                        className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs rounded-xl cursor-pointer"
                      >
                        {language === 'ko' ? '취소' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingParentFolder(true)}
                      className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 rounded-xl transition-all cursor-pointer shadow-3xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{language === 'ko' ? '+ 새 상위폴더 추가' : '+ Add Parent Folder'}</span>
                    </button>
                  )}
                </div>

                {/* Unified Single-line Add Form */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs">
                  <select
                    value={newPosGroup}
                    onChange={(e) => setNewPosGroup(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-800 shrink-0 focus:outline-none"
                  >
                    {allParentGroups.map((g) => (
                      <option key={g} value={g}>
                        📁 {getPosGroupTitle(g, g)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newPosName}
                    onChange={(e) => setNewPosName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddPosition();
                    }}
                    placeholder={language === 'ko' ? "새 포지션 명칭 (한글/영문)..." : "New position name (Korean/English)..."}
                    className="flex-1 min-w-0 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                  <input
                    type="text"
                    value={newPosNameEn}
                    onChange={(e) => setNewPosNameEn(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddPosition();
                    }}
                    placeholder={language === 'ko' ? "영문명 (선택)" : "English name (optional)"}
                    className="w-36 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none hidden sm:block"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPosition()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 transition-all shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ko' ? '포지션 추가' : 'Add Position'}</span>
                  </button>
                </div>
              </div>

              {/* Group Cards Display (Dynamic & Reorderable) */}
              <div className="space-y-4">
                {allParentGroups
                  .filter(
                    (grpKey) =>
                      selectedPosFilterGroup === 'ALL' ||
                      selectedPosFilterGroup === grpKey
                  )
                  .map((grpKey, idx) => {
                    const grpTitle = getPosGroupTitle(grpKey, grpKey);
                    const grpItems = metadata.positions.filter(
                      (p) => p.group === grpKey || p.group === grpTitle
                    );
                    const Icon = grpKey.includes('가드')
                      ? Layers
                      : grpKey.includes('탑') || grpKey.includes('도미넌트')
                        ? Crown
                        : grpKey.includes('스탠딩')
                          ? User
                          : Shield;

                    return (
                      <div
                        key={grpKey}
                        className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3.5 shadow-3xs"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Icon className="w-4 h-4 text-slate-700 shrink-0" />
                            {editingPosGroupId === grpKey ? (
                              <div className="flex items-center gap-1 flex-1 max-w-xs">
                                <input
                                  type="text"
                                  value={editingPosGroupValue}
                                  onChange={(e) => setEditingPosGroupValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSavePositionGroupRename(grpKey, grpTitle);
                                    if (e.key === 'Escape') setEditingPosGroupId(null);
                                  }}
                                  className="px-2 py-0.5 text-xs font-bold border border-indigo-400 rounded-lg flex-1 bg-white"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSavePositionGroupRename(grpKey, grpTitle)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                  title="저장"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPosGroupId(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                                  title="취소"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs font-black text-slate-900">{grpTitle}</h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPosGroupId(grpKey);
                                    setEditingPosGroupValue(grpTitle);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded cursor-pointer transition-colors"
                                  title={language === 'ko' ? "상위폴더명 변경" : "Rename group"}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-700">
                                  {grpItems.length} {language === 'ko' ? '개 포지션' : 'positions'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Controls: Move Up, Move Down, Delete Parent Folder */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMovePosGroup(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-3xs"
                              title={language === 'ko' ? "상위폴더 위로 이동 (순서 변경)" : "Move folder up"}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePosGroup(idx, 'down')}
                              disabled={idx === allParentGroups.length - 1}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-3xs"
                              title={language === 'ko' ? "상위폴더 아래로 이동 (순서 변경)" : "Move folder down"}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteParentFolder(grpKey)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 cursor-pointer transition-colors shadow-3xs"
                              title={language === 'ko' ? "상위폴더 삭제" : "Delete parent folder"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {grpItems.map((pos) => (
                            <div
                              key={pos.id}
                              id={`pos-item-${pos.id}`}
                              className={`p-3 rounded-xl bg-white border transition-all flex items-center justify-between gap-2 shadow-2xs ${
                                highlightedItemName === pos.name
                                  ? 'border-indigo-600 ring-2 ring-indigo-500/50 bg-indigo-50/30'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <Folder className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                                {editingPosId === pos.id ? (
                                  <div className="flex items-center gap-1 flex-1">
                                    <input
                                      type="text"
                                      value={editingPosValue}
                                      onChange={(e) => setEditingPosValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSavePositionRename(pos.id, pos.name);
                                      }}
                                      className="px-2 py-1 text-xs border border-indigo-400 rounded-lg flex-1"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSavePositionRename(pos.id, pos.name)}
                                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-slate-800 truncate block">
                                      {language === 'en' ? (pos.nameEn || pos.name) : pos.name}
                                    </span>
                                    {pos.nameEn && pos.nameEn !== pos.name && (
                                      <span className="text-[10px] text-slate-400 truncate block">
                                        {pos.nameEn}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPosId(pos.id);
                                    setEditingPosValue(pos.nameEn && pos.nameEn !== pos.name ? `${pos.name} (${pos.nameEn})` : pos.name);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                                  title={language === 'ko' ? "수정" : "Edit"}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePosition(pos.id, pos.name)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                  title={language === 'ko' ? "삭제" : "Delete"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 3: 기술 */}
          {activeTab === 'categories' && (
            <div className="space-y-5">
              {/* Header & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-800" />
                    <span>{language === 'ko' ? '기술 폴더 관리' : 'Manage Technique Categories'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'ko' ? `총 ${metadata.categories.length}개의 기술이 ${catGroups.length}대 기술 폴더로 체계화되어 있습니다.` : `Total ${metadata.categories.length} categories organized into ${catGroups.length} functional folders.`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedCatFolder('ALL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      selectedCatFolder === 'ALL'
                        ? 'bg-slate-900 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'ko' ? '전체 폴더' : 'All Folders'} ({metadata.categories.length})
                  </button>
                  {catGroups.map((grp) => {
                    const count = getCategoriesForFolder(grp.id).length;
                    const title = getCatGroupTitle(grp.id, grp.name === '기타' ? '기타' : translateCategoryGroup(grp.id, language));
                    return (
                      <button
                        key={grp.id}
                        type="button"
                        onClick={() => setSelectedCatFolder(grp.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                          selectedCatFolder === grp.id
                            ? 'bg-slate-900 text-white shadow-2xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {title} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Folder Add Bar & Technique Add Form */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 p-2 bg-slate-100/70 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-slate-700 ml-1" />
                    <span className="text-xs font-bold text-slate-800">
                      {language === 'ko' ? '기술 폴더 관리' : 'Category Folders'} ({catGroups.length})
                    </span>
                  </div>

                  {isAddingCatFolder ? (
                    <div className="flex items-center gap-1.5 flex-1 max-w-md">
                      <input
                        type="text"
                        value={newCatFolderName}
                        onChange={(e) => setNewCatFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCatFolder();
                          if (e.key === 'Escape') setIsAddingCatFolder(false);
                        }}
                        placeholder={language === 'ko' ? "새 기술 폴더명 (한글/영문)..." : "New category folder name..."}
                        className="flex-1 px-3 py-1 text-xs font-bold bg-white border border-indigo-400 rounded-xl text-slate-900 focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddCatFolder}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shrink-0 transition-colors"
                      >
                        {language === 'ko' ? '추가' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCatFolder(false)}
                        className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs rounded-xl cursor-pointer"
                      >
                        {language === 'ko' ? '취소' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingCatFolder(true)}
                      className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 rounded-xl transition-all cursor-pointer shadow-3xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{language === 'ko' ? '+ 새 기술 폴더 추가' : '+ Add Category Folder'}</span>
                    </button>
                  )}
                </div>

                {/* Unified Single-line Add Form */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs">
                  <select
                    value={selectedCatFolder !== 'ALL' ? selectedCatFolder : newCategoryTargetFolder}
                    onChange={(e) => setNewCategoryTargetFolder(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-800 shrink-0 focus:outline-none"
                  >
                    {catGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {getCatGroupTitle(g.id, g.name === '기타' ? '기타' : translateCategoryGroup(g.id, language))}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory();
                    }}
                    placeholder={language === 'ko' ? "새 기술 명칭 (한글/영문)..." : "New category name (Korean/English)..."}
                    className="flex-1 min-w-0 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCategory()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 transition-all shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ko' ? '기술 추가' : 'Add Category'}</span>
                  </button>
                </div>
              </div>

              {/* Category Folders Display (Dynamic & Reorderable) */}
              <div className="space-y-4">
                {catGroups
                  .filter((grp) => selectedCatFolder === 'ALL' || selectedCatFolder === grp.id)
                  .map((grp, idx) => {
                    const grpItems = getCategoriesForFolder(grp.id);
                    const title = getCatGroupTitle(grp.id, grp.name === '기타' ? '기타' : translateCategoryGroup(grp.id, language));
                    return (
                      <div key={grp.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3.5 shadow-3xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Folder className="w-4 h-4 text-slate-700 shrink-0" />
                            {editingCatGroupId === grp.id ? (
                              <div className="flex items-center gap-1 flex-1 max-w-xs">
                                <input
                                  type="text"
                                  value={editingCatGroupValue}
                                  onChange={(e) => setEditingCatGroupValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCategoryGroupRename(grp.id, title);
                                    if (e.key === 'Escape') setEditingCatGroupId(null);
                                  }}
                                  className="px-2 py-0.5 text-xs font-bold border border-indigo-400 rounded-lg flex-1 bg-white"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveCategoryGroupRename(grp.id, title)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                  title="저장"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCatGroupId(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                                  title="취소"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs font-black text-slate-900">{title}</h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCatGroupId(grp.id);
                                    setEditingCatGroupValue(title);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded cursor-pointer transition-colors"
                                  title={language === 'ko' ? "기술 폴더명 변경" : "Rename category group"}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-700">
                                  {grpItems.length} {language === 'ko' ? '개 기술' : 'categories'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Controls: Move Up, Move Down, Delete Category Folder */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveCatFolder(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-3xs"
                              title={language === 'ko' ? "기술 폴더 위로 이동" : "Move folder up"}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveCatFolder(idx, 'down')}
                              disabled={idx === catGroups.length - 1}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-3xs"
                              title={language === 'ko' ? "기술 폴더 아래로 이동" : "Move folder down"}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCatFolder(grp.id)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 cursor-pointer transition-colors shadow-3xs"
                              title={language === 'ko' ? "기술 폴더 삭제" : "Delete category folder"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {grpItems.map((cat) => {
                            const idx = metadata.categories.indexOf(cat);
                            return (
                              <div
                                key={cat}
                                id={`cat-item-${cat}`}
                                className={`p-3 rounded-xl bg-white border transition-all flex items-center justify-between gap-2 shadow-2xs ${
                                  highlightedItemName === cat
                                    ? 'border-indigo-600 ring-2 ring-indigo-500/50 bg-indigo-50/30'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  {editingCatIdx === idx ? (
                                    <div className="flex items-center gap-1 flex-1">
                                      <input
                                        type="text"
                                        value={editingCatValue}
                                        onChange={(e) => setEditingCatValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveCategoryRename(idx, cat);
                                        }}
                                        className="px-2 py-1 text-xs border border-indigo-400 rounded-lg flex-1"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveCategoryRename(idx, cat)}
                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      {translateCategory(cat, language)}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCatIdx(idx);
                                      setEditingCatValue(cat);
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                                    title={language === 'ko' ? "수정" : "Edit"}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(cat)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                    title={language === 'ko' ? "삭제" : "Delete"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                {/* Submissions Bridge & Info Card */}
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-sky-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-sky-950 flex items-center gap-2">
                        <span>{language === 'ko' ? '서브미션(피니시) 기술은 [서브미션] 탭에서 통합 관리됩니다' : 'Submissions are centrally managed in the Submissions tab'}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-100 text-sky-700 font-extrabold border border-sky-300">
                          {language === 'ko' ? '중복 방지 일원화' : 'Unified'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-sky-800 leading-relaxed mt-0.5">
                        {language === 'ko'
                          ? '기술과의 중복을 없애고 서브미션(조르기, 상체/하체 관절기, 압박)으로 일원화했습니다. 영상 추가 및 수정 모달의 기술에서 [📁 서브미션]을 선택하면 해당 세부 피니시 목록이 100% 실시간 연동되어 선택 가능합니다.'
                          : 'To eliminate duplicates, submissions are unified under the compass groups. Synced across video add/edit modals.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('submissions')}
                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl cursor-pointer shrink-0 transition-colors shadow-2xs flex items-center gap-1 self-start sm:self-center whitespace-nowrap"
                  >
                    <span>{language === 'ko' ? '서브미션 관리 이동' : 'Go to Submissions'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 서브미션 */}
          {activeTab === 'submissions' && (
            <div className="space-y-5">
              {/* Header & Group Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-slate-800" />
                    <span>{language === 'ko' ? '서브미션 관리' : 'Manage Submissions'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'ko' ? `총 ${metadata.submissions.length}개 서브미션 그룹이 체계적으로 등록되어 있습니다.` : `Total ${metadata.submissions.length} submission groups registered.`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedSubGroup('ALL' as any)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      (selectedSubGroup as string) === 'ALL'
                        ? 'bg-slate-900 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'ko' ? '전체 그룹' : 'All Groups'}
                  </button>
                  {metadata.submissions.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedSubGroup(group.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        selectedSubGroup === group.id
                          ? 'bg-slate-900 text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {translateSubmissionGroup(group.id, language)} ({group.items.length})
                    </button>
                  ))}
                </div>
              </div>

              {/* Unified Single-line Add Form: Group + Item */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Add Submission Technique to selected group */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs">
                  <select
                    value={selectedSubGroup !== ('ALL' as any) ? selectedSubGroup : metadata.submissions[0]?.id || 'choke'}
                    onChange={(e) => setSelectedSubGroup(e.target.value as SubmissionGroupId)}
                    className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-800 shrink-0 focus:outline-none"
                  >
                    {metadata.submissions.map((g) => (
                      <option key={g.id} value={g.id}>
                        {translateSubmissionGroup(g.id, language)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newSubItem}
                    onChange={(e) => setNewSubItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSubmissionItem();
                    }}
                    placeholder={language === 'ko' ? "새 세부 피니시 기술명 (한글/영문)..." : "New finish name (Korean/English)..."}
                    className="flex-1 min-w-0 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSubmissionItem()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ko' ? '기술 추가' : 'Add Category'}</span>
                  </button>
                </div>

                {/* 2. Add New Submission Group */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs">
                  <input
                    type="text"
                    value={newSubGroupName}
                    onChange={(e) => setNewSubGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSubmissionGroup();
                    }}
                    placeholder={language === 'ko' ? "새 서브미션 분류 그룹명 (한글/영문)..." : "New submission group name (Korean/English)..."}
                    className="flex-1 min-w-0 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubmissionGroup}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ko' ? '그룹 생성' : 'Create Group'}</span>
                  </button>
                </div>
              </div>

              {/* Submission Groups Display */}
              <div className="space-y-4">
                {metadata.submissions
                  .filter((g) => (selectedSubGroup as string) === 'ALL' || selectedSubGroup === g.id)
                  .map((group) => (
                    <div key={group.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3.5 shadow-3xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-slate-700" />
                          {editingSubGroupId === group.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingSubGroupValue}
                                onChange={(e) => setEditingSubGroupValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveSubmissionGroupRename(group.id, group.name);
                                  if (e.key === 'Escape') setEditingSubGroupId(null);
                                }}
                                className="px-2 py-0.5 text-xs font-bold border border-indigo-400 rounded-lg bg-white"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveSubmissionGroupRename(group.id, group.name)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                title="저장"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSubGroupId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                                title="취소"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-slate-900">{group.name}</h4>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubGroupId(group.id);
                                  setEditingSubGroupValue(group.name);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded cursor-pointer transition-colors"
                                title={language === 'ko' ? "서브미션 대분류명 변경" : "Rename submission group"}
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-700">
                                {group.items.length} {language === 'ko' ? '개 기술' : 'techniques'}
                              </span>
                            </div>
                          )}
                        </div>
                        {group.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSubmissionGroup(group.id)}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{language === 'ko' ? '이 서브미션 그룹 삭제' : 'Delete this group'}</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                        {group.items.map((item) => (
                          <div
                            key={item}
                            id={`sub-item-${item}`}
                            className={`p-3 rounded-xl bg-white border transition-all flex items-center justify-between gap-2 shadow-2xs ${
                              highlightedItemName === item
                                ? 'border-indigo-600 ring-2 ring-indigo-500/50 bg-indigo-50/30'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {editingSubItem === item ? (
                              <div className="flex items-center gap-1 flex-1">
                                <input
                                  type="text"
                                  value={editingSubValue}
                                  onChange={(e) => setEditingSubValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveSubItemRename(item, group.id);
                                  }}
                                  className="px-2 py-1 text-xs border border-indigo-400 rounded-lg flex-1"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveSubItemRename(item, group.id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-slate-800 truncate">
                                {item}
                              </span>
                            )}

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubItem(item);
                                  setEditingSubValue(item);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                                title={language === 'ko' ? "수정" : "Edit"}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubItem(item, group.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title={language === 'ko' ? "삭제" : "Delete"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 5: 도복 구분 & 난이도 단계 */}
          {activeTab === 'gi_diff' && (
            <div className="space-y-5">
              <div className="pb-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-800" />
                  <span>{language === 'ko' ? '도복 구분 & 난이도 단계 관리' : 'Manage Gi & Difficulty Levels'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'ko' ? '도복 착용 여부(Gi / No-Gi / 공용) 및 기술 난이도 단계를 자유롭게 등록/수정할 수 있습니다.' : 'Manage Gi/No-Gi rule types and technique difficulty tiers freely.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Gi / No-Gi Container */}
                <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4 shadow-3xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-700" />
                      <h4 className="text-xs font-black text-slate-900">{language === 'ko' ? '도복 (Gi / No-Gi) 분류' : 'Gi / No-Gi Classification'}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-700">
                        {metadata.giTypes.length} {language === 'ko' ? '종' : ' types'}
                      </span>
                    </div>
                  </div>

                  {/* Unified Single-line Add Form */}
                  <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <input
                      type="text"
                      value={newGi}
                      onChange={(e) => setNewGi(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddGi();
                      }}
                      placeholder={language === 'ko' ? "새 도복/룰셋 구분 (예: 도복(Gi), 노기(No-Gi))..." : "New Gi/Rule type (e.g. Gi, No-Gi)..."}
                      className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleAddGi}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'ko' ? '추가' : 'Add'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {metadata.giTypes.map((gi, idx) => (
                      <div
                        key={gi}
                        className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        {editingGiIndex === idx ? (
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="text"
                              value={editingGiValue}
                              onChange={(e) => setEditingGiValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveGiRename(idx, gi);
                              }}
                              className="px-2 py-1 text-xs border border-indigo-400 rounded-lg flex-1"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveGiRename(idx, gi)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-800">{gi}</span>
                        )}

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingGiIndex(idx);
                              setEditingGiValue(gi);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                            title={language === 'ko' ? "수정" : "Edit"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {metadata.giTypes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteGi(gi)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title={language === 'ko' ? "삭제" : "Delete"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Difficulty Levels Container */}
                <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4 shadow-3xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-slate-700" />
                      <h4 className="text-xs font-black text-slate-900">{language === 'ko' ? '난이도 체계 단계' : 'Difficulty Tiers'}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-700">
                        {metadata.difficulties.length} {language === 'ko' ? '단계' : ' tiers'}
                      </span>
                    </div>
                  </div>

                  {/* Unified Single-line Add Form */}
                  <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <input
                      type="text"
                      value={newDiff}
                      onChange={(e) => setNewDiff(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddDiff();
                      }}
                      placeholder={language === 'ko' ? "새 난이도 단계 (예: 기초, 중급, 마스터)..." : "New difficulty tier (e.g. Basic, Intermediate, Master)..."}
                      className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleAddDiff}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'ko' ? '추가' : 'Add'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {metadata.difficulties.map((diff, idx) => (
                      <div
                        key={diff}
                        className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        {editingDiffIndex === idx ? (
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="text"
                              value={editingDiffValue}
                              onChange={(e) => setEditingDiffValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveDiffRename(idx, diff);
                              }}
                              className="px-2 py-1 text-xs border border-indigo-400 rounded-lg flex-1"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveDiffRename(idx, diff)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-800">{diff}</span>
                        )}

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDiffIndex(idx);
                              setEditingDiffValue(diff);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                            title={language === 'ko' ? "수정" : "Edit"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {metadata.difficulties.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDiff(diff)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title={language === 'ko' ? "삭제" : "Delete"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
