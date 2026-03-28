import type { Metadata } from 'next'
import localFont from 'next/font/local'
import IweosTemplateHome from '@/components/home-template/IweosTemplateHome'

const hornbill = localFont({
  src: '../../public/fonts/Hornbill-Regular.otf',
  variable: '--font-homepage-hornbill',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ìwéOS | School OS for Grading and Payments',
  description:
    'Run grading, school fees, receipts, and reconciliation in one workflow for admins, teachers, and parents.',
  openGraph: {
    title: 'ìwéOS | Run your school like an OS',
    description:
      'Grading, results, and school fees in one simple system for admins, teachers, and parents.',
    type: 'website',
    images: [
      {
        url: '/images/iweos-features-concept.svg',
        width: 1200,
        height: 630,
        alt: 'ìwéOS product preview',
      },
    ],
  },
}

export default function HomePage() {
  return (
    <div className={hornbill.className}>
      <IweosTemplateHome />
    </div>
  )
}
