import React, { useRef, useState } from 'react';
import {
  Settings,
  Download,
  Upload,
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
  Globe,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
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

interface SettingsPageViewProps {
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

export const SettingsPageView: React.FC<SettingsPageViewProps> = ({
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoUploadRef = useRef<HTMLInputElement | null>(null);
  const { t, language } = useLanguage();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [nicknameInput, setNicknameInput] = useState<string>(() => {
    return localStorage.getItem('bjj_user_nickname') || settings.userNickname || currentUser?.displayName || '';
  });

  const handleSaveNickname = () => {
    const trimmed = nicknameInput.trim();
    if (!trimmed) {
      alert(language === 'ko' ? '닉네임을 입력해주세요.' : 'Please enter a nickname.');
      return;
    }
    localStorage.setItem('bjj_user_nickname', trimmed);
    onUpdateSettings({ userNickname: trimmed });
    setStatusMessage(language === 'ko' ? `닉네임이 '${trimmed}'(으)로 설정되었습니다. 자유게시판 글쓴이 이름으로 적용됩니다.` : `Nickname set to '${trimmed}'. Applied to community posts.`);
  };

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
    if (e.target) e.target.value = '';
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {statusMessage && (
        <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="truncate">{statusMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-3.5 sm:p-8 shadow-xs space-y-3.5 sm:space-y-6">
        {/* User Account Session Card */}
        {currentUser && (
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="User"
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-300 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                  {currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentUser.displayName || currentUser.email}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold truncate hidden sm:block">
                  {language === 'ko' ? 'Google 계정 클라우드 DB 동기화 활성화됨' : 'Google Cloud DB Sync Active'}
                </div>
                <div className="text-[10px] text-emerald-600 font-bold truncate sm:hidden">
                  {language === 'ko' ? '클라우드 동기화됨' : 'Cloud Synced'}
                </div>
              </div>
            </div>

            {onRequestSignOut && (
              <button
                type="button"
                onClick={onRequestSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{language === 'ko' ? '로그아웃' : 'Log Out'}</span>
              </button>
            )}
          </div>
        )}

        {/* Language Selection Section */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
              <Globe className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="whitespace-nowrap">{t('languageSettingTitle')}</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400">
              {t('languageSettingDesc')}
            </span>
          </div>
          <LanguageSwitcher variant="card" primaryColor={settings.primaryColor} />
        </div>

        {/* Nickname Setting Section */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
              <UserIcon className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="whitespace-nowrap">{t('nicknameSettingTitle')}</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400">{t('nicknameSettingDesc')}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              placeholder={currentUser?.displayName || currentUser?.email?.split('@')[0] || (language === 'ko' ? '닉네임을 입력하세요' : 'Enter your nickname')}
              className="flex-1 px-3 py-1.5 sm:py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNickname();
              }}
            />
            <button
              type="button"
              onClick={handleSaveNickname}
              className="px-3.5 py-1.5 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 whitespace-nowrap shadow-2xs active:scale-95"
            >
              {t('saveBtn')}
            </button>
          </div>
        </div>

        {/* Excel Backup / Restore Section */}
        <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">{language === 'ko' ? '엑셀(.xlsx) 데이터 백업 및 복원' : 'Excel (.xlsx) Backup & Restore'}</span>
          </div>
          <p className="hidden sm:block text-xs text-slate-500 leading-relaxed">
            {language === 'ko' ? '모든 수련 기술 영상, 대기열, 분류체계, 마인드맵 배치 및 환경설정 데이터를 단일 엑셀 파일로 안전하게 백업하거나 불러올 수 있습니다.' : 'Safely backup or restore all techniques, queues, taxonomy, diagrams, and settings into a single Excel file.'}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-0.5 sm:flex sm:flex-wrap sm:items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleImportExcel}
            />
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate sm:hidden">{language === 'ko' ? '엑셀 백업' : 'Export Excel'}</span>
              <span className="hidden sm:inline">{language === 'ko' ? '전체 데이터 엑셀 백업 (.xlsx)' : 'Export All Data to Excel (.xlsx)'}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate sm:hidden">{language === 'ko' ? '엑셀 복원' : 'Restore Excel'}</span>
              <span className="hidden sm:inline">{language === 'ko' ? '엑셀 파일에서 복원하기' : 'Restore from Excel File'}</span>
            </button>
          </div>
        </div>

        {/* Proficiency Scores Thresholds */}
        <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
            <Sliders className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">{language === 'ko' ? '숙련도 기준 점수 설정' : 'Proficiency Score Thresholds'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">
                {language === 'ko' ? '강점 기술 기준: X점 이상' : 'Strength Threshold: X+ pts'}
              </label>
              <select
                value={settings.highScoreThreshold}
                onChange={(e) =>
                  onUpdateSettings({ highScoreThreshold: Number(e.target.value) })
                }
                className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg truncate"
              >
                {[6, 7, 8, 9, 10].map((score) => (
                  <option key={score} value={score}>
                    {score}{language === 'ko' ? '점 이상' : '+ pts'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">
                {language === 'ko' ? '취약 기술 기준: Y점 이하' : 'Weakness Threshold: Y- pts'}
              </label>
              <select
                value={settings.lowScoreThreshold}
                onChange={(e) =>
                  onUpdateSettings({ lowScoreThreshold: Number(e.target.value) })
                }
                className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg truncate"
              >
                {[2, 3, 4, 5, 6].map((score) => (
                  <option key={score} value={score}>
                    {score}{language === 'ko' ? '점 이하' : '- pts'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">
                {language === 'ko' ? '망각 방지 알림 기준 경과일' : 'Neglect Alert Threshold (Days)'}
              </label>
              <select
                value={settings.neglectedDaysThreshold}
                onChange={(e) =>
                  onUpdateSettings({ neglectedDaysThreshold: Number(e.target.value) })
                }
                className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg truncate"
              >
                <option value={30}>{language === 'ko' ? '30일 이상 미수련' : '30+ days inactive'}</option>
                <option value={60}>{language === 'ko' ? '60일 이상 미수련' : '60+ days inactive'}</option>
                <option value={90}>{language === 'ko' ? '90일 이상 미수련' : '90+ days inactive'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Complete Database Reset Section */}
        <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-50/60 border border-rose-200">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-rose-900">
            <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="whitespace-nowrap">{language === 'ko' ? '데이터베이스 전체 초기화' : 'Reset Database Entirely'}</span>
          </div>
          <p className="hidden sm:block text-xs text-rose-700 leading-relaxed font-medium">
            {language === 'ko' ? '데이터가 꼬였거나 완전히 깨끗한 상태로 처음부터 다시 시작하고 싶을 때 사용하세요. 등록된 모든 수련 영상, 대기열, 시청 기록, 설정 및 클라우드 DB 데이터가 완전히 삭제되고 초기 상태로 리셋됩니다.' : 'Use this if you want to start fresh. All techniques, queues, history, settings, and cloud database data will be completely deleted and restored to defaults.'}
          </p>
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'ko' ? '데이터베이스 전체 초기화' : 'Reset All Database Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  데이터베이스 전체 초기화
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  {language === 'ko' ? '정말 리셋하시겠습니까?' : 'Are you sure you want to reset?'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/70 p-3.5 rounded-xl border border-rose-100">
              등록된 모든 <span className="font-bold text-rose-700">수련 영상({videos.length}개)</span>, <span className="font-bold text-rose-700">대기열({queueItems.length}개)</span>, 시청 기록, 학습 일지, 마인드맵 및 클라우드 동기화 데이터가 영구히 삭제되고 초기 상태로 리셋됩니다.<br/><br/>
              <strong className="text-rose-700">⚠️ 이 작업은 되돌릴 수 없습니다.</strong> 사전에 [전체 데이터 엑셀 백업]을 진행하시는 것을 권장합니다.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                {language === 'ko' ? '취소' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetToDefaults();
                  setStatusMessage(language === 'ko' ? '🧹 데이터베이스 전체 초기화가 완료되었습니다. 모든 데이터가 초기화되었습니다.' : '🧹 Database has been reset completely.');
                  setTimeout(() => setStatusMessage(null), 4500);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'ko' ? '예, 전체 초기화 진행합니다' : 'Yes, reset all data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
