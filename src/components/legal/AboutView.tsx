'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Heart, Globe, Users, Award, Store } from 'lucide-react'
import { useNavStore } from '@/store/nav-store'
import { useNavStore as useNav } from '@/store/nav-store'

const values = [
  {
    icon: Heart,
    title: 'Authenticity',
    description: 'We celebrate the rich heritage of Bangladeshi craftsmanship by ensuring every product tells a genuine story of our culture.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Empowering local artisans and small businesses across all 64 districts to reach customers nationwide.',
  },
  {
    icon: Award,
    title: 'Quality',
    description: 'Rigorous quality checks and verified sellers ensure that every product meets our high standards of excellence.',
  },
  {
    icon: Globe,
    title: 'Accessibility',
    description: 'Making traditional Bangladeshi products accessible to everyone — from Dhaka to the remotest villages.',
  },
]

const team = [
  {
    name: 'Rafiq Ahmed',
    role: 'Founder & CEO',
    initials: 'RA',
    description: 'Visionary entrepreneur from Old Dhaka with 15+ years in Bangladeshi retail.',
  },
  {
    name: 'Fatima Begum',
    role: 'Head of Artisan Relations',
    initials: 'FB',
    description: 'Champion of grassroots artisans, connecting rural craftspeople to urban markets.',
  },
  {
    name: 'Kamal Hossain',
    role: 'Chief Technology Officer',
    initials: 'KH',
    description: 'Tech leader building seamless e-commerce experiences for Bangladesh.',
  },
  {
    name: 'Nusrat Jahan',
    role: 'Head of Operations',
    initials: 'NJ',
    description: 'Logistics expert ensuring deliveries reach every corner of Bangladesh.',
  },
]

const milestones = [
  { year: '2020', event: 'Bangla Bazar founded in Dhaka' },
  { year: '2021', event: 'Expanded to all divisional cities' },
  { year: '2022', event: '10,000+ verified artisans joined' },
  { year: '2023', event: 'Launched bKash & Nagad payments' },
  { year: '2024', event: 'Coverage in all 64 districts' },
  { year: '2025', event: '1 million+ happy customers' },
]

export function AboutView() {
  const goBack = useNav((s) => s.goBack)

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
            <Store className="h-5 w-5 text-[#FFD700]" />
            <h1 className="text-lg font-heading font-black text-foreground">About Bangla Bazar</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#FFD700] border-b-[3px] border-foreground text-center mb-10 py-8 px-4"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-[#FF6B9D] border-[3px] border-foreground shadow-[4px_4px_0px_var(--foreground)]"
          >
            <span className="text-2xl font-black text-white">BB</span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground">
            Bangla <span className="text-[#FF6B9D]">Bazar</span>
          </h2>
          <p className="text-sm font-medium text-foreground/80 mt-2 max-w-md mx-auto">
            Bangladesh&apos;s premier marketplace for authentic traditional products
          </p>
          <div className="nb-accent-bar w-16 mx-auto mt-4" />
        </motion.div>

        {/* Our Story */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="nb-card-static bg-card p-6 mb-6"
        >
          <h3 className="text-lg font-heading font-black text-foreground mb-1 flex items-center gap-2">
            <span className="text-[#FFD700]">📖</span>
            Our Story
          </h3>
          <div className="nb-accent-bar w-12 mb-4" />
          <div className="space-y-3 text-sm text-muted-foreground font-medium leading-relaxed">
            <p>
              Bangla Bazar was born from a simple yet powerful idea: to bring the vibrant
              markets of Bangladesh — from the bustling lanes of{' '}
              <span className="text-[#FFD700] font-bold">New Market</span> to the artisan
              workshops of <span className="text-[#FFD700] font-bold">Tangail</span> — right
              to your fingertips.
            </p>
            <p>
              Founded in 2020 in the heart of Dhaka, we started with a mission to preserve and
              promote Bangladeshi craftsmanship. From the legendary{' '}
              <span className="text-[#FFD700] font-bold">Jamdani Sharee</span> of Narayanganj
              to the exquisite <span className="text-[#FFD700] font-bold">Nakshi Kantha</span>{' '}
              of Rajshahi, every product on our platform carries the soul of Bangladesh.
            </p>
            <p>
              Today, we are proud to serve customers across all 64 districts, connecting over
              10,000 verified artisans and sellers with millions of Bangladeshis who cherish
              authenticity and quality.
            </p>
          </div>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="nb-card-static bg-card p-6 mb-6"
        >
          <h3 className="text-lg font-heading font-black text-foreground mb-1 flex items-center gap-2">
            <span className="text-[#4ECDC4]">🎯</span>
            Our Mission
          </h3>
          <div className="nb-accent-bar w-12 mb-4" />
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            To empower Bangladeshi artisans and small businesses by providing a world-class
            digital marketplace that celebrates our rich cultural heritage while making
            traditional products accessible, affordable, and deliverable to every doorstep in
            Bangladesh. We believe every{' '}
            <span className="text-[#FFD700] font-bold">Sharee</span>, every{' '}
            <span className="text-[#FFD700] font-bold">Punjabi</span>, and every pair of{' '}
            <span className="text-[#FFD700] font-bold">traditional shoes</span> tells a story
            — and that story deserves to be heard.
          </p>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-6"
        >
          <h3 className="text-lg font-heading font-black text-foreground mb-1 flex items-center gap-2">
            <span className="text-[#FF6B9D]">💎</span>
            Our Values
          </h3>
          <div className="nb-accent-bar w-12 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="nb-card bg-card p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#FFD700] border-[3px] border-foreground shadow-[3px_3px_0px_var(--foreground)]">
                    <value.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <h4 className="text-sm font-heading font-black text-foreground">{value.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Timeline / Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="nb-card-static bg-card p-6 mb-6"
        >
          <h3 className="text-lg font-heading font-black text-foreground mb-1 flex items-center gap-2">
            <span className="text-[#FFD700]">📅</span>
            Our Journey
          </h3>
          <div className="nb-accent-bar w-12 mb-4" />
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-2 bottom-2 border-l-[3px] border-foreground" />
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="flex items-start gap-4"
                >
                  <div className="relative z-10 w-8 h-8 rounded-full bg-[#FFD700] border-2 border-foreground flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-foreground" />
                  </div>
                  <div className="pt-1">
                    <span className="text-xs font-heading font-black text-[#FFD700]">{milestone.year}</span>
                    <p className="text-sm text-muted-foreground font-medium">{milestone.event}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mb-6"
        >
          <h3 className="text-lg font-heading font-black text-foreground mb-1 flex items-center gap-2">
            <span className="text-[#4ECDC4]">👥</span>
            Our Team
          </h3>
          <div className="nb-accent-bar w-12 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="nb-card bg-card p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#FF6B9D] border-[3px] border-foreground shadow-[3px_3px_0px_var(--foreground)] flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-white">{member.initials}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-heading font-black text-foreground">{member.name}</h4>
                    <p className="text-xs font-bold text-[#FF6B9D]">{member.role}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {member.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center py-8"
        >
          <div className="nb-divider w-32 mx-auto mb-6" />
          <p className="text-sm font-bold text-foreground mb-3">
            Be part of the Bangla Bazar family
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            © 2025 Bangla Bazar Ltd. All rights reserved.
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
