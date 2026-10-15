import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  Settings,
  Image as ImageIcon,
  Sliders,
  Compass,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet,
  LogOut,
  User as UserIcon,
  Shield,
  Palette,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  AppSettings,
  MetadataConfig,
  MindmapStorageState,
  SubmissionGroupId,
  TechniqueVideo,
} from '../types';
import {
  exportArchiveToExcel,
  importArchiveFromExcel,
} from '../services/archiveService';
import { useLanguage } from '../i18n/LanguageContext';

interface Module6SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  metadata: MetadataConfig;
  onUpdateMetadata: (next: MetadataConfig) => void;
  videos: TechniqueVideo[];
  queueItems: TechniqueVideo[];
  mindmapState: MindmapStorageState;
  currentUser?: {
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  } | null;
  onRequestSignOut?: () => void;
  onOpenAdminDashboard?: () => void;
  onRestoreFullBackup: (payload: {
    settings?: AppSettings;
    metadata?: MetadataConfig;
    videos?: TechniqueVideo[];
    queueItems?: TechniqueVideo[];
    mindmapState?: MindmapStorageState;
  }) => void;
  onResetToDefaults: () => void;
}

export const Module6SettingsModal: React.FC<Module6SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  metadata,
  onUpdateMetadata,
  videos,
  queueItems,
  mindmapState,
  currentUser,
  onRequestSignOut,
  onOpenAdminDashboard,
  onRestoreFullBackup,
  onResetToDefaults,
}) => {
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoUploadRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleImageFileUpload = (
    file: File,
    callback: (dataUrl: string) => void
  ) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateSubmissionHubImage = (
    groupId: SubmissionGroupId,
    imageUrl: string
  ) => {
    const nextSubmissions = metadata.submissions.map((grp) =>
      grp.id === groupId ? { ...grp, customImageUrl: imageUrl } : grp
    );
    onUpdateMetadata({ ...metadata, submissions: nextSubmissions });
  };

  const handleExportExcel = () => {
    try {
      const backupPayload = {
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        settings,
        metadata,
        videos,
        queueItems,
        mindmapState,
      };
      exportArchiveToExcel(backupPayload);
      setStatusMessage(
        '전체 데이터(기술 영상, 대기열, 분류체계, 마인드맵 좌표 및 환경설정)가 엑셀(.xlsx) 파일로 내보내졌습니다.'
      );
    } catch (err) {
      console.error(err);
      setStatusMessage('엑셀 파일 내보내기 중 오류가 발생했습니다.');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await importArchiveFromExcel(file);
      onRestoreFullBackup(parsed);
      setStatusMessage(
        '엑셀(.xlsx) 파일로부터 데이터를 성공적으로 불러왔습니다.'
      );
    } catch (err) {
      console.error(err);
      setStatusMessage(
        '유효하지 않은 엑셀 파일이거나 파일 파싱 중 오류가 발생했습니다.'
      );
    }
    // reset input value so same file can be re-selected if needed
    if (e.target) e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-slate-900" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'ko' ? '글로벌 환경 설정 센터' : 'Settings Center'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ko' ? '앱 명칭, 수련 모토, 프로필 로고, 숙련도 기준 점수 및 엑셀(Excel) 데이터 내보내기/가져오기를 관리합니다.' : 'Manage app name, slogan, profile logo, score criteria, and Excel data export/import.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {currentUser && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="User"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      {language === 'ko' ? '로그인됨' : 'Logged In'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentUser.email === 'kof5842@gmail.com' && onOpenAdminDashboard && (
                  <button
                    type="button"
                    onClick={onOpenAdminDashboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span>{language === 'ko' ? '관리자 설정' : 'Admin Settings'}</span>
                  </button>
                )}

                {onRequestSignOut && (
                  <button
                    type="button"
                    onClick={onRequestSignOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{language === 'ko' ? '로그아웃' : 'Log Out'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>{language === 'ko' ? '개인화 브랜딩' : 'Personal Branding'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'ko' ? '앱 명칭 및 브라우저 탭 타이틀' : 'App Title & Browser Tab'}
                </label>
                <input
                  type="text"
                  value={settings.appTitle}
                  onChange={(e) =>
                    onUpdateSettings({ appTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'ko' ? '슬로건 / 나만의 수련 모토' : 'Slogan / Training Motto'}
                </label>
                <input
                  type="text"
                  value={settings.appSubtitle}
                  onChange={(e) =>
                    onUpdateSettings({ appSubtitle: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200/70">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center overflow-hidden border border-slate-300">
                  {settings.logoImageUrl ? (
                    <img
                      src={settings.logoImageUrl}
                      alt="Profile Logo"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{settings.logoText || 'BJJ'}</span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    프로필 로고
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {language === 'ko' ? '소속 체육관 마크나 개인 이미지를 업로드할 수 있습니다.' : 'Upload your gym crest or personal profile image.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settings.logoText}
                  onChange={(e) =>
                    onUpdateSettings({
                      logoText: e.target.value.slice(0, 5),
                    })
                  }
                  className="w-20 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-center font-bold"
                />
                <input
                  ref={logoUploadRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageFileUpload(file, (dataUrl) =>
                        onUpdateSettings({ logoImageUrl: dataUrl })
                      );
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => logoUploadRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap"
                >
                  {language === 'ko' ? '로고 업로드' : 'Upload Logo'}
                </button>
              </div>
            </div>
          </div>

          {/* Video Folder Group Colors Customization */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Palette className="w-4 h-4 text-indigo-600" />
                <span>{language === 'ko' ? '영상 폴더 그룹 색상 커스텀' : 'Custom Folder Group Colors'}</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    folderColors: {
                      guard: '#059669',
                      dominant: '#d97706',
                      other: '#6366f1',
                    },
                  })
                }
                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                기본 색상 복원
              </button>
            </div>
            <p className="text-xs text-slate-500">
              영상 폴더 목록에서 가드, 탑/도미넌트, 스탠딩/특수 포지션 그룹별로 표시되는 폴더 아이콘 및 배지의 색상을 자유롭게 지정합니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Guard Color */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: settings.folderColors?.guard || '#059669' }}
                    />
                    가드 폴더
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {settings.folderColors?.guard || '#059669'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.folderColors?.guard || '#059669'}
                    onChange={(e) =>
                      onUpdateSettings({
                        folderColors: {
                          ...settings.folderColors,
                          guard: e.target.value,
                        },
                      })
                    }
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <div className="flex items-center gap-1">
                    {['#059669', '#0284c7', '#0d9488', '#16a34a'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            folderColors: {
                              ...settings.folderColors,
                              guard: c,
                            },
                          })
                        }
                        className="w-5 h-5 rounded-full border border-slate-300 transition-transform hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Dominant Position Color */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: settings.folderColors?.dominant || '#d97706' }}
                    />
                    탑 & 도미넌트 폴더
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {settings.folderColors?.dominant || '#d97706'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.folderColors?.dominant || '#d97706'}
                    onChange={(e) =>
                      onUpdateSettings({
                        folderColors: {
                          ...settings.folderColors,
                          dominant: e.target.value,
                        },
                      })
                    }
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <div className="flex items-center gap-1">
                    {['#d97706', '#ea580c', '#e11d48', '#ca8a04'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            folderColors: {
                              ...settings.folderColors,
                              dominant: c,
                            },
                          })
                        }
                        className="w-5 h-5 rounded-full border border-slate-300 transition-transform hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Other Position Color */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: settings.folderColors?.other || '#6366f1' }}
                    />
                    기타 포지션 폴더
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {settings.folderColors?.other || '#6366f1'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.folderColors?.other || '#6366f1'}
                    onChange={(e) =>
                      onUpdateSettings({
                        folderColors: {
                          ...settings.folderColors,
                          other: e.target.value,
                        },
                      })
                    }
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <div className="flex items-center gap-1">
                    {['#6366f1', '#8b5cf6', '#475569', '#ec4899'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            folderColors: {
                              ...settings.folderColors,
                              other: c,
                            },
                          })
                        }
                        className="w-5 h-5 rounded-full border border-slate-300 transition-transform hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>숙련도 기준 점수(X점) 설정</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  강점 기술(주력 무기) 기준: X점 이상
                </label>
                <select
                  value={settings.highScoreThreshold}
                  onChange={(e) =>
                    onUpdateSettings({
                      highScoreThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg"
                >
                  {[6, 7, 8, 9, 10].map((score) => (
                    <option key={score} value={score}>
                      {score}점 이상
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  취약 기술 기준: Y점 이하
                </label>
                <select
                  value={settings.lowScoreThreshold}
                  onChange={(e) =>
                    onUpdateSettings({
                      lowScoreThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg"
                >
                  {[2, 3, 4, 5, 6].map((score) => (
                    <option key={score} value={score}>
                      {score}점 이하
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  망각 방지 알림 기준 경과일
                </label>
                <select
                  value={settings.neglectedDaysThreshold}
                  onChange={(e) =>
                    onUpdateSettings({
                      neglectedDaysThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg"
                >
                  <option value={30}>30일 이상 미수련</option>
                  <option value={60}>60일 이상 미수련</option>
                  <option value={90}>90일 이상 미수련</option>
                </select>
              </div>
            </div>
          </div>

          {/* Training Journal Layout Settings */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              <span>학습일지 가로/세로 레이아웃 설정</span>
            </div>
            <p className="text-xs text-slate-500">
              학습일지를 주별/월별로 볼 때, PC 및 모바일 화면 규격별로 가로모드(바둑판/가로배열) 또는 세로모드(하루씩 세로 나열)로 설정합니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PC (데스크톱) 화면 레이아웃
                </label>
                <select
                  value={settings.journalLayoutPc || 'horizontal'}
                  onChange={(e) =>
                    onUpdateSettings({
                      journalLayoutPc: e.target.value as 'horizontal' | 'vertical',
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg"
                >
                  <option value="horizontal">가로모드 (달력 바둑판 / 일주일 가로배열)</option>
                  <option value="vertical">세로모드 (하루에 한 줄씩 세로 나열)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  모바일 (휴대폰) 화면 레이아웃
                </label>
                <select
                  value={settings.journalLayoutMobile || 'vertical'}
                  onChange={(e) =>
                    onUpdateSettings({
                      journalLayoutMobile: e.target.value as 'horizontal' | 'vertical',
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg"
                >
                  <option value="horizontal">가로모드 (달력 바둑판 / 일주일 가로배열)</option>
                  <option value="vertical">세로모드 (하루에 한 줄씩 세로 나열)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <div className="text-sm font-bold text-white">
                전체 데이터 엑셀(Excel .xlsx) 백업 및 복원
              </div>
            </div>
            <p className="text-xs text-slate-400">
              기술 영상 목록, 수련 대기열, 포지션/서브미션 분류체계, 환경설정 및 마인드맵 좌표를 엑셀 시트(.xlsx)로 내보내거나 가져올 수 있습니다.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>엑셀(.xlsx) 파일로 내보내기</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={handleImportExcel}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>엑셀(.xlsx) 파일 불러오기</span>
                </button>
              </div>

              {showResetConfirm ? (
                <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-xs text-rose-300 font-semibold px-2">정말 초기화할까요?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetToDefaults();
                      setShowResetConfirm(false);
                      setStatusMessage(
                        '기본 프리셋 샘플 데이터로 복원되었습니다.'
                      );
                    }}
                    className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    초기화
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>초기 샘플 복원</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            설정 저장 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
