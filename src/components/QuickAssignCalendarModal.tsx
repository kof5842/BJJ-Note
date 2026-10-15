import { useLanguage } from '../i18n/LanguageContext';
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar, Check, Flame } from 'lucide-react';
import { TechniqueVideo } from '../types';
import { getKoreanHolidayName, formatDateDot } from '../utils/bjjAnalyzer';

interface QuickAssignCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: TechniqueVideo;
  onToggleDateAssignment: (videoId: string, dateStr: string) => void;
  themeColor?: string;
}

export const QuickAssignCalendarModal: React.FC<QuickAssignCalendarModalProps> = ({
  isOpen,
  onClose,
  video,
  onToggleDateAssignment,
  themeColor = '#0ea5e9',
}) => {
  const { language } = useLanguage();
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(10);

  const todayDateStr = '2026-10-02';

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((prev) => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((prev) => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(10);
  };

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0

    const prevMonthLastDay = new Date(
      currentYear,
      currentMonth - 1,
      0
    ).getDate();
    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      dayOfWeekMonZero: number;
      holidayName: string | null;
    }[] = [];

    // Prev month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(
        dayNum
      ).padStart(2, '0')}`;
      const dow = cells.length % 7;
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        dayOfWeekMonZero: dow,
        holidayName: getKoreanHolidayName(dateStr),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(
        2,
        '0'
      )}-${String(d).padStart(2, '0')}`;
      const dow = cells.length % 7;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        dayOfWeekMonZero: dow,
        holidayName: getKoreanHolidayName(dateStr),
      });
    }

    // Next month padding to complete row
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(
        2,
        '0'
      )}-${String(d).padStart(2, '0')}`;
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

  if (!isOpen) return null;

  const assignedDates = video.practiceDates || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
              style={{ backgroundColor: themeColor }}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 truncate leading-tight">
                {language === 'ko' ? '학습일지 배정 달력' : 'Training Calendar Assign'}
              </h3>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {video.titleKo}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title={language === 'ko' ? "닫기" : "Close"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title={language === 'ko' ? "이전 달" : "Previous Month"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="text-base font-black text-slate-800 font-mono tracking-tight bg-transparent focus:outline-none cursor-pointer py-0.5"
              >
                {Array.from({ length: Math.max(35, currentYear - 2020 + 20) }, (_, i) => 2020 + i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}{language === 'ko' ? '년' : ''}
                  </option>
                ))}
              </select>
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                className="text-base font-black text-slate-800 font-mono tracking-tight bg-transparent focus:outline-none cursor-pointer py-0.5"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {language === 'ko' ? `${m}월` : new Date(currentYear, m - 1).toLocaleString('en', { month: 'short' })}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title={language === 'ko' ? "다음 달" : "Next Month"}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoToday}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-3xs"
          >
            {language === 'ko' ? '오늘로 이동' : 'Today'}
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4 pt-0">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {(language === 'ko' ? ['월', '화', '수', '목', '금', '토', '일'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map((d, i) => (
              <div
                key={d}
                className={`text-[11px] font-bold py-1 ${
                  i === 5
                    ? 'text-sky-500'
                    : i === 6
                    ? 'text-rose-500'
                    : 'text-slate-400'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => {
              const isAssigned = assignedDates.includes(cell.dateStr);
              const isToday = cell.dateStr === todayDateStr;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => onToggleDateAssignment(video.id, cell.dateStr)}
                  className={`relative aspect-square rounded-xl p-1 flex flex-col items-center justify-center transition-all cursor-pointer select-none group ${
                    isAssigned
                      ? 'text-white font-black shadow-2xs scale-95'
                      : cell.isCurrentMonth
                      ? 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                      : 'bg-transparent text-slate-300 hover:text-slate-500'
                  } ${
                    isToday && !isAssigned
                      ? 'ring-2 ring-indigo-500 ring-offset-1 font-bold'
                      : ''
                  }`}
                  style={isAssigned ? { backgroundColor: themeColor } : undefined}
                >
                  <span className="text-xs leading-none">
                    {cell.dayNumber}
                  </span>

                  {/* Assigned Check Indicator */}
                  {isAssigned && (
                    <span className="absolute bottom-1 right-1 flex items-center justify-center text-[9px] font-black">
                      ✓
                    </span>
                  )}

                  {/* Holiday / Today indicator dot */}
                  {cell.holidayName && !isAssigned && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-rose-400" />
                  )}
                  {isToday && !isAssigned && (
                    <span className="absolute top-1 right-1 text-[8px] font-extrabold text-indigo-600 font-mono">
                      오늘
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Assigned dates chips & footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">
              {language === 'ko' ? '배정 현황:' : 'Assigned:'}{' '}
              <span className="font-mono text-indigo-600 font-black">
                {language === 'ko' ? `${assignedDates.length}회 배정됨` : `${assignedDates.length} sessions`}
              </span>
            </span>
            <span className="text-[11px] text-slate-400">
              {language === 'ko' ? '날짜를 터치하여 배정/해제' : 'Tap date to assign / unassign'}
            </span>
          </div>

          {assignedDates.length > 0 && (
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
              {assignedDates.map((dateStr) => (
                <span
                  key={dateStr}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-700 shadow-3xs"
                >
                  <span>{formatDateDot(dateStr)}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDateAssignment(video.id, dateStr);
                    }}
                    className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                    title={language === 'ko' ? "배정 해제" : "Unassign"}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-colors cursor-pointer shadow-2xs"
          >
            {language === 'ko' ? '배정 완료' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
