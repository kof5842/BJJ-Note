import React, { useState, useRef } from 'react';
import { Heart, Flame } from 'lucide-react';
import { getScoreColorStyle } from '../utils/bjjAnalyzer';

interface ProficiencyRaterProps {
  score: number;
  onChange: (newScore: number) => void;
  compact?: boolean;
}

export function getProficiencyZoneLabel(score: number): {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
} {
  if (!score || score <= 0) {
    return {
      label: '미검증(미부여)',
      colorClass: 'text-slate-500',
      bgClass: 'bg-slate-100',
      borderClass: 'border-slate-200',
    };
  }
  if (score <= 3) {
    return {
      label: '취약 구간 (드릴 시급)',
      colorClass: 'text-rose-600',
      bgClass: 'bg-rose-50',
      borderClass: 'border-rose-200',
    };
  }
  if (score <= 7) {
    return {
      label: '발전 구간 (실전 적응 중)',
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
    };
  }
  return {
    label: '강점 구간 (주력 A게임)',
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
  };
}

export const ProficiencyRater: React.FC<ProficiencyRaterProps> = ({
  score,
  onChange,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [popupTop, setPopupTop] = useState<number | null>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopupTop(rect.top - 6);
    }
    setIsExpanded(!isExpanded);
  };

  const zone = getProficiencyZoneLabel(score);

  if (compact) {
    return (
      <div
        className="relative inline-flex items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className="p-1 rounded-lg hover:bg-slate-100 text-amber-500 hover:text-amber-600 cursor-pointer flex items-center justify-center transition-all shrink-0"
          title="숙련도 점수 평가 (1~10점)"
        >
          <Flame
            className={`w-3.5 h-3.5 shrink-0 ${
              score >= 8
                ? 'fill-emerald-400 text-emerald-400'
                : score >= 4
                  ? 'fill-amber-400 text-amber-400'
                  : score >= 1
                    ? 'fill-rose-400 text-rose-400'
                    : 'text-amber-400'
            }`}
          />
        </button>

        {isExpanded && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
            />
            <div
              className="fixed left-1/2 -translate-x-1/2 -translate-y-full sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:bottom-full sm:translate-x-0 sm:translate-y-0 sm:mb-2 p-2 bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-2xl rounded-2xl flex items-center justify-center gap-1 z-50 animate-in fade-in zoom-in-95 duration-150 max-w-[96vw] overflow-x-auto custom-scrollbar"
              style={
                popupTop !== null && typeof window !== 'undefined' && window.innerWidth < 640
                  ? { top: `${Math.max(60, popupTop)}px` }
                  : undefined
              }
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1 py-0.5 px-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                  const active = score >= val;
                  const color = getScoreColorStyle(val);
                  let barColor =
                    'bg-slate-100 hover:bg-slate-200 text-slate-900 font-black border border-slate-200';
                  if (active) {
                    barColor = `${color.bgClass} ${color.borderClass} ${color.textClass} font-black shadow-3xs ring-1 ring-slate-900/10`;
                  }
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(score === val ? 0 : val);
                        setIsExpanded(false);
                      }}
                      title={`자가진단 ${val}점 부여 (다시 누르면 해제)`}
                      className={`w-7 h-7 rounded-lg text-xs font-black font-mono tabular-nums flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 shrink-0 ${barColor}`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
      <div className="grid grid-cols-10 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
          const isSelected = score === val;
          const isFilled = score >= val;
          const color = getScoreColorStyle(val);
          let styleClass =
            'bg-white border-slate-200 text-slate-600 hover:border-slate-400';
          if (isFilled) {
            styleClass = `${color.bgClass} ${color.borderClass} ${color.textClass} font-semibold`;
          }
          return (
            <button
              key={val}
              type="button"
              onClick={() => onChange(isSelected ? 0 : val)}
              className={`py-1.5 rounded-lg border text-xs font-mono tabular-nums transition-all cursor-pointer ${styleClass} ${
                isSelected ? 'ring-2 ring-offset-1 ring-slate-900 shadow-xs scale-105' : ''
              }`}
            >
              {val}
            </button>
          );
        })}
      </div>
    </div>
  );
};
