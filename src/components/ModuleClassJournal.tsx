import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Check,
  X,
  Calendar as CalendarIcon,
  Trash2,
  Users,
  Eye,
  EyeOff,
  GraduationCap,
  FileText,
  Clock,
  Play,
  Settings,
  Sparkles,
  Shield,
  Layers,
  Award,
} from 'lucide-react';
import {
  AppSettings,
  ClassJournalEntry,
  MetadataConfig,
  TechniqueVideo,
  TimelineFrame,
  JournalMemo,
} from '../types';
import {
  formatDateDot,
  getKoreanHolidayName,
} from '../utils/bjjAnalyzer';
import { useLanguage } from '../i18n/LanguageContext';
import { translatePosition, translateCategory } from '../utils/taxonomyTranslation';
import { VideoArchivePickerModal } from './VideoArchivePickerModal';
import {
  fetchClassJournal,
  saveClassJournalEntries,
  fetchTeamMemberUids,
  saveTeamMemberUids,
  fetchAdminUserSummaries,
  AdminUserSummary,
} from '../services/archiveService';

interface ModuleClassJournalProps {
  videos: TechniqueVideo[];
  metadata: MetadataConfig;
  settings: AppSettings;
  onOpenVideoReview: (video: TechniqueVideo, dateStr: string) => void;
  onOpenSettingsTab?: () => void;
  onOpenAiRecommend?: () => void;
}

interface CalendarCellData {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  dayOfWeekMonZero: number;
  holidayName: string | null;
}

