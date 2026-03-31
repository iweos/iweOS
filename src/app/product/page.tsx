import type { Metadata } from 'next'
import Link from 'next/link'
import PublicSiteShell from '@/components/home-template/PublicSiteShell'
import { howItWorksSteps, outcomes, roles } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Product',
  description: 'See how iweOS supports school operations, teachers, and academic workflows.',
}

export default function ProductPage() {
  return (
    <PublicSiteShell currentPath='/product'>
      <main>
        <section className='border-b border-[#e6dfd3]'>
          <div className='mx-auto max-w-6xl px-4 py-16'>
            <p className='text-sm font-semibold uppercase tracking-[0.12em] text-[#1e3a5f]'>Product</p>
            <h1 className='mt-4 text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl'>One school operating system, not scattered tools</h1>
            <p className='mt-4 max-w-3xl text-lg leading-8 text-[#4b5563]'>
              iweOS brings grading, results, attendance, comments, conduct, promotion, and payment workflows into one connected platform.
            </p>
            <div className='mt-8 flex flex-wrap gap-3'>
              <Link href='/sign-up' className='rounded-md bg-[#1e3a5f] px-5 py-3 text-sm font-medium !text-white hover:!text-white'>
                Sign up
              </Link>
              <Link href='/guide' className='rounded-md border border-[#cfd8e3] px-5 py-3 text-sm font-semibold text-[#1f2a37] hover:border-[#9aa7bb]'>
                Open guide
              </Link>
            </div>
          </div>
        </section>

        <section className='border-b border-[#e6dfd3]'>
          <div className='mx-auto max-w-6xl px-4 py-14'>
            <h2 className='text-3xl font-semibold text-[#111827]'>Core outcomes</h2>
            <div className='mt-6 grid gap-4 md:grid-cols-3'>
              {outcomes.map((item) => (
                <article key={item.title} className='rounded-xl border border-[#d7dfe9] bg-white p-5'>
                  <h3 className='text-lg font-semibold text-[#111827]'>{item.title}</h3>
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
                <article key={step.title} className='rounded-xl border border-[#d7dfe9] bg-white p-5'>
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
                <article key={role.role} className='rounded-xl border border-[#d7dfe9] bg-white p-5'>
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
