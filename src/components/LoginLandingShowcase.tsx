import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Youtube,
  Instagram,
  Sparkles,
  HelpCircle,
  Award,
  Sliders,
  Check,
  Video,
} from 'lucide-react';
import { LandingShowcaseConfig } from '../types';
import { DEFAULT_LANDING_SHOWCASE } from '../data/initialData';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface LoginLandingShowcaseProps {
  onGoogleSignIn: () => void;
  authError: string | null;
  onClearAuthError: () => void;
  appTitle?: string;
  appSubtitle?: string;
  logoImageUrl?: string;
  logoText?: string;
  landingConfig?: LandingShowcaseConfig;
  primaryColor?: string;
}

export const LoginLandingShowcase: React.FC<LoginLandingShowcaseProps> = ({
  onGoogleSignIn,
  authError,
  onClearAuthError,
  appTitle = '주짓수 스케치',
  appSubtitle = '수련자 전용 테크트리 & 클라우드 아카이브',
  logoImageUrl,
  logoText = 'BJJ',
  landingConfig,
  primaryColor,
}) => {
  const { t, language } = useLanguage();
  const themeColor = primaryColor || '#0ea5e9';

  // Merge prop config with defaults
  const config: LandingShowcaseConfig = {
    ...DEFAULT_LANDING_SHOWCASE,
    ...landingConfig,
  };

  const features =
    config.featuresList && config.featuresList.length > 0
      ? config.featuresList
      : DEFAULT_LANDING_SHOWCASE.featuresList || [];

  // Single active accordion index: opening one closes all other cards!
  const [openedIndex, setOpenedIndex] = useState<number | null>(0);

  const toggleFeature = (index: number) => {
    if (openedIndex === index) {
      // Clicking the currently open card closes it
      setOpenedIndex(null);
    } else {
      // Opening another card opens only that card and closes all others!
      setOpenedIndex(index);
    }
  };

  const currentFeature =
    (openedIndex !== null ? features[openedIndex] : null) || features[0];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-slate-100 overflow-x-hidden w-full">
      {/* Top Header Navbar: Pure White with Brand Theme Accent */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            {/* Custom Logo Image or Brand Theme Badge */}
            {logoImageUrl ? (
              <img
                src={logoImageUrl}
                alt={appTitle}
                referrerPolicy="no-referrer"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain border border-slate-200 shrink-0 shadow-xs bg-white"
              />
            ) : (
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-xs shrink-0 tracking-tight"
                style={{ backgroundColor: themeColor }}
              >
                {logoText}
              </div>
            )}

            <div className="flex flex-col items-start justify-center leading-tight select-none min-w-0">
              <span className="text-slate-900 font-black text-base sm:text-lg md:text-xl tracking-tight truncate max-w-[150px] xs:max-w-[220px] sm:max-w-xs md:max-w-none">
                {appTitle}
              </span>
              {appSubtitle && (
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-md hidden xs:block">
                  {appSubtitle}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {((config.showYoutube ?? true) || (config.showInstagram ?? true)) && (
              <div className="hidden md:flex items-center gap-1 border-r border-slate-200 pr-3 text-slate-400">
                {(config.showYoutube ?? true) && (
                  <a
                    href={config.youtubeUrl || 'https://youtube.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="유튜브 채널 바로가기"
                    className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {(config.showInstagram ?? true) && (
                  <a
                    href={config.instagramUrl || 'https://instagram.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="인스타그램 바로가기"
                    className="p-1.5 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}

            <LanguageSwitcher variant="pill" primaryColor={themeColor} />

            <button
              type="button"
              onClick={onGoogleSignIn}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0"
              style={{ backgroundColor: themeColor }}
            >
              <svg className="w-3.5 h-3.5 bg-white p-0.5 rounded-full shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="hidden sm:inline">
                {language === 'ko' ? (config.headerLoginButtonText || 'Google 로그인') : 'Sign in'}
              </span>
              <span className="sm:hidden">
                {language === 'ko' ? '로그인' : 'Login'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </button>
          </div>
        </div>
        <div
          className="h-[3px] w-full"
          style={{
            background: `linear-gradient(90deg, ${themeColor} 0%, ${themeColor}80 40%, transparent 100%)`,
          }}
        />
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 flex-1 w-full space-y-6 sm:space-y-10">
        {/* Optional Hero Banner Image if uploaded in Admin */}
        {config.heroImageUrl && (
          <div className="w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-sm aspect-video sm:aspect-21/9 bg-slate-50">
            <img
              src={config.heroImageUrl}
              alt={appTitle}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Auth Error Banner if popup fails */}
        {authError && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-xs animate-in fade-in break-keep">
            <span>{authError}</span>
            <button
              type="button"
              onClick={onClearAuthError}
              className="text-rose-500 hover:text-rose-700 font-bold text-base cursor-pointer p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Empathy Section [공감 문구] "이런 적 있으신가요?" */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-2xs space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm" style={{ color: themeColor }}>
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" style={{ color: themeColor }} />
            <span className="tracking-tight break-keep">
              {config.empathyTitle || '[공감 문구] "이런 적 있으신가요?"'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {(config.empathyPoints || []).map((pt, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 sm:space-y-2 hover:bg-slate-50/90 transition-colors"
              >
                <div
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl text-white flex items-center justify-center font-bold text-[11px] sm:text-xs shadow-2xs shrink-0"
                  style={{ backgroundColor: themeColor }}
                >
                  0{idx + 1}
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-keep">
                  {pt.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed break-keep">
                  {pt.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Interactive Feature Tour / Accordion Showcase */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-2xs space-y-5 sm:space-y-6">
          {/* Top Title & Subheadline */}
          <div className="space-y-1.5">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold border"
              style={{
                backgroundColor: `${themeColor}15`,
                color: themeColor,
                borderColor: `${themeColor}35`,
              }}
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" style={{ color: themeColor }} />
              <span>{config.featuresBadge || '핵심 솔루션 안내'}</span>
            </div>
            <h2 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug break-keep">
              {config.headline ||
                config.featuresTitle ||
                '비싸고 막상 필요한 기능은 없는 범용 프로그램, 아직도 쓰세요?'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed break-keep">
              {config.subheadline ||
                `${appTitle}는 수련자가 필요로 하는 기술 체계와 영상 복습을 직관적으로 제공합니다.`}
            </p>
          </div>

          {/* Highlight Pill with Theme Color */}
          <div
            className="p-3 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-xs font-semibold"
            style={{
              backgroundColor: `${themeColor}10`,
              borderColor: `${themeColor}30`,
            }}
          >
            <span className="font-bold flex items-center gap-1.5 break-keep" style={{ color: themeColor }}>
              <Check className="w-3.5 h-3.5 shrink-0" style={{ color: themeColor }} />
              {config.featuresHighlightTitle ||
                '합리적인 무료 클라우드로 즉시 시작하세요'}
            </span>
            <span className="text-slate-600 text-[10px] sm:text-[11px] break-keep">
              {config.featuresHighlightSub ||
                'Google 원클릭 계정 연동으로 나만의 독립된 기술 아카이브가 즉시 생성됩니다.'}
            </span>
          </div>

          {/* 2-Column Container: Left Accordion Items, Right Interactive Image Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start pt-1 sm:pt-2">
            {/* Left Column: Expandable/Collapsible Accordion List (Single open card behavior) */}
            <div className="lg:col-span-6 space-y-2 sm:space-y-2.5">
              {features.map((f, idx) => {
                const isOpen = openedIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isOpen
                        ? 'shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    style={
                      isOpen
                        ? {
                            backgroundColor: `${themeColor}0c`,
                            borderColor: `${themeColor}50`,
                          }
                        : undefined
                    }
                  >
                    <button
                      type="button"
                      onClick={() => toggleFeature(idx)}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3 text-left cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <span
                          className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 transition-all"
                          style={{
                            backgroundColor: isOpen ? themeColor : '#cbd5e1',
                            boxShadow: isOpen ? `0 0 0 3px ${themeColor}30` : undefined,
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <span
                            className="text-xs sm:text-sm block font-bold break-keep leading-tight"
                            style={{
                              color: isOpen ? themeColor : '#1e293b',
                              fontWeight: isOpen ? 900 : 700,
                            }}
                          >
                            {f.title}
                          </span>
                          {f.subtitle && (
                            <span
                              className="text-[10px] sm:text-[11px] font-medium block break-keep mt-0.5"
                              style={{ color: isOpen ? themeColor : '#64748b' }}
                            >
                              {f.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-slate-400 shrink-0 p-0.5">
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4" style={{ color: themeColor }} />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Accordion Content (Only the currently open card is visible) */}
                    {isOpen && (
                      <div
                        className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1 border-t text-[11px] sm:text-xs text-slate-700 leading-relaxed space-y-2 animate-in fade-in duration-150"
                        style={{ borderColor: `${themeColor}20` }}
                      >
                        <p className="whitespace-pre-line text-slate-700 break-keep">
                          {f.desc}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Column: Active Feature Preview / Attached Image Showcase */}
            <div className="lg:col-span-6 bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-200 p-3.5 sm:p-6 flex flex-col items-center justify-center min-h-[260px] sm:min-h-[380px] shadow-inner relative overflow-hidden">
              {/* Header Label inside Right Preview Card */}
              <div className="w-full flex items-center justify-between pb-2.5 sm:pb-3 mb-2.5 sm:mb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse shrink-0"
                    style={{ backgroundColor: themeColor }}
                  />
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {currentFeature?.title || '핵심 기능 미리보기'}
                  </span>
                </div>
                <span
                  className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
                  style={{
                    backgroundColor: `${themeColor}15`,
                    color: themeColor,
                    borderColor: `${themeColor}35`,
                  }}
                >
                  {currentFeature?.subtitle || '솔루션 화면'}
                </span>
              </div>

              {currentFeature?.imageUrl ? (
                /* Custom uploaded preview image attached by admin */
                <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white flex items-center justify-center">
                  <img
                    src={currentFeature.imageUrl}
                    alt={currentFeature.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[360px] sm:max-h-[420px] object-contain rounded-xl"
                  />
                </div>
              ) : (
                /* High-fidelity Mock UI Card with Brand Theme */
                <div className="w-full max-w-sm space-y-2.5 sm:space-y-3">
                  <div
                    className="bg-white rounded-2xl p-3.5 sm:p-4 border text-slate-900 space-y-2.5 sm:space-y-3 shadow-xs"
                    style={{ borderColor: `${themeColor}35` }}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-white flex items-center justify-center font-black text-[10px] sm:text-xs shrink-0"
                          style={{ backgroundColor: themeColor }}
                        >
                          {logoText}
                        </div>
                        <span className="text-xs font-black text-slate-900 truncate">
                          {currentFeature?.title || appTitle}
                        </span>
                      </div>
                      <span
                        className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
                        style={{
                          backgroundColor: `${themeColor}15`,
                          color: themeColor,
                          borderColor: `${themeColor}35`,
                        }}
                      >
                        실시간 연동
                      </span>
                    </div>

                    {/* Mock Notification / Card items */}
                    <div className="space-y-2">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-[10px] sm:text-[11px] font-bold text-slate-900 truncate">
                            출석 & 일지 기록
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-slate-500 truncate">
                            타임스탬프 자동 캡처 ON
                          </div>
                        </div>
                        <div
                          className="w-7 h-3.5 sm:w-8 sm:h-4 rounded-full flex items-center justify-end px-0.5 shrink-0"
                          style={{ backgroundColor: themeColor }}
                        >
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white shadow-xs" />
                        </div>
                      </div>

                      <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-[10px] sm:text-[11px] font-bold text-slate-900 truncate">
                            복습 알림 브리핑
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-slate-500 truncate">
                            60일 경과 취약 포지션 알림
                          </div>
                        </div>
                        <div
                          className="w-7 h-3.5 sm:w-8 sm:h-4 rounded-full flex items-center justify-end px-0.5 shrink-0"
                          style={{ backgroundColor: themeColor }}
                        >
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white shadow-xs" />
                        </div>
                      </div>

                      <div
                        className="p-2 sm:p-2.5 rounded-xl border flex items-center gap-2 sm:gap-2.5"
                        style={{
                          backgroundColor: `${themeColor}10`,
                          borderColor: `${themeColor}30`,
                        }}
                      >
                        <div
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-white flex items-center justify-center shrink-0 shadow-2xs"
                          style={{ backgroundColor: themeColor }}
                        >
                          <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] sm:text-[11px] font-bold text-slate-900 truncate">
                            라쏘 가드 스윕 & 오모플라타
                          </div>
                          <div className="text-[9px] font-mono truncate" style={{ color: themeColor }}>
                            숙련도 9점 · 프레임 3단계 완료
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-0.5 text-center">
                      <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold break-keep">
                        {currentFeature?.subtitle || '체계적인 수련 데이터 관리'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Footer Callout Line */}
          <div className="pt-2 text-center text-[11px] sm:text-xs text-slate-500 font-medium break-keep">
            {config.featuresFooterCallout || (
              <>
                <strong className="font-bold text-slate-900">
                  쉽게 바로 시작해요
                </strong>{' '}
                — 별도 설치 없이 웹 브라우저에서 바로 시작하고, 개인 데이터는
                암호화되어 안전하게 보관됩니다.
              </>
            )}
          </div>
        </section>

        {/* 3. Before vs After Comparison [간단 비교] 사용 전과 후 */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-2xs space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base md:text-lg">
            <Sliders className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" style={{ color: themeColor }} />
            <span className="break-keep">{config.comparisonTitle || '[간단 비교] 사용 전과 후'}</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 -mx-1 sm:mx-0">
            <table className="min-w-[460px] w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50">
                  <th className="p-3 sm:p-3.5 font-bold text-slate-500 w-1/4 break-keep">
                    {config.comparisonCategoryHeader || '구분'}
                  </th>
                  <th className="p-3 sm:p-3.5 font-bold text-rose-700 w-3/8 bg-rose-50/40 break-keep">
                    {config.comparisonBeforeHeader || '기존 방식 (사용 전)'}
                  </th>
                  <th
                    className="p-3 sm:p-3.5 font-black w-3/8 break-keep"
                    style={{
                      backgroundColor: `${themeColor}15`,
                      color: themeColor,
                    }}
                  >
                    {config.comparisonAfterHeader ||
                      '이 프로그램을 쓸 때 (사용 후)'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(config.comparisonItems || []).map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="p-3 sm:p-3.5 font-bold text-slate-800 bg-slate-50/30 break-keep">
                      {row.category}
                    </td>
                    <td className="p-3 sm:p-3.5 text-slate-600 bg-rose-50/20 break-keep leading-relaxed">
                      {row.before}
                    </td>
                    <td
                      className="p-3 sm:p-3.5 font-bold break-keep leading-relaxed"
                      style={{
                        backgroundColor: `${themeColor}08`,
                        color: themeColor,
                      }}
                    >
                      {row.after}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. CTA & Empathy Quote [가입 유도 문구] - Brand Theme Styled */}
        <section
          className="p-6 sm:p-10 md:p-12 rounded-2xl sm:rounded-3xl text-slate-900 text-center shadow-md relative overflow-hidden space-y-4 sm:space-y-6 border-2"
          style={{
            background: `linear-gradient(135deg, ${themeColor}10 0%, #ffffff 50%, ${themeColor}18 100%)`,
            borderColor: `${themeColor}40`,
          }}
        >
          <div className="relative z-10 max-w-2xl mx-auto space-y-4 sm:space-y-5">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold border"
              style={{
                backgroundColor: `${themeColor}20`,
                color: themeColor,
                borderColor: `${themeColor}40`,
              }}
            >
              <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" style={{ color: themeColor }} />
              <span>{config.ctaBadge || '실전 수련 솔루션'}</span>
            </div>

            <blockquote className="text-base sm:text-xl md:text-2xl font-black text-slate-900 leading-snug sm:leading-relaxed break-keep">
              {config.ctaQuote ||
                '"기술을 많이 아는 것보다 중요한 건, 내가 아는 기술을 제때 꺼내 쓰는 것입니다."'}
            </blockquote>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line break-keep max-w-xl mx-auto">
              {config.ctaSubtext ||
                '오늘 체육관에서 배운 기술 하나부터 가볍게 기록해보세요.\n차곡차곡 쌓인 기록이 실전에서 막힘없이 움직이는 나만의 실력이 됩니다.'}
            </p>

            <div className="pt-2 sm:pt-4 flex flex-col items-center gap-2.5 sm:gap-3 w-full">
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-white text-xs sm:text-sm md:text-base font-black shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2.5 mx-auto"
                style={{ backgroundColor: themeColor }}
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 bg-white p-0.5 rounded-full shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="break-keep">
                  {config.ctaButtonText || 'Google 계정으로 무료 시작하기'}
                </span>
                <ArrowRight className="w-4 h-4 text-white shrink-0" />
              </button>

              <span className="text-[10px] sm:text-[11px] text-slate-400 break-keep text-center max-w-md">
                {config.ctaNoteText ||
                  '* 별도 회원가입 없이 로그인 즉시 독립된 클라우드 데이터베이스가 생성됩니다.'}
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-5 sm:py-6 px-4 text-center text-[10px] sm:text-xs text-slate-400 border-t border-slate-200 bg-white break-keep">
        {config.footerText
          ? `${appTitle} · ${config.footerText}`
          : `${appTitle} · Google Cloud Firestore 연동 · 자기주도 주짓수 수련 솔루션`}
      </footer>
    </div>
  );
};