export const ModuleClassJournal: React.FC<ModuleClassJournalProps> = ({
  videos,
  metadata,
  settings,
  onOpenVideoReview,
  onOpenSettingsTab,
  onOpenAiRecommend,
}) => {
  const { t, language } = useLanguage();
  const themeColor = settings.primaryColor || '#0ea5e9';
  const journalStyle = settings.classJournalStyle || {
    cardBgColor: '#fffbeb',
    borderColor: '#f59e0b',
    badgeLabel: '관장님 수업',
  };

  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Screen detection for matching mobile UI of Module3TrainingJournal
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeLayoutMode = isMobileScreen
    ? (settings.journalLayoutMobile || 'vertical')
    : (settings.journalLayoutPc || 'horizontal');

  // Class journal entries state
  const [classEntries, setClassEntries] = useState<ClassJournalEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);

  // Team members state
  const [teamMemberUids, setTeamMemberUids] = useState<string[]>([]);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [userSummaries, setUserSummaries] = useState<AdminUserSummary[]>([]);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Assign video state
  const [assigningDate, setAssigningDate] = useState<string | null>(null);

  // Edit notes state
  const [editingEntry, setEditingEntry] = useState<ClassJournalEntry | null>(null);
  const [editGeneralNotes, setEditGeneralNotes] = useState('');
  const [editMemos, setEditMemos] = useState<JournalMemo[]>([]);
  const [newMemoText, setNewMemoText] = useState('');
  const [newMemoSec, setNewMemoSec] = useState(0);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const todayDateStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Load class journal entries & team members
  useEffect(() => {
    let isMounted = true;
    fetchClassJournal().then((data) => {
      if (isMounted) {
        setClassEntries(data);
        setIsLoadingEntries(false);
      }
    });

    fetchTeamMemberUids().then((uids) => {
      if (isMounted) setTeamMemberUids(uids);
    });

    const handleSync = () => {
      fetchClassJournal().then((data) => setClassEntries(data));
      fetchTeamMemberUids().then((uids) => setTeamMemberUids(uids));
    };

    window.addEventListener('bjj_class_journal_changed', handleSync);
    window.addEventListener('bjj_team_members_changed', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener('bjj_class_journal_changed', handleSync);
      window.removeEventListener('bjj_team_members_changed', handleSync);
    };
  }, []);

  // Load registered users when opening team modal
  useEffect(() => {
    if (isTeamModalOpen) {
      setIsLoadingUsers(true);
      fetchAdminUserSummaries().then((users) => {
        setUserSummaries(users);
        setIsLoadingUsers(false);
      });
    }
  }, [isTeamModalOpen]);

  // Calendar cells generation
  const calendarCells = useMemo(() => {
    const cells: CalendarCellData[] = [];
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = (startDayOfWeek - 1 - i) % 7;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        dayOfWeekMonZero: dow,
        holidayName: getKoreanHolidayName(dateStr),
      });
    }

    const totalDays = lastDayOfMonth.getDate();
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const curDate = new Date(currentYear, currentMonth - 1, d);
      let dow = curDate.getDay() - 1;
      if (dow === -1) dow = 6;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        dayOfWeekMonZero: dow,
        holidayName: getKoreanHolidayName(dateStr),
      });
    }

    let endDayOfWeek = lastDayOfMonth.getDay() - 1;
    if (endDayOfWeek === -1) endDayOfWeek = 6;
    const remainingDays = 6 - endDayOfWeek;
    for (let d = 1; d <= remainingDays; d++) {
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = (endDayOfWeek + d) % 7;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        dayOfWeekMonZero: dow,
        holidayName: getKoreanHolidayName(dateStr),
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Group class entries by date
  const entriesByDate = useMemo(() => {
    const map: Record<string, ClassJournalEntry[]> = {};
    for (const e of classEntries) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [classEntries]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(10);
    setWeekOffset(0);
  };

  // Assign video handler
  const handleSelectVideoForClass = (selectedVideo: TechniqueVideo) => {
    if (!assigningDate) return;

    // Check if already assigned on this date
    const exists = classEntries.some(
      (e) => e.date === assigningDate && e.videoId === selectedVideo.id
    );
    if (exists) {
      showToast(`⚠️ 이미 '${selectedVideo.titleKo}' 기술이 해당 일자에 등록되어 있습니다.`);
      setAssigningDate(null);
      return;
    }

    const newEntry: ClassJournalEntry = {
      id: `cj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: assigningDate,
      videoId: selectedVideo.id,
      videoTitleKo: selectedVideo.titleKo,
      videoTitleEn: selectedVideo.titleEn,
      youtubeUrl: selectedVideo.youtubeUrl,
      youtubeId: selectedVideo.youtubeId,
      thumbnailUrl: selectedVideo.thumbnailUrl,
      position: selectedVideo.position,
      category: selectedVideo.category,
      categories: selectedVideo.categories,
      endPosition: selectedVideo.endPosition,
      giType: selectedVideo.giType,
      difficulty: selectedVideo.difficulty,
      proficiencyScore: selectedVideo.proficiencyScore,
      generalNotes: selectedVideo.generalNotes || '',
      journalMemos: [...(selectedVideo.journalMemos || [])],
      timelineFrames: [...(selectedVideo.timelineFrames || [])],
      isPublished: true, // Default to published for team
      instructorName: settings.appTitle || '관장님',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextEntries = [newEntry, ...classEntries];
    setClassEntries(nextEntries);
    saveClassJournalEntries(nextEntries);
    setAssigningDate(null);
    showToast(`✅ [${assigningDate}] '${selectedVideo.titleKo}' 수업 일지 배정 완료!`);
  };

  // Toggle publish / private
  const handleTogglePublish = (entry: ClassJournalEntry) => {
    const nextPublished = !entry.isPublished;
    const nextEntries = classEntries.map((e) =>
      e.id === entry.id
        ? { ...e, isPublished: nextPublished, updatedAt: new Date().toISOString() }
        : e
    );
    setClassEntries(nextEntries);
    saveClassJournalEntries(nextEntries);
    showToast(
      nextPublished
        ? `👁️ '${entry.videoTitleKo}' 팀원에게 공개 전환되었습니다.`
        : `🔒 '${entry.videoTitleKo}' 비공개(준비중)로 전환되었습니다.`
    );
  };

  // Delete class entry
  const handleDeleteEntry = (entryId: string, titleKo: string) => {
    const nextEntries = classEntries.filter((e) => e.id !== entryId);
    setClassEntries(nextEntries);
    saveClassJournalEntries(nextEntries);
    showToast(`🗑️ '${titleKo}' 수업 일지 배정이 취소되었습니다.`);
  };

  // Toggle team member
  const handleToggleTeamMember = (uid: string) => {
    let nextUids: string[];
    const isMember = teamMemberUids.includes(uid);
    if (isMember) {
      nextUids = teamMemberUids.filter((id) => id !== uid);
    } else {
      nextUids = [...teamMemberUids, uid];
    }
    setTeamMemberUids(nextUids);
    saveTeamMemberUids(nextUids);
  };

  // Open note edit modal
  const handleOpenEditNotes = (entry: ClassJournalEntry) => {
    setEditingEntry(entry);
    setEditGeneralNotes(entry.generalNotes || '');
    setEditMemos([...(entry.journalMemos || [])]);
  };

  // Save notes
  const handleSaveNotes = () => {
    if (!editingEntry) return;
    const nextEntries = classEntries.map((e) =>
      e.id === editingEntry.id
        ? {
            ...e,
            generalNotes: editGeneralNotes,
            journalMemos: editMemos,
            updatedAt: new Date().toISOString(),
          }
        : e
    );
    setClassEntries(nextEntries);
    saveClassJournalEntries(nextEntries);
    setEditingEntry(null);
    showToast(`✅ 수업 메모 저장이 완료되었습니다.`);
  };

  // Filter users for team modal
  const filteredUsers = useMemo(() => {
    if (!teamSearchQuery.trim()) return userSummaries;
    const q = teamSearchQuery.toLowerCase();
    return userSummaries.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q) ||
        u.uid?.toLowerCase().includes(q)
    );
  }, [userSummaries, teamSearchQuery]);

  return (
    <div className="space-y-4 pb-28">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold animate-in fade-in flex items-center gap-2 border border-slate-700">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Date Navigation & Layout Header */}
      <div className="flex items-center justify-center gap-2.5 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-3xs flex-wrap">
        <div className="flex items-center gap-2">
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="text-lg font-bold text-slate-900 bg-transparent font-mono tabular-nums focus:outline-none cursor-pointer"
          >
            {Array.from({ length: 31 }, (_, i) => 2020 + i).map((yr) => (
              <option key={yr} value={yr}>
                {yr}{language === 'ko' ? '년' : ''}
              </option>
            ))}
          </select>
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(Number(e.target.value))}
            className="text-lg font-bold text-slate-900 bg-transparent font-mono tabular-nums focus:outline-none cursor-pointer"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {language === 'ko' ? `${m}월` : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setIsTeamModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-3xs bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
          title={language === 'ko' ? '내 팀 소속 회원 관리' : 'Manage Team Members'}
        >
          <Users className="w-4 h-4 text-amber-600" />
          <span>{language === 'ko' ? `내 팀 관리 (${teamMemberUids.length}명)` : `Team (${teamMemberUids.length})`}</span>
        </button>

        {onOpenAiRecommend && (
          <button
            type="button"
            onClick={onOpenAiRecommend}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-3xs bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100"
            title={language === 'ko' ? '✨ AI 수업 추천으로 이동' : 'AI Class Recommendation'}
          >
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>{language === 'ko' ? '✨ AI 수업 추천' : '✨ AI Recommend'}</span>
          </button>
        )}

        {onOpenSettingsTab && (
          <button
            type="button"
            onClick={onOpenSettingsTab}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
            title={language === 'ko' ? '수업일지 카드 디자인 설정' : 'Card Design Settings'}
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {activeLayoutMode === 'horizontal' ? (
        /* ==================== 가로모드 (Grid Layout) ==================== */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/60">
            {[
              { label: language === 'ko' ? '월 (Mon)' : 'Mon', color: 'text-slate-600' },
              { label: language === 'ko' ? '화 (Tue)' : 'Tue', color: 'text-slate-600' },
              { label: language === 'ko' ? '수 (Wed)' : 'Wed', color: 'text-slate-600' },
              { label: language === 'ko' ? '목 (Thu)' : 'Thu', color: 'text-slate-600' },
              { label: language === 'ko' ? '금 (Fri)' : 'Fri', color: 'text-slate-600' },
              { label: language === 'ko' ? '토 (Sat)' : 'Sat', color: 'text-blue-600' },
              { label: language === 'ko' ? '일 (Sun)' : 'Sun', color: 'text-rose-600' },
            ].map((day) => (
              <div
                key={day.label}
                className={`py-3 text-center text-xs font-bold ${day.color} border-r last:border-r-0 border-slate-200/70`}
              >
                {day.label}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
            {calendarCells.map((cell) => {
              const assignedList = entriesByDate[cell.dateStr] || [];
              const isToday = cell.dateStr === todayDateStr;
              const isSunday = cell.dayOfWeekMonZero === 6;
              const isSaturday = cell.dayOfWeekMonZero === 5;
              const isRedDay = isSunday || !!cell.holidayName;

              let dayNumColor = 'text-slate-800';
              if (!cell.isCurrentMonth) {
                dayNumColor = isRedDay
                  ? 'text-rose-300'
                  : isSaturday
                    ? 'text-blue-300'
                    : 'text-slate-300';
              } else if (isRedDay) {
                dayNumColor = 'text-rose-600';
              } else if (isSaturday) {
                dayNumColor = 'text-blue-600';
              }

              return (
                <div
                  key={cell.dateStr}
                  className={`min-h-[170px] p-2 flex flex-col justify-between transition-colors ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/40 opacity-70'
                      : isToday
                        ? 'bg-amber-50/20'
                        : 'hover:bg-slate-50/50'
                  }`}
                >
                  {/* Cell Header: Day Number + Holiday + Quick Add */}
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1 min-w-0">
                      <span
                        className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${dayNumColor} ${
                          isToday ? 'bg-amber-500 text-white font-black shadow-xs' : ''
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {cell.holidayName && (
                        <span className="text-[10px] text-rose-500 font-bold truncate max-w-[65px]">
                          {cell.holidayName}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setAssigningDate(cell.dateStr)}
                      className="p-1 rounded-md text-amber-600 hover:bg-amber-100/70 transition-colors cursor-pointer"
                      title={language === 'ko' ? `[${cell.dateStr}] 수업 기술 배정` : 'Assign Class Video'}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Assigned Class Videos Cards List */}
                  <div className="space-y-1.5 flex-1 min-h-[40px] overflow-y-auto max-h-[160px]">
                    {assignedList.map((entry) => {
                      const videoObj: TechniqueVideo = {
                        id: entry.videoId,
                        titleKo: entry.videoTitleKo,
                        titleEn: entry.videoTitleEn || '',
                        youtubeUrl: entry.youtubeUrl,
                        youtubeId: entry.youtubeId,
                        thumbnailUrl: entry.thumbnailUrl,
                        position: entry.position,
                        category: entry.category,
                        categories: entry.categories,
                        endPosition: entry.endPosition,
                        giType: entry.giType || 'Both',
                        difficulty: entry.difficulty || '중급',
                        submissionGroup: 'none',
                        submissionDetail: '',
                        proficiencyScore: entry.proficiencyScore || 0,
                        isFavorite: false,
                        generalNotes: entry.generalNotes || '',
                        timelineFrames: entry.timelineFrames || [],
                        journalMemos: entry.journalMemos || [],
                        practiceDates: [entry.date],
                        nextTechniqueIds: [],
                        createdAt: entry.createdAt,
                        updatedAt: entry.updatedAt,
                      };

                      return (
                        <div
                          key={entry.id}
                          style={{
                            backgroundColor: journalStyle.cardBgColor || '#fffbeb',
                            borderColor: journalStyle.borderColor || '#f59e0b',
                          }}
                          className="group relative p-2 rounded-xl border transition-all shadow-3xs hover:shadow-2xs space-y-1"
                        >
                          {/* Top: Badge & Publish Toggle */}
                          <div className="flex items-center justify-between gap-1">
                            <span
                              style={{
                                color: journalStyle.borderColor || '#f59e0b',
                                backgroundColor: `${journalStyle.borderColor || '#f59e0b'}15`,
                              }}
                              className="px-1.5 py-0.5 rounded-md text-[9px] font-black shrink-0 flex items-center gap-1"
                            >
                              <GraduationCap className="w-3 h-3" />
                              <span>{journalStyle.badgeLabel || '관장님 수업'}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => handleTogglePublish(entry)}
                              className={`p-0.5 rounded cursor-pointer transition-colors ${
                                entry.isPublished
                                  ? 'text-emerald-600 hover:bg-emerald-100'
                                  : 'text-slate-400 hover:bg-slate-200'
                              }`}
                              title={entry.isPublished ? '현재 팀원에게 공개됨 (클릭하여 비공개 전환)' : '현재 비공개 상태 (클릭하여 공개 전환)'}
                            >
                              {entry.isPublished ? (
                                <Eye className="w-3.5 h-3.5" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Title & Click to Review with Thumbnail */}
                          <div
                            onClick={() => onOpenVideoReview(videoObj, entry.date)}
                            className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
                          >
                            <div className="w-10 aspect-video rounded-md bg-slate-900 overflow-hidden shrink-0 border border-black/10 shadow-3xs">
                              {entry.thumbnailUrl && (
                                <img
                                  src={entry.thumbnailUrl}
                                  alt={entry.videoTitleKo}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="text-[11px] font-black text-slate-900 line-clamp-1 leading-snug">
                                {entry.videoTitleKo}
                              </h5>
                              <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium truncate mt-0.5">
                                <span className="truncate">{translatePosition(entry.position, language, metadata.positions)}</span>
                                {entry.category && <span className="truncate">· {translateCategory(entry.category, language)}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Action buttons on card hover */}
                          <div className="flex items-center justify-between pt-1 border-t border-amber-200/50 text-[10px]">
                            <div className="flex items-center gap-1 text-slate-400">
                              {entry.journalMemos && entry.journalMemos.length > 0 && (
                                <span className="flex items-center gap-0.5 text-amber-700 font-bold">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{entry.journalMemos.length}</span>
                                </span>
                              )}
                              {entry.generalNotes && (
                                <FileText className="w-2.5 h-2.5 text-amber-700" />
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditNotes(entry)}
                                className="p-0.5 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                                title="수업 메모 작성/수정"
                              >
                                <FileText className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEntry(entry.id, entry.videoTitleKo)}
                                className="p-0.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="배정 취소"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom: Empty state or date footer */}
                  <div className="pt-1 text-[10px] text-slate-400 font-mono text-right">
                    {assignedList.length > 0 && (
                      <span>{assignedList.length}개 수업</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ==================== 세로모드 (Vertical List Layout - Mobile 1:1 match with Module3TrainingJournal) ==================== */
        <div className="space-y-3">
          {calendarCells.filter((c) => c.isCurrentMonth).map((cell) => {
            const assignedList = entriesByDate[cell.dateStr] || [];
            const isToday = cell.dateStr === todayDateStr;
            const isSunday = cell.dayOfWeekMonZero === 6;
            const isSaturday = cell.dayOfWeekMonZero === 5;
            const isRedDay = isSunday || !!cell.holidayName;

            let dayNumColor = 'text-slate-800';
            if (isRedDay) {
              dayNumColor = 'text-rose-600';
            } else if (isSaturday) {
              dayNumColor = 'text-blue-600';
            }

            const dayNamesShort = language === 'ko'
              ? ['월요일 (Mon)', '화요일 (Tue)', '수요일 (Wed)', '목요일 (Thu)', '금요일 (Fri)', '토요일 (Sat)', '일요일 (Sun)']
              : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const dayLabel = dayNamesShort[cell.dayOfWeekMonZero];

            return (
              <div
                key={cell.dateStr}
                className={`p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between transition-colors ${
                  isToday ? 'ring-2 ring-amber-500/80 ring-offset-1 bg-amber-50/5' : ''
                }`}
              >
                {/* Date Column (Left) */}
                <div className="w-full sm:w-44 flex sm:flex-col items-center sm:items-start justify-between sm:justify-center border-b sm:border-b-0 sm:border-r border-slate-100 pb-2 sm:pb-0 sm:pr-4 shrink-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center justify-center text-sm font-mono font-bold w-8 h-8 rounded-lg shrink-0 ${
                          isToday ? 'bg-amber-500 text-white shadow-2xs' : dayNumColor
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {dayLabel}
                        </span>
                        {cell.holidayName && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100 shrink-0">
                            {cell.holidayName}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAssigningDate(cell.dateStr)}
                      className="p-1.5 rounded-xl border border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300 text-slate-600 transition-all cursor-pointer shadow-3xs bg-white flex items-center justify-center shrink-0"
                      title={language === 'ko' ? `[${cell.dateStr}] 수업 기술 배정` : 'Assign Class Video'}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Assigned Class Videos (Center) */}
                <div className="flex-1 flex flex-col sm:flex-row sm:flex-wrap gap-2.5 items-stretch sm:items-center py-1 w-full min-w-0">
                  {assignedList.length > 0 ? (
                    assignedList.map((entry) => {
                      const videoObj: TechniqueVideo = {
                        id: entry.videoId,
                        titleKo: entry.videoTitleKo,
                        titleEn: entry.videoTitleEn || '',
                        youtubeUrl: entry.youtubeUrl,
                        youtubeId: entry.youtubeId,
                        thumbnailUrl: entry.thumbnailUrl,
                        position: entry.position,
                        category: entry.category,
                        categories: entry.categories,
                        endPosition: entry.endPosition,
                        giType: entry.giType || 'Both',
                        difficulty: entry.difficulty || '중급',
                        submissionGroup: 'none',
                        submissionDetail: '',
                        proficiencyScore: entry.proficiencyScore || 0,
                        isFavorite: false,
                        generalNotes: entry.generalNotes || '',
                        timelineFrames: entry.timelineFrames || [],
                        journalMemos: entry.journalMemos || [],
                        practiceDates: [entry.date],
                        nextTechniqueIds: [],
                        createdAt: entry.createdAt,
                        updatedAt: entry.updatedAt,
                      };

                      return (
                        <div
                          key={entry.id}
                          onClick={() => onOpenVideoReview(videoObj, entry.date)}
                          style={{
                            backgroundColor: journalStyle.cardBgColor || '#fffbeb',
                            borderColor: journalStyle.borderColor || '#f59e0b',
                          }}
                          className="group relative flex items-center gap-2.5 p-2 rounded-xl border shadow-2xs transition-all cursor-pointer w-full sm:w-auto sm:max-w-[320px] hover:shadow-xs hover:scale-[1.01]"
                        >
                          <div className="w-11 aspect-video rounded-md overflow-hidden bg-slate-900 shrink-0 border border-black/10">
                            {entry.thumbnailUrl && (
                              <img
                                src={entry.thumbnailUrl}
                                alt={entry.videoTitleKo}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <span
                                className="px-1.5 py-0.2 rounded text-[8.5px] font-black text-white shrink-0 shadow-2xs"
                                style={{ backgroundColor: journalStyle.borderColor || '#f59e0b' }}
                              >
                                {journalStyle.badgeLabel || (language === 'ko' ? '관장님 수업' : 'Class')}
                              </span>
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {language === 'en' ? (entry.videoTitleEn || entry.videoTitleKo) : entry.videoTitleKo}
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <span className="truncate">{translatePosition(entry.position, language, metadata.positions)}</span>
                              {entry.journalMemos && entry.journalMemos.length > 0 && (
                                <span className="text-amber-800 font-bold shrink-0">
                                  · 메모 {entry.journalMemos.length}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(entry)}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                entry.isPublished
                                  ? 'text-emerald-600 hover:bg-emerald-100'
                                  : 'text-slate-400 hover:bg-slate-200'
                              }`}
                              title={entry.isPublished ? '현재 팀원에게 공개됨 (클릭하여 비공개 전환)' : '현재 비공개 상태 (클릭하여 공개 전환)'}
                            >
                              {entry.isPublished ? (
                                <Eye className="w-3.5 h-3.5" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditNotes(entry)}
                              className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                              title="수업 메모 작성/수정"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(entry.id, entry.videoTitleKo)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="배정 취소"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-400 font-medium select-none pl-1">
                      {language === 'ko' ? '배정된 수업 일정이 없습니다.' : 'No class scheduled for this day.'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== Video Picker Modal ==================== */}
      {assigningDate && (
        <VideoArchivePickerModal
          videos={videos}
          metadata={metadata}
          primaryColor={themeColor}
          onSelectVideo={handleSelectVideoForClass}
          onClose={() => setAssigningDate(null)}
        />
      )}

      {/* ==================== Team Management Modal ==================== */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-amber-500 text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <h3 className="text-sm font-black">
                  {language === 'ko' ? '내 팀 소속 회원 관리' : 'Manage My Team Members'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ko'
                  ? '내 팀으로 등록된 회원들만 [학습일지] 달력에서 관장님이 공개한 수업일지를 열람할 수 있습니다. 특정 회원을 내 팀으로 소속시키거나 제외할 수 있습니다.'
                  : 'Only members assigned to your team can view your published curriculum in their Training Journal.'}
              </p>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  placeholder={language === 'ko' ? "회원 이메일 또는 이름 검색..." : "Search member email or name..."}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Members List */}
              <div className="space-y-2 pt-1">
                {isLoadingUsers ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    회원 목록을 불러오는 중...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    가입된 회원 정보를 찾을 수 없습니다.
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isMember = teamMemberUids.includes(user.uid);
                    return (
                      <div
                        key={user.uid}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isMember
                            ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-400/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {user.displayName || user.email.split('@')[0]}
                            </span>
                            {isMember && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500 text-white">
                                내 팀원
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 truncate block">
                            {user.email}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleTeamMember(user.uid)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isMember
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                              : 'bg-amber-500 text-white hover:bg-amber-600 shadow-xs'
                          }`}
                        >
                          {isMember ? (language === 'ko' ? '팀 제외' : 'Remove') : (language === 'ko' ? '+ 팀 소속 등록' : '+ Add to Team')}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                현재 등록된 팀원: <strong>{teamMemberUids.length}</strong>명
              </span>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Edit Class Notes Modal ==================== */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black truncate max-w-sm">
                  [{editingEntry.date}] {editingEntry.videoTitleKo} 수업 메모
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1 hover:bg-white/20 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {/* General Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  관장님 총평 및 일반 메모
                </label>
                <textarea
                  value={editGeneralNotes}
                  onChange={(e) => setEditGeneralNotes(e.target.value)}
                  rows={4}
                  placeholder="오늘 수업에서 강조한 핵심 포인트, 주의사항, 드릴 방법 등을 적어주세요..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              {/* Timeline Memos List */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  타임라인 메모 ({editMemos.length}개)
                </label>

                {editMemos.map((memo, idx) => (
                  <div
                    key={memo.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono font-black text-amber-600 block">
                        ⏱️ {memo.timeLabel}
                      </span>
                      <p className="text-slate-800 mt-0.5 whitespace-pre-wrap">
                        {memo.content}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditMemos((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-4 py-2 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl cursor-pointer shadow-xs"
              >
                메모 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
