"use client";

import Link from "next/link";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ChevronDown, GraduationCap, School, ShieldCheck } from "lucide-react";

const portals = [
  { label: "School Admin", detail: "Manage or create a school", href: "/sign-in?portal=admin", icon: School },
  { label: "Teacher", detail: "Open your assigned school", href: "/sign-in?portal=teacher", icon: ShieldCheck },
  { label: "Student Portal", detail: "View linked student records", href: "/sign-in?portal=student", icon: GraduationCap },
] as const;

type PublicSignInMenuProps = {
  buttonClassName?: string;
  panelClassName?: string;
};

export default function PublicSignInMenu({ buttonClassName = "", panelClassName = "" }: PublicSignInMenuProps) {
  return (
    <Popover className="relative">
      <PopoverButton
        className={`inline-flex items-center justify-center gap-1.5 ${buttonClassName}`}
        aria-label="Choose a portal to sign in"
      >
        <span>Sign in</span>
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </PopoverButton>
      <PopoverPanel
        anchor="bottom end"
        transition
        className={`z-[100] mt-2 w-[min(19rem,calc(100vw-2rem))] rounded-xl border border-[#d8dfe7] bg-white p-2 shadow-[0_20px_55px_rgba(15,23,42,.16)] transition duration-150 ease-out data-closed:-translate-y-1 data-closed:opacity-0 ${panelClassName}`}
      >
        <div className="px-2 pb-2 pt-1">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[.12em] text-[#8a929e]">Choose your portal</p>
        </div>
        {portals.map(({ label, detail, href, icon: Icon }) => (
          <Link
            href={href}
            className="grid min-h-14 grid-cols-[34px_minmax(0,1fr)] items-center gap-2.5 rounded-lg px-2.5 py-2 text-[#202833] no-underline transition hover:bg-[#f1f5f2] focus-visible:bg-[#f1f5f2] focus-visible:outline-none"
            key={href}
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eaf2ec] text-[#2f6b3f]"><Icon className="h-4 w-4" /></span>
            <span className="grid gap-0.5"><strong className="text-xs font-semibold">{label}</strong><small className="text-[10px] text-[#727b86]">{detail}</small></span>
          </Link>
        ))}
      </PopoverPanel>
    </Popover>
  );
}
