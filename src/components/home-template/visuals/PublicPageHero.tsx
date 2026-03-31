import Link from 'next/link'
import { ArrowRight, LucideIcon } from 'lucide-react'
import PublicLottie from '@/components/home-template/visuals/PublicLottie'

type PublicPageHeroProps = {
  eyebrow: string
  title: string
  description: string
  primaryCta: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  animationData: object
  icon: LucideIcon
}

export default function PublicPageHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  animationData,
  icon: Icon,
}: PublicPageHeroProps) {
  return (
    <section className='border-b border-[#e6dfd3]'>
      <div className='mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr]'>
        <div>
          <span className='inline-flex items-center gap-2 rounded-full border border-[#d9e3ef] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1e3a5f] shadow-sm'>
            <Icon className='h-4 w-4' />
            {eyebrow}
          </span>
          <h1 className='mt-5 text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl'>{title}</h1>
          <p className='mt-4 max-w-3xl text-lg leading-8 text-[#4b5563]'>{description}</p>
          <div className='mt-8 flex flex-wrap gap-3'>
            <Link href={primaryCta.href} className='rounded-md bg-[#1e3a5f] px-5 py-3 text-sm font-medium !text-white hover:!text-white'>
              {primaryCta.label}
            </Link>
            {secondaryCta ? (
              <Link href={secondaryCta.href} className='inline-flex items-center gap-2 rounded-md border border-[#cfd8e3] px-5 py-3 text-sm font-semibold text-[#1f2a37] hover:border-[#9aa7bb]'>
                <span>{secondaryCta.label}</span>
                <ArrowRight className='h-4 w-4' />
              </Link>
            ) : null}
          </div>
        </div>

        <div className='rounded-[2rem] border border-[#d7dfe9] bg-[radial-gradient(circle_at_top_left,rgba(30,58,95,0.12),transparent_40%),linear-gradient(150deg,#ffffff_0%,#f6f9fc_50%,#fff8ee_100%)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] site-float'>
          <div className='rounded-[1.5rem] border border-white/80 bg-white/82 p-4 backdrop-blur'>
            <PublicLottie animationData={animationData} className='mx-auto h-[280px] w-full max-w-[320px]' />
          </div>
        </div>
      </div>
    </section>
  )
}
