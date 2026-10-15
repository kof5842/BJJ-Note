import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Users,
  Video,
  BarChart3,
  Search,
  RefreshCw,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Award,
  Clock,
  Mail,
  Loader2,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import {
  AdminUserSummary,
  fetchAdminAllUsers,
  loadUserCloudData,
  FullArchivePayload,
  setUserBanStatus,
  formatStayTime,
} from '../services/archiveService';
import { TechniqueVideo } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminEmail: string;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  adminEmail,
}) => {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'learned' | 'mom' | 'stay' | 'videos' | 'active' | 'name'>('learned');
  const [kickTargetUser, setKickTargetUser] = useState<AdminUserSummary | null>(null);
  const [isProcessingKick, setIsProcessingKick] = useState(false);

  // Selected user detail inspection
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userDetailData, setUserDetailData] = useState<FullArchivePayload | null>(null);

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
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {language === 'ko' ? '관리자 설정' : 'Admin Center'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {adminEmail} 계정 전용 · 전체 회원 가입 현황 및 학습 영상 데이터 실시간 모니터링
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700 disabled:opacity-50"
              title={language === 'ko' ? "데이터 새로고침" : "Refresh Data"}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{language === 'ko' ? '새로고침' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-slate-50/50">
          {/* 4 Summary KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold">{language === 'ko' ? '총 가입 회원' : 'Total Users'}</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : `${totalUsers}명`}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">
                {language === 'ko' ? 'Google 계정 연동 완료' : 'Google Auth Active'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold">{language === 'ko' ? '총 학습 영상' : 'Total Videos'}</span>
                <Video className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : `${totalVideos}개`}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">
                {language === 'ko' ? '전체 유저 등록 누적 합계' : 'All Users Cumulative'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold">인당 평균 영상</span>
                <TrendingUp className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : `${avgVideosPerUser}개`}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">
                회원 1인당 평균 보유 기술
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold">등록 대기열</span>
                <Layers className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : `${totalQueue}개`}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">
                분석 대기 중인 URL 영상
              </div>
            </div>
          </div>

          {/* Search, Sort & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="회원 이름 또는 구글 이메일 검색..."
                className="w-full pl-9 pr-4 py-2 bg-transparent text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">정렬:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSortBy('learned')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    sortBy === 'learned'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  🎓 많이 학습한 순
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('mom')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    sortBy === 'mom'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  📈 전월대비 증가순
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('stay')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    sortBy === 'stay'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ⏱️ 체류시간 순
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('videos')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    sortBy === 'videos'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  영상 보유 순
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('active')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    sortBy === 'active'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  최근 활동 순
                </button>
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700" />
                <span className="text-sm font-bold text-slate-900">
                  가입 회원 목록 ({filteredUsers.length}명)
                </span>
              </div>
              <span className="text-xs text-slate-400">
                회원을 클릭하면 상세 기술 영상 목록을 조회할 수 있습니다
              </span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span>회원 통계 데이터를 불러오는 중...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
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
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
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
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900">
                              {user.displayName || user.email.split('@')[0]}
                            </span>
                            {isAdminUser && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
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
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-5 self-end sm:self-center flex-wrap">
                        {/* 체류시간 */}
                        <div className="text-left sm:text-right">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                            <span>{formatStayTime(user.totalStaySeconds)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">체류시간</div>
                        </div>

                        {/* 전월 대비 추가 */}
                        <div className="text-left sm:text-right">
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

                        {/* 학습 완료 개수 */}
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Video className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="text-base font-black text-slate-900">
                              {user.learnedVideoCount || 0}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold">/ {user.videoCount}개</span>
                          </div>
                          <div className="text-[10px] text-slate-400">학습 완료 / 총 보유</div>
                        </div>

                        {/* Kick Action Button */}
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
                                  });
                                }
                              } else {
                                setKickTargetUser(user);
                              }
                            }}
                            className={`px-2.5 py-1 text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-3xs shrink-0 ${
                              user.isBanned
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                            }`}
                          >
                            {user.isBanned ? '강퇴 해제' : '강퇴'}
                          </button>
                        )}

                        <ChevronRight className="w-4 h-4 text-slate-400" />
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
                      } catch (e) {
                        console.error(e);
                        alert('강퇴 처리 중 오류가 발생했습니다.');
                      } finally {
                        setIsProcessingKick(false);
                        setKickTargetUser(null);
                      }
                    }}
                    disabled={isProcessingKick}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingKick ? '강퇴 처리 중...' : '강퇴 실행'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Detail Drilldown Drawer/Panel if a user is selected */}
          {selectedUser && (
            <div className="p-5 rounded-2xl bg-white border border-indigo-200 shadow-sm animate-in fade-in space-y-4">
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
                <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>사용자의 Firestore 데이터 보관함을 불러오는 중...</span>
                </div>
              ) : !userDetailData ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  해당 사용자의 등록된 기술 데이터가 없습니다. (새로 가입한 회원)
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-slate-600">
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-400 block text-[10px]">보유 기술 수</span>
                      <strong className="text-sm text-slate-900 font-black">
                        {userDetailData.videos.length}개
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-400 block text-[10px]">대기열 영상 수</span>
                      <strong className="text-sm text-slate-900 font-black">
                        {userDetailData.queueItems.length}개
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-400 block text-[10px]">설정된 앱 명칭</span>
                      <strong className="text-sm text-slate-900 font-bold truncate block">
                        {userDetailData.settings?.appTitle || '기본 타이틀'}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-400 block text-[10px]">최종 클라우드 동기화</span>
                      <strong className="text-[11px] text-slate-900 font-mono block">
                        {userDetailData.exportedAt?.slice(0, 16).replace('T', ' ')}
                      </strong>
                    </div>
                  </div>

                  {/* Video List of Selected User */}
                  <div>
                    <div className="text-xs font-bold text-slate-800 mb-2">
                      학습 중인 기술 영상 목록 ({userDetailData.videos.length}개):
                    </div>
                    {userDetailData.videos.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-400 text-center">
                        등록된 기술 영상이 아직 없습니다.
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {userDetailData.videos.map((vid, idx) => (
                          <div
                            key={vid.id || idx}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-slate-400 font-mono text-[11px] w-5">
                                #{idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">
                                  {vid.titleKo}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold">
                                    {vid.position}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold">
                                    {vid.submissionGroup} · {vid.submissionDetail}
                                  </span>
                                  {vid.practiceDates?.length > 0 && (
                                    <span className="text-slate-400">
                                      수련 {vid.practiceDates.length}회 기록
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {vid.youtubeUrl && (
                              <a
                                href={vid.youtubeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition-colors shrink-0"
                                title="유튜브 원본 영상 열기"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Super Admin Feature Recommendations Guide (Answers User Question) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-black">
              <Sparkles className="w-4 h-4" />
              <span>관리자 계정에 추가하면 좋은 추천 기능 아이디어</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              관장님 및 플랫폼 관리자로서 서비스를 더욱 효과적으로 운영하기 위해 향후 확장할 수 있는 핵심 추천 기능입니다:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                <div className="font-bold text-amber-300 mb-1">📢 전체 공지사항 배너</div>
                <div className="text-[11px] text-slate-400 leading-normal">
                  모든 회원의 앱 상단에 이번 주 추천 기술이나 도장 일정, 대회 공지를 띄우는 기능
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                <div className="font-bold text-emerald-300 mb-1">🔥 인기 포지션·기술 TOP 랭킹</div>
                <div className="text-[11px] text-slate-400 leading-normal">
                  회원들이 가장 많이 연습하고 있는 1위 가드 포지션과 1위 서브미션 분석 차트
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                <div className="font-bold text-sky-300 mb-1">🎁 추천 기술 프리셋 원클릭 배포</div>
                <div className="text-[11px] text-slate-400 leading-normal">
                  관리자가 엄선한 화이트벨트 필독 기술 10개를 신규 가입자에게 기본 제공하는 기능
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>최고 관리자 권한 활성화됨 ({adminEmail})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
