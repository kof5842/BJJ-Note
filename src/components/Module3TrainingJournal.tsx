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
  ListFilter,
  Grid,
  Columns,
  GraduationCap,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { AppSettings, MetadataConfig, TechniqueVideo, ClassJournalEntry } from '../types';
import {
  formatDateDot,
  getKoreanHolidayName,
} from '../utils/bjjAnalyzer';
import { JournalAssignmentView } from './JournalAssignmentView';
import { useLanguage } from '../i18n/LanguageContext';
import { translatePosition } from '../utils/taxonomyTranslation';
import { fetchClassJournal, fetchTeamMemberUids } from '../services/archiveService';

interface Module3TrainingJournalProps {
  videos: TechniqueVideo[];
  metadata: MetadataConfig;
  settings: AppSettings;
  currentUser?: { uid: string; email?: string | null; displayName?: string | null } | null;
  isAdmin?: boolean;
  onUpdateSettings: (nextSettings: any) => void;
  onToggleDateAssignment: (videoId: string, dateStr: string) => void;
  onOpenReviewPopup: (video: TechniqueVideo, dateStr: string) => void;
  onUpdateVideo?: (updated: TechniqueVideo) => void;
}

interface CalendarCellData {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  dayOfWeekMonZero: number;
  holidayName: string | null;
}

