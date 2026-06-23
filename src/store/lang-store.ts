import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import translations, { type LangKey } from '@/lib/i18n'

type Language = 'en' | 'bn'

interface LangStore {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: LangKey) => string
}

export const useLangStore = create<LangStore>()(
  persist(
    (set, get) => ({
      language: 'en' as Language,

      setLanguage: (lang: Language) => {
        set({ language: lang })
      },

      // Translation function — returns the translated string for the current language
      t: (key: LangKey): string => {
        const lang = get().language
        return translations[lang][key] || translations.en[key] || key
      },
    }),
    {
      name: 'bdk-lang',
    }
  )
)

// Non-hook helper for use outside React components
export function getT(lang?: Language) {
  const currentLang = lang || 'en'
  return (key: LangKey): string => {
    return translations[currentLang][key] || translations.en[key] || key
  }
}

export type { LangKey, Language }
