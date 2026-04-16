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

function linkTargetProps(href: string) {
  return href === '/guide' ? { target: '_blank', rel: 'noreferrer noopener' } : {}
}

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

export default function PublicSiteShell({ currentPath = '/', children }: PublicSiteShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const primaryNav = useMemo(() => navItems, [])

  return (
    <div className='site-hornbill bg-[#f8f6f2] text-[#1f2a37]'>
      <header className='sticky top-0 z-50 border-b border-[#e6dfd3] bg-[#f8f6f2]/95 backdrop-blur'>
        <div className='mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3'>
          <BrandLogo href='/' variant='dark' className='text-xl' textClassName='font-semibold text-[#111827]' iconClassName='text-[#111827]' />

          <nav className='hidden items-center gap-6 lg:flex'>
            {primaryNav.map((item) =>
              item.children?.length ? (
                <div key={item.label} className='group relative py-2'>
                  <button
                    type='button'
                    className={`inline-flex items-center gap-1 text-sm font-medium transition ${
                      isActivePath(currentPath, item.href) ? 'text-[#111827]' : 'text-[#374151] hover:text-[#111827]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown className='h-4 w-4' />
                  </button>
                  <div className='invisible absolute left-0 top-full z-40 min-w-[190px] pt-2 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100'>
                    <div className='rounded-2xl border border-[#d7dfe9] bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.12)]'>
                    {item.children.map((child) => (
                      <Link
                        key={`${item.label}-${child.label}`}
                        href={child.href}
                        {...linkTargetProps(child.href)}
                        className={`block rounded-xl px-3 py-2 text-sm transition ${
                          isActivePath(currentPath, child.href) ? 'bg-[#eef3f9] text-[#111827]' : 'text-[#374151] hover:bg-[#f6f9fc] hover:text-[#111827]'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  {...linkTargetProps(item.href)}
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
                          {...linkTargetProps(child.href)}
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
                    {...linkTargetProps(item.href)}
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
            <div className='mt-4 flex items-center gap-3 text-[#1e3a5f]'>
              <i className='fas fa-dove text-sm' aria-hidden='true' />
              <i className='fas fa-dove text-sm' aria-hidden='true' />
            </div>
            <div className='mt-4 flex items-center gap-4'>
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className='inline-flex items-center text-[#1e3a5f] transition hover:text-[#132b45]'
                >
                  <SocialIcon label={social.label} />
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