export const Module3TrainingJournal: React.FC<Module3TrainingJournalProps> = ({
  videos,
  metadata,
  settings,
  currentUser,
  isAdmin = false,
  onUpdateSettings,
  onToggleDateAssignment,
  onOpenReviewPopup,
  onUpdateVideo,
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const { t, language } = useLanguage();

  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth() + 1);

  const [assignModalDate, setAssignModalDate] = useState<string | null>(null);

  const todayDateStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Team members list (내 팀 관리)
  const [teamMemberUids, setTeamMemberUids] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bjj_my_team_members_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Check if the current user belongs to the instructor's team (or is admin)
  const isUserInTeam = useMemo(() => {
    if (isAdmin) return true;
    if (currentUser?.uid && teamMemberUids.includes(currentUser.uid)) return true;
    return false;
  }, [isAdmin, currentUser?.uid, teamMemberUids]);

  // Toast feedback state
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3500);
  };

  // User Request: 내 팀으로 등록된 회원들은 학습일지에서 2026년 10월이라고 적힌 달력 맨 옆에 아이콘을 누르면 관리자가 수업일지를 등록한걸 볼수있어. 한번더 누르면 가려지기도하지.
  const [showClassJournal, setShowClassJournal] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bjj_show_class_journal_in_training') === 'true';
    } catch {
      return false;
    }
  });
  const [classJournalList, setClassJournalList] = useState<ClassJournalEntry[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchClassJournal().then((data) => {
      if (isMounted) setClassJournalList(data);
    });

    fetchTeamMemberUids().then((uids) => {
      if (isMounted) setTeamMemberUids(uids);
    });

    const handleSync = () => {
      fetchClassJournal().then((data) => {
        if (isMounted) setClassJournalList(data);
      });
      fetchTeamMemberUids().then((uids) => {
        if (isMounted) setTeamMemberUids(uids);
      });
    };

    window.addEventListener('bjj_class_journal_changed', handleSync);
    window.addEventListener('bjj_team_members_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener('bjj_class_journal_changed', handleSync);
      window.removeEventListener('bjj_team_members_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const classEntriesByDate = useMemo(() => {
    // CRITICAL: If current user is NOT in the instructor's team (and not an admin), NEVER show class journal entries!
    if (!isUserInTeam) {
      return {};
    }

    const map: Record<string, ClassJournalEntry[]> = {};
    for (const entry of classJournalList) {
      if (entry.isPublished === false) continue;
      // If targeted to specific team members, check if current user is in that subset
      if (entry.targetTeamMemberUids && entry.targetTeamMemberUids.length > 0) {
        if (!isAdmin && (!currentUser?.uid || !entry.targetTeamMemberUids.includes(currentUser.uid))) {
          continue;
        }
      }
      const d = entry.date;
      if (!map[d]) map[d] = [];
      map[d].push(entry);
    }
    return map;
  }, [classJournalList, isUserInTeam, isAdmin, currentUser?.uid]);

  const handleOpenClassEntry = (entry: ClassJournalEntry, dateStr: string) => {
    const classVideo: TechniqueVideo = {
      id: entry.videoId || entry.id,
      youtubeUrl: entry.youtubeUrl,
      youtubeId: entry.youtubeId,
      titleKo: entry.videoTitleKo,
      titleEn: entry.videoTitleEn || '',
      thumbnailUrl: entry.thumbnailUrl,
      position: entry.position,
      category: entry.category,
      categories: entry.categories || [entry.category],
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
      practiceDates: [dateStr],
      nextTechniqueIds: [],
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
    onOpenReviewPopup(classVideo, dateStr);
  };

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

  const handlePrev = () => {
    if (viewMode === 'week') {
      setWeekOffset((prev) => prev - 1);
    } else {
      handlePrevMonth();
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setWeekOffset((prev) => prev + 1);
    } else {
      handleNextMonth();
    }
  };

  const handleGoToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(10);
    setWeekOffset(0);
  };

  const weekDates = useMemo(() => {
    const baseDate = new Date('2026-10-02T00:00:00');
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);

    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1); // Monday of that week
    const monday = new Date(baseDate.setDate(diff));

    const dates: { dateStr: string; label: string; dayName: string; isToday: boolean; dayOfWeekMonZero: number; holidayName: string | null }[] = [];
    const dayNames = language === 'ko'
      ? ['월요일 (Mon)', '화요일 (Tue)', '수요일 (Wed)', '목요일 (Thu)', '금요일 (Fri)', '토요일 (Sat)', '일요일 (Sun)']
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      dates.push({
        dateStr,
        label: language === 'ko'
          ? `${d.getMonth() + 1}월 ${d.getDate()}일`
          : `${months[d.getMonth()]} ${d.getDate()}`,
        dayName: dayNames[i],
        isToday: dateStr === todayDateStr,
        dayOfWeekMonZero: i,
        holidayName: getKoreanHolidayName(dateStr),
      });
    }
    return dates;
  }, [weekOffset, language]);

  const calendarCells = useMemo<CalendarCellData[]>(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    const cells: CalendarCellData[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dow = cells.length % 7;
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        dayOfWeekMonZero: dow,
        holidayName: getKoreanHolidayName(dateStr),
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = cells.length % 7;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        dayOfWeekMonZero: dow,
        holidayName: getKoreanHolidayName(dateStr),
      });
    }

    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = cells.length % 7;
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

  const videosByDate = useMemo(() => {
    const map: Record<string, TechniqueVideo[]> = {};
    for (const v of videos) {
      for (const d of v.practiceDates) {
        if (!map[d]) map[d] = [];
        map[d].push(v);
      }
    }
    return map;
  }, [videos]);

  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const monthlyTrainedDaysCount = useMemo(() => {
    return Object.keys(videosByDate).filter(
      (d) => d.startsWith(monthPrefix) && videosByDate[d].length > 0
    ).length;
  }, [videosByDate, monthPrefix]);

  // When assigning in mobile environment, enter into dedicated assignment screen without modal popup
  if (assignModalDate && isMobileScreen) {
    return (
      <JournalAssignmentView
        videos={videos}
        metadata={metadata}
        settings={settings}
        targetDate={assignModalDate}
        onClose={() => setAssignModalDate(null)}
        onToggleDateAssignment={onToggleDateAssignment}
        onOpenReviewPopup={onOpenReviewPopup}
        onUpdateVideo={onUpdateVideo}
        isModal={false}
      />
    );
  }

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-200">
      {toastFeedback && (
        <div className="p-3.5 rounded-2xl bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in slide-in-from-top-2">
          <ShieldAlert className="w-4 h-4 text-white shrink-0" />
          <span>{toastFeedback}</span>
        </div>
      )}

      <div className="flex items-center justify-center gap-2.5 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-3xs flex-wrap">
        <div className="flex items-center gap-2">
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="text-lg font-bold text-slate-900 bg-transparent font-mono tabular-nums focus:outline-none cursor-pointer"
          >
            {Array.from({ length: Math.max(31, currentYear - 2020 + 20) }, (_, i) => 2020 + i).map((yr) => (
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

        {/* User Request: 2026년 10월이라고 적힌 달력 맨 옆에 아이콘을 누르면 관리자가 수업일지를 등록한걸 볼수있어. 내 팀으로 등록된 회원만 열람 가능 */}
        <button
          type="button"
          onClick={() => {
            if (!isUserInTeam) {
              showToast(
                language === 'ko'
                  ? '🔒 관장님의 [내 팀]으로 등록된 회원만 수업일지를 열람할 수 있습니다.'
                  : '🔒 Only registered team members can view the class journal.'
              );
              setShowClassJournal(false);
              return;
            }
            const next = !showClassJournal;
            setShowClassJournal(next);
            try {
              localStorage.setItem('bjj_show_class_journal_in_training', String(next));
            } catch {}
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-3xs ${
            showClassJournal && isUserInTeam
              ? 'text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
          }`}
          style={showClassJournal && isUserInTeam ? {
            backgroundColor: settings.classJournalStyle?.borderColor || '#f59e0b',
            borderColor: settings.classJournalStyle?.borderColor || '#f59e0b',
          } : undefined}
          title={
            !isUserInTeam
              ? (language === 'ko' ? '내 팀 회원 전용 (관장님 팀으로 등록된 회원만 열람 가능)' : 'Team members only')
              : showClassJournal
              ? (language === 'ko' ? '관장님 수업일지 숨기기 (한 번 더 누르면 가려짐)' : 'Hide Class Journal')
              : (language === 'ko' ? '관장님 수업일지 연동 보기 (클릭 시 표시)' : 'Show Class Journal')
          }
        >
          {isUserInTeam ? (
            <GraduationCap className="w-4 h-4" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>
            {language === 'ko'
              ? (showClassJournal && isUserInTeam ? '수업일지 표시 중' : '수업일지 보기')
              : (showClassJournal && isUserInTeam ? 'Class Journal ON' : 'Class Journal')}
          </span>
          {!isUserInTeam && (
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded font-normal">
              {language === 'ko' ? '팀원전용' : 'Team'}
            </span>
          )}
        </button>
      </div>

      {activeLayoutMode === 'horizontal' ? (
        /* ==================== 가로모드 (Grid Layout) ==================== */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          {/* Calendar Header (Days of week) */}
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

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
            {(viewMode === 'month'
              ? calendarCells
              : weekDates.map((d, idx) => ({
                  dateStr: d.dateStr,
                  dayNumber: new Date(d.dateStr).getDate(),
                  isCurrentMonth: true,
                  dayOfWeekMonZero: idx,
                  holidayName: d.holidayName,
                }))
            ).map((cell) => {
              const assignedList = videosByDate[cell.dateStr] || [];
              const classEntriesForCell = showClassJournal ? (classEntriesByDate[cell.dateStr] || []) : [];
              const hasEntries = assignedList.length > 0 || classEntriesForCell.length > 0;
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
                  className={`min-h-[155px] p-2.5 flex flex-col justify-between transition-colors ${
                    cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span
                        className={`inline-flex items-center justify-center text-xs font-mono tabular-nums font-bold ${
                          isToday
                            ? 'w-6 h-6 rounded-md bg-blue-600 text-white'
                            : dayNumColor
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {cell.holidayName && (
                        <span
                          className={`text-[11px] font-semibold truncate ${
                            cell.isCurrentMonth
                              ? 'text-rose-600'
                              : 'text-rose-300'
                          }`}
                          title={cell.holidayName}
                        >
                          {cell.holidayName}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setAssignModalDate(cell.dateStr)}
                      className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer shrink-0"
                      title={language === 'ko' ? `${cell.dateStr} 학습 기술 추가 (+)` : `Add technique for ${cell.dateStr} (+)`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {hasEntries ? (
                    <div className="space-y-1.5 flex-1">
                      {/* 1. 개인 학습일지 영상 카드 */}
                      {assignedList.map((tech) => (
                        <div
                          key={`${cell.dateStr}-${tech.id}`}
                          onClick={() => onOpenReviewPopup(tech, cell.dateStr)}
                          className="group relative flex items-center gap-2 p-1.5 rounded-xl bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-400 shadow-2xs transition-all cursor-pointer"
                        >
                          <div className="w-11 aspect-video rounded-md overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                            {tech.thumbnailUrl && (
                              <img
                                src={tech.thumbnailUrl}
                                alt={language === 'en' ? (tech.titleEn || tech.titleKo) : tech.titleKo}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700 truncate">
                              {language === 'en' ? (tech.titleEn || tech.titleKo) : tech.titleKo}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                              <span className="truncate">{translatePosition(tech.position, language, metadata.positions)}</span>
                              {tech.proficiencyScore > 0 && (
                                <span className="font-mono tabular-nums text-emerald-600 font-semibold shrink-0">
                                  · {tech.proficiencyScore}{language === 'ko' ? '점' : ' pts'}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleDateAssignment(tech.id, cell.dateStr);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-600 transition-opacity cursor-pointer shrink-0"
                            title={language === 'ko' ? '이 날짜에서 배정 해제' : 'Unassign from date'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {/* 2. 관장님 수업일지 연동 카드 (관리자 설정 커스텀 색상 & 모서리선 & 뱃지) */}
                      {classEntriesForCell.map((cEntry) => (
                        <div
                          key={`class-${cell.dateStr}-${cEntry.id}`}
                          onClick={() => handleOpenClassEntry(cEntry, cell.dateStr)}
                          className="group relative flex items-center gap-2 p-1.5 rounded-xl border shadow-2xs transition-all cursor-pointer hover:shadow-xs hover:scale-[1.01]"
                          style={{
                            backgroundColor: settings.classJournalStyle?.cardBgColor || '#fffbeb',
                            borderColor: settings.classJournalStyle?.borderColor || '#f59e0b',
                          }}
                          title={language === 'ko' ? '관장님 수업일지 (클릭 시 타임라인/일반메모 연동 상세 보기)' : 'Instructor Class Journal Entry'}
                        >
                          <div className="w-11 aspect-video rounded-md overflow-hidden bg-slate-900 shrink-0 border border-black/10">
                            {cEntry.thumbnailUrl && (
                              <img
                                src={cEntry.thumbnailUrl}
                                alt={cEntry.videoTitleKo}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <span
                                className="px-1.5 py-0.2 rounded text-[8.5px] font-black text-white shrink-0 shadow-2xs"
                                style={{ backgroundColor: settings.classJournalStyle?.borderColor || '#f59e0b' }}
                              >
                                {settings.classJournalStyle?.badgeLabel || (language === 'ko' ? '관장님 수업' : 'Class')}
                              </span>
                              <div className="text-[11px] font-bold text-slate-900 truncate">
                                {language === 'en' ? (cEntry.videoTitleEn || cEntry.videoTitleKo) : cEntry.videoTitleKo}
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <span className="truncate">{translatePosition(cEntry.position, language, metadata.positions)}</span>
                              {cEntry.timelineFrames && cEntry.timelineFrames.length > 0 && (
                                <span className="text-amber-800 font-bold shrink-0">
                                  · 메모 {cEntry.timelineFrames.length}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    cell.isCurrentMonth && (
                      <button
                        type="button"
                        onClick={() => setAssignModalDate(cell.dateStr)}
                        className="flex-1 w-full rounded-xl border border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-blue-600 transition-colors cursor-pointer py-4"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-[11px] font-medium">{language === 'ko' ? '학습 배정' : 'Assign'}</span>
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ==================== 세로모드 (Vertical List Layout) ==================== */
        <div className="space-y-3">
          {(viewMode === 'month'
            ? calendarCells.filter((c) => c.isCurrentMonth)
            : weekDates.map((d, idx) => ({
                dateStr: d.dateStr,
                dayNumber: new Date(d.dateStr).getDate(),
                isCurrentMonth: true,
                dayOfWeekMonZero: idx,
                holidayName: d.holidayName,
                dayName: d.dayName,
              }))
          ).map((cell) => {
            const assignedList = videosByDate[cell.dateStr] || [];
            const classEntriesForCell = showClassJournal ? (classEntriesByDate[cell.dateStr] || []) : [];
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
            const dayLabel = 'dayName' in cell ? (cell as any).dayName : dayNamesShort[cell.dayOfWeekMonZero];

            return (
              <div
                key={cell.dateStr}
                className={`p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between transition-colors ${
                  isToday ? 'ring-2 ring-blue-500/80 ring-offset-1 bg-blue-50/5' : ''
                }`}
              >
                {/* Date Column (Left) */}
                <div className="w-full sm:w-44 flex sm:flex-col items-center sm:items-start justify-between sm:justify-center border-b sm:border-b-0 sm:border-r border-slate-100 pb-2 sm:pb-0 sm:pr-4 shrink-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center justify-center text-sm font-mono font-bold w-8 h-8 rounded-lg shrink-0 ${
                          isToday ? 'bg-blue-600 text-white shadow-2xs' : dayNumColor
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
                      onClick={() => setAssignModalDate(cell.dateStr)}
                      className="p-1.5 rounded-xl border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-slate-600 transition-all cursor-pointer shadow-3xs bg-white flex items-center justify-center shrink-0"
                      title={language === 'ko' ? '학습 배정' : 'Assign'}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Assigned Techniques (Center) */}
                <div className="flex-1 flex flex-col sm:flex-row sm:flex-wrap gap-2.5 items-stretch sm:items-center py-1 w-full min-w-0">
                  {assignedList.length > 0 || classEntriesForCell.length > 0 ? (
                    <>
                      {/* 1. 개인 학습일지 영상 카드 */}
                      {assignedList.map((tech) => (
                        <div
                          key={`${cell.dateStr}-${tech.id}`}
                          onClick={() => onOpenReviewPopup(tech, cell.dateStr)}
                          className="group relative flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-400 shadow-3xs transition-all cursor-pointer w-full sm:w-auto sm:max-w-[280px]"
                        >
                          <div className="w-11 aspect-video rounded-md overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                            {tech.thumbnailUrl && (
                              <img
                                src={tech.thumbnailUrl}
                                alt={language === 'en' ? (tech.titleEn || tech.titleKo) : tech.titleKo}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                              {language === 'en' ? (tech.titleEn || tech.titleKo) : tech.titleKo}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                              <span className="truncate">{translatePosition(tech.position, language, metadata.positions)}</span>
                              {tech.proficiencyScore > 0 && (
                                <span className="font-mono tabular-nums text-emerald-600 font-semibold shrink-0">
                                  · {tech.proficiencyScore}{language === 'ko' ? '점' : ' pts'}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleDateAssignment(tech.id, cell.dateStr);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-600 transition-opacity cursor-pointer shrink-0"
                            title={language === 'ko' ? '이 날짜에서 배정 해제' : 'Unassign from date'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {/* 2. 관장님 수업일지 연동 카드 */}
                      {classEntriesForCell.map((cEntry) => (
                        <div
                          key={`class-vert-${cell.dateStr}-${cEntry.id}`}
                          onClick={() => handleOpenClassEntry(cEntry, cell.dateStr)}
                          className="group relative flex items-center gap-2.5 p-2 rounded-xl border shadow-2xs transition-all cursor-pointer w-full sm:w-auto sm:max-w-[280px] hover:shadow-xs hover:scale-[1.01]"
                          style={{
                            backgroundColor: settings.classJournalStyle?.cardBgColor || '#fffbeb',
                            borderColor: settings.classJournalStyle?.borderColor || '#f59e0b',
                          }}
                          title={language === 'ko' ? '관장님 수업일지 (클릭 시 타임라인/일반메모 연동 상세 보기)' : 'Instructor Class Journal Entry'}
                        >
                          <div className="w-11 aspect-video rounded-md overflow-hidden bg-slate-900 shrink-0 border border-black/10">
                            {cEntry.thumbnailUrl && (
                              <img
                                src={cEntry.thumbnailUrl}
                                alt={cEntry.videoTitleKo}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <span
                                className="px-1.5 py-0.2 rounded text-[8.5px] font-black text-white shrink-0 shadow-2xs"
                                style={{ backgroundColor: settings.classJournalStyle?.borderColor || '#f59e0b' }}
                              >
                                {settings.classJournalStyle?.badgeLabel || (language === 'ko' ? '관장님 수업' : 'Class')}
                              </span>
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {language === 'en' ? (cEntry.videoTitleEn || cEntry.videoTitleKo) : cEntry.videoTitleKo}
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <span className="truncate">{translatePosition(cEntry.position, language, metadata.positions)}</span>
                              {cEntry.timelineFrames && cEntry.timelineFrames.length > 0 && (
                                <span className="text-amber-800 font-bold shrink-0">
                                  · 메모 {cEntry.timelineFrames.length}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium select-none pl-1">
                      {language === 'ko' ? '배정된 수련 일정이 없습니다.' : 'No techniques assigned for this day.'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {assignModalDate && !isMobileScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-[1400px] h-[92vh] max-h-[95vh] flex flex-col overflow-hidden p-4 sm:p-5">
            <JournalAssignmentView
              videos={videos}
              metadata={metadata}
              settings={settings}
              targetDate={assignModalDate}
              onClose={() => setAssignModalDate(null)}
              onToggleDateAssignment={onToggleDateAssignment}
              onOpenReviewPopup={onOpenReviewPopup}
              onUpdateVideo={onUpdateVideo}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
