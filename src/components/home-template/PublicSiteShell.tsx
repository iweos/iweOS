'use client'

import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import BrandLogo from '@/components/BrandLogo'
import {
  footerGroups,
  navItems,
  socialLinks,
} from '@/lib/content'

type PublicSiteShellProps = {
  currentPath?: string
  children: React.ReactNode
}

function isActivePath(currentPath: string, href: string) {
  if (href === '/') {
    return currentPath === '/'
  }

  return currentPath.startsWith(href)
}

export default function PublicSiteShell({ currentPath = '/', children }: PublicSiteShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const primaryNav = useMemo(() => navItems, [])

  return (
    <div className='bg-[#f8f6f2] text-[#1f2a37]'>
      <header className='sticky top-0 z-50 border-b border-[#e6dfd3] bg-[#f8f6f2]/95 backdrop-blur'>
        <div className='mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3'>
          <BrandLogo href='/' variant='dark' className='text-xl' textClassName='font-semibold text-[#111827]' iconClassName='text-[#111827]' />

          <nav className='hidden items-center gap-6 lg:flex'>
            {primaryNav.map((item) =>
              item.children?.length ? (
                <div key={item.label} className='group relative'>
                  <button
                    type='button'
                    className={`inline-flex items-center gap-1 text-sm font-medium transition ${
                      isActivePath(currentPath, item.href) ? 'text-[#111827]' : 'text-[#374151] hover:text-[#111827]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown className='h-4 w-4' />
                  </button>
                  <div className='invisible absolute left-0 top-[calc(100%+0.7rem)] z-40 min-w-[190px] rounded-2xl border border-[#d7dfe9] bg-white p-2 opacity-0 shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition duration-150 group-hover:visible group-hover:opacity-100'>
                    {item.children.map((child) => (
                      <Link
                        key={`${item.label}-${child.label}`}
                        href={child.href}
                        className={`block rounded-xl px-3 py-2 text-sm transition ${
                          isActivePath(currentPath, child.href) ? 'bg-[#eef3f9] text-[#111827]' : 'text-[#374151] hover:bg-[#f6f9fc] hover:text-[#111827]'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-sm font-medium transition ${
                    isActivePath(currentPath, item.href) ? 'text-[#111827]' : 'text-[#374151] hover:text-[#111827]'
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className='hidden items-center gap-2 lg:flex'>
            <Link
              href='/sign-in'
              className='rounded-md border border-[#cfd8e3] px-3 py-2 text-sm font-semibold text-[#374151] hover:border-[#9aa7bb]'
            >
              Sign in
            </Link>
            <Link
              href='/sign-up'
              className='rounded-md bg-[#1e3a5f] px-3 py-2 text-sm font-medium !text-white visited:!text-white hover:!text-white hover:bg-[#18314f]'
            >
              Sign up
            </Link>
          </div>

          <button
            className='rounded-md border border-[#d7dfe9] px-2 py-1 text-sm lg:hidden'
            onClick={() => setMobileOpen((state) => !state)}
            aria-label='Toggle menu'
          >
            Menu
          </button>
        </div>

        {mobileOpen && (
          <nav className='border-t border-[#e6dfd3] bg-[#fbfaf7] px-4 py-3 lg:hidden'>
            <div className='mx-auto flex max-w-6xl flex-col gap-3'>
              {primaryNav.map((item) =>
                item.children?.length ? (
                  <div key={`mobile-${item.label}`} className='flex flex-col gap-1'>
                    <span className='text-sm font-semibold text-[#111827]'>{item.label}</span>
                    <div className='flex flex-col gap-1 pl-3'>
                      {item.children.map((child) => (
                        <Link
                          key={`mobile-${item.label}-${child.label}`}
                          href={child.href}
                          className={`text-sm ${isActivePath(currentPath, child.href) ? 'text-[#111827]' : 'text-[#374151]'}`}
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={`mobile-${item.label}`}
                    href={item.href}
                    className={`text-sm font-medium ${isActivePath(currentPath, item.href) ? 'text-[#111827]' : 'text-[#374151]'}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ),
              )}
              <div className='mt-2 flex gap-2'>
                <Link href='/sign-in' className='rounded-md border border-[#cfd8e3] px-3 py-2 text-sm font-semibold text-[#374151]'>
                  Sign in
                </Link>
                <Link href='/sign-up' className='rounded-md bg-[#1e3a5f] px-3 py-2 text-sm font-medium !text-white visited:!text-white hover:!text-white'>
                  Sign up
                </Link>
              </div>
            </div>
          </nav>
        )}
      </header>

      {children}

      <footer className='border-t border-[#d7dfe9] bg-[#ffffff]'>
        <div className='mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(0,0.72fr))] xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,0.7fr))]'>
          <div>
            <BrandLogo href='/' variant='dark' className='text-xl' textClassName='font-semibold text-[#111827]' iconClassName='text-[#111827]' />
            <p className='mt-2 max-w-md text-sm leading-7 text-[#4b5563]'>
              Run grading, school fees, receipts, and reconciliation in one workflow.
            </p>
            <div className='mt-4 flex gap-4'>
              {socialLinks.map((social) => (
                <Link key={social.label} href={social.href} className='text-sm font-medium text-[#1e3a5f] underline underline-offset-4'>
                  {social.label}
                </Link>
              ))}
            </div>
          </div>

          {footerGroups.slice(0, 4).map((group) => (
            <nav key={group.title}>
              <p className='text-sm font-semibold text-[#111827]'>{group.title}</p>
              <ul className='mt-2 space-y-2'>
                {group.links.map((item) => (
                  <li key={`${group.title}-${item.label}`}>
                    <Link href={item.href} className='text-sm text-[#4b5563] hover:text-[#111827]'>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </footer>
    </div>
  )
}
