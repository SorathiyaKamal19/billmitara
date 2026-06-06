import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold dark:border-white/10 dark:bg-white/10">
      <Languages size={17} />
      <span className="sr-only">
        {t('ભાષા', 'Language')}
      </span>
      <select
        className="bg-transparent font-bold outline-none"
        value={language}
        onChange={(event) =>
          setLanguage(event.target.value as 'gu' | 'en')
        }
        aria-label={t('ભાષા', 'Language')}
      >
        <option value="gu">ગુજરાતી</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
