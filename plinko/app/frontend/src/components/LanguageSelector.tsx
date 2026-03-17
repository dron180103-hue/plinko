import { type Language } from '@/lib/i18n';

interface LanguageSelectorProps {
  currentLang: Language;
  onChangeLang: (lang: Language) => void;
}

const LANGUAGES: { code: Language; flag: string; label: string }[] = [
  { code: 'ru', flag: '🇷🇺', label: 'RU' },
  { code: 'ua', flag: '🇺🇦', label: 'UA' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
];

export default function LanguageSelector({ currentLang, onChangeLang }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => onChangeLang(lang.code)}
          className={`
            flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all duration-200
            ${currentLang === lang.code
              ? 'bg-purple-600/40 border border-purple-400/40 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]'
              : 'bg-white/[0.03] border border-white/[0.06] text-white/40 hover:bg-white/[0.06] hover:text-white/60'
            }
          `}
        >
          <span className="text-sm">{lang.flag}</span>
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  );
}