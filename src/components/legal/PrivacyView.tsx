'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Shield } from 'lucide-react'
import { useNavStore } from '@/store/nav-store'
import { ScrollArea } from '@/components/ui/scroll-area'

const sections = [
  {
    title: '1. Data Collection',
    icon: '📋',
    content: `Bangla Bazar collects the following personal information when you use our platform:

• Personal Identification: Name, email address, phone number, and delivery address when you create an account or place an order.
• Payment Information: Payment method details required for processing transactions. We do not store full credit/debit card numbers — these are handled by our secure payment partners.
• Device & Usage Data: IP address, browser type, device information, and usage patterns to improve our services and ensure security.
• Location Data: Approximate location for delivery estimation and regional product availability, collected only with your consent.
• Communication Data: Messages sent through our chat feature between buyers and sellers for dispute resolution purposes.`,
  },
  {
    title: '2. Data Usage',
    icon: '🔒',
    content: `Your data is used for the following purposes:

• Order Processing: To fulfill your orders, manage deliveries, and provide order tracking.
• Account Management: To maintain your account, authenticate logins, and provide customer support.
• Personalization: To recommend products based on your preferences and browsing history.
• Communication: To send order updates, promotional offers, and important notifications (with your opt-in consent).
• Security: To detect and prevent fraud, unauthorized access, and other malicious activities.
• Legal Compliance: To comply with the Digital Security Act, 2018 and other applicable Bangladeshi laws.`,
  },
  {
    title: '3. Cookies & Tracking',
    icon: '🍪',
    content: `Bangla Bazar uses cookies and similar tracking technologies:

• Essential Cookies: Required for website functionality, authentication, and security (cannot be disabled).
• Analytics Cookies: Help us understand how users interact with our platform to improve the experience.
• Marketing Cookies: Used for targeted advertisements and measuring campaign effectiveness.

You can manage your cookie preferences through your browser settings. Disabling certain cookies may affect functionality.

We also use local storage for maintaining your cart, preferences, and session data.`,
  },
  {
    title: '4. Third-Party Services',
    icon: '🤝',
    content: `We may share limited data with trusted third-party services:

• Payment Processors: bKash, Nagad, Rocket, and bank payment gateways for secure transaction processing.
• Delivery Partners: Pathao, Steadfast, RedX, and other logistics providers for order fulfillment.
• Analytics Providers: Google Analytics and similar tools for usage analysis.
• Cloud Services: Secure cloud hosting providers for data storage and application hosting.

All third-party partners are bound by data protection agreements and are required to handle your information securely.`,
  },
  {
    title: '5. Your Rights',
    icon: '⚖️',
    content: `Under Bangladeshi law and our commitment to your privacy, you have the right to:

• Access: Request a copy of all personal data we hold about you.
• Correction: Update or correct inaccurate personal information.
• Deletion: Request deletion of your account and associated data (subject to legal retention requirements).
• Portability: Export your data in a machine-readable format.
• Objection: Opt out of marketing communications and non-essential data processing.
• Withdraw Consent: Revoke previously given consent for specific data processing activities.

To exercise these rights, contact us at privacy@banglabazar.com.bd or through your account settings.`,
  },
  {
    title: '6. Contact Us',
    icon: '📞',
    content: `If you have any questions or concerns about this Privacy Policy or your data, please contact us:

Bangla Bazar Ltd.
Gulshan Avenue, Dhaka 1212, Bangladesh
Email: privacy@banglabazar.com.bd
Phone: +880 1XXX-XXXXXX

Data Protection Officer: privacy@banglabazar.com.bd

We aim to respond to all privacy-related inquiries within 7 business days.`,
  },
]

export function PrivacyView() {
  const goBack = useNavStore((s) => s.goBack)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b-[3px] border-foreground">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={goBack}
            className="nb-btn-sm bg-card text-foreground flex items-center justify-center gap-1.5 px-3 py-1.5"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#22C55E]" />
            <h1 className="text-lg font-heading font-black text-foreground">Privacy Policy</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="nb-card-static bg-[#22C55E]/10 border-[#22C55E] p-5 mb-6"
          >
            <div className="nb-accent-bar w-16 mb-4" style={{ background: '#22C55E' }} />
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Last updated: January 2025
            </p>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed mt-2">
              At Bangla Bazar, we are committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you
              use our e-commerce platform serving customers across Bangladesh.
            </p>
          </motion.div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="nb-card-static bg-card p-5 mb-4"
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xl">{section.icon}</span>
                  <h2 className="text-base font-heading font-black text-foreground">{section.title}</h2>
                </div>
                <div className="nb-accent-bar w-10 mb-3" style={{ background: '#22C55E' }} />
                <div className="text-sm text-muted-foreground font-medium leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 mb-6 text-center"
          >
            <div className="nb-divider w-32 mx-auto mb-4" />
            <p className="text-xs text-muted-foreground font-medium">
              © 2025 Bangla Bazar Ltd. All rights reserved.
            </p>
          </motion.div>
        </div>
      </ScrollArea>
    </motion.div>
  )
}
