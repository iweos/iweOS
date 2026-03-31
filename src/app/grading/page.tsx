import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck, ChartNoAxesCombined, FileSpreadsheet } from 'lucide-react'
import PublicSiteShell from '@/components/home-template/PublicSiteShell'
import PublicPageHero from '@/components/home-template/visuals/PublicPageHero'
import { gradingFlowLottie } from '@/lib/lotties/publicSite'
import { gradingFeatures } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Grading',
  description: 'Explore the grading, result, and teacher workflow features inside iweOS.',
}

export default function GradingPage() {
  return (
    <PublicSiteShell currentPath='/grading'>
      <main>
        <PublicPageHero
          eyebrow='Grading'
          title='Run grading and result workflows with less friction'
          description='iweOS gives schools structured grade entry, attendance, conduct, comments, result publishing, PDF export, and secure sharing in one grading workspace.'
          primaryCta={{ label: 'Open guide', href: '/guide' }}
          secondaryCta={{ label: 'Sign up', href: '/sign-up' }}
          animationData={gradingFlowLottie}
          icon={ChartNoAxesCombined}
        />

        <section>
          <div className='mx-auto max-w-6xl px-4 py-14'>
            <div className='grid gap-6 lg:grid-cols-2'>
              {gradingFeatures.map((item) => (
                <article key={item.title} className='rounded-[1.75rem] border border-[#d7dfe9] bg-white p-6 shadow-[0_18px_42px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5'>
                  <h2 className='flex items-center gap-3 text-2xl font-semibold text-[#111827]'>
                    {item.title.includes('Role') ? <BadgeCheck className='h-6 w-6 text-[#1e3a5f]' /> : <FileSpreadsheet className='h-6 w-6 text-[#2f6b3f]' />}
                    {item.title}
                  </h2>
                  <p className='mt-3 text-sm leading-7 text-[#4b5563]'>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PublicSiteShell>
  )
}
