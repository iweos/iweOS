import type { Metadata } from 'next'
import Link from 'next/link'
import PublicSiteShell from '@/components/home-template/PublicSiteShell'
import { paymentFeatures } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Payments',
  description: 'See how iweOS handles school fee payment, invoicing, and reconciliation.',
}

export default function PaymentsPage() {
  return (
    <PublicSiteShell currentPath='/payments'>
      <main>
        <section className='border-b border-[#e6dfd3]'>
          <div className='mx-auto max-w-6xl px-4 py-16'>
            <p className='text-sm font-semibold uppercase tracking-[0.12em] text-[#1e3a5f]'>Payments</p>
            <h1 className='mt-4 text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl'>From invoice creation to parent payment and reconciliation</h1>
            <p className='mt-4 max-w-3xl text-lg leading-8 text-[#4b5563]'>
              Use iweOS to configure fees, generate invoices, accept parent payments, issue receipts, and keep outstanding balances visible.
            </p>
            <div className='mt-8 flex flex-wrap gap-3'>
              <Link href='/pay' className='rounded-md bg-[#1e3a5f] px-5 py-3 text-sm font-medium !text-white hover:!text-white'>
                Try fee payment
              </Link>
              <Link href='/pricing' className='rounded-md border border-[#cfd8e3] px-5 py-3 text-sm font-semibold text-[#1f2a37] hover:border-[#9aa7bb]'>
                View pricing
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className='mx-auto max-w-6xl px-4 py-14'>
            <div className='grid gap-6 lg:grid-cols-2'>
              {paymentFeatures.map((item) => (
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
