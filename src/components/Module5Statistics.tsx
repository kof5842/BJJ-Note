import React, { useMemo, useState } from 'react';
import {
  Home,
  BarChart3,
  AlertTriangle,
  Sparkles,
  GitBranch,
  Shield,
  Clock,
  CalendarPlus,
  Edit3,
  CheckCircle2,
  Folder,
  FolderOpen,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
  Layers,
  Star,
  Play,
  ZoomIn,
  X,
} from 'lucide-react';
import { AppSettings, MetadataConfig, TechniqueVideo } from '../types';
import { formatDateKorean } from '../utils/bjjAnalyzer';
import { useLanguage } from '../i18n/LanguageContext';
import { translatePosition, translateCategory, translateSubmissionDetail, translateGiType, translateDifficulty } from '../utils/taxonomyTranslation';

interface Module5StatisticsProps {
  videos: TechniqueVideo[];
  metadata: MetadataConfig;
  settings: AppSettings;
  onOpenModal: (video: TechniqueVideo, mode: 'view' | 'edit', activeJournalDate?: string) => void;
  onQuickAssignToday: (videoId: string) => void;
}

export const Module5Statistics: React.FC<Module5StatisticsProps> = ({
  videos,
  metadata,
  settings,
  onOpenModal,
  onQuickAssignToday,
}) => {
  const referenceToday = new Date('2026-10-02T00:00:00Z');
  const { t, language } = useLanguage();

  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  const [positionSortBy, setPositionSortBy] = useState<
    'count_desc' | 'score_desc' | 'score_asc' | 'recent'
  >('count_desc');
  const [expandedPositionFolder, setExpandedPositionFolder] = useState<string | null>(null);
  const [summonNotice, setSummonNotice] = useState<string | null>(null);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  // Filter videos by selected year and month based on their practiceDates
  const filteredVideos = useMemo(() => {
    if (selectedYear === 'ALL' && selectedMonth === 'ALL') {
      return videos;
    }
    return videos.filter((v) => {
      if (v.practiceDates.length === 0) {
        return false;
      }
      return v.practiceDates.some((d) => {
        const yr = d.slice(0, 4);
        const mo = d.slice(5, 7);
        const matchYear = selectedYear === 'ALL' || yr === selectedYear;
        const matchMonth = selectedMonth === 'ALL' || mo === selectedMonth;
        return matchYear && matchMonth;
      });
    });
  }, [videos, selectedYear, selectedMonth]);

  const overviewStats = useMemo(() => {
    const total = filteredVideos.length;
    const favorites = filteredVideos.filter((v) => v.isFavorite).length;
    const rated = filteredVideos.filter((v) => v.proficiencyScore > 0);
    const avgScore =
      rated.length > 0
        ? rated.reduce((sum, v) => sum + v.proficiencyScore, 0) / rated.length
        : 0;

    let recent30DaysSessions = 0;
    for (const v of filteredVideos) {
      for (const d of v.practiceDates) {
        if (d >= '2026-09-02' && d <= '2026-10-02') {
          recent30DaysSessions++;
        }
      }
    }

    const strongCount = filteredVideos.filter(
      (v) => v.proficiencyScore >= settings.highScoreThreshold
    ).length;
    const weakCount = filteredVideos.filter(
      (v) =>
        v.proficiencyScore > 0 &&
        v.proficiencyScore <= settings.lowScoreThreshold
    ).length;

    return {
      total,
      favorites,
      ratedCount: rated.length,
      avgScore: avgScore.toFixed(1),
      recent30DaysSessions,
      strongCount,
      weakCount,
    };
  }, [filteredVideos, settings.highScoreThreshold, settings.lowScoreThreshold]);

  const radarAxes = useMemo(() => {
    const classifyAxis = (v: TechniqueVideo): number => {
      const cat = v.category;
      const pos = v.position;
      if (cat.includes('서브미션') || v.submissionGroup !== 'none') return 2;
      if (cat.includes('패스')) return 1;
      if (cat.includes('이스케이프') || cat.includes('카운터') || cat.includes('복귀'))
        return 3;
      if (cat.includes('테이크다운') || pos.includes('스탠딩')) return 4;
      return 0;
    };

    const labels = language === 'ko'
      ? [
          '가드 운용 (Guard Play)',
          '가드 패스 (Guard Pass)',
          '서브미션 (Submission)',
          '이스케이프 & 디펜스',
          '테이크다운 & 스탠딩',
        ]
      : [
          'Guard Play',
          'Guard Pass',
          'Submission',
          'Escape & Defense',
          'Takedown & Standing',
        ];

    const counts = [0, 0, 0, 0, 0];
    const scoreSums = [0, 0, 0, 0, 0];
    const ratedCounts = [0, 0, 0, 0, 0];

    for (const v of filteredVideos) {
      const idx = classifyAxis(v);
      counts[idx]++;
      if (v.proficiencyScore > 0) {
        scoreSums[idx] += v.proficiencyScore;
        ratedCounts[idx]++;
      }
    }

    const maxCount = Math.max(4, ...counts);

    return labels.map((label, i) => {
      const avg = ratedCounts[i] > 0 ? scoreSums[i] / ratedCounts[i] : 0;
      const countNorm = Math.min(100, Math.round((counts[i] / maxCount) * 100));
      const scoreNorm = Math.min(100, Math.round((avg / 10) * 100));
      const combinedBalance = Math.round(countNorm * 0.45 + scoreNorm * 0.55);
      return {
        label,
        count: counts[i],
        avgScore: avg > 0 ? avg.toFixed(1) : '0.0',
        countNorm,
        scoreNorm,
        combinedBalance,
      };
    });
  }, [filteredVideos, language]);

  const positionFolderStats = useMemo(() => {
    const list: Array<{
      position: string;
      total: number;
      pct: number;
      avgScore: number;
      strongCount: number;
      weakCount: number;
      unratedCount: number;
      giCount: number;
      nogiCount: number;
      submissionCount: number;
      recentPracticedDate?: string;
      recent30DaysCount: number;
      videos: TechniqueVideo[];
    }> = [];

    const totalVideos = Math.max(1, filteredVideos.length);

    for (const pos of metadata.positions) {
      const posVideos = filteredVideos.filter((v) => v.position === pos.name);
      if (posVideos.length === 0) continue;

      const rated = posVideos.filter((v) => v.proficiencyScore > 0);
      const avg =
        rated.length > 0
          ? Number(
              (
                rated.reduce((s, v) => s + v.proficiencyScore, 0) / rated.length
              ).toFixed(1)
            )
          : 0;

      const strongCount = posVideos.filter(
        (v) => v.proficiencyScore >= settings.highScoreThreshold
      ).length;
      const weakCount = posVideos.filter(
        (v) =>
          v.proficiencyScore > 0 &&
          v.proficiencyScore <= settings.lowScoreThreshold
      ).length;
      const unratedCount = posVideos.filter((v) => v.proficiencyScore === 0).length;

      const giCount = posVideos.filter((v) => v.giType === 'Gi').length;
      const nogiCount = posVideos.filter((v) => v.giType === 'No-Gi').length;
      const submissionCount = posVideos.filter(
        (v) => v.category === '서브미션' || v.submissionGroup !== 'none'
      ).length;

      let recent30DaysCount = 0;
      let latestDate: string | undefined;

      for (const v of posVideos) {
        for (const d of v.practiceDates) {
          if (!latestDate || d > latestDate) latestDate = d;
          if (d >= '2026-09-02' && d <= '2026-10-02') {
            recent30DaysCount++;
          }
        }
      }

      list.push({
        position: pos.name,
        total: posVideos.length,
        pct: Math.round((posVideos.length / totalVideos) * 100),
        avgScore: avg,
        strongCount,
        weakCount,
        unratedCount,
        giCount,
        nogiCount,
        submissionCount,
        recentPracticedDate: latestDate,
        recent30DaysCount,
        videos: posVideos,
      });
    }

    return list.sort((a, b) => {
      if (positionSortBy === 'count_desc') return b.total - a.total;
      if (positionSortBy === 'score_desc') return b.avgScore - a.avgScore;
      if (positionSortBy === 'score_asc') {
        if (a.avgScore === 0 && b.avgScore > 0) return 1;
        if (b.avgScore === 0 && a.avgScore > 0) return -1;
        return a.avgScore - b.avgScore;
      }
      if (positionSortBy === 'recent') {
        if (!a.recentPracticedDate) return 1;
        if (!b.recentPracticedDate) return -1;
        return b.recentPracticedDate.localeCompare(a.recentPracticedDate);
      }
      return b.total - a.total;
    });
  }, [
    filteredVideos,
    metadata.positions,
    settings.highScoreThreshold,
    settings.lowScoreThreshold,
    positionSortBy,
  ]);

  const maxPosTotal = useMemo(() => {
    return Math.max(1, ...positionFolderStats.map((p) => p.total));
  }, [positionFolderStats]);

  const positionHeatmap = useMemo(() => {
    const map: Array<{
      position: string;
      total: number;
      weakCount: number;
      avgScore: number;
    }> = [];

    for (const pos of metadata.positions) {
      const list = filteredVideos.filter((v) => v.position === pos.name);
      if (list.length === 0) continue;
      const rated = list.filter((v) => v.proficiencyScore > 0);
      const avg =
        rated.length > 0
          ? rated.reduce((s, v) => s + v.proficiencyScore, 0) / rated.length
          : 0;
      const weak = list.filter(
        (v) => v.proficiencyScore > 0 && v.proficiencyScore <= 5
      ).length;
      map.push({
        position: pos.name,
        total: list.length,
        weakCount: weak,
        avgScore: Number(avg.toFixed(1)),
      });
    }

    return map.sort((a, b) => {
      if (a.avgScore === 0 && b.avgScore > 0) return 1;
      if (b.avgScore === 0 && a.avgScore > 0) return -1;
      return a.avgScore - b.avgScore;
    });
  }, [filteredVideos, metadata.positions]);

  const diagnosticReportText = useMemo(() => {
    const ratedPositions = positionHeatmap.filter((p) => p.avgScore > 0);
    if (ratedPositions.length === 0) {
      return language === 'ko'
        ? '각 기술 카드에서 1~10점 자가진단을 진행하면 맞춤형 취약점 리포트가 생성됩니다.'
        : 'Self-evaluate 1-10 pts on technique cards to generate your personalized diagnostic report.';
    }
    const weakest = ratedPositions[0];
    const strongest = ratedPositions[ratedPositions.length - 1];

    const sortedAxes = [...radarAxes].sort(
      (a, b) => a.combinedBalance - b.combinedBalance
    );
    const lowestAxis = sortedAxes[0];

    const strongestPos = translatePosition(strongest.position, language, metadata.positions);
    const weakestPos = translatePosition(weakest.position, language, metadata.positions);

    if (language === 'en') {
      return `[Diagnostic Report] Currently, '${strongestPos}' area is an established weapon averaging ${strongest.avgScore} pts (Strength), while '${weakestPos}' area averages ${weakest.avgScore} pts, identified as a bottleneck zone. Also, '${lowestAxis.label}' has a relatively low proportion, so prioritize defense and escape drills in this week's journal.`;
    }

    return `[객관화 진단 리포트] 현재 '${strongest.position}' 영역은 평균 ${strongest.avgScore}점(강점)으로 안정적인 실전 무기를 갖추고 있으나, '${weakest.position}' 영역은 평균 ${weakest.avgScore}점으로 취약 병목(Bottleneck) 구간으로 분석되었습니다. 또한 '${lowestAxis.label}' 비중이 상대적으로 낮으므로 방어 및 탈출 드릴 세션을 이번 주 일지에 우선 배정하세요.`;
  }, [positionHeatmap, radarAxes, language, metadata.positions]);

  const isolatedTechniques = useMemo(() => {
    const inboundSet = new Set<string>();
    for (const v of filteredVideos) {
      for (const nextId of v.nextTechniqueIds || []) {
        inboundSet.add(nextId);
      }
    }

    return filteredVideos.filter((v) => {
      const hasOutbound = (v.nextTechniqueIds?.length || 0) > 0;
      const hasInbound = inboundSet.has(v.id);
      return !hasOutbound && !hasInbound;
    });
  }, [filteredVideos]);

  const giComparison = useMemo(() => {
    const calc = (filterFn: (v: TechniqueVideo) => boolean) => {
      const list = filteredVideos.filter(filterFn);
      const rated = list.filter((v) => v.proficiencyScore > 0);
      const avg =
        rated.length > 0
          ? (
              rated.reduce((s, v) => s + v.proficiencyScore, 0) / rated.length
            ).toFixed(1)
          : '0.0';
      return { count: list.length, avg };
    };

    return {
      gi: calc((v) => v.giType === 'Gi'),
      nogi: calc((v) => v.giType === 'No-Gi'),
      all: calc((v) => v.giType === 'All' || v.giType === 'Both'),
    };
  }, [filteredVideos]);

  const neglectedTechniques = useMemo(() => {
    const result: Array<{
      video: TechniqueVideo;
      lastDate?: string;
      elapsedDays: number | null;
    }> = [];

    for (const v of filteredVideos) {
      if (!v.practiceDates || v.practiceDates.length === 0) {
        result.push({
          video: v,
          lastDate: undefined,
          elapsedDays: null,
        });
      } else {
        const lastDate = [...v.practiceDates].sort().slice(-1)[0];
        const lastDt = new Date(`${lastDate}T00:00:00Z`);
        const diffDays = Math.floor(
          (referenceToday.getTime() - lastDt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays >= settings.neglectedDaysThreshold) {
          result.push({
            video: v,
            lastDate,
            elapsedDays: diffDays,
          });
        }
      }
    }

    return result.sort((a, b) => {
      if (a.elapsedDays === null && b.elapsedDays !== null) return -1;
      if (a.elapsedDays !== null && b.elapsedDays === null) return 1;
      return (b.elapsedDays || 0) - (a.elapsedDays || 0);
    });
  }, [filteredVideos, settings.neglectedDaysThreshold]);

  const computeRadarPolygon = (values0to100: number[]) => {
    const cx = 150;
    const cy = 150;
    const maxR = 102;
    return values0to100
      .map((val, i) => {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const r = Math.max(12, (val / 100) * maxR);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification when video is summoned */}
      {summonNotice && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg font-bold text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{summonNotice}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. MOBILE-ONLY STREAMLINED HOME DASHBOARD (block md:hidden) */}
      {/* ============================================================ */}
      <div className="block md:hidden space-y-3.5">
        {/* 1. Mobile Metric Tiles (Clean White 2x2 Grid) */}
        <div className="grid grid-cols-2 gap-2">
          {/* 전체 영상 */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 truncate">
              {language === 'ko' ? '전체 영상' : 'Total Videos'}
            </span>
            <div className="text-xl font-black font-mono text-slate-900 mt-1 truncate">
              {overviewStats.total}개
            </div>
          </div>

          {/* 평균 숙련도 */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 truncate">
              {language === 'ko' ? '평균 숙련도' : 'Avg Proficiency'}
            </span>
            <div className="text-xl font-black font-mono text-emerald-600 mt-1 truncate">
              ★ {overviewStats.avgScore}점
            </div>
          </div>

          {/* 강점 / 약점 */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 truncate">
              {language === 'ko' ? '강점 / 약점' : 'Strong / Weak'}
            </span>
            <div className="text-sm font-black font-mono mt-1.5 truncate">
              <span className="text-emerald-600 font-bold">강 {overviewStats.strongCount}</span>
              <span className="text-slate-300 mx-1">/</span>
              <span className="text-rose-600 font-bold">약 {overviewStats.weakCount}</span>
            </div>
          </div>

          {/* 30일 복습 */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 truncate">
              {language === 'ko' ? '30일 복습' : 'Recent 30 Days'}
            </span>
            <div className="text-xl font-black font-mono text-blue-600 mt-1 truncate">
              {overviewStats.recent30DaysSessions}회
            </div>
          </div>
        </div>

        {/* 2. Position Stats (포지션 통계 - 가로형 막대그래프) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 truncate">
              <Folder className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="truncate">{language === 'ko' ? '포지션 통계' : 'Position Stats'}</span>
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-bold shrink-0">
              <button
                type="button"
                onClick={() => setPositionSortBy('count_desc')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  positionSortBy === 'count_desc' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {language === 'ko' ? '보유순' : 'Count'}
              </button>
              <button
                type="button"
                onClick={() => setPositionSortBy('score_desc')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  positionSortBy === 'score_desc' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {language === 'ko' ? '숙련도순' : 'Score'}
              </button>
              <button
                type="button"
                onClick={() => setPositionSortBy('score_asc')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  positionSortBy === 'score_asc' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {language === 'ko' ? '취약순' : 'Weak'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {positionFolderStats.map((item, idx) => {
              const isExpanded = expandedPositionFolder === item.position;
              const barWidthPct = Math.max(6, Math.round((item.total / maxPosTotal) * 100));

              let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
              let badgeText = language === 'ko' ? '미평가' : 'Unrated';
              let barColor = 'bg-gradient-to-r from-slate-300 to-slate-400';

              if (item.avgScore >= settings.highScoreThreshold) {
                badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                badgeText = language === 'ko' ? '주력 강점' : 'Strength';
                barColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
              } else if (item.avgScore > 0 && item.avgScore <= settings.lowScoreThreshold) {
                badgeBg = 'bg-rose-50 text-rose-800 border-rose-300';
                badgeText = language === 'ko' ? '취약 병목' : 'Bottleneck';
                barColor = 'bg-gradient-to-r from-rose-500 to-amber-400';
              } else if (item.avgScore > 0) {
                badgeBg = 'bg-sky-50 text-sky-800 border-sky-300';
                badgeText = language === 'ko' ? '발전 구간' : 'Developing';
                barColor = 'bg-gradient-to-r from-sky-500 to-indigo-400';
              }

              return (
                <div
                  key={item.position}
                  onClick={() => setExpandedPositionFolder(isExpanded ? null : item.position)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isExpanded ? 'border-sky-400 bg-sky-50/20 shadow-xs' : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-extrabold text-slate-900 truncate text-xs">
                        {idx + 1}. {translatePosition(item.position, language, metadata.positions)}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${badgeBg}`}>
                        {badgeText}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600 shrink-0">
                      <span className="font-bold text-slate-900">{item.total}개</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-extrabold text-emerald-600">
                        {item.avgScore > 0 ? `★${item.avgScore}` : '-'}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-sky-600' : ''}`} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${barWidthPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0 w-8 text-right">
                      {item.pct}%
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-200 space-y-1.5 mt-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Gi {item.giCount} / No-Gi {item.nogiCount}</span>
                        {item.submissionCount > 0 && <span className="text-amber-700 font-bold">피니시 {item.submissionCount}개</span>}
                      </div>
                      <div className="space-y-1">
                        {item.videos.map((v) => (
                          <div
                            key={v.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenModal(v, 'view');
                            }}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-sky-50/60 border border-slate-200 text-xs transition-colors cursor-pointer"
                          >
                            <span className="font-semibold text-slate-800 truncate">{v.titleKo}</span>
                            <span className="font-mono text-emerald-600 font-bold shrink-0">{v.proficiencyScore > 0 ? `★${v.proficiencyScore}` : '-'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Area Breakdown (영역 분석) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 truncate">
              <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate">{language === 'ko' ? '영역 분석' : 'Technique Area Analysis'}</span>
            </h3>
          </div>

          {/* Diagnostic Report text banner (clean, single-line truncated) */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 font-medium truncate flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{diagnosticReportText}</span>
          </div>

          <div className="space-y-2">
            {radarAxes.map((axis) => (
              <div key={axis.label} className="p-2.5 rounded-xl bg-white border border-slate-200/70 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 truncate text-[11px]">{axis.label}</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
                    <span className="text-blue-600 font-bold">{axis.count}개</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-emerald-600 font-bold">★ {axis.avgScore}점</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                  <div className="h-full bg-blue-500 rounded-l-full transition-all duration-500" style={{ width: `${axis.countNorm}%` }} />
                  <div className="h-full bg-emerald-500 rounded-r-full transition-all duration-500" style={{ width: `${axis.scoreNorm}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Neglected Techniques (방치된 기술 알림 - Deduplicated, single clean instance) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 truncate">
              <Clock className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="truncate">{language === 'ko' ? `방치된 기술 (${neglectedTechniques.length}개)` : `Neglected Techniques (${neglectedTechniques.length})`}</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-medium truncate">
              {settings.neglectedDaysThreshold}일 이상 미수련
            </span>
          </div>

          <div className="space-y-2">
            {neglectedTechniques.length === 0 ? (
              <div className="p-3 text-center text-xs text-emerald-700 bg-emerald-50/70 border border-emerald-200 rounded-xl font-bold truncate">
                ✅ {language === 'ko' ? '모든 기술을 주기적으로 복습하고 있습니다!' : 'All techniques are reviewed!'}
              </div>
            ) : (
              neglectedTechniques.slice(0, 8).map(({ video, lastDate, elapsedDays }) => (
                <div key={video.id} className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-2 hover:border-slate-300 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">{video.titleKo}</div>
                    <div className="text-[10px] text-rose-600 font-mono truncate mt-0.5">
                      {elapsedDays === null ? '수련 이력 없음' : `${elapsedDays}일 경과 (${formatDateKorean(lastDate)})`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const todayStr = new Date().toISOString().slice(0, 10);
                      onQuickAssignToday(video.id);
                      const updatedVideo: TechniqueVideo = {
                        ...video,
                        practiceDates: video.practiceDates.includes(todayStr)
                          ? video.practiceDates
                          : [...video.practiceDates, todayStr].sort(),
                        updatedAt: new Date().toISOString(),
                      };
                      onOpenModal(updatedVideo, 'view', todayStr);
                      setSummonNotice(
                        language === 'ko'
                          ? `'${video.titleKo}' 오늘 수련 추가 완료`
                          : `'${video.titleEn || video.titleKo}' added to today`
                      );
                      setTimeout(() => setSummonNotice(null), 3000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold shrink-0 shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    + {language === 'ko' ? '수련' : 'Practice'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 5. Gi vs No-Gi Ratio (Gi vs No-Gi 보유 비중) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-3 shadow-2xs">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100 truncate">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">{language === 'ko' ? 'Gi vs No-Gi 보유 비중' : 'Gi vs No-Gi Ratio'}</span>
          </h3>
          <div className="space-y-2">
            {[
              {
                label: language === 'ko' ? 'Gi (도복 전용)' : 'Gi Only',
                count: giComparison.gi.count,
                avg: giComparison.gi.avg,
                barColor: 'bg-blue-600',
              },
              {
                label: language === 'ko' ? 'No-Gi (노기 / 레슬링)' : 'No-Gi (Wrestling)',
                count: giComparison.nogi.count,
                avg: giComparison.nogi.avg,
                barColor: 'bg-rose-600',
              },
              {
                label: language === 'ko' ? 'All (도복/노기 공통)' : 'All (Both)',
                count: giComparison.all.count,
                avg: giComparison.all.avg,
                barColor: 'bg-emerald-600',
              },
            ].map((row) => {
              const pct = filteredVideos.length > 0 ? Math.round((row.count / filteredVideos.length) * 100) : 0;
              return (
                <div key={row.label} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 text-[11px] truncate">{row.label}</span>
                    <span className="font-mono text-[11px] text-slate-600 shrink-0 truncate">
                      {row.count}개 ({pct}%) · <strong className="text-slate-900">★ {row.avg}</strong>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${row.barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DESKTOP RICH DASHBOARD (hidden md:block) */}
      {/* ============================================================ */}
      <div className="hidden md:block space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. 영상 보유 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="text-xs font-semibold text-slate-500 whitespace-nowrap truncate">
              {language === 'ko' ? '영상 보유' : 'Total Videos'}
            </div>
            <div className="mt-2 flex items-baseline">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 whitespace-nowrap">
                {overviewStats.total}{language === 'ko' ? '개' : ''}
              </span>
            </div>
          </div>

          {/* 2. 숙련도 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="text-xs font-semibold text-slate-500 whitespace-nowrap truncate">
              {language === 'ko' ? '숙련도' : 'Avg Proficiency'}
            </div>
            <div className="mt-2 flex items-baseline">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-600 whitespace-nowrap">
                {overviewStats.avgScore}{language === 'ko' ? '점' : ' pts'}
              </span>
            </div>
          </div>

          {/* 3. 강점 및 약점 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="text-xs font-semibold text-slate-500 whitespace-nowrap truncate">
              {language === 'ko' ? '강점 및 약점' : 'Strengths & Weaknesses'}
            </div>
            <div className="mt-2 flex items-baseline gap-1 font-mono tabular-nums whitespace-nowrap overflow-hidden">
              <span className="text-xs sm:text-sm font-bold text-emerald-600 whitespace-nowrap">
                {language === 'ko' ? `강점 ${overviewStats.strongCount}개` : `Strong ${overviewStats.strongCount}`}
              </span>
              <span className="text-slate-300 font-normal">/</span>
              <span className="text-xs sm:text-sm font-bold text-rose-600 whitespace-nowrap">
                {language === 'ko' ? `약점 ${overviewStats.weakCount}개` : `Weak ${overviewStats.weakCount}`}
              </span>
            </div>
          </div>

          {/* 4. 복습 (30일 이내) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="text-xs font-semibold text-slate-500 whitespace-nowrap truncate">
              {language === 'ko' ? '복습 (30일 이내)' : 'Reviews (30 Days)'}
            </div>
            <div className="mt-2 flex items-baseline">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-blue-600 whitespace-nowrap">
                {overviewStats.recent30DaysSessions}{language === 'ko' ? '회' : ' sessions'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 1. 기술 통계 Box */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-2.5 shadow-2xs flex flex-col justify-between h-auto min-h-[270px] lg:h-[270px] overflow-hidden">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 shrink-0">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>{language === 'ko' ? '기술 통계' : 'Technique Stats'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(true)}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title={language === 'ko' ? '오각형 차트 크게 보기' : 'Enlarge Radar Chart'}
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>{language === 'ko' ? '크게 보기' : 'Expand'}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 min-h-0 overflow-hidden">
              <div
                onClick={() => setIsZoomModalOpen(true)}
                className="group relative w-48 h-48 sm:w-36 sm:h-36 lg:w-44 lg:h-44 shrink-0 mx-auto flex items-center justify-center cursor-pointer p-1 rounded-2xl hover:bg-slate-50 transition-colors"
                title={language === 'ko' ? '클릭하여 오각형 차트 크게 보기' : 'Click to enlarge chart'}
              >
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 transition-opacity z-10 pointer-events-none shadow-xs">
                  <ZoomIn className="w-3 h-3" />
                  <span>{language === 'ko' ? '확대' : 'Zoom'}</span>
                </div>
                <svg viewBox="0 0 300 300" className="w-full h-full group-hover:scale-105 transition-transform duration-200">
                  {[25, 50, 75, 100].map((level) => (
                    <polygon
                      key={level}
                      points={computeRadarPolygon([
                        level,
                        level,
                        level,
                        level,
                        level,
                      ])}
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  ))}

                  {[0, 1, 2, 3, 4].map((i) => {
                    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                    const x = 150 + Math.cos(angle) * 102;
                    const y = 150 + Math.sin(angle) * 102;
                    const lx = 150 + Math.cos(angle) * 128;
                    const ly = 150 + Math.sin(angle) * 122;
                    const shortLabels = language === 'ko'
                      ? ['가드 운용', '가드 패스', '서브미션', '이스케이프', '테이크다운']
                      : ['Guard Play', 'Guard Pass', 'Submission', 'Escape', 'Takedown'];
                    return (
                      <g key={i}>
                        <line
                          x1="150"
                          y1="150"
                          x2={x}
                          y2={y}
                          stroke="#cbd5e1"
                          strokeWidth="1"
                        />
                        <text
                          x={lx}
                          y={ly}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-[10px] font-bold fill-slate-700"
                        >
                          {shortLabels[i]}
                        </text>
                      </g>
                    );
                  })}

                  <polygon
                    points={computeRadarPolygon(
                      radarAxes.map((a) => a.countNorm)
                    )}
                    fill="rgba(37, 99, 235, 0.16)"
                    stroke="#2563eb"
                    strokeWidth="2"
                  />

                  <polygon
                    points={computeRadarPolygon(
                      radarAxes.map((a) => a.scoreNorm)
                    )}
                    fill="rgba(16, 185, 129, 0.22)"
                    stroke="#059669"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <div className="flex-1 w-full space-y-1 sm:space-y-1.5 overflow-y-auto max-h-[190px] pr-0.5 custom-scrollbar">
                {radarAxes.map((axis) => (
                  <div
                    key={axis.label}
                    className="px-2.5 py-1.25 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs transition-colors hover:bg-slate-100/70"
                  >
                    <span className="font-semibold text-slate-800 text-[11px] truncate mr-2">
                      {axis.label}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono tabular-nums text-[11px] shrink-0 whitespace-nowrap">
                      <span className="text-blue-600 font-bold">
                        {axis.count}{language === 'ko' ? '개' : ''}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-emerald-600 font-bold">
                        {language === 'ko' ? `평균 ${axis.avgScore}점` : `Avg ${axis.avgScore} pts`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. 포지션 통계 Box (Desktop Horizontal Bar Chart) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-2.5 shadow-2xs overflow-hidden flex flex-col justify-between h-auto min-h-[270px] lg:h-[270px]">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-indigo-600" />
                  <span>{language === 'ko' ? '포지션 통계 (가로형 막대그래프)' : 'Position Stats (Horizontal Chart)'}</span>
                </h2>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto text-[11px]">
                <button
                  type="button"
                  onClick={() => setPositionSortBy('count_desc')}
                  className={`px-2 py-0.5 font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    positionSortBy === 'count_desc'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'ko' ? '보유량순' : 'By Count'}
                </button>
                <button
                  type="button"
                  onClick={() => setPositionSortBy('score_desc')}
                  className={`px-2 py-0.5 font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    positionSortBy === 'score_desc'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'ko' ? '숙련도순' : 'By Score'}
                </button>
                <button
                  type="button"
                  onClick={() => setPositionSortBy('score_asc')}
                  className={`px-2 py-0.5 font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    positionSortBy === 'score_asc'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'ko' ? '취약순' : 'Weakest'}
                </button>
                <button
                  type="button"
                  onClick={() => setPositionSortBy('recent')}
                  className={`px-2 py-0.5 font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    positionSortBy === 'recent'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'ko' ? '최근수련순' : 'Recent'}
                </button>
              </div>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
              {positionFolderStats.map((item, idx) => {
                const isExpanded = expandedPositionFolder === item.position;
                const barWidthPct = Math.max(6, Math.round((item.total / maxPosTotal) * 100));

                let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
                let badgeText = language === 'ko' ? '미평가' : 'Unrated';
                let barColor = 'bg-gradient-to-r from-slate-300 to-slate-400';

                if (item.avgScore >= settings.highScoreThreshold) {
                  badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                  badgeText = language === 'ko' ? '주력 강점' : 'Strength';
                  barColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
                } else if (item.avgScore > 0 && item.avgScore <= settings.lowScoreThreshold) {
                  badgeBg = 'bg-rose-50 text-rose-800 border-rose-300';
                  badgeText = language === 'ko' ? '취약 병목' : 'Bottleneck';
                  barColor = 'bg-gradient-to-r from-rose-500 to-amber-400';
                } else if (item.avgScore > 0) {
                  badgeBg = 'bg-sky-50 text-sky-800 border-sky-300';
                  badgeText = language === 'ko' ? '발전 구간' : 'Developing';
                  barColor = 'bg-gradient-to-r from-sky-500 to-indigo-400';
                }

                return (
                  <div
                    key={item.position}
                    onClick={() => setExpandedPositionFolder(isExpanded ? null : item.position)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      isExpanded ? 'border-sky-400 bg-sky-50/20 shadow-xs' : 'border-slate-200/90 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-extrabold text-slate-900 truncate text-xs">
                          {idx + 1}. {translatePosition(item.position, language, metadata.positions)}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${badgeBg}`}>
                          {badgeText}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 shrink-0">
                        <span className="font-bold text-slate-900">{item.total}{language === 'ko' ? '개' : ' vids'}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-extrabold text-emerald-600">
                          {item.avgScore > 0 ? `★ ${item.avgScore}` : (language === 'ko' ? '미평가' : 'Unrated')}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-sky-600' : ''}`} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${barWidthPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0 w-8 text-right">
                        {item.pct}%
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-200 space-y-2 mt-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <span>Gi {item.giCount} / No-Gi {item.nogiCount}</span>
                          {item.submissionCount > 0 && <span className="text-amber-700 font-bold">피니시 {item.submissionCount}개</span>}
                        </div>
                        <div className="space-y-1">
                          {item.videos.map((v) => (
                            <div
                              key={v.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenModal(v, 'view');
                              }}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200 text-xs transition-colors cursor-pointer"
                            >
                              <span className="font-semibold text-slate-800 truncate">{v.titleKo}</span>
                              <span className="font-mono text-emerald-600 font-bold shrink-0">{v.proficiencyScore > 0 ? `★ ${v.proficiencyScore}` : '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop-only secondary widgets grid */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Selector 3: Gi vs No-Gi */}
        <div style={{ height: '303px' }} className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 overflow-hidden flex flex-col justify-between">
          <div className="shrink-0">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>{language === 'ko' ? 'Gi vs No-Gi 보유량 및 숙련도 비교' : 'Gi vs No-Gi Count & Proficiency'}</span>
            </h2>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
            {[
              {
                label: language === 'ko' ? 'Gi (도복 전용)' : 'Gi Only',
                count: giComparison.gi.count,
                avg: giComparison.gi.avg,
                barColor: 'bg-blue-600',
              },
              {
                label: language === 'ko' ? 'No-Gi (노기 / 레슬링)' : 'No-Gi (Wrestling)',
                count: giComparison.nogi.count,
                avg: giComparison.nogi.avg,
                barColor: 'bg-rose-600',
              },
              {
                label: language === 'ko' ? 'All (도복/노기 공통)' : 'All (Both Gi/No-Gi)',
                count: giComparison.all.count,
                avg: giComparison.all.avg,
                barColor: 'bg-emerald-600',
              },
            ].map((row) => {
              const pct =
                videos.length > 0
                  ? Math.round((row.count / videos.length) * 100)
                  : 0;
              return (
                <div
                  key={row.label}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      {row.label}
                    </span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {row.count}{language === 'ko' ? '개' : ''} ({pct}%) ·{' '}
                      <strong className="text-slate-900">
                        {language === 'ko' ? `평균 ${row.avg}점` : `Avg ${row.avg} pts`}
                      </strong>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${row.barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selector 1: 테크 트리 고립 노드 */}
        <div style={{ height: '303px' }} className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 overflow-hidden flex flex-col justify-between">
          <div className="shrink-0">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-amber-600" />
              <span>
                {language === 'ko'
                  ? `테크 트리 고립 노드 (${isolatedTechniques.length}개)`
                  : `Isolated Tech Tree Nodes (${isolatedTechniques.length})`}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ko' ? '연계 체인이 연결되지 않은 기술입니다.' : 'Techniques with no linked follow-up chain.'}
            </p>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
            {isolatedTechniques.length === 0 ? (
              <div className="p-4 text-center text-xs text-emerald-700 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
                {language === 'ko' ? '모든 기술이 유기적으로 연결되어 있습니다!' : 'All techniques are organically connected!'}
              </div>
            ) : (
              isolatedTechniques.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {language === 'en' ? (v.titleEn || v.titleKo) : v.titleKo}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {v.position} · {language === 'ko' ? '후속 연계 미지정' : 'No follow-up linked'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenModal(v, 'view')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 shrink-0 cursor-pointer whitespace-nowrap"
                    title={language === 'ko' ? '기술 상세 뷰어를 엽니다' : 'Open technique viewer'}
                  >
                    <Play className="w-3 h-3 text-indigo-600" />
                    <span>{language === 'ko' ? '열기' : 'Open'}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selector 2: 방치된 기술 알림 */}
        <div style={{ height: '303px' }} className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 overflow-hidden flex flex-col justify-between">
          <div className="shrink-0">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              <span>
                {language === 'ko'
                  ? `방치된 기술 알림 (${neglectedTechniques.length}개)`
                  : `Neglected Technique Alerts (${neglectedTechniques.length})`}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ko'
                ? `${settings.neglectedDaysThreshold}일 이상 미수련 상태인 기술입니다.`
                : `Techniques unpracticed for ${settings.neglectedDaysThreshold}+ days.`}
            </p>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
            {neglectedTechniques.length === 0 ? (
              <div className="p-4 text-center text-xs text-emerald-700 bg-emerald-50 rounded-xl">
                {language === 'ko' ? '모든 기술을 주기적으로 복습하고 있습니다!' : 'All techniques are being reviewed regularly!'}
              </div>
            ) : (
              neglectedTechniques.map(({ video, lastDate, elapsedDays }) => (
                <div
                  key={video.id}
                  className="p-3 rounded-xl bg-rose-50/50 border border-rose-200/80 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {language === 'en' ? (video.titleEn || video.titleKo) : video.titleKo}
                    </div>
                    <div className="text-[11px] text-rose-700 font-mono tabular-nums mt-0.5">
                      {elapsedDays === null
                        ? (language === 'ko' ? '수련 이력 없음' : 'No practice history')
                        : (language === 'ko' ? `${elapsedDays}일 경과 (${formatDateKorean(lastDate)})` : `${elapsedDays} days ago (${lastDate})`)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const todayStr = new Date().toISOString().slice(0, 10);
                      onQuickAssignToday(video.id);
                      const updatedVideo: TechniqueVideo = {
                        ...video,
                        practiceDates: video.practiceDates.includes(todayStr)
                          ? video.practiceDates
                          : [...video.practiceDates, todayStr].sort(),
                        updatedAt: new Date().toISOString(),
                      };
                      onOpenModal(updatedVideo, 'view', todayStr);
                      setSummonNotice(
                        language === 'ko'
                          ? `'${video.titleKo}' 기술이 오늘 수련 일지에 추가되고 상세 뷰어가 실행되었습니다.`
                          : `'${video.titleEn || video.titleKo}' added to today's journal and opened.`
                      );
                      setTimeout(() => setSummonNotice(null), 4000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 cursor-pointer whitespace-nowrap shadow-xs active:scale-95 transition-all"
                    title={language === 'ko' ? '이 기술을 오늘 날짜 수련 일지에 추가하고 즉시 상세 뷰어를 엽니다' : 'Add to today journal and open viewer'}
                  >
                    <Play className="w-3 h-3" />
                    <span>{language === 'ko' ? '열기' : 'Open'}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Radar Chart Zoom Modal */}
      {isZoomModalOpen && (
        <div
          onClick={() => setIsZoomModalOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl relative border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {language === 'ko' ? '기술 능력치 오각형 차트 (확대)' : 'Technique Radar Chart (Enlarged)'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {language === 'ko' ? '보유량(파란색) 및 평균 숙련도(초록색) 정밀 비교' : 'Detailed comparison of Volume (Blue) & Avg Proficiency (Green)'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Enlarged SVG Chart */}
            <div className="w-60 h-64 sm:w-72 sm:h-72 mx-auto bg-slate-50/70 rounded-2xl border border-slate-100 p-2 flex items-center justify-center shadow-inner">
              <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-xs">
                {[25, 50, 75, 100].map((level) => (
                  <polygon
                    key={level}
                    points={computeRadarPolygon([level, level, level, level, level])}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    strokeDasharray={level < 100 ? '2 2' : undefined}
                  />
                ))}

                {[0, 1, 2, 3, 4].map((i) => {
                  const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                  const x = 150 + Math.cos(angle) * 102;
                  const y = 150 + Math.sin(angle) * 102;
                  const lx = 150 + Math.cos(angle) * 128;
                  const ly = 150 + Math.sin(angle) * 122;
                  const shortLabels = language === 'ko'
                    ? ['가드 운용', '가드 패스', '서브미션', '이스케이프', '테이크다운']
                    : ['Guard Play', 'Guard Pass', 'Submission', 'Escape', 'Takedown'];
                  return (
                    <g key={i}>
                      <line
                        x1="150"
                        y1="150"
                        x2={x}
                        y2={y}
                        stroke="#94a3b8"
                        strokeWidth="1"
                      />
                      <text
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[11px] font-bold fill-slate-800"
                      >
                        {shortLabels[i]}
                      </text>
                    </g>
                  );
                })}

                <polygon
                  points={computeRadarPolygon(radarAxes.map((a) => a.countNorm))}
                  fill="rgba(37, 99, 235, 0.22)"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                />

                <polygon
                  points={computeRadarPolygon(radarAxes.map((a) => a.scoreNorm))}
                  fill="rgba(16, 185, 129, 0.28)"
                  stroke="#059669"
                  strokeWidth="2.5"
                />
              </svg>
            </div>

            {/* Legend & Breakdown Table */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold">
                <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
                  <span>{language === 'ko' ? '보유 기술 수 (Volume)' : 'Technique Volume'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
                  <span>{language === 'ko' ? '평균 숙련도 (Proficiency)' : 'Avg Proficiency'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {radarAxes.map((axis) => (
                  <div
                    key={axis.label}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <span className="font-bold text-slate-800 text-xs">
                      {axis.label}
                    </span>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-blue-700 font-bold">{axis.count}{language === 'ko' ? '개' : ''}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-emerald-700 font-black">
                        ★ {axis.avgScore}{language === 'ko' ? '점' : ' pts'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                {language === 'ko' ? '닫기' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
