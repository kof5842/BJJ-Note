import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Video,
  Search,
  RefreshCw,
  Layers,
  ChevronRight,
  TrendingUp,
  Clock,
  Mail,
  Loader2,
  FolderOpen,
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
  Compass,
  Palette,
  FolderCog,
  Check,
  Edit3,
  Sparkles,
  HelpCircle,
  Sliders,
  Eye,
  EyeOff,
  Menu,
  History,
  Upload,
  X,
  Globe,
  Youtube,
  Instagram,
} from 'lucide-react';
import {
  AdminUserSummary,
  fetchAdminAllUsers,
  loadUserCloudData,
  FullArchivePayload,
  saveGlobalSystemConfig,
  fetchGlobalSystemConfig,
  setUserBanStatus,
  formatStayTime,
} from '../services/archiveService';
import {
  AppSettings,
  ClassJournalStyleConfig,
  LandingShowcaseConfig,
  MetadataConfig,
  MindmapColorsConfig,
  NavMenuVisibilityConfig,
  PositionFolder,
  SubmissionCompassGroup,
  SubmissionGroupId,
} from '../types';
import { DEFAULT_LANDING_SHOWCASE } from '../data/initialData';
import { useLanguage } from '../i18n/LanguageContext';
import { translatePosition, translateCategory, translateSubmissionGroup, translateSubmissionDetail, translateGiType, translateDifficulty } from '../utils/taxonomyTranslation';

interface AdminCenterViewProps {
  adminEmail: string;
  metadata: MetadataConfig;
  settings: AppSettings;
  onUpdateMetadata: (next: MetadataConfig) => void;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

export const AdminCenterView: React.FC<AdminCenterViewProps> = ({
  adminEmail,
  metadata,
  settings,
  onUpdateMetadata,
  onUpdateSettings,
}) => {
  const { t, language } = useLanguage();
  const [activeAdminTab, setActiveAdminTab] = useState<'monitoring' | 'config' | 'login_showcase' | 'color_settings'>('monitoring');

  // Monitoring State
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'learned' | 'mom' | 'stay' | 'videos' | 'active' | 'name'>('learned');
  const [kickTargetUser, setKickTargetUser] = useState<AdminUserSummary | null>(null);
  const [isProcessingKick, setIsProcessingKick] = useState(false);

  // Selected User Inspector
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userDetailData, setUserDetailData] = useState<FullArchivePayload | null>(null);

