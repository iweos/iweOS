'use client'

import Link from 'next/link'
import { useState } from 'react'
import PublicSiteShell from '@/components/home-template/PublicSiteShell'
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
          <div className='mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-20'>
            <div>
              <p className='text-sm font-semibold uppercase tracking-[0.12em] text-[#1e3a5f]'>School Operating System</p>
              <h1 className='mt-4 text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl'>{heroContent.heading}</h1>
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
                  className='rounded-md border border-[#cfd8e3] px-5 py-3 text-sm font-semibold text-[#1f2a37] hover:border-[#9aa7bb]'
                >
                  {heroContent.secondaryCta.label}
                </Link>
                <Link
                  href={heroContent.tertiaryCta.href}
                  className='rounded-md px-5 py-3 text-sm font-semibold text-[#1e3a5f] underline underline-offset-4'
                >
                  {heroContent.tertiaryCta.label}
                </Link>
              </div>
            </div>

            <aside className='rounded-xl border border-[#d7dfe9] bg-white p-6'>
              <p className='text-sm font-semibold text-[#111827]'>What you get with ìwéOS</p>
              <ul className='mt-4 space-y-3 text-sm text-[#4b5563]'>
                {outcomes.map((item) => (
                  <li key={item.title} className='rounded-md border border-[#ebeff5] bg-[#f9fbfe] p-3'>
                    <p className='font-semibold text-[#1f2a37]'>{item.title}</p>
                    <p className='mt-1'>{item.description}</p>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className='border-b border-[#e6dfd3]'>
          <div className='mx-auto w-full max-w-6xl px-4 py-14'>
            <div className='grid gap-6 lg:grid-cols-2'>
              <article className='rounded-xl border border-[#d7dfe9] bg-white p-6'>
                <h2 className='text-2xl font-semibold text-[#111827]'>Grading System</h2>
                <p className='mt-2 text-sm text-[#6b7280]'>Academic workflows in one structured system.</p>
                <ul className='mt-5 space-y-3'>
                  {gradingFeatures.map((item) => (
                    <li key={item.title} className='rounded-md border border-[#ebeff5] p-3'>
                      <p className='font-semibold text-[#1f2a37]'>{item.title}</p>
                      <p className='mt-1 text-sm text-[#4b5563]'>{item.description}</p>
                    </li>
                  ))}
                </ul>
              </article>

              <article className='rounded-xl border border-[#d7dfe9] bg-white p-6'>
                <h2 className='text-2xl font-semibold text-[#111827]'>Payment</h2>
                <p className='mt-2 text-sm text-[#6b7280]'>Fee collection and reconciliation with clear records.</p>
                <ul className='mt-5 space-y-3'>
                  {paymentFeatures.map((item) => (
                    <li key={item.title} className='rounded-md border border-[#ebeff5] p-3'>
                      <p className='font-semibold text-[#1f2a37]'>{item.title}</p>
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
                <article key={step.title} className='rounded-xl border border-[#d7dfe9] bg-white p-5'>
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
                <article key={role.role} className='rounded-xl border border-[#d7dfe9] bg-white p-5'>
                  <h3 className='text-lg font-semibold text-[#111827]'>{role.role}</h3>
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
                <article key={entry.name} className='rounded-xl border border-[#d7dfe9] bg-white p-5'>
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
                      className='flex w-full items-center justify-between px-5 py-4 text-left'
                      onClick={() => setOpenFaq((current) => (current === item.question ? null : item.question))}
                    >
                      <span className='font-semibold text-[#111827]'>{item.question}</span>
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
            <div className='rounded-xl border border-[#d7dfe9] bg-white p-8 text-center'>
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
