"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Building2, Check, ChevronDown, GraduationCap, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";

type PortalSwitcherProps = {
  mode: "admin" | "teacher";
  currentSchoolName?: string;
  platformAdmin: boolean;
  teacherPortalAdmin: boolean;
};

export default function PortalSwitcher({ mode, currentSchoolName, platformAdmin, teacherPortalAdmin }: PortalSwitcherProps) {
  const currentLabel = mode === "admin" ? "School admin" : "Teacher portal";
  const CurrentIcon = mode === "admin" ? Building2 : GraduationCap;

  return (
    <Popover className="app-portal-switcher">
      <PopoverButton className="app-portal-trigger" aria-label="Change portal">
        <CurrentIcon />
        <span><small>Current portal</small><strong>{currentLabel}</strong></span>
        <ChevronDown className="app-portal-chevron" />
      </PopoverButton>
      <PopoverPanel anchor="bottom end" className="app-portal-panel">
        <div className="app-portal-heading"><span>Portal access</span><small>{currentSchoolName || "iweOS workspace"}</small></div>
        <div className="app-portal-options">
          {mode === "admin" ? <div className="is-current"><span><Building2 /></span><div><strong>School administration</strong><small>Manage setup, people, results, and payments</small></div><Check /></div> : null}
          {mode === "admin" ? <Link href="/app/teacher/dashboard"><span><UsersRound /></span><div><strong>Teacher portal</strong><small>Attendance, scores, conduct, and comments</small></div></Link> : null}
          {mode === "teacher" && teacherPortalAdmin ? <Link href="/app/admin/dashboard"><span><Building2 /></span><div><strong>School administration</strong><small>Return to administrative operations</small></div></Link> : null}
          {mode === "teacher" ? <div className="is-current"><span><GraduationCap /></span><div><strong>Teacher portal</strong><small>Your teaching workspace</small></div><Check /></div> : null}
          {platformAdmin ? <Link href="/dataroom"><span><ShieldCheck /></span><div><strong>iweOS Dataroom</strong><small>Platform-wide school intelligence</small></div></Link> : null}
        </div>
      </PopoverPanel>
    </Popover>
  );
}
