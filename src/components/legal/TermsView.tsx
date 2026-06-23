'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, FileText } from 'lucide-react'
import { useNavStore } from '@/store/nav-store'
import { ScrollArea } from '@/components/ui/scroll-area'

const sections = [
  {
    title: '1. General Terms',
    icon: '📜',
    content: `Welcome to Bangla Bazar. By accessing and using our platform, you agree to be bound by these Terms & Conditions.

• Eligibility: You must be at least 18 years old or have parental consent to use our services. By using our platform, you represent that you meet this requirement.
• Account Responsibility: You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
• Prohibited Activities: You must not use the platform for any unlawful purpose, attempt to gain unauthorized access, or interfere with the proper functioning of the service.
• Modifications: Bangla Bazar reserves the right to modify these terms at any time. Continued use after modifications constitutes acceptance of the updated terms.
• Governing Law: These terms are governed by the laws of the People's Republic of Bangladesh. Any disputes shall be resolved in the courts of Dhaka, Bangladesh.`,
  },
  {
    title: '2. Products & Pricing',
    icon: '🏷️',
    content: `• Product Listings: We strive to display accurate product information, images, and pricing. However, errors may occur. We reserve the right to correct any inaccuracies.
• Pricing: All prices are displayed in Bangladeshi Taka (৳) and are inclusive of applicable VAT unless stated otherwise. Prices are subject to change without prior notice.
• Availability: Product availability is subject to stock levels. We do not guarantee that any product listed will be available at the time of your order.
• Product Authenticity: We work with verified sellers to ensure product authenticity. Handicraft and traditional items may have slight variations as they are often handmade.
• Descriptions: Product descriptions in both English and Bengali are provided for convenience. In case of discrepancy, the English description shall prevail.`,
  },
  {
    title: '3. Payment Terms',
    icon: '💳',
    content: `• Accepted Methods: We accept Cash on Delivery (COD), bKash, Nagad, Rocket, and major bank cards (Visa, Mastercard) issued in Bangladesh.
• Payment Security: All online transactions are processed through secure, encrypted payment gateways. We do not store your full card details.
• COD Orders: Cash on Delivery orders may require phone verification. COD is available for orders up to ৳50,000.
• Payment Confirmation: Orders are confirmed only after successful payment verification. Failed payments will result in order cancellation.
• Currency: All transactions are processed in Bangladeshi Taka (BDT). International card transactions may incur additional bank fees.`,
  },
  {
    title: '4. Shipping & Delivery',
    icon: '🚚',
    content: `• Coverage: We deliver across all 64 districts of Bangladesh. Delivery times may vary based on location.
• Delivery Time: Dhaka metro: 1-3 business days. Major cities: 3-5 business days. Remote areas: 5-10 business days.
• Shipping Charges: Shipping costs are calculated at checkout based on delivery location and order weight. Orders above ৳2,000 qualify for free shipping within Dhaka.
• Tracking: Order tracking is available through our platform and via SMS notifications.
• Delivery Partners: We partner with trusted logistics providers including Pathao, Steadfast, and RedX.
• Failed Delivery: If delivery fails after 3 attempts, the order will be returned to the seller. Re-delivery may incur additional charges.`,
  },
  {
    title: '5. Returns & Refunds',
    icon: '↩️',
    content: `• Return Window: You may request a return within 7 days of delivery for most products. Custom or personalized items are non-returnable unless defective.
• Return Conditions: Items must be unused, in original packaging, with all tags attached. Damaged or used items will not be accepted.
• Refund Process: Approved refunds are processed within 5-10 business days. Refunds are issued to the original payment method.
• Damaged/Defective Items: If you receive a damaged or defective product, contact us within 48 hours with photographic evidence for an expedited replacement or refund.
• Exchange: Size exchanges for clothing items are subject to availability. Exchange shipping costs are borne by the buyer unless the item was defective.
• Non-Returnable Items: Undergarments, perishable goods, and items marked as "Final Sale" cannot be returned.`,
  },
  {
    title: '6. Limitation of Liability',
    icon: '🛡️',
    content: `• Service Availability: Bangla Bazar strives for 99.9% uptime but does not guarantee uninterrupted service. We are not liable for service disruptions due to force majeure events.
• Third-Party Services: We are not responsible for the actions or failures of third-party sellers, delivery partners, or payment processors beyond our direct control.
• Maximum Liability: Our total liability for any claim shall not exceed the amount you paid for the specific transaction in question.
• Indirect Damages: We shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our platform.
• Seller Disputes: While we facilitate transactions between buyers and sellers, Bangla Bazar acts as an intermediary and is not a party to the sale contract between users and sellers.
• No Warranty: Products are provided "as is" without warranties of any kind, except as provided by the manufacturer or seller.`,
  },
]

export function TermsView() {
  const goBack = useNavStore((s) => s.goBack)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={goBack}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#FFD700]/10 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#FFD700]" />
            <h1 className="text-lg font-bold text-foreground">Terms & Conditions</h1>
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
            className="mb-8"
          >
            <div className="h-1 w-16 rounded-full bg-[#FFD700] mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Last updated: January 2025
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              These Terms & Conditions govern your use of the Bangla Bazar platform. Please read
              them carefully before using our services. By using our platform, you acknowledge that
              you have read, understood, and agree to be bound by these terms.
            </p>
          </motion.div>

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-card rounded-2xl border border-border p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{section.icon}</span>
                  <h2 className="text-base font-bold text-foreground">{section.title}</h2>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
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
            <div className="h-px w-32 mx-auto bg-border mb-4" />
            <p className="text-xs text-muted-foreground">
              © 2025 Bangla Bazar Ltd. All rights reserved.
            </p>
          </motion.div>
        </div>
      </ScrollArea>
    </motion.div>
  )
}
