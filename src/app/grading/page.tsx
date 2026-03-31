import type { Metadata } from 'next'
import Link from 'next/link'
import PublicSiteShell from '@/components/home-template/PublicSiteShell'
import { gradingFeatures } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Grading',
  description: 'Explore the grading, result, and teacher workflow features inside iweOS.',
}

export default function GradingPage() {
  return (
    <PublicSiteShell currentPath='/grading'>
      <main>
        <section className='border-b border-[#e6dfd3]'>
          <div className='mx-auto max-w-6xl px-4 py-16'>
            <p className='text-sm font-semibold uppercase tracking-[0.12em] text-[#1e3a5f]'>Grading</p>
            <h1 className='mt-4 text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl'>Run grading and result workflows with less friction</h1>
            <p className='mt-4 max-w-3xl text-lg leading-8 text-[#4b5563]'>
              iweOS gives schools structured grade entry, attendance, conduct, comments, result publishing, PDF export, and secure sharing in one grading workspace.
            </p>
            <div className='mt-8 flex flex-wrap gap-3'>
              <Link href='/guide' className='rounded-md bg-[#1e3a5f] px-5 py-3 text-sm font-medium !text-white hover:!text-white'>
                Open guide
              </Link>
              <Link href='/sign-up' className='rounded-md border border-[#cfd8e3] px-5 py-3 text-sm font-semibold text-[#1f2a37] hover:border-[#9aa7bb]'>
                Sign up
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className='mx-auto max-w-6xl px-4 py-14'>
            <div className='grid gap-6 lg:grid-cols-2'>
              {gradingFeatures.map((item) => (
                <article key={item.title} className='rounded-xl border border-[#d7dfe9] bg-white p-6'>
                  <h2 className='text-2xl font-semibold text-[#111827]'>{item.title}</h2>
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