  // Admin Config State
  const [globalFeedback, setGlobalFeedback] = useState<string | null>(null);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);

  // 1. Position addition in Admin Center (Global Preset for all accounts)
  const [adminNewPosName, setAdminNewPosName] = useState('');
  const [adminNewPosNameEn, setAdminNewPosNameEn] = useState('');
  const [adminNewPosGroup, setAdminNewPosGroup] = useState<string>('가드');

  // 2. Category addition in Admin Center (Global Preset)
  const [adminNewCategory, setAdminNewCategory] = useState('');

  // 3. Submission group & technique addition in Admin Center (Global Preset)
  const [adminSelectedSubGroup, setAdminSelectedSubGroup] = useState<SubmissionGroupId>(
    metadata.submissions[0]?.id || 'choke'
  );
  const [adminNewSubGroupName, setAdminNewSubGroupName] = useState('');
  const [adminIsAddingSubGroup, setAdminIsAddingSubGroup] = useState(false);
  const [adminNewSubItem, setAdminNewSubItem] = useState('');

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchAdminAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load admin user list:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectUser = async (user: AdminUserSummary) => {
    setSelectedUser(user);
    setUserDetailLoading(true);
    setUserDetailData(null);
    try {
      const cloudData = await loadUserCloudData(user.uid);
      setUserDetailData(cloudData);
    } catch (err) {
      console.error('Failed to load user detail:', err);
    } finally {
      setUserDetailLoading(false);
    }
  };

  // Filter & Sort
  const filteredUsers = users
    .filter((u) => {
      const q = searchQuery.toLowerCase();
      return (
        (u.email || '').toLowerCase().includes(q) ||
        (u.displayName || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'learned') {
        return (b.learnedVideoCount || 0) - (a.learnedVideoCount || 0) || (b.videoCount - a.videoCount);
      }
      if (sortBy === 'mom') {
        return (b.momVideoChange || 0) - (a.momVideoChange || 0);
      }
      if (sortBy === 'stay') {
        return (b.totalStaySeconds || 0) - (a.totalStaySeconds || 0);
      }
      if (sortBy === 'videos') {
        return b.videoCount - a.videoCount;
      }
      if (sortBy === 'active') {
        return (b.lastActiveAt || '').localeCompare(a.lastActiveAt || '');
      }
      return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
    });

  // KPI Calculations
  const totalUsers = users.length;
  const totalVideos = users.reduce((sum, u) => sum + (u.videoCount || 0), 0);
  const totalQueue = users.reduce((sum, u) => sum + (u.queueCount || 0), 0);
  const avgVideosPerUser = totalUsers > 0 ? (totalVideos / totalUsers).toFixed(1) : '0';

  const formatTimeAgo = (isoStr?: string) => {
    if (!isoStr) return '기록 없음';
    try {
      const diffMs = Date.now() - new Date(isoStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return '방금 전';
      if (diffMins < 60) return `${diffMins}분 전`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}시간 전`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}일 전`;
    } catch {
      return isoStr.slice(0, 10);
    }
  };

  // ----------------------------------------------------
  // ADMIN GLOBAL PRESET HANDLERS
  // (Saves to systemConfig/defaultMetadata so every account inherits them!)
  // ----------------------------------------------------

  // 1. Add Global Position
  const handleAdminAddGlobalPosition = async () => {
    const trimmed = adminNewPosName.trim();
    if (!trimmed) return;
    if (metadata.positions.some((p) => p.name === trimmed)) {
      alert(language === 'ko' ? '이미 동일한 이름의 포지션이 존재합니다.' : 'A position with the same name already exists.');
      return;
    }

    const newPos: PositionFolder = {
      id: `pos-${Date.now()}`,
      name: trimmed,
      nameEn: adminNewPosNameEn.trim() || trimmed,
      group: adminNewPosGroup,
      subCategories: [...metadata.categories],
      isGlobalDefault: true,
    };

    const nextPositions = [...metadata.positions, newPos];
    const nextMetadata: MetadataConfig = {
      ...metadata,
      positions: nextPositions,
    };

    onUpdateMetadata(nextMetadata);
    setAdminNewPosName('');
    setAdminNewPosNameEn('');

    setIsSavingGlobal(true);
    try {
      await saveGlobalSystemConfig(
        {
          globalPositions: nextPositions,
        },
        adminEmail
      );
      setGlobalFeedback(
        `[${trimmed}] 시작 포지션이 모든 회원 계정의 공용 고정 폴더로 클라우드에 영구 배포되었습니다!`
      );
      setTimeout(() => setGlobalFeedback(null), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // 2. Add Global Category / Attribute
  const handleAdminAddGlobalCategory = async () => {
    const trimmed = adminNewCategory.trim();
    if (!trimmed) return;
    if (metadata.categories.includes(trimmed)) {
      alert(language === 'ko' ? '이미 등록된 기술 성격/속성입니다.' : 'This category already exists.');
      return;
    }

    const nextCategories = [...metadata.categories, trimmed];
    const nextPositions = metadata.positions.map((p) => ({
      ...p,
      subCategories: p.subCategories.includes(trimmed)
        ? p.subCategories
        : [...p.subCategories, trimmed],
    }));

    const nextMetadata: MetadataConfig = {
      ...metadata,
      categories: nextCategories,
      positions: nextPositions,
    };

    onUpdateMetadata(nextMetadata);
    setAdminNewCategory('');

    setIsSavingGlobal(true);
    try {
      await saveGlobalSystemConfig(
        {
          globalCategories: nextCategories,
          globalPositions: nextPositions,
        },
        adminEmail
      );
      setGlobalFeedback(
        `[${trimmed}] 기술 성격/속성이 모든 회원 계정의 공용 고정값으로 클라우드에 영구 배포되었습니다!`
      );
      setTimeout(() => setGlobalFeedback(null), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // 3. Add Global Submission Group
  const handleAdminAddGlobalSubGroup = async () => {
    const trimmed = adminNewSubGroupName.trim();
    if (!trimmed) return;
    const newId = `sub-grp-${Date.now()}`;
    const newGroup: SubmissionCompassGroup = {
      id: newId,
      name: trimmed,
      hubTitle: trimmed,
      items: [],
      isCustom: true,
      isGlobalDefault: true,
    };

    const nextSubmissions = [...metadata.submissions, newGroup];
    const nextMetadata: MetadataConfig = {
      ...metadata,
      submissions: nextSubmissions,
    };

    onUpdateMetadata(nextMetadata);
    setAdminSelectedSubGroup(newId);
    setAdminNewSubGroupName('');
    setAdminIsAddingSubGroup(false);

    setIsSavingGlobal(true);
    try {
      await saveGlobalSystemConfig(
        {
          globalSubmissions: nextSubmissions,
        },
        adminEmail
      );
      setGlobalFeedback(
        `[${trimmed}] 서브미션 종류가 모든 회원 계정에 공용 고정값으로 클라우드에 영구 배포되었습니다!`
      );
      setTimeout(() => setGlobalFeedback(null), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // 4. Add Technique into Submission Group
  const handleAdminAddGlobalSubItem = async () => {
    const trimmed = adminNewSubItem.trim();
    if (!trimmed) return;
    const nextSubmissions = metadata.submissions.map((group) => {
      if (group.id !== adminSelectedSubGroup) return group;
      if (group.items.includes(trimmed)) return group;
      return {
        ...group,
        items: [...group.items, trimmed],
      };
    });

    const nextMetadata: MetadataConfig = {
      ...metadata,
      submissions: nextSubmissions,
    };

    onUpdateMetadata(nextMetadata);
    setAdminNewSubItem('');

    setIsSavingGlobal(true);
    try {
      await saveGlobalSystemConfig(
        {
          globalSubmissions: nextSubmissions,
        },
        adminEmail
      );
      setGlobalFeedback(
        `[${trimmed}] 서브미션 기술이 모든 회원 계정에 공용 고정값으로 저장되었습니다!`
      );
      setTimeout(() => setGlobalFeedback(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // 5. Admin Option: Timeline Memo Image Attachment Toggle
  const handleToggleTimelineMemoImages = async (allow: boolean) => {
    onUpdateSettings({ allowTimelineMemoImages: allow });
    setIsSavingGlobal(true);
    try {
      await saveGlobalSystemConfig(
        {
          allowTimelineMemoImages: allow,
        },
        adminEmail
      );
      setGlobalFeedback(
        `타임라인 메모 이미지 첨부 허용 여부가 [${allow ? 'ON (허용)' : 'OFF (차단)'}]으로 전체 반영되었습니다.`
      );
      setTimeout(() => setGlobalFeedback(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // 5-A2. Admin Option: Mindmap Diagram Colors (Start, End Position & Submission)
  const handleAdminUpdateMindmapColors = async (patch: Partial<MindmapColorsConfig>) => {
    const nextMindmapColors: MindmapColorsConfig = {
      ...(settings.mindmapColors || {}),
      ...patch,
    };
    onUpdateSettings({ mindmapColors: nextMindmapColors });
    setIsSavingGlobal(true);
    try {
      await saveGlobalSystemConfig(
        {
          mindmapColors: nextMindmapColors,
        },
        adminEmail
      );
      setGlobalFeedback('다이어그램 시작/끝포지션 및 서브미션 색상이 전체 공용값으로 저장되었습니다.');
      setTimeout(() => setGlobalFeedback(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // 5-A3. Admin Option: App Brand Primary Color (하늘색 등)
  const handleAdminUpdatePrimaryColor = async (color: string) => {
    onUpdateSettings({ primaryColor: color });
    document.documentElement.style.setProperty('--primary-color', color);
    setIsSavingGlobal(true);
    try {
      await saveGlobalSystemConfig(
        {
          primaryColor: color,
        },
        adminEmail
      );
      setGlobalFeedback(`앱 메인 브랜드 컬러가 [${color}]로 전체 반영되었습니다.`);
      setTimeout(() => setGlobalFeedback(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // 5-A4. Admin Option: Video Folder Group Colors
  const handleAdminUpdateFolderColors = async (nextColors: typeof settings.folderColors) => {
    onUpdateSettings({ folderColors: nextColors });
    setIsSavingGlobal(true);
    try {
      await saveGlobalSystemConfig(
        {
          folderColors: nextColors,
        },
        adminEmail
      );
      setGlobalFeedback('영상 폴더 그룹 색상이 전체 계정 공용값으로 저장되었습니다.');
      setTimeout(() => setGlobalFeedback(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // 5-A5. Admin Option: Class Journal Box Color, Border Color & Badge Label (관장님 수업일지 스타일)
  const handleAdminUpdateClassJournalStyle = async (patch: Partial<ClassJournalStyleConfig>) => {
    const nextStyle: ClassJournalStyleConfig = {
      cardBgColor: '#fffbeb',
      borderColor: '#f59e0b',
      badgeLabel: '관장님 수업',
      ...(settings.classJournalStyle || {}),
      ...patch,
    };
    onUpdateSettings({ classJournalStyle: nextStyle });
    setIsSavingGlobal(true);
    try {
      await saveGlobalSystemConfig(
        {
          classJournalStyle: nextStyle,
        },
        adminEmail
      );
      setGlobalFeedback('관장님 수업일지 표시 색상 및 모서리 테두리 설정이 전체 저장되었습니다.');
      setTimeout(() => setGlobalFeedback(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // 5-B. Admin Option: Mindmap Toolbar Position (Top / Bottom / Left / Right)
  const handleAdminChangeToolbarPosition = async (pos: 'top' | 'bottom' | 'left' | 'right') => {
    onUpdateSettings({ mindmapToolbarPosition: pos });
    setIsSavingGlobal(true);
    try {
      await saveGlobalSystemConfig(
        {
          mindmapToolbarPosition: pos,
        },
        adminEmail
      );
      const labels: Record<string, string> = {
        top: '가로형 상단',
        bottom: '가로형 하단',
        left: '세로형 좌측',
        right: '세로형 우측',
      };
      setGlobalFeedback(
        `다이어그램 툴바 위치가 [${labels[pos]}]으로 모든 회원 계정에 공용 기본값으로 클라우드에 영구 배포되었습니다!`
      );
      setTimeout(() => setGlobalFeedback(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // 6. Admin Option: Landing Showcase & Login Screen Customization
  const [adminAppTitle, setAdminAppTitle] = useState(settings.appTitle && settings.appTitle !== '주짓수 마스터리' && settings.appTitle !== '주짓수 마스터리 아카이브' ? settings.appTitle : '주짓수 스케치');
  const [adminAppSubtitle, setAdminAppSubtitle] = useState(
    settings.appSubtitle || '수련자 전용 테크트리 & 클라우드 아카이브'
  );
  const [adminLogoText, setAdminLogoText] = useState(settings.logoText || 'BJJ');
  const [adminLogoImageUrl, setAdminLogoImageUrl] = useState(settings.logoImageUrl || '');

  const landingState = settings.landingShowcase || DEFAULT_LANDING_SHOWCASE;
  const [landingHeaderLoginBtn, setLandingHeaderLoginBtn] = useState(
    landingState.headerLoginButtonText || 'Google 계정으로 시작'
  );
  const [landingHeadline, setLandingHeadline] = useState(landingState.headline || '');
  const [landingSubheadline, setLandingSubheadline] = useState(landingState.subheadline || '');
  const [landingEmpathyTitle, setLandingEmpathyTitle] = useState(
    landingState.empathyTitle || '[공감 문구] "이런 적 있으신가요?"'
  );
  const [landingEmpathyImageUrl, setLandingEmpathyImageUrl] = useState(
    landingState.empathyImageUrl || ''
  );
  const [landingEmpathyPoints, setLandingEmpathyPoints] = useState<
    Array<{ title: string; desc: string }>
  >(
    landingState.empathyPoints?.length
      ? landingState.empathyPoints
      : DEFAULT_LANDING_SHOWCASE.empathyPoints || []
  );

  const [landingFeaturesBadge, setLandingFeaturesBadge] = useState(
    landingState.featuresBadge || '핵심 솔루션 안내'
  );
  const [landingFeaturesTitle, setLandingFeaturesTitle] = useState(
    landingState.featuresTitle || '[핵심 기능 안내] 이 프로그램은 이렇게 도와줍니다'
  );
  const [landingFeaturesHighlightTitle, setLandingFeaturesHighlightTitle] = useState(
    landingState.featuresHighlightTitle || '합리적인 무료 클라우드로 즉시 시작하세요'
  );
  const [landingFeaturesHighlightSub, setLandingFeaturesHighlightSub] = useState(
    landingState.featuresHighlightSub ||
      'Google 원클릭 계정 연동으로 나만의 독립된 기술 아카이브가 즉시 생성됩니다.'
  );
  const [landingFeaturesFooterCallout, setLandingFeaturesFooterCallout] = useState(
    landingState.featuresFooterCallout ||
      '쉽게 바로 시작해요 — 별도 설치 없이 웹 브라우저에서 바로 시작하고, 개인 데이터는 암호화되어 안전하게 보관됩니다.'
  );
  const [landingFeaturesList, setLandingFeaturesList] = useState<
    Array<{ title: string; subtitle?: string; desc: string; imageUrl?: string }>
  >(
    landingState.featuresList?.length
      ? landingState.featuresList
      : DEFAULT_LANDING_SHOWCASE.featuresList || []
  );

  const [landingComparisonTitle, setLandingComparisonTitle] = useState(
    landingState.comparisonTitle || '[간단 비교] 사용 전과 후'
  );
  const [landingComparisonCategoryHeader, setLandingComparisonCategoryHeader] = useState(
    landingState.comparisonCategoryHeader || '구분'
  );
  const [landingComparisonBeforeHeader, setLandingComparisonBeforeHeader] = useState(
    landingState.comparisonBeforeHeader || '기존 방식 (사용 전)'
  );
  const [landingComparisonAfterHeader, setLandingComparisonAfterHeader] = useState(
    landingState.comparisonAfterHeader || '이 프로그램을 쓸 때 (사용 후)'
  );
  const [landingComparisonItems, setLandingComparisonItems] = useState<
    Array<{ category: string; before: string; after: string }>
  >(
    landingState.comparisonItems?.length
      ? landingState.comparisonItems
      : DEFAULT_LANDING_SHOWCASE.comparisonItems || []
  );

  const [landingCtaBadge, setLandingCtaBadge] = useState(
    landingState.ctaBadge || '실전 수련 솔루션'
  );
  const [landingCtaQuote, setLandingCtaQuote] = useState(
    landingState.ctaQuote ||
      '"기술을 많이 아는 것보다 중요한 건, 내가 아는 기술을 제때 꺼내 쓰는 것입니다."'
  );
  const [landingCtaSubtext, setLandingCtaSubtext] = useState(
    landingState.ctaSubtext ||
      '오늘 체육관에서 배운 기술 하나부터 가볍게 기록해보세요.\n차곡차곡 쌓인 기록이 실전에서 막힘없이 움직이는 나만의 실력이 됩니다.'
  );
  const [landingCtaButtonText, setLandingCtaButtonText] = useState(
    landingState.ctaButtonText || 'Google 계정으로 무료 시작하기'
  );
  const [landingCtaNoteText, setLandingCtaNoteText] = useState(
    landingState.ctaNoteText ||
      '* 별도 회원가입 없이 로그인 즉시 독립된 클라우드 데이터베이스가 생성됩니다.'
  );
  const [landingHeroImage, setLandingHeroImage] = useState(
    landingState.heroImageUrl || ''
  );
  const [landingFooterText, setLandingFooterText] = useState(
    landingState.footerText || 'Google Cloud Firestore 연동 · 자기주도 주짓수 수련 솔루션'
  );
  const [landingYoutubeUrl, setLandingYoutubeUrl] = useState(
    landingState.youtubeUrl || 'https://youtube.com'
  );
  const [landingShowYoutube, setLandingShowYoutube] = useState(
    landingState.showYoutube ?? true
  );
  const [landingInstagramUrl, setLandingInstagramUrl] = useState(
    landingState.instagramUrl || 'https://instagram.com'
  );
  const [landingShowInstagram, setLandingShowInstagram] = useState(
    landingState.showInstagram ?? true
  );

  const handleImageFileRead = (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        onComplete(compressed);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleAddFeature = () => {
    setLandingFeaturesList((prev) => [
      ...prev,
      {
        title: `신규 핵심 기능 ${prev.length + 1}`,
        subtitle: '기능 부제목',
        desc: '해당 기능에 대한 상세한 설명 내용을 입력하세요.',
        imageUrl: '',
      },
    ]);
  };

  const handleRemoveFeature = (idx: number) => {
    if (landingFeaturesList.length <= 1) {
      alert('최소 1개 이상의 핵심 기능이 유지되어야 합니다.');
      return;
    }
    setLandingFeaturesList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddComparisonItem = () => {
    setLandingComparisonItems((prev) => [
      ...prev,
      {
        category: '새 구분 항목',
        before: '기존 방식의 불편한 점',
        after: '이 프로그램 사용 시 개선점',
      },
    ]);
  };

  const handleRemoveComparisonItem = (idx: number) => {
    if (landingComparisonItems.length <= 1) {
      alert('최소 1개 이상의 비교 항목이 유지되어야 합니다.');
      return;
    }
    setLandingComparisonItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveLandingShowcase = async () => {
    const updatedLanding: LandingShowcaseConfig = {
      ...landingState,
      headerLoginButtonText: landingHeaderLoginBtn,
      headline: landingHeadline,
      subheadline: landingSubheadline,
      empathyTitle: landingEmpathyTitle,
      empathyImageUrl: landingEmpathyImageUrl,
      empathyPoints: landingEmpathyPoints,
      featuresBadge: landingFeaturesBadge,
      featuresTitle: landingFeaturesTitle,
      featuresHighlightTitle: landingFeaturesHighlightTitle,
      featuresHighlightSub: landingFeaturesHighlightSub,
      featuresFooterCallout: landingFeaturesFooterCallout,
      featuresList: landingFeaturesList,
      comparisonTitle: landingComparisonTitle,
      comparisonCategoryHeader: landingComparisonCategoryHeader,
      comparisonBeforeHeader: landingComparisonBeforeHeader,
      comparisonAfterHeader: landingComparisonAfterHeader,
      comparisonItems: landingComparisonItems,
      ctaBadge: landingCtaBadge,
      ctaQuote: landingCtaQuote,
      ctaSubtext: landingCtaSubtext,
      ctaButtonText: landingCtaButtonText,
      ctaNoteText: landingCtaNoteText,
      heroImageUrl: landingHeroImage,
      footerText: landingFooterText,
      youtubeUrl: landingYoutubeUrl,
      showYoutube: landingShowYoutube,
      instagramUrl: landingInstagramUrl,
      showInstagram: landingShowInstagram,
    };

    onUpdateSettings({
      appTitle: adminAppTitle,
      appSubtitle: adminAppSubtitle,
      logoText: adminLogoText,
      logoImageUrl: adminLogoImageUrl,
      landingShowcase: updatedLanding,
    });

    setIsSavingGlobal(true);
    try {
      await saveGlobalSystemConfig(
        {
          appTitle: adminAppTitle,
          appSubtitle: adminAppSubtitle,
          logoText: adminLogoText,
          logoImageUrl: adminLogoImageUrl,
          landingShowcase: updatedLanding,
        },
        adminEmail
      );
      setGlobalFeedback(
        '로그인 화면의 모든 글씨, 브랜딩(로고/명칭), 핵심기능 및 비교표가 전체 클라우드에 성공적으로 반영되었습니다.'
      );
      setTimeout(() => setGlobalFeedback(null), 4000);
    } catch (e) {
      console.error(e);
      alert('로그인 화면 설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const handleResetLandingShowcase = async () => {
    if (!confirm('로그인 화면 설명 문구와 이미지를 기본값으로 복원하시겠습니까?')) return;
    setAdminAppTitle('주짓수 마스터리');
    setAdminAppSubtitle('수련자 전용 테크트리 & 클라우드 아카이브');
    setAdminLogoText('BJJ');
    setAdminLogoImageUrl('');
    setLandingHeaderLoginBtn(DEFAULT_LANDING_SHOWCASE.headerLoginButtonText || 'Google 계정으로 시작');
    setLandingHeadline(DEFAULT_LANDING_SHOWCASE.headline || '');
    setLandingSubheadline(DEFAULT_LANDING_SHOWCASE.subheadline || '');
    setLandingEmpathyTitle(DEFAULT_LANDING_SHOWCASE.empathyTitle || '');
    setLandingEmpathyImageUrl('');
    setLandingEmpathyPoints(DEFAULT_LANDING_SHOWCASE.empathyPoints || []);
    setLandingFeaturesBadge(DEFAULT_LANDING_SHOWCASE.featuresBadge || '핵심 솔루션 안내');
    setLandingFeaturesTitle(DEFAULT_LANDING_SHOWCASE.featuresTitle || '');
    setLandingFeaturesHighlightTitle(DEFAULT_LANDING_SHOWCASE.featuresHighlightTitle || '합리적인 무료 클라우드로 즉시 시작하세요');
    setLandingFeaturesHighlightSub(DEFAULT_LANDING_SHOWCASE.featuresHighlightSub || 'Google 원클릭 계정 연동으로 나만의 독립된 기술 아카이브가 즉시 생성됩니다.');
    setLandingFeaturesFooterCallout(DEFAULT_LANDING_SHOWCASE.featuresFooterCallout || '쉽게 바로 시작해요 — 별도 설치 없이 웹 브라우저에서 바로 시작하고, 개인 데이터는 암호화되어 안전하게 보관됩니다.');
    setLandingFeaturesList(DEFAULT_LANDING_SHOWCASE.featuresList || []);
    setLandingComparisonTitle(DEFAULT_LANDING_SHOWCASE.comparisonTitle || '');
    setLandingComparisonCategoryHeader(DEFAULT_LANDING_SHOWCASE.comparisonCategoryHeader || '구분');
    setLandingComparisonBeforeHeader(DEFAULT_LANDING_SHOWCASE.comparisonBeforeHeader || '기존 방식 (사용 전)');
    setLandingComparisonAfterHeader(DEFAULT_LANDING_SHOWCASE.comparisonAfterHeader || '이 프로그램을 쓸 때 (사용 후)');
    setLandingComparisonItems(DEFAULT_LANDING_SHOWCASE.comparisonItems || []);
    setLandingCtaBadge(DEFAULT_LANDING_SHOWCASE.ctaBadge || '실전 수련 솔루션');
    setLandingCtaQuote(DEFAULT_LANDING_SHOWCASE.ctaQuote || '');
    setLandingCtaSubtext(DEFAULT_LANDING_SHOWCASE.ctaSubtext || '');
    setLandingCtaButtonText(DEFAULT_LANDING_SHOWCASE.ctaButtonText || 'Google 계정으로 무료 시작하기');
    setLandingCtaNoteText(DEFAULT_LANDING_SHOWCASE.ctaNoteText || '* 별도 회원가입 없이 로그인 즉시 독립된 클라우드 데이터베이스가 생성됩니다.');
    setLandingHeroImage('');
    setLandingFooterText(DEFAULT_LANDING_SHOWCASE.footerText || 'Google Cloud Firestore 연동 · 자기주도 주짓수 수련 솔루션');
    setLandingYoutubeUrl(DEFAULT_LANDING_SHOWCASE.youtubeUrl || 'https://youtube.com');
    setLandingShowYoutube(DEFAULT_LANDING_SHOWCASE.showYoutube ?? true);
    setLandingInstagramUrl(DEFAULT_LANDING_SHOWCASE.instagramUrl || 'https://instagram.com');
    setLandingShowInstagram(DEFAULT_LANDING_SHOWCASE.showInstagram ?? true);

    onUpdateSettings({
      appTitle: '주짓수 마스터리',
      appSubtitle: '수련자 전용 테크트리 & 클라우드 아카이브',
      logoText: 'BJJ',
      logoImageUrl: '',
      landingShowcase: DEFAULT_LANDING_SHOWCASE,
    });
    setIsSavingGlobal(true);
    try {
      await saveGlobalSystemConfig(
        {
          appTitle: '주짓수 마스터리',
          appSubtitle: '수련자 전용 테크트리 & 클라우드 아카이브',
          logoText: 'BJJ',
          logoImageUrl: '',
          landingShowcase: DEFAULT_LANDING_SHOWCASE,
        },
        adminEmail
      );
      setGlobalFeedback('로그인 화면 모든 문구가 기본값으로 복원되었습니다.');
      setTimeout(() => setGlobalFeedback(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const handleToggleMenuVisibility = async (key: keyof NavMenuVisibilityConfig) => {
    const currentVis = settings.menuVisibility || {};
    const currentVal = currentVis[key] ?? true;
    const nextVal = !currentVal;
    const nextVis: NavMenuVisibilityConfig = {
      ...currentVis,
      [key]: nextVal,
    };

    onUpdateSettings({ menuVisibility: nextVis });
    setIsSavingGlobal(true);
    try {
      await saveGlobalSystemConfig(
        {
          menuVisibility: nextVis,
        },
        adminEmail
      );
      const keyNameMap: Record<string, string> = {
        home: '홈',
        folder: '영상 폴더',
        add: '영상 추가',
        journal: '학습일지',
        mindmap: '다이어그램',
        positions: '포지션 분류',
        community: '자유게시판',
        watchLogs: '시청 로그 기록',
      };
      setGlobalFeedback(
        `메뉴 [${keyNameMap[key] || key}] 표시 설정이 [${nextVal ? '표시' : '숨김'}] 상태로 전환되어 전체 계정에 즉시 배포되었습니다.`
      );
      setTimeout(() => setGlobalFeedback(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const currentAdminSubGroupObj =
    metadata.submissions.find((s) => s.id === adminSelectedSubGroup) ||
    metadata.submissions[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {globalFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{globalFeedback}</span>
        </div>
      )}

      {/* Admin Center Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 sm:p-1.5 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveAdminTab('monitoring')}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold rounded-lg sm:rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeAdminTab === 'monitoring'
              ? 'bg-slate-900 text-white font-black shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <span className="sm:hidden">통계 ({totalUsers})</span>
          <span className="hidden sm:inline">회원 가입 & 영상 통계 모니터링</span>
          <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white">
            {totalUsers}명
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('config')}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold rounded-lg sm:rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeAdminTab === 'config'
              ? 'text-white font-black shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          style={activeAdminTab === 'config' ? { backgroundColor: settings.primaryColor || '#0ea5e9' } : undefined}
        >
          <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="sm:hidden">시스템 설정</span>
          <span className="hidden sm:inline">관리자 환경설정</span>
          <span className="hidden sm:inline px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-white/20 text-white">
            전체 계정 적용
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('login_showcase')}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold rounded-lg sm:rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeAdminTab === 'login_showcase'
              ? 'text-white font-black shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          style={activeAdminTab === 'login_showcase' ? { backgroundColor: settings.primaryColor || '#0ea5e9' } : undefined}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="sm:hidden">로그인 화면</span>
          <span className="hidden sm:inline">로그인 화면 설정</span>
          <span className="hidden sm:inline px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-white/20 text-white">
            화면 브랜딩 & 문구
          </span>
        </button>

        {/* User Request: 로그인 화면 설정 옆에 컬러 설정 탭 생성 */}
        <button
          type="button"
          onClick={() => setActiveAdminTab('color_settings')}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold rounded-lg sm:rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeAdminTab === 'color_settings'
              ? 'text-white font-black shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          style={activeAdminTab === 'color_settings' ? { backgroundColor: settings.primaryColor || '#0ea5e9' } : undefined}
        >
          <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="sm:hidden">컬러 설정</span>
          <span className="hidden sm:inline">컬러 설정</span>
          <span className="hidden sm:inline px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-white/20 text-white">
            앱 테마 & 다이어그램
          </span>
        </button>
      </div>

      {/* SECTION 1: MONITORING & USER DASHBOARD */}
      {activeAdminTab === 'monitoring' && (
        <div className="space-y-4 sm:space-y-6">
          {/* 4 Summary KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-0.5 sm:mb-1">
                <span className="text-[11px] sm:text-xs font-bold">총 가입 회원</span>
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" />
              </div>
              <div className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isLoading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-slate-400" /> : `${totalUsers}명`}
              </div>
              <div className="hidden sm:block text-[11px] text-slate-400 mt-1 font-medium truncate">
                Google 계정 연동 완료
              </div>
            </div>

            <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-0.5 sm:mb-1">
                <span className="text-[11px] sm:text-xs font-bold">총 학습 영상</span>
                <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              </div>
              <div className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isLoading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-slate-400" /> : `${totalVideos}개`}
              </div>
              <div className="hidden sm:block text-[11px] text-slate-400 mt-1 font-medium truncate">
                전체 유저 등록 누적 합계
              </div>
            </div>

            <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-0.5 sm:mb-1">
                <span className="text-[11px] sm:text-xs font-bold">인당 평균 영상</span>
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
              </div>
              <div className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isLoading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-slate-400" /> : `${avgVideosPerUser}개`}
              </div>
              <div className="hidden sm:block text-[11px] text-slate-400 mt-1 font-medium truncate">
                회원 1인당 평균 보유 기술
              </div>
            </div>

            <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-0.5 sm:mb-1">
                <span className="text-[11px] sm:text-xs font-bold">등록 대기열</span>
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
              </div>
              <div className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isLoading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-slate-400" /> : `${totalQueue}개`}
              </div>
              <div className="hidden sm:block text-[11px] text-slate-400 mt-1 font-medium truncate">
                분석 대기 중인 URL 영상
              </div>
            </div>
          </div>

          {/* Search, Sort & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="회원 이름 또는 이메일 검색..."
                className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 bg-transparent text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-1.5 border-t sm:border-t-0 sm:border-l border-slate-100 sm:border-slate-200 pt-1.5 sm:pt-0 sm:pl-3 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSortBy('learned')}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    sortBy === 'learned'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="sm:hidden">학습순</span>
                  <span className="hidden sm:inline">🎓 많이 학습한 순</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('mom')}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    sortBy === 'mom'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="sm:hidden">전월대비</span>
                  <span className="hidden sm:inline">📈 전월대비 증가순</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('stay')}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    sortBy === 'stay'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="sm:hidden">체류시간</span>
                  <span className="hidden sm:inline">⏱️ 체류시간 순</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('videos')}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    sortBy === 'videos'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="sm:hidden">영상순</span>
                  <span className="hidden sm:inline">영상 보유 순</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('active')}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    sortBy === 'active'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="sm:hidden">활동순</span>
                  <span className="hidden sm:inline">최근 활동 순</span>
                </button>
              </div>

              {/* Data Refresh Button */}
              <button
                type="button"
                onClick={loadData}
                disabled={isRefreshing}
                className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-bold transition-colors cursor-pointer border border-slate-200 disabled:opacity-50 shrink-0 whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? 'animate-spin text-sky-500' : ''}`} />
                <span className="sm:hidden">새로고침</span>
                <span className="hidden sm:inline">데이터 새로고침</span>
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3.5 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap">
                  가입 회원 목록 ({filteredUsers.length}명)
                </span>
              </div>
              <span className="hidden sm:inline text-xs text-slate-400">
                회원을 클릭하면 상세 기술 영상 목록을 조회할 수 있습니다
              </span>
            </div>

            {isLoading ? (
              <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span>회원 통계 데이터를 불러오는 중...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-xs">
                {searchQuery ? '검색 결과와 일치하는 회원이 없습니다.' : '아직 가입한 회원이 없습니다.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const isAdminUser = user.email === adminEmail || user.role === 'admin';
                  const isSelected = selectedUser?.uid === user.uid;
                  const momDiff = user.momVideoChange || 0;

                  return (
                    <div
                      key={user.uid}
                      onClick={() => handleSelectUser(user)}
                      className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="User"
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {user.displayName?.[0] || user.email?.[0] || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {user.displayName || user.email.split('@')[0]}
                            </span>
                            {isAdminUser && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                관리자
                              </span>
                            )}
                            {user.isBanned && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                                강퇴(이용정지)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 flex-wrap">
                        {/* 체류시간 Metric */}
                        <div className="text-left md:text-right">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span>{formatStayTime(user.totalStaySeconds)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">체류시간</div>
                        </div>

                        {/* 전월 대비 영상 추가 수 Metric */}
                        <div className="text-left md:text-right">
                          <div className="flex items-center gap-1 text-xs font-extrabold">
                            {momDiff > 0 ? (
                              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                📈 +{momDiff}개
                              </span>
                            ) : momDiff < 0 ? (
                              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                📉 {momDiff}개
                              </span>
                            ) : (
                              <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                ➖ +0개
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">전월 대비 추가</div>
                        </div>

                        {/* 학습 영상 수 Metric */}
                        <div className="text-left md:text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Video className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="text-sm font-black text-slate-900">
                              {user.learnedVideoCount || 0}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold">/ {user.videoCount}개</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">학습 완료 / 총 보유</div>
                        </div>

                        {/* Kick / Ban Button (In-app Confirmation Dialog) */}
                        {!isAdminUser && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (user.isBanned) {
                                if (confirm(`${user.email} 회원의 강퇴(이용 정지)를 해제하시겠습니까?`)) {
                                  setUserBanStatus(user.uid, false).then(() => {
                                    setUsers((prev) =>
                                      prev.map((u) => (u.uid === user.uid ? { ...u, isBanned: false } : u))
                                    );
                                    setGlobalFeedback(`[${user.email}] 회원의 이용 정지가 해제되었습니다.`);
                                    setTimeout(() => setGlobalFeedback(null), 4000);
                                  });
                                }
                              } else {
                                setKickTargetUser(user);
                              }
                            }}
                            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-3xs flex items-center gap-1 shrink-0 ${
                              user.isBanned
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{user.isBanned ? '강퇴 해제' : '강퇴'}</span>
                          </button>
                        )}

                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Member Kick Confirmation Dialog Modal */}
          {kickTargetUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1">
                  회원 강퇴 확인
                </h3>
                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  정말 <strong className="text-rose-600 font-extrabold">{kickTargetUser.displayName || kickTargetUser.email}</strong> 회원을 강퇴하시겠습니까?
                  <br />
                  <span className="text-slate-400 font-mono text-[11px] block mt-1">({kickTargetUser.email})</span>
                  <br />
                  강퇴 처리 시 해당 회원은 서비스 이용이 즉시 제한됩니다.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setKickTargetUser(null)}
                    disabled={isProcessingKick}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsProcessingKick(true);
                      try {
                        await setUserBanStatus(kickTargetUser.uid, true, '관리자 강퇴 처리');
                        setUsers((prev) =>
                          prev.map((u) => (u.uid === kickTargetUser.uid ? { ...u, isBanned: true } : u))
                        );
                        setGlobalFeedback(`[${kickTargetUser.email}] 회원이 성공적으로 강퇴 처리되었습니다.`);
                        setTimeout(() => setGlobalFeedback(null), 4000);
                      } catch (e) {
                        console.error(e);
                        alert('강퇴 처리 중 오류가 발생했습니다.');
                      } finally {
                        setIsProcessingKick(false);
                        setKickTargetUser(null);
                      }
                    }}
                    disabled={isProcessingKick}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingKick ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>강퇴 처리 중...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>강퇴 실행</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Detail Drilldown Panel */}
          {selectedUser && (
            <div className="p-6 rounded-3xl bg-white border border-indigo-200 shadow-sm animate-in fade-in space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-black text-slate-900">
                    [{selectedUser.displayName || selectedUser.email}] 님의 기술 아카이브 상세 분석
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-xs text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
                >
                  닫기 ✕
                </button>
              </div>

              {userDetailLoading ? (
                <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span>회원 기술 데이터를 불러오는 중...</span>
                </div>
              ) : userDetailData ? (
                <div className="space-y-3">
                  <div className="text-xs text-slate-600 font-medium">
                    총 {userDetailData.videos.length}개 기술 영상 등록됨
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
                    {userDetailData.videos.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                      >
                        <div className="font-bold text-slate-900 truncate">
                          {v.titleKo}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {v.position} · {v.category} · {v.giType}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  등록된 영상이 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: ADMIN CONFIGURATION & GLOBAL PRESETS */}
      {activeAdminTab === 'config' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-3.5 sm:p-8 shadow-xs space-y-3 sm:space-y-8">
          {/* Header Explanation */}
          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-200 space-y-1 sm:space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 shrink-0" />
              <h3 className="text-xs sm:text-sm font-black text-amber-950 truncate">
                관리자 환경설정 (모든 계정 적용 공용 고정값)
              </h3>
            </div>
            <p className="hidden sm:block text-xs text-amber-900 leading-relaxed">
              이곳에서 관리자가 추가한 시작 포지션, 기술 속성, 서브미션 종류는 <strong>고정값으로 본인에게만 생기는 것이 아니라 모든 회원 계정에 자동으로 공용 폴더 및 속성으로 생성</strong>됩니다.
            </p>
          </div>

          {/* 1. 시작 포지션 추가 (관리자 옵션: 모든 계정 폴더 생성) */}
          <div className="space-y-2 sm:space-y-3 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <FolderCog className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  1. 시작 포지션 추가
                </h4>
              </div>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800">
                전체 회원 계정에 자동 배포
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-500">
              새로운 포지션을 등록하면 모든 사용자의 [영상 폴더] 및 [마인드맵]에 고정값으로 공용 폴더가 생성됩니다.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-0.5">
              <select
                value={adminNewPosGroup}
                onChange={(e) => setAdminNewPosGroup(e.target.value)}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg sm:rounded-xl text-slate-800 focus:outline-none truncate"
              >
                <option value="스탠딩 및 특수 포지션">스탠딩 및 특수 포지션 (6종)</option>
                <option value="탑 & 도미넌트 (상위)">탑 & 도미넌트 (상위) (8종)</option>
                <option value="가드 포지션 (하위)">가드 포지션 (하위) (23종)</option>
              </select>
              <input
                type="text"
                value={adminNewPosName}
                onChange={(e) => setAdminNewPosName(e.target.value)}
                placeholder="포지션명 (예: 50/50 가드)"
                className="flex-1 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
              />
              <input
                type="text"
                value={adminNewPosNameEn}
                onChange={(e) => setAdminNewPosNameEn(e.target.value)}
                placeholder="영문명 (선택)"
                className="sm:w-32 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleAdminAddGlobalPosition}
                disabled={isSavingGlobal}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg sm:rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="sm:hidden">포지션 추가</span>
                <span className="hidden sm:inline">공용 고정값 폴더 배포</span>
              </button>
            </div>
          </div>

          {/* 2. 기술 성격/속성 추가 (관리자 옵션: 모든 계정 배포) */}
          <div className="space-y-2 sm:space-y-3 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500 shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  2. 기술 성격/속성 추가
                </h4>
              </div>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800">
                전체 회원 계정에 자동 배포
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-500">
              새로운 기술 속성을 등록하면 모든 회원 계정에 분류 옵션으로 즉시 반영됩니다.
            </p>

            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="text"
                value={adminNewCategory}
                onChange={(e) => setAdminNewCategory(e.target.value)}
                placeholder="기술 속성명 (예: 암 트라이앵글 계열)"
                className="flex-1 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleAdminAddGlobalCategory}
                disabled={isSavingGlobal}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg sm:rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="sm:hidden">속성 추가</span>
                <span className="hidden sm:inline">공용 속성 배포</span>
              </button>
            </div>
          </div>

          {/* 3. 서브미션 종류 관리 */}
          <div className="space-y-3 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500 shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  3. 서브미션 종류 관리
                </h4>
              </div>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800">
                전체 회원 계정에 자동 배포
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-500 leading-relaxed">
              초크, 상체관절기, 하체관절기, 압박 및 기타 피니시 외에도 <strong>내가 원하는 새로운 서브미션 종류를 자유롭게 추가</strong>할 수 있습니다.
            </p>

            {/* Add New Submission Group Form */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="text"
                value={adminNewSubGroupName}
                onChange={(e) => setAdminNewSubGroupName(e.target.value)}
                placeholder="새 서브미션 종류 (예: 렉락 변형)"
                className="flex-1 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleAdminAddGlobalSubGroup}
                disabled={isSavingGlobal}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg sm:rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="sm:hidden">종류 추가</span>
                <span className="hidden sm:inline">서브미션 종류 추가 (전체 배포)</span>
              </button>
            </div>

            {/* Current Submission Groups Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap pt-1">
              {metadata.submissions.map((group) => {
                const isSelected = adminSelectedSubGroup === group.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setAdminSelectedSubGroup(group.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 whitespace-nowrap ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{group.name}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700">
                      {group.items.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Add Technique Item inside selected group */}
            {currentAdminSubGroupObj && (
              <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    [{currentAdminSubGroupObj.name}] 에 공용 기술 추가
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {currentAdminSubGroupObj.items.length}개 등록됨
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={adminNewSubItem}
                    onChange={(e) => setAdminNewSubItem(e.target.value)}
                    placeholder={`[${currentAdminSubGroupObj.name}] 세부 기술명`}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAdminAddGlobalSubItem}
                    disabled={isSavingGlobal}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 disabled:opacity-50 whitespace-nowrap"
                  >
                    추가
                  </button>
                </div>

                <div className="flex flex-wrap gap-1 pt-0.5">
                  {currentAdminSubGroupObj.items.map((it) => (
                    <span
                      key={it}
                      className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-slate-100 text-slate-800 text-[11px] sm:text-xs font-medium"
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. 관리자 옵션: 타임라인 메모 이미지 첨부 허용 */}
          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 shrink-0" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    타임라인 메모 이미지 첨부
                  </div>
                  <div className="hidden sm:block text-xs text-slate-500">
                    상세 뷰어에서 타임라인 메모 작성 시 스크린샷 및 디테일 이미지 첨부 허용 여부를 설정합니다.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 p-1 bg-white rounded-lg sm:rounded-xl border border-slate-300 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleTimelineMemoImages(true)}
                  className={`px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs font-bold rounded-md sm:rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    settings.allowTimelineMemoImages !== false
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  허용
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleTimelineMemoImages(false)}
                  className={`px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs font-bold rounded-md sm:rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    settings.allowTimelineMemoImages === false
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  차단
                </button>
              </div>
            </div>
          </div>

          {/* 5-B. 다이어그램(마인드맵) 툴바 배치 위치 설정 (상단/하단/좌측/우측) */}
          <div className="space-y-2 sm:space-y-3 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500 shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  다이어그램 툴바 위치
                </h4>
              </div>

              <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold shrink-0">
                {
                  settings.mindmapToolbarPosition === 'bottom'
                    ? '하단'
                    : settings.mindmapToolbarPosition === 'left'
                      ? '좌측'
                      : settings.mindmapToolbarPosition === 'right'
                        ? '우측'
                        : '상단 (기본)'
                }
              </span>
            </div>

            <p className="hidden sm:block text-xs text-slate-500">
              클러스터/필터/줌 등이 포함된 다이어그램 조작 툴바를 가로형(상단/하단) 또는 세로형(좌측/우측)으로 배치합니다.
            </p>

            <div className="grid grid-cols-4 gap-1.5 sm:gap-3 pt-1">
              {[
                {
                  id: 'top' as const,
                  label: '상단',
                  sub: '기본 가로 바',
                  preview: 'border-t-4 border-t-sky-500',
                },
                {
                  id: 'bottom' as const,
                  label: '하단',
                  sub: '하단 고정 바',
                  preview: 'border-b-4 border-b-sky-500',
                },
                {
                  id: 'left' as const,
                  label: '좌측',
                  sub: '좌측 사이드바',
                  preview: 'border-l-4 border-l-sky-600',
                },
                {
                  id: 'right' as const,
                  label: '우측',
                  sub: '우측 사이드바',
                  preview: 'border-r-4 border-r-sky-500',
                },
              ].map((opt) => {
                const isSelected = (settings.mindmapToolbarPosition || 'top') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleAdminChangeToolbarPosition(opt.id)}
                    disabled={isSavingGlobal}
                    className={`p-2 sm:p-3.5 rounded-lg sm:rounded-xl border text-center sm:text-left transition-all cursor-pointer flex flex-col justify-between ${opt.preview} ${
                      isSelected
                        ? 'bg-white border-sky-500 shadow-sm ring-2 ring-sky-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-center sm:justify-between mb-0.5 sm:mb-1">
                        <span className={`text-xs font-black ${isSelected ? 'text-sky-600' : 'text-slate-900'}`}>
                          {opt.label}
                        </span>
                        {isSelected && (
                          <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-sky-500" />
                        )}
                      </div>
                      <p className="hidden sm:block text-[11px] text-slate-500 leading-snug">
                        {opt.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5-C. 전체 메뉴 표시/숨김 설정 (글로벌 고정값 배포) */}
          <div className="space-y-2 sm:space-y-4 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500 shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  전체 메뉴 표시/숨김 관리
                </h4>
              </div>

              <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold shrink-0">
                전체 즉시 배포
              </span>
            </div>

            <p className="hidden sm:block text-xs text-slate-500">
              좌측 사이드바에 표시할 네비게이션 메뉴를 관리자가 켜거나 꺼서 전체 회원에게 즉시 적용합니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 pt-0.5">
              {[
                { key: 'home' as const, label: '홈 (대시보드)', desc: '통계 분석 및 홈 대시보드' },
                { key: 'folder' as const, label: '영상 폴더', desc: '포지션별 영상 아카이브' },
                { key: 'add' as const, label: '영상 추가', desc: '유튜브 링크 다중 등록 큐' },
                { key: 'journal' as const, label: '학습일지', desc: '일자별 캘린더 수련 기록' },
                { key: 'mindmap' as const, label: '다이어그램', desc: '순환형 마인드맵/테크트리' },
                { key: 'positions' as const, label: '포지션 분류', desc: '8대 기둥 & 커스텀 분류' },
                { key: 'community' as const, label: '자유게시판', desc: '오픈 커뮤니티 및 영상 클립 질문 Q&A' },
                { key: 'watchLogs' as const, label: '시청 로그 기록', desc: '내가 시청한 영상 일시 기록' },
              ].map((item) => {
                const isVisible = (settings.menuVisibility?.[item.key] ?? true);

                return (
                  <div
                    key={item.key}
                    className={`p-2.5 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                      isVisible
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-100/70 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className={`text-xs font-bold block truncate ${isVisible ? 'text-slate-900' : 'text-slate-500'}`}>
                        {item.label}
                      </span>
                      <p className="hidden sm:block text-[11px] text-slate-400 truncate mt-0.5">
                        {item.desc}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleMenuVisibility(item.key)}
                      disabled={isSavingGlobal}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs whitespace-nowrap ${
                        isVisible
                          ? 'bg-sky-500 hover:bg-sky-600 text-white'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                      }`}
                    >
                      {isVisible ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>표시</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>숨김</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: LOGIN SCREEN & SHOWCASE CUSTOMIZER */}
      {activeAdminTab === 'login_showcase' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8 animate-in fade-in">
          {/* Header Explanation */}
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-black text-amber-950">
                로그인 화면 브랜딩 & 안내 문구 설정
              </h3>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              비로그인 사용자가 접속했을 때 표시되는 랜딩/로그인 화면의 <strong>공감 문구, 4대 핵심 기능 안내, Before/After 비교표, 가입 유도 CTA 카피 및 대표 이미지</strong>를 관리자가 직접 커스터마이징하여 전체 적용합니다.
            </p>
          </div>

          <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    로그인 화면 안내 문구 및 이미지 수정
                  </h4>
                  <p className="text-xs text-slate-500">
                    회원 로그인 화면의 공감 문구, 핵심 기능 안내 문구, 가입 유도 카피를 관리자가 직접 수정하고 전체 반영합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetLandingShowcase}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  기본 문구로 초기화
                </button>
                <button
                  type="button"
                  onClick={handleSaveLandingShowcase}
                  disabled={isSavingGlobal}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>로그인 화면 저장</span>
                </button>
              </div>
            </div>

            <div className="space-y-6 pt-2">
              {/* 0. App Title, Subtitle, Logo Customization Section (Request #3) */}
              <div className="p-4 rounded-xl bg-white border border-sky-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-slate-900">
                      [앱 명칭 & 로고 설정] 로그인 화면 및 헤더 브랜딩
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                    전체 공용 반영
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      앱 / 도장 명칭 (App Title)
                    </label>
                    <input
                      type="text"
                      value={adminAppTitle}
                      onChange={(e) => setAdminAppTitle(e.target.value)}
                      placeholder="주짓수 마스터리"
                      className="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      서브 타이틀 (Subtitle)
                    </label>
                    <input
                      type="text"
                      value={adminAppSubtitle}
                      onChange={(e) => setAdminAppSubtitle(e.target.value)}
                      placeholder="수련자 전용 테크트리 & 클라우드 아카이브"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      상단 로그인 버튼 문구
                    </label>
                    <input
                      type="text"
                      value={landingHeaderLoginBtn}
                      onChange={(e) => setLandingHeaderLoginBtn(e.target.value)}
                      placeholder="Google 계정으로 시작"
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                        <span>왼쪽 로고 이미지 업로드 / 텍스트 설정</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        도장 로고 이미지 파일을 직접 첨부하거나 웹 URL을 입력하세요. 미등록 시 하늘색 텍스트 뱃지가 표시됩니다.
                      </p>
                    </div>

                    {/* Logo Preview */}
                    <div className="flex items-center gap-2 shrink-0">
                      {adminLogoImageUrl ? (
                        <div className="relative group">
                          <img
                            src={adminLogoImageUrl}
                            alt="Logo Preview"
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-xl object-contain border border-slate-300 bg-white shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => setAdminLogoImageUrl('')}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] hover:bg-rose-600 shadow-xs cursor-pointer"
                            title="로고 이미지 삭제"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
                          {adminLogoText || 'BJJ'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        로고 대체 텍스트
                      </label>
                      <input
                        type="text"
                        value={adminLogoText}
                        onChange={(e) => setAdminLogoText(e.target.value)}
                        placeholder="BJJ"
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        로고 이미지 URL 직접 입력
                      </label>
                      <input
                        type="text"
                        value={adminLogoImageUrl}
                        onChange={(e) => setAdminLogoImageUrl(e.target.value)}
                        placeholder="https://... 또는 파일 업로드"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-4 pt-4 sm:pt-0">
                      <label className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>로고 파일 첨부</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileRead(e, (dataUrl) => setAdminLogoImageUrl(dataUrl))}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* SNS (YouTube & Instagram) Settings: URL & Show/Hide */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
                    <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-sky-600" />
                      <span>로그인 화면 SNS 아이콘 링크 (URL) 및 노출/숨김 설정</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      상단 헤더 아이콘 클릭 시 이동할 URL 설정 및 숨김 처리
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* YouTube Setting Card */}
                    <div
                      className={`p-3 rounded-xl border transition-all ${
                        landingShowYoutube
                          ? 'bg-white border-slate-300 shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="p-1 rounded-md bg-red-50 text-red-600 border border-red-200">
                            <Youtube className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-slate-900">
                            유튜브 아이콘 & URL
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLandingShowYoutube(!landingShowYoutube)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs ${
                            landingShowYoutube
                              ? 'bg-sky-500 hover:bg-sky-600 text-white'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                          }`}
                        >
                          {landingShowYoutube ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>표시됨</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>숨김</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-semibold text-slate-600">
                          클릭 시 이동할 유튜브 링크 URL
                        </label>
                        <input
                          type="url"
                          value={landingYoutubeUrl}
                          onChange={(e) => setLandingYoutubeUrl(e.target.value)}
                          placeholder="https://www.youtube.com/@채널명"
                          disabled={!landingShowYoutube}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Instagram Setting Card */}
                    <div
                      className={`p-3 rounded-xl border transition-all ${
                        landingShowInstagram
                          ? 'bg-white border-slate-300 shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="p-1 rounded-md bg-pink-50 text-pink-600 border border-pink-200">
                            <Instagram className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-slate-900">
                            인스타그램 아이콘 & URL
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLandingShowInstagram(!landingShowInstagram)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs ${
                            landingShowInstagram
                              ? 'bg-sky-500 hover:bg-sky-600 text-white'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                          }`}
                        >
                          {landingShowInstagram ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>표시됨</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>숨김</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-semibold text-slate-600">
                          클릭 시 이동할 인스타그램 링크 URL
                        </label>
                        <input
                          type="url"
                          value={landingInstagramUrl}
                          onChange={(e) => setLandingInstagramUrl(e.target.value)}
                          placeholder="https://www.instagram.com/계정명"
                          disabled={!landingShowInstagram}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Empathy Section */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    <span>[공감 문구] 섹션 타이틀 및 공감 포인트 관리</span>
                  </span>
                </div>
                <input
                  type="text"
                  value={landingEmpathyTitle}
                  onChange={(e) => setLandingEmpathyTitle(e.target.value)}
                  placeholder='[공감 문구] "이런 적 있으신가요?"'
                  className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                />

                <div className="space-y-3 pt-1">
                  {landingEmpathyPoints.map((pt, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50/70 border border-slate-200 space-y-2">
                      <div className="text-[11px] font-bold text-slate-700">공감 포인트 0{idx + 1}</div>
                      <input
                        type="text"
                        value={pt.title}
                        onChange={(e) => {
                          const next = [...landingEmpathyPoints];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setLandingEmpathyPoints(next);
                        }}
                        placeholder="공감 제목"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                      <textarea
                        value={pt.desc}
                        onChange={(e) => {
                          const next = [...landingEmpathyPoints];
                          next[idx] = { ...next[idx], desc: e.target.value };
                          setLandingEmpathyPoints(next);
                        }}
                        rows={2}
                        placeholder="공감 세부 설명"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Core Features Section (Request #4: Expandable accordion with attached image + custom titles) */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>[핵심 기능 안내] 모든 문구 & 기능별 카드 관리 (4개 이상 자유 추가 및 이미지 첨부)</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="flex items-center gap-1 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>핵심 기능 추가</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      기능 섹션 상단 뱃지 문구
                    </label>
                    <input
                      type="text"
                      value={landingFeaturesBadge}
                      onChange={(e) => setLandingFeaturesBadge(e.target.value)}
                      placeholder="핵심 솔루션 안내"
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      메인 헤드라인 (Headline)
                    </label>
                    <input
                      type="text"
                      value={landingHeadline}
                      onChange={(e) => setLandingHeadline(e.target.value)}
                      placeholder="비싸고 막상 필요한 기능은 없는 범용 프로그램, 아직도 쓰세요?"
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    서브 헤드라인 설명 (Subheadline)
                  </label>
                  <textarea
                    value={landingSubheadline}
                    onChange={(e) => setLandingSubheadline(e.target.value)}
                    rows={2}
                    placeholder="수련자 여러분이 진짜 필요하다고 하신 4방향 순환 마인드맵, 유튜브 타임라인 메모, 그리고 계정별 분리 클라우드 DB를 바로 만들고 고쳐 드리고 있어요."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2.5">
                  <div className="text-[11px] font-bold text-sky-900">
                    하늘색 하이라이트 박스 문구 설정
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        하이라이트 타이틀
                      </label>
                      <input
                        type="text"
                        value={landingFeaturesHighlightTitle}
                        onChange={(e) => setLandingFeaturesHighlightTitle(e.target.value)}
                        placeholder="합리적인 무료 클라우드로 즉시 시작하세요"
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        하이라이트 서브 설명
                      </label>
                      <input
                        type="text"
                        value={landingFeaturesHighlightSub}
                        onChange={(e) => setLandingFeaturesHighlightSub(e.target.value)}
                        placeholder="Google 원클릭 계정 연동으로 나만의 독립된 기술 아카이브가 즉시 생성됩니다."
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {landingFeaturesList.map((f, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-lg bg-sky-500 text-white text-[10px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            기능 0{idx + 1}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="이 기능 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">기능 제목</label>
                        <input
                          type="text"
                          value={f.title}
                          onChange={(e) => {
                            const next = [...landingFeaturesList];
                            next[idx] = { ...next[idx], title: e.target.value };
                            setLandingFeaturesList(next);
                          }}
                          placeholder="기능 명칭"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">소제목</label>
                        <input
                          type="text"
                          value={f.subtitle || ''}
                          onChange={(e) => {
                            const next = [...landingFeaturesList];
                            next[idx] = { ...next[idx], subtitle: e.target.value };
                            setLandingFeaturesList(next);
                          }}
                          placeholder="부제목"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-sky-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">설명 내용 (아코디언 내용)</label>
                        <textarea
                          value={f.desc}
                          onChange={(e) => {
                            const next = [...landingFeaturesList];
                            next[idx] = { ...next[idx], desc: e.target.value };
                            setLandingFeaturesList(next);
                          }}
                          rows={3}
                          placeholder="기능 상세 설명"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                        />
                      </div>

                      {/* Attached Image for this feature (Right preview image) */}
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold text-slate-700 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-sky-600" />
                            <span>우측 배치 예시 이미지 (선택)</span>
                          </label>
                          {f.imageUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...landingFeaturesList];
                                next[idx] = { ...next[idx], imageUrl: '' };
                                setLandingFeaturesList(next);
                              }}
                              className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                            >
                              이미지 제거
                            </button>
                          )}
                        </div>

                        {f.imageUrl && (
                          <div className="relative w-full h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                            <img
                              src={f.imageUrl}
                              alt={f.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={f.imageUrl || ''}
                            onChange={(e) => {
                              const next = [...landingFeaturesList];
                              next[idx] = { ...next[idx], imageUrl: e.target.value };
                              setLandingFeaturesList(next);
                            }}
                            placeholder="이미지 웹 URL 또는 파일 첨부"
                            className="flex-1 px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
                          />
                          <label className="cursor-pointer shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-300 flex items-center gap-1">
                            <Upload className="w-3 h-3 text-slate-600" />
                            <span>파일</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageFileRead(e, (dataUrl) => {
                                  const next = [...landingFeaturesList];
                                  next[idx] = { ...next[idx], imageUrl: dataUrl };
                                  setLandingFeaturesList(next);
                                })
                              }
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    기능 섹션 하단 안내 문구 (Footer Callout)
                  </label>
                  <input
                    type="text"
                    value={landingFeaturesFooterCallout}
                    onChange={(e) => setLandingFeaturesFooterCallout(e.target.value)}
                    placeholder="쉽게 바로 시작해요 — 별도 설치 없이 웹 브라우저에서 바로 시작하고, 개인 데이터는 암호화되어 안전하게 보관됩니다."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* 3. Before vs After Comparison */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span>[간단 비교] 사용 전과 후 비교표 문구 및 열 제목</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleAddComparisonItem}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
                  >
                    <Plus className="w-3 h-3" />
                    <span>비교 항목 추가</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={landingComparisonTitle}
                  onChange={(e) => setLandingComparisonTitle(e.target.value)}
                  placeholder="[간단 비교] 사용 전과 후"
                  className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-100 border border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      1열 제목
                    </label>
                    <input
                      type="text"
                      value={landingComparisonCategoryHeader}
                      onChange={(e) => setLandingComparisonCategoryHeader(e.target.value)}
                      placeholder="구분"
                      className="w-full px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-rose-700 mb-0.5">
                      2열 제목 (기존 방식)
                    </label>
                    <input
                      type="text"
                      value={landingComparisonBeforeHeader}
                      onChange={(e) => setLandingComparisonBeforeHeader(e.target.value)}
                      placeholder="기존 방식 (사용 전)"
                      className="w-full px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-sky-800 mb-0.5">
                      3열 제목 (개선 방식)
                    </label>
                    <input
                      type="text"
                      value={landingComparisonAfterHeader}
                      onChange={(e) => setLandingComparisonAfterHeader(e.target.value)}
                      placeholder="이 프로그램을 쓸 때 (사용 후)"
                      className="w-full px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  {landingComparisonItems.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center relative group">
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">구분</label>
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => {
                            const next = [...landingComparisonItems];
                            next[idx] = { ...next[idx], category: e.target.value };
                            setLandingComparisonItems(next);
                          }}
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-semibold text-rose-600 mb-0.5">기존 방식</label>
                        <input
                          type="text"
                          value={item.before}
                          onChange={(e) => {
                            const next = [...landingComparisonItems];
                            next[idx] = { ...next[idx], before: e.target.value };
                            setLandingComparisonItems(next);
                          }}
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-600"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-semibold text-emerald-700 mb-0.5">이 프로그램을 쓸 때</label>
                        <input
                          type="text"
                          value={item.after}
                          onChange={(e) => {
                            const next = [...landingComparisonItems];
                            next[idx] = { ...next[idx], after: e.target.value };
                            setLandingComparisonItems(next);
                          }}
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-emerald-950"
                        />
                      </div>
                      <div className="sm:col-span-1 flex items-center justify-end pt-3 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveComparisonItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="항목 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. CTA & Hero Image */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-slate-700" />
                  <span>[가입 유도 & CTA 문구] 및 대표 배너 이미지</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      CTA 뱃지 문구 (Badge)
                    </label>
                    <input
                      type="text"
                      value={landingCtaBadge}
                      onChange={(e) => setLandingCtaBadge(e.target.value)}
                      placeholder="실전 수련 솔루션"
                      className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      하단 시작하기 버튼 문구
                    </label>
                    <input
                      type="text"
                      value={landingCtaButtonText}
                      onChange={(e) => setLandingCtaButtonText(e.target.value)}
                      placeholder="Google 계정으로 무료 시작하기"
                      className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    가입 유도 메인 인용구 (CTA Quote)
                  </label>
                  <input
                    type="text"
                    value={landingCtaQuote}
                    onChange={(e) => setLandingCtaQuote(e.target.value)}
                    placeholder='"기술을 많이 아는 것보다 중요한 건, 내가 아는 기술을 제때 꺼내 쓰는 것입니다."'
                    className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    가입 유도 서브 설명 (CTA Subtext)
                  </label>
                  <textarea
                    value={landingCtaSubtext}
                    onChange={(e) => setLandingCtaSubtext(e.target.value)}
                    rows={2}
                    placeholder="오늘 체육관에서 배운 기술 하나부터 가볍게 기록해보세요.&#10;차곡차곡 쌓인 기록이 실전에서 막힘없이 움직이는 나만의 실력이 됩니다."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    버튼 아래 안내 각주 (Note Text)
                  </label>
                  <input
                    type="text"
                    value={landingCtaNoteText}
                    onChange={(e) => setLandingCtaNoteText(e.target.value)}
                    placeholder="* 별도 회원가입 없이 로그인 즉시 독립된 클라우드 데이터베이스가 생성됩니다."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    로그인 화면 최상단 대표 배너 이미지 URL (선택)
                  </label>
                  <input
                    type="text"
                    value={landingHeroImage}
                    onChange={(e) => setLandingHeroImage(e.target.value)}
                    placeholder="이미지 웹 URL 또는 비워두기 (예: https://...)"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* 5. Footer Text */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800">
                  [로그인 화면 최하단 푸터 문구]
                </span>
                <input
                  type="text"
                  value={landingFooterText}
                  onChange={(e) => setLandingFooterText(e.target.value)}
                  placeholder="Google Cloud Firestore 연동 · 자기주도 주짓수 수련 솔루션"
                  className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: COLOR SETTINGS (User Request: 로그인 화면 설정 옆에 컬러 설정 탭 생성, 전체 계정 공용 고정값 배포) */}
      {activeAdminTab === 'color_settings' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8 animate-in fade-in">
          {/* Header Explanation Banner */}
          <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 space-y-2">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-sky-600" />
              <h3 className="text-sm font-black text-sky-950">
                글로벌 컬러 설정 (전체 회원 계정 공용 테마 배포)
              </h3>
            </div>
            <p className="text-xs text-sky-800 leading-relaxed">
              앱의 메인 브랜드 테마 컬러(사이드바, 헤더, 액션 버튼, 배지 등), 영상 폴더 그룹별 색상, 다이어그램 마인드맵 노드 및 연결선 색상을 관리자가 일괄 지정합니다. 변경 즉시 현재 화면 및 클라우드 데이터베이스에 실시간 영구 배포됩니다.
            </p>
          </div>

          {/* 1. 앱 메인 컬러 (브랜드 테마) 설정 */}
          <div className="space-y-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                  style={{ backgroundColor: settings.primaryColor || '#0ea5e9' }}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>앱 메인 컬러 (브랜드 테마) 설정</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: `${settings.primaryColor || '#0ea5e9'}15`,
                        color: settings.primaryColor || '#0ea5e9',
                        borderColor: `${settings.primaryColor || '#0ea5e9'}30`,
                      }}
                    >
                      현재 테마: {settings.primaryColor || '#0ea5e9'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    UI 배경은 흰색이며, 사이드바 활성 메뉴, 모바일 하단 내비게이션, 주요 헤더 배지 및 액션 버튼에 실시간 반영됩니다.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAdminUpdatePrimaryColor('#0ea5e9')}
                className="text-xs text-sky-600 hover:text-sky-800 font-semibold underline cursor-pointer self-start sm:self-auto"
              >
                기본 하늘색(#0ea5e9) 복원
              </button>
            </div>

            {/* Live Preview Card & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">현재 메인 컬러 선택:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs"
                      style={{ backgroundColor: settings.primaryColor || '#0ea5e9' }}
                    />
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {settings.primaryColor || '#0ea5e9'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={settings.primaryColor || '#0ea5e9'}
                    onChange={(e) => handleAdminUpdatePrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 shadow-2xs shrink-0"
                    title="색상 선택기 열기"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor || '#0ea5e9'}
                    onChange={(e) => handleAdminUpdatePrimaryColor(e.target.value)}
                    placeholder="#0ea5e9"
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                {/* Preset Swatches */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-semibold text-slate-500">추천 프리셋:</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { name: '하늘색 (기본)', hex: '#0ea5e9' },
                      { name: '딥 오션', hex: '#0284c7' },
                      { name: '로열 블루', hex: '#2563eb' },
                      { name: '인디고', hex: '#6366f1' },
                      { name: '에메랄드', hex: '#059669' },
                      { name: '크림슨 로즈', hex: '#e11d48' },
                      { name: '바이올렛 퍼플', hex: '#7c3aed' },
                      { name: '앰버 오렌지', hex: '#d97706' },
                      { name: '다크 슬레이트', hex: '#334155' },
                    ].map((swatch) => {
                      const isSelected = (settings.primaryColor || '#0ea5e9').toLowerCase() === swatch.hex.toLowerCase();
                      return (
                        <button
                          key={swatch.hex}
                          type="button"
                          onClick={() => handleAdminUpdatePrimaryColor(swatch.hex)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-slate-900 bg-slate-900 text-white font-bold shadow-xs scale-105'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                            style={{ backgroundColor: swatch.hex }}
                          />
                          <span>{swatch.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Real-time Preview */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 flex flex-col justify-between">
                <div className="text-xs font-bold text-slate-700">UI 컴포넌트 실시간 미리보기</div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">기술 영상 아카이브</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: settings.primaryColor || '#0ea5e9' }}
                    >
                      PRO
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs"
                      style={{ backgroundColor: settings.primaryColor || '#0ea5e9' }}
                    >
                      영상 시청하기
                    </button>
                    <span
                      className="px-2 py-1 rounded-lg text-xs font-bold border"
                      style={{
                        borderColor: `${settings.primaryColor || '#0ea5e9'}55`,
                        color: settings.primaryColor || '#0ea5e9',
                        backgroundColor: `${settings.primaryColor || '#0ea5e9'}15`,
                      }}
                    >
                      가드 패스
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  선택한 색상이 사이드바 활성 메뉴, 모바일 내비게이션, 주요 버튼 및 뱃지에 즉시 적용됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 2. 영상 폴더 그룹 색상 커스텀 */}
          <div className="space-y-3 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  영상 폴더 그룹 기본 색상 테마 설정
                </h4>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleAdminUpdateFolderColors({
                    guard: '#059669',
                    dominant: '#d97706',
                    other: '#6366f1',
                  })
                }
                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                기본 색상 복원
              </button>
            </div>
            <p className="text-xs text-slate-500">
              영상 폴더에서 가드, 탑/도미넌트, 스탠딩/특수 포지션 그룹별로 표시되는 폴더의 색상을 자유롭게 지정합니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-2xs"
                    style={{ backgroundColor: settings.folderColors?.guard || '#059669' }}
                  />
                  <span className="text-xs font-bold text-slate-800">가드 포지션</span>
                </div>
                <input
                  type="color"
                  value={settings.folderColors?.guard || '#059669'}
                  onChange={(e) =>
                    handleAdminUpdateFolderColors({
                      ...settings.folderColors,
                      guard: e.target.value,
                    })
                  }
                  className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-2xs"
                    style={{ backgroundColor: settings.folderColors?.dominant || '#d97706' }}
                  />
                  <span className="text-xs font-bold text-slate-800">탑 & 도미넌트</span>
                </div>
                <input
                  type="color"
                  value={settings.folderColors?.dominant || '#d97706'}
                  onChange={(e) =>
                    handleAdminUpdateFolderColors({
                      ...settings.folderColors,
                      dominant: e.target.value,
                    })
                  }
                  className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-2xs"
                    style={{ backgroundColor: settings.folderColors?.other || '#6366f1' }}
                  />
                  <span className="text-xs font-bold text-slate-800">기타 포지션</span>
                </div>
                <input
                  type="color"
                  value={settings.folderColors?.other || '#6366f1'}
                  onChange={(e) =>
                    handleAdminUpdateFolderColors({
                      ...settings.folderColors,
                      other: e.target.value,
                    })
                  }
                  className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
              </div>
            </div>
          </div>

          {/* 3. 다이어그램 시작포지션, 끝포지션(연결선), 서브미션 색상 설정 */}
          <div className="space-y-3 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-500" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    다이어그램 시작 포지션 · 끝(최종) 포지션 · 서브미션 색상 설정
                  </h4>
                  <p className="text-xs text-slate-500">
                    다이어그램 마인드맵 상의 시작 포지션 폴더, 최종 포지션 전개 연결선, 서브미션 연결선 및 피니시 노드 테마 색상을 관리자가 직접 지정합니다.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleAdminUpdateMindmapColors({
                    startPositionColor: '#0284c7',
                    endPositionLineColor: '#8b5cf6',
                    submissionLineColor: '#f43f5e',
                    submissionNodeColor: '#e11d48',
                  })
                }
                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer self-start sm:self-auto"
              >
                기본 색상 복원
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* 1. 시작 포지션 기본 색상 */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
                    style={{ backgroundColor: settings.mindmapColors?.startPositionColor || '#0284c7' }}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">시작 포지션</div>
                    <div className="text-[10px] text-slate-400">폴더 및 연결 테두리</div>
                  </div>
                </div>
                <input
                  type="color"
                  value={settings.mindmapColors?.startPositionColor || '#0284c7'}
                  onChange={(e) => handleAdminUpdateMindmapColors({ startPositionColor: e.target.value })}
                  className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
              </div>

              {/* 2. 최종(도착) 포지션 전개 연결선 색상 */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
                    style={{ backgroundColor: settings.mindmapColors?.endPositionLineColor || '#8b5cf6' }}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">끝(최종) 포지션</div>
                    <div className="text-[10px] text-slate-400">도착 전개 연결선</div>
                  </div>
                </div>
                <input
                  type="color"
                  value={settings.mindmapColors?.endPositionLineColor || '#8b5cf6'}
                  onChange={(e) => handleAdminUpdateMindmapColors({ endPositionLineColor: e.target.value })}
                  className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
              </div>

              {/* 3. 서브미션 피니시 연결선 색상 */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
                    style={{ backgroundColor: settings.mindmapColors?.submissionLineColor || '#f43f5e' }}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">서브미션 연결선</div>
                    <div className="text-[10px] text-slate-400">피니시 곡선 연결선</div>
                  </div>
                </div>
                <input
                  type="color"
                  value={settings.mindmapColors?.submissionLineColor || '#f43f5e'}
                  onChange={(e) => handleAdminUpdateMindmapColors({ submissionLineColor: e.target.value })}
                  className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
              </div>

              {/* 4. 서브미션 피니시 노드 기본 색상 */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
                    style={{ backgroundColor: settings.mindmapColors?.submissionNodeColor || '#e11d48' }}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">서브미션 노드</div>
                    <div className="text-[10px] text-slate-400">외곽 피니시 뱃지</div>
                  </div>
                </div>
                <input
                  type="color"
                  value={settings.mindmapColors?.submissionNodeColor || '#e11d48'}
                  onChange={(e) => handleAdminUpdateMindmapColors({ submissionNodeColor: e.target.value })}
                  className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
              </div>
            </div>
          </div>

          {/* 4. 관장님 수업일지 표시 색상 및 모서리 테두리 설정 (학습일지 구분) */}
          <div className="space-y-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-500" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    관장님 수업일지 카드 표시 색상 및 모서리 테두리 설정
                  </h4>
                  <p className="text-xs text-slate-500">
                    회원이 본인 학습일지와 관장님이 배정한 수업일지를 쉽게 구별할 수 있도록 네모박스 배경색, 모서리 테두리 선색, 뱃지 명칭을 자유롭게 설정합니다.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleAdminUpdateClassJournalStyle({
                    cardBgColor: '#fffbeb',
                    borderColor: '#f59e0b',
                    badgeLabel: '관장님 수업',
                  })
                }
                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer self-start sm:self-auto"
              >
                기본 색상 복원
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* 카드 배경색 (네모박스 색상) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-md border border-slate-300 shadow-2xs shrink-0"
                    style={{ backgroundColor: settings.classJournalStyle?.cardBgColor || '#fffbeb' }}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">네모박스 배경색</div>
                    <div className="text-[10px] text-slate-400">수업 카드 배경 색상</div>
                  </div>
                </div>
                <input
                  type="color"
                  value={settings.classJournalStyle?.cardBgColor || '#fffbeb'}
                  onChange={(e) =>
                    handleAdminUpdateClassJournalStyle({ cardBgColor: e.target.value })
                  }
                  className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
              </div>

              {/* 모서리 테두리 선색 */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-md border-2 shadow-2xs shrink-0"
                    style={{
                      borderColor: settings.classJournalStyle?.borderColor || '#f59e0b',
                      backgroundColor: 'transparent',
                    }}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">모서리 선색 (테두리)</div>
                    <div className="text-[10px] text-slate-400">카드 테두리 및 뱃지 선색</div>
                  </div>
                </div>
                <input
                  type="color"
                  value={settings.classJournalStyle?.borderColor || '#f59e0b'}
                  onChange={(e) =>
                    handleAdminUpdateClassJournalStyle({ borderColor: e.target.value })
                  }
                  className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
              </div>

              {/* 뱃지 라벨 명칭 */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                <div className="text-xs font-bold text-slate-800">뱃지 라벨 텍스트</div>
                <input
                  type="text"
                  value={settings.classJournalStyle?.badgeLabel || '관장님 수업'}
                  onChange={(e) =>
                    handleAdminUpdateClassJournalStyle({ badgeLabel: e.target.value })
                  }
                  placeholder="관장님 수업"
                  className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none"
                />
              </div>
            </div>

            {/* 실시간 미리보기 카드 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-700">회원 학습일지 화면에서의 표시 실시간 미리보기:</div>
              <div
                className="max-w-md p-2.5 rounded-xl border shadow-2xs flex items-center gap-3"
                style={{
                  backgroundColor: settings.classJournalStyle?.cardBgColor || '#fffbeb',
                  borderColor: settings.classJournalStyle?.borderColor || '#f59e0b',
                }}
              >
                <div className="w-14 aspect-video rounded-lg bg-slate-900 border border-black/10 shrink-0 flex items-center justify-center text-white text-[10px] font-bold">
                  ▶ 16:9
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="px-2 py-0.5 rounded text-[9px] font-black text-white shadow-2xs"
                      style={{ backgroundColor: settings.classJournalStyle?.borderColor || '#f59e0b' }}
                    >
                      {settings.classJournalStyle?.badgeLabel || '관장님 수업'}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      클로즈드 가드 암바 & 기무라 카운터
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    가드 포지션 (하위) · 관장님 타임라인 메모 3개 연동
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
