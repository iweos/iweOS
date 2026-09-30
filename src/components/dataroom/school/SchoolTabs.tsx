"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
export default function SchoolTabs({ items }: { items: { key: string; label: string; href: string; active: boolean }[] }) {
  const ref = useRef<HTMLElement>(null);
  const active = items.find(item => item.active)?.key;
  useEffect(() => {
    const nav = ref.current;
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && current) nav.scrollLeft = Math.max(0, current.offsetLeft - nav.offsetLeft - (nav.clientWidth - current.clientWidth) / 2);
  }, [active]);
  return <nav ref={ref} className="sw-tabs" aria-label="School sections">{items.map(item => <Link key={item.key} href={item.href} aria-current={item.active ? "page" : undefined}>{item.label}</Link>)}</nav>;
}
