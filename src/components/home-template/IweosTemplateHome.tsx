'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FileCheck, Menu, MessageCircle, Quote, X, Zap } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import {
  footerGroups,
  heroContent,
  outcomes,
  socialLinks,
  testimonials,
} from '@/lib/content'

const homepageNav = [
  { label: 'Home', href: '/' },
  { label: 'Product', href: '/product' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Docs', href: '/guide' },
]

const valueIcons = [Zap, FileCheck, MessageCircle] as const

function SocialIcon({ label }: { label: string }) {
  if (label === 'LinkedIn') {
    return (
      <svg viewBox='0 0 24 24' className='h-4 w-4' aria-hidden='true' fill='currentColor'>
        <path d='M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.48 1s2.5 1.12 2.5 2.5ZM.5 8h4V24h-4V8Zm7 0h3.83v2.19h.05c.53-1 1.84-2.19 3.79-2.19 4.05 0 4.8 2.67 4.8 6.14V24h-4v-7.83c0-1.87-.03-4.28-2.61-4.28-2.61 0-3.01 2.04-3.01 4.15V24h-4V8Z' />
      </svg>
    )
  }

  if (label === 'YouTube') {
    return (
      <svg viewBox='0 0 24 24' className='h-4 w-4' aria-hidden='true' fill='currentColor'>
        <path d='M23.5 6.2a3 3 0 0 0-2.1-2.12C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.4.58A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.12c1.87.58 9.4.58 9.4.58s7.53 0 9.4-.58a3 3 0 0 0 2.1-2.12A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.6 15.8V8.2l6.3 3.8-6.3 3.8Z' />
      </svg>
    )
  }

  return (
    <svg viewBox='0 0 24 24' className='h-4 w-4' aria-hidden='true' fill='currentColor'>
      <path d='M18.9 2H22l-6.77 7.74L23.2 22h-6.27l-4.9-6.41L6.4 22H3.3l7.24-8.27L.8 2h6.35l4.43 5.85L18.9 2Zm-1.1 18h1.73L6.2 3.9H4.34L17.8 20Z' />
    </svg>
  )
}

export default function IweosTemplateHome() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className='min-h-screen bg-[#f8f6f2] text-[#1f2a37]'>
      <header className='sticky top-0 z-50 border-b border-[#e6dfd3] bg-[#f8f6f2]/95 backdrop-blur supports-[backdrop-filter]:bg-[#f8f6f2]/80'>
        <div className='mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4'>
          <BrandLogo
            href='/'
            variant='dark'
            className='text-xl'
            textClassName='font-semibold tracking-tight text-[#111827]'
            iconClassName='text-[#111827]'
          />

          <nav className='hidden items-center gap-1 lg:flex'>
            {homepageNav.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className='rounded-md px-3 py-2 text-sm font-medium text-[#6b7280] transition-colors hover:text-[#111827]'
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className='hidden items-center gap-3 lg:flex'>
            <Link
              href='/sign-in'
              className='text-sm font-medium text-[#6b7280] transition-colors hover:text-[#111827]'
            >
              Sign in
            </Link>
            <Link
              href='/sign-up'
              className='rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium !text-white visited:!text-white hover:!text-white hover:bg-[#18314f]'
            >
              Create school
            </Link>
          </div>

          <button
            className='text-[#111827] lg:hidden'
            onClick={() => setMobileOpen((current) => !current)}
            aria-label='Toggle menu'
          >
            {mobileOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </button>
        </div>

        {mobileOpen && (
          <div className='border-t border-[#e6dfd3] bg-[#f8f6f2] lg:hidden'>
            <nav className='mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4'>
              {homepageNav.map((link) => (
                <Link
                  key={`mobile-${link.label}`}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className='rounded-md px-3 py-2 text-sm font-medium text-[#6b7280] transition-colors hover:text-[#111827]'
                >
                  {link.label}
                </Link>
              ))}
              <div className='my-2 h-px bg-[#e6dfd3]' />
              <Link
                href='/sign-in'
                onClick={() => setMobileOpen(false)}
                className='px-3 py-2 text-sm font-medium text-[#6b7280] transition-colors hover:text-[#111827]'
              >
                Sign in
              </Link>
              <div className='px-3 pt-1'>
                <Link
                  href='/sign-up'
                  onClick={() => setMobileOpen(false)}
                  className='block w-full rounded-md bg-[#1e3a5f] px-4 py-2 text-center text-sm font-medium !text-white visited:!text-white hover:!text-white hover:bg-[#18314f]'
                >
                  Create school
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className='py-20 md:py-32'>
          <div className='mx-auto w-full max-w-3xl px-4 text-center'>
            <h1 className='text-4xl leading-tight tracking-tight text-[#111827] md:text-5xl lg:text-6xl'>
              {heroContent.heading.replace('OS.', 'operating system.')}
            </h1>
            <p className='mx-auto mt-6 max-w-2xl text-lg text-[#6b7280] md:text-xl'>
              Grading, results, school fees, receipts, and reconciliation, in one simple system for admins, teachers, and parents.
            </p>
            <p className='mt-3 text-sm text-[#6b7280]'>{heroContent.trustLine}</p>
            <div className='mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row'>
              <Link
                href='/sign-up'
                className='rounded-md bg-[#1e3a5f] px-6 py-3 text-base font-medium !text-white visited:!text-white hover:!text-white hover:bg-[#18314f]'
              >
                Create school
              </Link>
              <Link
                href='/product'
                className='rounded-md border border-[#d4cec2] bg-transparent px-6 py-3 text-base font-medium text-[#111827] transition-colors hover:bg-[#f3efe7]'
              >
                View product
              </Link>
              <Link
                href='/pay'
                className='rounded-md px-6 py-3 text-base font-medium text-[#4a7a61] transition-colors hover:text-[#2f6b3f]'
              >
                Pay fees
              </Link>
            </div>
          </div>
        </section>

        <section className='border-t border-[#e6dfd3] py-20'>
          <div className='mx-auto w-full max-w-6xl px-4'>
            <div className='grid gap-8 md:grid-cols-3'>
              {outcomes.map((value, index) => {
                const Icon = valueIcons[index] ?? Zap
                return (
                  <div key={value.title} className='flex flex-col gap-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7efe8]'>
                      <Icon className='h-5 w-5 text-[#3f6f54]' />
                    </div>
                    <h3 className='text-lg font-semibold text-[#111827]'>{value.title}</h3>
                    <p className='text-sm leading-relaxed text-[#6b7280]'>{value.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className='border-t border-[#e6dfd3] py-20'>
          <div className='mx-auto w-full max-w-5xl px-4'>
            <h2 className='text-center text-3xl tracking-tight text-[#111827] md:text-4xl'>
              What school operators say
            </h2>

            <div className='mt-12 grid gap-6 md:grid-cols-3'>
              {testimonials.map((entry) => (
                <article
                  key={entry.name}
                  className='flex flex-col justify-between rounded-lg border border-[#ddd6c9] bg-[#f2eee7] p-6'
                >
                  <div>
                    <Quote className='mb-3 h-5 w-5 text-[#4a7a61]' />
                    <p className='text-sm leading-relaxed text-[#1f2a37]'>{entry.quote}</p>
                  </div>
                  <div className='mt-6 border-t border-[#ddd6c9] pt-4'>
                    <p className='text-sm font-semibold text-[#111827]'>{entry.name}</p>
                    <p className='text-xs text-[#6b7280]'>
                      {entry.title}, {entry.school}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className='border-t border-[#e6dfd3] py-20'>
          <div className='mx-auto w-full max-w-2xl px-4 text-center'>
            <h2 className='text-3xl tracking-tight text-[#111827] md:text-4xl'>
              See ìwéOS in your school context
            </h2>
            <p className='mt-4 text-[#6b7280]'>
              Book a walkthrough for grading workflows, payment setup, and reconciliation.
            </p>
            <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
              <Link
                href='/sign-up'
                className='rounded-md bg-[#1e3a5f] px-6 py-3 text-base font-medium !text-white visited:!text-white hover:!text-white hover:bg-[#18314f]'
              >
                Create school
              </Link>
              <Link
                href='/pay'
                className='rounded-md border border-[#d4cec2] bg-transparent px-6 py-3 text-base font-medium text-[#111827] transition-colors hover:bg-[#f3efe7]'
              >
                Pay fees
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className='border-t border-[#e6dfd3] py-12'>
        <div className='mx-auto w-full max-w-6xl px-4'>
          <div className='grid gap-8 md:grid-cols-[1.2fr_repeat(4,minmax(0,0.8fr))]'>
            <div>
              <BrandLogo
                href='/'
                variant='dark'
                className='text-lg'
                textClassName='font-semibold text-[#111827]'
                iconClassName='text-[#111827]'
              />
              <p className='mt-2 max-w-xs text-sm text-[#6b7280]'>
                A school operating system for grading workflows, results, school payments, receipts, and reconciliation.
              </p>
            </div>

            {footerGroups.map((group) => (
              <div key={group.title}>
                <h4 className='text-sm font-semibold text-[#111827]'>{group.title}</h4>
                <ul className='mt-3 space-y-2 text-sm text-[#6b7280]'>
                  {group.links.map((item) => (
                    <li key={`${group.title}-${item.label}`}>
                      <Link href={item.href} className='transition-colors hover:text-[#111827]'>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className='mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#e6dfd3] pt-6 text-xs text-[#6b7280] md:flex-row'>
            <p>&copy; {new Date().getFullYear()} ìwéOS. All rights reserved.</p>
            <div className='flex items-center gap-4'>
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className='inline-flex items-center text-[#6b7280] transition-colors hover:text-[#111827]'
                >
                  <SocialIcon label={social.label} />
                </Link>
              ))}
              <Link href='mailto:support@iweos.io' className='transition-colors hover:text-[#111827]'>
                support@iweos.io
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
