import React from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'header' | 'card';
  className?: string;
  primaryColor?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  className = '',
  primaryColor = '#0ea5e9',
}) => {
  const { language, setLanguage, toggleLanguage } = useLanguage();

  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 shadow-3xs shrink-0 ${className}`}
        role="group"
        aria-label="Language selection"
      >
        <button
          type="button"
          onClick={() => setLanguage('ko')}
          className={`flex items-center justify-center px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
            language === 'ko'
              ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>KO</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`flex items-center justify-center px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
            language === 'en'
              ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>EN</span>
        </button>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`grid grid-cols-2 gap-2.5 ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage('ko')}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
            language === 'ko'
              ? 'border-sky-500 bg-sky-50/70 text-slate-900 shadow-xs ring-1 ring-sky-400'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🇰🇷</span>
            <div>
              <div className="text-xs font-bold">한국어 (Korean)</div>
              <div className="text-[10px] text-slate-500">기본 언어 설정</div>
            </div>
          </div>
          {language === 'ko' && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
            language === 'en'
              ? 'border-sky-500 bg-sky-50/70 text-slate-900 shadow-xs ring-1 ring-sky-400'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🇺🇸</span>
            <div>
              <div className="text-xs font-bold">English (영어)</div>
              <div className="text-[10px] text-slate-500">All features in English</div>
            </div>
          </div>
          {language === 'en' && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          )}
        </button>
      </div>
    );
  }

  // Default 'header' compact button
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-3xs active:scale-95 ${className}`}
      title={language === 'ko' ? '영어로 변경 (Switch to English)' : '한국어로 변경 (Switch to Korean)'}
    >
      <Globe className="w-3.5 h-3.5" style={{ color: primaryColor }} />
      <span className="text-[11px] font-black tracking-tight text-slate-800">
        {language === 'ko' ? '한국어' : 'ENG'}
      </span>
      <span className="text-[9px] font-bold text-slate-400 border-l border-slate-200 pl-1">
        {language === 'ko' ? 'EN' : 'KO'}
      </span>
    </button>
  );
};
