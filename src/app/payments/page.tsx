import type { Metadata } from 'next'
import Link from 'next/link'
import { CreditCard, Landmark, ReceiptText } from 'lucide-react'
import PublicSiteShell from '@/components/home-template/PublicSiteShell'
import PublicPageHero from '@/components/home-template/visuals/PublicPageHero'
import { paymentsFlowLottie } from '@/lib/lotties/publicSite'
import { paymentFeatures } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Payments',
  description: 'See how iweOS handles school fee payment, invoicing, and reconciliation.',
}

export default function PaymentsPage() {
  return (
    <PublicSiteShell currentPath='/payments'>
      <main>
        <PublicPageHero
          eyebrow='Payments'
          title='From invoice creation to parent payment and reconciliation'
          description='Use iweOS to configure fees, generate invoices, accept parent payments, issue receipts, and keep outstanding balances visible.'
          primaryCta={{ label: 'Try fee payment', href: '/pay' }}
          secondaryCta={{ label: 'View pricing', href: '/pricing' }}
          animationData={paymentsFlowLottie}
          icon={CreditCard}
        />

        <section>
          <div className='mx-auto max-w-6xl px-4 py-14'>
            <div className='grid gap-6 lg:grid-cols-2'>
              {paymentFeatures.map((item) => (
                <article key={item.title} className='rounded-[1.75rem] border border-[#d7dfe9] bg-white p-6 shadow-[0_18px_42px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5'>
                  <h2 className='flex items-center gap-3 text-2xl font-semibold text-[#111827]'>
                    {item.title.includes('Invoice') ? <ReceiptText className='h-6 w-6 text-[#a15a00]' /> : item.title.includes('Part') ? <Landmark className='h-6 w-6 text-[#1e3a5f]' /> : <CreditCard className='h-6 w-6 text-[#2f6b3f]' />}
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
