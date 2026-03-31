import type { Metadata } from 'next'
import PublicSiteShell from '@/components/home-template/PublicSiteShell'
import { faqs } from '@/lib/content'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Common questions about using iweOS for school operations, grading, and payments.',
}

export default function FaqPage() {
  return (
    <PublicSiteShell currentPath='/faq'>
      <main>
        <section className='border-b border-[#e6dfd3]'>
          <div className='mx-auto max-w-4xl px-4 py-16'>
            <p className='text-sm font-semibold uppercase tracking-[0.12em] text-[#1e3a5f]'>FAQ</p>
            <h1 className='mt-4 text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl'>Common questions</h1>
            <p className='mt-4 max-w-2xl text-lg leading-8 text-[#4b5563]'>
              Quick answers about setup, teacher access, payments, exports, and rollout expectations.
            </p>
          </div>
        </section>

        <section>
          <div className='mx-auto max-w-4xl px-4 py-14'>
            <div className='space-y-3'>
              {faqs.map((item) => (
                <article key={item.question} className='rounded-xl border border-[#d7dfe9] bg-white p-5'>
                  <h2 className='text-lg font-semibold text-[#111827]'>{item.question}</h2>
                  <p className='mt-3 text-sm leading-7 text-[#4b5563]'>{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PublicSiteShell>
  )
}
