'use client'

import { useNavStore } from '@/store/nav-store'
import { useLangStore } from '@/store/lang-store'

const categories = [
  { label: 'Sharee', labelBN: 'শাড়ি' },
  { label: 'Punjabi', labelBN: 'পাঞ্জাবি' },
  { label: 'Shoes', labelBN: 'জুতা' },
  { label: 'Jewellery', labelBN: 'গহনা' },
  { label: 'Electronics', labelBN: 'ইলেকট্রনিক্স' },
]

const quickLinkDefs = [
  { labelKey: 'about' as const, view: 'about' as const },
  { labelKey: 'privacyPolicy' as const, view: 'privacy' as const },
  { labelKey: 'termsConditions' as const, view: 'terms' as const },
]

const contactInfo = [
  { label: 'Dhaka, Bangladesh' },
  { label: 'support@banglabazar.com' },
  { label: '+880 1XXX-XXXXXX' },
]

export default function Footer() {
  const navigate = useNavStore((s) => s.navigate)
  const { language, t } = useLangStore()

  return (
    <footer className="bg-background border-t-2 border-[#FFD700]">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold"
                style={{ backgroundColor: '#FFD700', color: '#0A0A0A' }}
              >
                BB
              </span>
              <span className="text-xl font-bold text-foreground">
                {t('appName')}
              </span>
            </div>
            <p className="text-foreground/70 text-sm leading-relaxed">
              {t('aboutDesc')}
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-base mb-4 text-[#FFD700]">
              {t('categories')}
            </h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.label}>
                  <button
                    onClick={() => navigate('categories')}
                    className="text-foreground/70 hover:text-foreground text-sm transition-colors"
                  >
                    {language === 'en' ? cat.label : cat.labelBN}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-base mb-4 text-[#FFD700]">
              {t('quickLinks')}
            </h3>
            <ul className="space-y-2">
              {quickLinkDefs.map((link) => (
                <li key={link.labelKey}>
                  <button
                    onClick={() => navigate(link.view)}
                    className="text-foreground/70 hover:text-foreground text-sm transition-colors"
                  >
                    {t(link.labelKey)}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => navigate('chat', { senderId: 'admin' })}
                  className="text-foreground/70 hover:text-foreground text-sm transition-colors"
                >
                  {t('contactSupport')}
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-base mb-4 text-[#FFD700]">
              {t('contact')}
            </h3>
            <ul className="space-y-2">
              {contactInfo.map((info, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-foreground/70 text-sm"
                >
                  {idx === 0 && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  )}
                  {idx === 1 && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  )}
                  {idx === 2 && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  )}
                  {info.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-center text-foreground/40 text-sm">
            &copy; 2024 {t('appName')}. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  )
}
