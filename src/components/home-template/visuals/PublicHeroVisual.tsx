import { BellRing, CreditCard, FileCheck2, Sparkles } from 'lucide-react'
import PublicLottie from '@/components/home-template/visuals/PublicLottie'
import { schoolPulseLottie } from '@/lib/lotties/publicSite'

const miniCards = [
  {
    icon: FileCheck2,
    title: 'Result automation',
    value: 'Draft → Publish',
  },
  {
    icon: CreditCard,
    title: 'Parent payments',
    value: 'Receipts instantly',
  },
  {
    icon: BellRing,
    title: 'Notifications',
    value: 'Admins and teachers',
  },
]

export default function PublicHeroVisual() {
  return (
    <div className='relative overflow-hidden rounded-[2rem] border border-[#d7dfe9] bg-[radial-gradient(circle_at_top_left,rgba(30,58,95,0.12),transparent_38%),linear-gradient(160deg,#ffffff_0%,#f4f7fb_48%,#fff9ef_100%)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]'>
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.42)_38%,transparent_72%)] opacity-80' />

      <div className='relative grid gap-5 lg:grid-cols-[1fr_0.95fr]'>
        <div className='rounded-[1.6rem] border border-white/70 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur site-float'>
          <div className='flex items-center gap-3'>
            <span className='inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1e3a5f] text-white'>
              <Sparkles className='h-5 w-5' />
            </span>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.14em] text-[#1e3a5f]'>Live school operations</p>
              <p className='text-sm text-[#4b5563]'>One flow for academics, reports, and payments.</p>
            </div>
          </div>

          <div className='mt-5 grid gap-3'>
            {miniCards.map((card, index) => {
              const Icon = card.icon
              return (
                <div
                  key={card.title}
                  className={`rounded-2xl border border-[#e7edf4] bg-[#fbfdff] px-4 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.04)] ${index === 1 ? 'site-float-delay' : ''}`}
                >
                  <div className='flex items-center gap-3'>
                    <span className='inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef3fb] text-[#1e3a5f]'>
                      <Icon className='h-5 w-5' />
                    </span>
                    <div>
                      <p className='text-xs font-semibold uppercase tracking-[0.12em] text-[#7b8796]'>{card.title}</p>
                      <p className='mt-1 text-sm font-semibold text-[#111827]'>{card.value}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className='relative rounded-[1.6rem] border border-[#e5edf6] bg-white/78 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur site-float-slow'>
          <div className='rounded-[1.35rem] bg-[linear-gradient(180deg,#eff5fb_0%,#ffffff_100%)] p-4'>
            <PublicLottie animationData={schoolPulseLottie} className='mx-auto h-[300px] w-full max-w-[320px]' />
          </div>
        </div>
      </div>
    </div>
  )
}
