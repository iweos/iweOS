import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpenCheck, GraduationCap, Layers3, Sparkles } from 'lucide-react'
import PublicSiteShell from '@/components/home-template/PublicSiteShell'
import PublicPageHero from '@/components/home-template/visuals/PublicPageHero'
import { schoolPulseLottie } from '@/lib/lotties/publicSite'
import { howItWorksSteps, outcomes, roles } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Product',
  description: 'See how iweOS supports school operations, teachers, and academic workflows.',
}

export default function ProductPage() {
  return (
    <PublicSiteShell currentPath='/product'>
      <main>
        <PublicPageHero
          eyebrow='Product'
          title='One school operating system, not scattered tools'
          description='iweOS brings grading, results, attendance, comments, conduct, promotion, and payment workflows into one connected platform.'
          primaryCta={{ label: 'Sign up', href: '/sign-up' }}
          secondaryCta={{ label: 'Open guide', href: '/guide' }}
          animationData={schoolPulseLottie}
          icon={Layers3}
        />

        <section className='border-b border-[#e6dfd3]'>
          <div className='mx-auto max-w-6xl px-4 py-14'>
            <h2 className='text-3xl font-semibold text-[#111827]'>Core outcomes</h2>
            <div className='mt-6 grid gap-4 md:grid-cols-3'>
              {outcomes.map((item) => (
                <article key={item.title} className='rounded-[1.5rem] border border-[#d7dfe9] bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5'>
                  <h3 className='flex items-center gap-2 text-lg font-semibold text-[#111827]'>
                    {item.title.includes('Faster') ? <Sparkles className='h-5 w-5 text-[#1e3a5f]' /> : item.title.includes('Cleaner') ? <BookOpenCheck className='h-5 w-5 text-[#2f6b3f]' /> : <GraduationCap className='h-5 w-5 text-[#a15a00]' />}
                    {item.title}
                  </h3>
                  <p className='mt-2 text-sm leading-7 text-[#4b5563]'>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className='border-b border-[#e6dfd3]'>
          <div className='mx-auto max-w-6xl px-4 py-14'>
            <h2 className='text-3xl font-semibold text-[#111827]'>How schools use it</h2>
            <div className='mt-6 grid gap-4 md:grid-cols-3'>
              {howItWorksSteps.map((step, index) => (
                <article key={step.title} className='rounded-[1.5rem] border border-[#d7dfe9] bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5'>
                  <p className='text-xs font-semibold uppercase tracking-[0.1em] text-[#1e3a5f]'>Step {index + 1}</p>
                  <h3 className='mt-2 text-lg font-semibold text-[#111827]'>{step.title}</h3>
                  <p className='mt-2 text-sm leading-7 text-[#4b5563]'>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className='mx-auto max-w-6xl px-4 py-14'>
            <h2 className='text-3xl font-semibold text-[#111827]'>Built for each role</h2>
            <div className='mt-6 grid gap-4 md:grid-cols-3'>
              {roles.map((role) => (
                <article key={role.role} className='rounded-[1.5rem] border border-[#d7dfe9] bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5'>
                  <h3 className='text-lg font-semibold text-[#111827]'>{role.role}</h3>
                  <p className='mt-2 text-sm leading-7 text-[#4b5563]'>{role.summary}</p>
                  <ul className='mt-3 space-y-2 text-sm text-[#4b5563]'>
                    {role.bullets.map((bullet) => (
                      <li key={bullet}>• {bullet}</li>
                    ))}
                  </ul>
                  <Link href={role.ctaHref} className='mt-4 inline-block text-sm font-semibold text-[#1e3a5f] underline underline-offset-4'>
                    {role.ctaLabel}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PublicSiteShell>
  )
}
