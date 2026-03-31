import type { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3, FileText, Share2 } from 'lucide-react'
import PublicSiteShell from '@/components/home-template/PublicSiteShell'
import PublicPageHero from '@/components/home-template/visuals/PublicPageHero'
import { gradingFlowLottie } from '@/lib/lotties/publicSite'

export const metadata: Metadata = {
  title: 'Result',
  description: 'See how iweOS handles result preview, publishing, PDF export, and secure sharing.',
}

const resultHighlights = [
  {
    title: 'Result preview and publication',
    description: 'Review each student result, then move it deliberately through draft, published, and unpublished states.',
    icon: FileText,
    tone: 'text-[#1e3a5f]',
  },
  {
    title: 'PDF export and mobile sharing',
    description: 'Open clean export routes, download PDF files, and share result documents without printing admin chrome.',
    icon: Share2,
    tone: 'text-[#2f6b3f]',
  },
  {
    title: 'Performance insight',
    description: 'Plot student performance against class average so the result sheet explains more than a total score.',
    icon: BarChart3,
    tone: 'text-[#a15a00]',
  },
]

export default function ResultsPage() {
  return (
    <PublicSiteShell currentPath='/results'>
      <main>
        <PublicPageHero
          eyebrow='Result'
          title='Move from grading to beautiful, shareable result documents'
          description='iweOS gives schools a full result flow: preview, publish, print, export to PDF, and share securely with students and parents.'
          primaryCta={{ label: 'Open guide', href: '/guide' }}
          secondaryCta={{ label: 'Sign up', href: '/sign-up' }}
          animationData={gradingFlowLottie}
          icon={FileText}
        />

        <section className='border-b border-[#e6dfd3]'>
          <div className='mx-auto max-w-6xl px-4 py-14'>
            <h2 className='text-3xl font-semibold text-[#111827]'>What schools can do with results</h2>
            <div className='mt-6 grid gap-4 md:grid-cols-3'>
              {resultHighlights.map((item) => {
                const Icon = item.icon
                return (
                  <article key={item.title} className='rounded-[1.6rem] border border-[#d7dfe9] bg-white p-6 shadow-[0_18px_42px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5'>
                    <h3 className='flex items-center gap-3 text-xl font-semibold text-[#111827]'>
                      <Icon className={`h-5 w-5 ${item.tone}`} />
                      {item.title}
                    </h3>
                    <p className='mt-3 text-sm leading-7 text-[#4b5563]'>{item.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section>
          <div className='mx-auto max-w-6xl px-4 py-14'>
            <div className='rounded-[2rem] border border-[#d7dfe9] bg-white p-7 shadow-[0_22px_52px_rgba(15,23,42,0.06)]'>
              <h2 className='text-3xl font-semibold text-[#111827]'>From raw scores to a finished result sheet</h2>
              <div className='mt-6 grid gap-4 md:grid-cols-4'>
                {[
                  ['1', 'Capture inputs', 'Teachers enter attendance, comments, conduct, and subject scores.'],
                  ['2', 'Review and validate', 'Admins preview the result and verify grading, remarks, and result assets.'],
                  ['3', 'Publish and export', 'Published results can be exported as PDF or printed from a clean route.'],
                  ['4', 'Share securely', 'Use the shared result link or mobile share flow without exposing unpublished records.'],
                ].map(([step, title, text]) => (
                  <article key={title} className='rounded-[1.3rem] border border-[#e6dfd3] bg-[#faf8f4] p-5'>
                    <p className='text-xs font-semibold uppercase tracking-[0.14em] text-[#1e3a5f]'>Step {step}</p>
                    <h3 className='mt-2 text-lg font-semibold text-[#111827]'>{title}</h3>
                    <p className='mt-2 text-sm leading-7 text-[#4b5563]'>{text}</p>
                  </article>
                ))}
              </div>
              <div className='mt-8'>
                <Link href='/guide' className='text-sm font-semibold text-[#1e3a5f] underline underline-offset-4'>
                  See the full result guide
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicSiteShell>
  )
}
