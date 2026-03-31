'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, BadgeCheck, BellRing, CreditCard, FileText, GraduationCap, Receipt, ShieldCheck, Sparkles } from 'lucide-react'
import PublicSiteShell from '@/components/home-template/PublicSiteShell'
import PublicHeroVisual from '@/components/home-template/visuals/PublicHeroVisual'
import {
  faqs,
  gradingFeatures,
  heroContent,
  howItWorksSteps,
  outcomes,
  paymentFeatures,
  roles,
  testimonials,
} from '@/lib/content'

export default function IweosTemplateHome() {
  const [openFaq, setOpenFaq] = useState<string | null>(faqs[0]?.question ?? null)

  return (
    <PublicSiteShell currentPath='/'>
      <main>
        <section className='border-b border-[#e6dfd3]'>
          <div className='mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20'>
            <div>
              <span className='inline-flex items-center gap-2 rounded-full border border-[#d9e3ef] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1e3a5f] shadow-sm'>
                <Sparkles className='h-4 w-4' />
                School Operating System
              </span>
              <h1 className='mt-5 text-4xl font-semibold leading-tight text-[#111827] sm:text-6xl'>{heroContent.heading}</h1>
              <p className='mt-4 max-w-2xl text-lg leading-8 text-[#4b5563]'>{heroContent.subheading}</p>
              <p className='mt-4 text-sm text-[#6b7280]'>{heroContent.trustLine}</p>

              <div className='mt-8 flex flex-wrap gap-3'>
                <Link
                  href={heroContent.primaryCta.href}
                  className='rounded-md bg-[#1e3a5f] px-5 py-3 text-sm font-medium !text-white visited:!text-white hover:!text-white hover:bg-[#18314f]'
                >
                  {heroContent.primaryCta.label}
                </Link>
                <Link
                  href={heroContent.secondaryCta.href}
                  className='inline-flex items-center gap-2 rounded-md border border-[#cfd8e3] px-5 py-3 text-sm font-semibold text-[#1f2a37] hover:border-[#9aa7bb]'
                >
                  <ArrowRight className='h-4 w-4' />
                  {heroContent.secondaryCta.label}
                </Link>
                <Link
                  href={heroContent.tertiaryCta.href}
                  className='rounded-md px-5 py-3 text-sm font-semibold text-[#1e3a5f] underline underline-offset-4'
                >
                  {heroContent.tertiaryCta.label}
                </Link>
              </div>

              <div className='mt-8 grid gap-3 sm:grid-cols-3'>
                <div className='rounded-2xl border border-[#d7dfe9] bg-white/80 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)] site-float'>
                  <p className='text-xs font-semibold uppercase tracking-[0.12em] text-[#7b8796]'>Teacher actions</p>
                  <p className='mt-2 text-2xl font-semibold text-[#111827]'>Autosave</p>
                  <p className='mt-1 text-sm text-[#4b5563]'>Attendance, comments, conduct, and grade entry.</p>
                </div>
                <div className='rounded-2xl border border-[#d7dfe9] bg-white/80 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)] site-float-delay'>
                  <p className='text-xs font-semibold uppercase tracking-[0.12em] text-[#7b8796]'>Result output</p>
                  <p className='mt-2 text-2xl font-semibold text-[#111827]'>PDF + Share</p>
                  <p className='mt-1 text-sm text-[#4b5563]'>Publish, export, and mobile-share result documents.</p>
                </div>
                <div className='rounded-2xl border border-[#d7dfe9] bg-white/80 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)] site-float-slow'>
                  <p className='text-xs font-semibold uppercase tracking-[0.12em] text-[#7b8796]'>Payment layer</p>
                  <p className='mt-2 text-2xl font-semibold text-[#111827]'>Per student</p>
                  <p className='mt-1 text-sm text-[#4b5563]'>Setup once, then scale pricing by student count.</p>
                </div>
              </div>
            </div>

            <PublicHeroVisual />
          </div>
        </section>

        <section className='border-b border-[#e6dfd3]'>
          <div className='mx-auto w-full max-w-6xl px-4 py-14'>
            <div className='grid gap-6 lg:grid-cols-2'>
              <article className='rounded-[1.75rem] border border-[#d7dfe9] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]'>
                <div className='flex items-center gap-3'>
                  <span className='inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3fb] text-[#1e3a5f]'>
                    <GraduationCap className='h-6 w-6' />
                  </span>
                  <div>
                    <h2 className='text-2xl font-semibold text-[#111827]'>Grading System</h2>
                    <p className='mt-1 text-sm text-[#6b7280]'>Academic workflows in one structured system.</p>
                  </div>
                </div>
                <ul className='mt-5 space-y-3'>
                  {gradingFeatures.map((item) => (
                    <li key={item.title} className='rounded-2xl border border-[#ebeff5] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.05)]'>
                      <p className='flex items-center gap-2 font-semibold text-[#1f2a37]'><BadgeCheck className='h-4 w-4 text-[#2f6b3f]' />{item.title}</p>
                      <p className='mt-1 text-sm text-[#4b5563]'>{item.description}</p>
                    </li>
                  ))}
                </ul>
              </article>

              <article className='rounded-[1.75rem] border border-[#d7dfe9] bg-[linear-gradient(180deg,#ffffff_0%,#fffaf2_100%)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]'>
                <div className='flex items-center gap-3'>
                  <span className='inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0d8] text-[#a15a00]'>
                    <Receipt className='h-6 w-6' />
                  </span>
                  <div>
                    <h2 className='text-2xl font-semibold text-[#111827]'>Payment</h2>
                    <p className='mt-1 text-sm text-[#6b7280]'>Fee collection and reconciliation with clear records.</p>
                  </div>
                </div>
                <ul className='mt-5 space-y-3'>
                  {paymentFeatures.map((item) => (
                    <li key={item.title} className='rounded-2xl border border-[#ebeff5] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.05)]'>
                      <p className='flex items-center gap-2 font-semibold text-[#1f2a37]'><CreditCard className='h-4 w-4 text-[#a15a00]' />{item.title}</p>
                      <p className='mt-1 text-sm text-[#4b5563]'>{item.description}</p>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className='border-b border-[#e6dfd3]'>
          <div className='mx-auto w-full max-w-6xl px-4 py-14'>
            <h2 className='text-3xl font-semibold text-[#111827]'>How it works</h2>
            <div className='mt-6 grid gap-4 md:grid-cols-3'>
              {howItWorksSteps.map((step, index) => (
                <article key={step.title} className='rounded-[1.5rem] border border-[#d7dfe9] bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5'>
                  <p className='text-xs font-semibold uppercase tracking-[0.1em] text-[#1e3a5f]'>Step {index + 1}</p>
                  <h3 className='mt-2 text-lg font-semibold text-[#111827]'>{step.title}</h3>
                  <p className='mt-2 text-sm text-[#4b5563]'>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className='border-b border-[#e6dfd3]'>
          <div className='mx-auto w-full max-w-6xl px-4 py-14'>
            <h2 className='text-3xl font-semibold text-[#111827]'>Built for every role</h2>
            <div className='mt-6 grid gap-4 md:grid-cols-3'>
              {roles.map((role) => (
                <article key={role.role} className='rounded-[1.5rem] border border-[#d7dfe9] bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5'>
                  <h3 className='flex items-center gap-2 text-lg font-semibold text-[#111827]'>
                    {role.role === 'Admins' ? <ShieldCheck className='h-5 w-5 text-[#1e3a5f]' /> : role.role === 'Teachers' ? <FileText className='h-5 w-5 text-[#2f6b3f]' /> : <CreditCard className='h-5 w-5 text-[#a15a00]' />}
                    {role.role}
                  </h3>
                  <p className='mt-2 text-sm text-[#4b5563]'>{role.summary}</p>
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

        <section className='border-b border-[#e6dfd3]'>
          <div className='mx-auto w-full max-w-6xl px-4 py-14'>
            <h2 className='text-3xl font-semibold text-[#111827]'>What schools say</h2>
            <div className='mt-6 grid gap-4 md:grid-cols-3'>
              {testimonials.map((entry) => (
                <article key={entry.name} className='rounded-[1.5rem] border border-[#d7dfe9] bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5'>
                  <p className='text-sm leading-7 text-[#374151]'>“{entry.quote}”</p>
                  <p className='mt-4 font-semibold text-[#111827]'>{entry.name}</p>
                  <p className='text-sm text-[#6b7280]'>
                    {entry.title}, {entry.school}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className='border-b border-[#e6dfd3]'>
          <div className='mx-auto w-full max-w-4xl px-4 py-14'>
            <h2 className='text-3xl font-semibold text-[#111827]'>Common questions</h2>
            <div className='mt-6 space-y-3'>
              {faqs.map((item) => {
                const isOpen = openFaq === item.question
                return (
                  <article key={item.question} className='rounded-xl border border-[#d7dfe9] bg-white'>
                    <button
                      type='button'
                      className='flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#fafcff]'
                      onClick={() => setOpenFaq((current) => (current === item.question ? null : item.question))}
                    >
                      <span className='flex items-center gap-2 font-semibold text-[#111827]'><BellRing className='h-4 w-4 text-[#1e3a5f]' />{item.question}</span>
                      <span className='text-[#6b7280]'>{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && <p className='px-5 pb-4 text-sm leading-7 text-[#4b5563]'>{item.answer}</p>}
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section>
          <div className='mx-auto w-full max-w-6xl px-4 py-14'>
            <div className='rounded-[2rem] border border-[#d7dfe9] bg-[radial-gradient(circle_at_top_left,rgba(30,58,95,0.12),transparent_40%),linear-gradient(160deg,#ffffff_0%,#f7faff_55%,#fff9ef_100%)] p-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.07)]'>
              <h2 className='text-3xl font-semibold text-[#111827]'>See ìwéOS in your school context</h2>
              <p className='mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#4b5563]'>
                Book a walkthrough for grading workflows, payment setup, and reconciliation.
              </p>
              <div className='mt-6 flex flex-wrap items-center justify-center gap-3'>
                <Link href='/sign-up' className='rounded-md bg-[#1e3a5f] px-5 py-3 text-sm font-medium !text-white visited:!text-white hover:!text-white hover:bg-[#18314f]'>
                  Sign up
                </Link>
                <Link href='/pay' className='rounded-md border border-[#cfd8e3] px-5 py-3 text-sm font-semibold text-[#1f2a37] hover:border-[#9aa7bb]'>
                  Pay fees
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicSiteShell>
  )
}
