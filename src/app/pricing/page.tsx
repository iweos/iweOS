import type { Metadata } from "next";
import Link from "next/link";
import { Check, CreditCard } from "lucide-react";
import PublicSiteShell from "@/components/home-template/PublicSiteShell";
import PublicPageHero from "@/components/home-template/visuals/PublicPageHero";
import { paymentsFlowLottie } from "@/lib/lotties/publicSite";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Lovable-style three-plan pricing for ìwéOS school grading and payment workflows.",
};

const pricingModels = [
  {
    name: "Starter",
    price: "To be set",
    description: "For smaller schools getting started with digital workflows.",
    features: [
      "Criteria to be defined later",
      "Core grading workflow",
      "Basic reporting scope",
      "Support model to be defined",
    ],
    ctaLabel: "Create school",
    ctaHref: "/sign-up",
    highlighted: false,
  },
  {
    name: "Standard",
    price: "To be set",
    description: "For growing schools that need grading, payments, and fuller operations.",
    features: [
      "Criteria to be defined later",
      "Grading + payment modules",
      "Receipts and reconciliation flow",
      "Expanded reporting scope",
      "Priority support option",
    ],
    ctaLabel: "Create school",
    ctaHref: "/sign-up",
    highlighted: true,
  },
  {
    name: "Premium",
    price: "To be set",
    description: "For larger schools or school groups with broader rollout needs.",
    features: [
      "Criteria to be defined later",
      "Full operational coverage",
      "Multi-campus or advanced setup support",
      "Deeper onboarding options",
      "Custom workflow support",
    ],
    ctaLabel: "Contact support",
    ctaHref: "mailto:support@iweos.io",
    highlighted: false,
  },
] as const;

export default function PricingPage() {
  return (
    <PublicSiteShell currentPath="/pricing">
      <main>
        <PublicPageHero
          eyebrow="Pricing"
          title="Simple, transparent pricing"
          description="Choose the plan structure that fits your school. The exact criteria and pricing values can be set later without changing the layout."
          primaryCta={{ label: "Create school", href: "/sign-up" }}
          secondaryCta={{ label: "Open guide", href: "/guide" }}
          animationData={paymentsFlowLottie}
          icon={CreditCard}
        />

        <section className="border-b border-[#e6dfd3]">
          <div className="mx-auto max-w-5xl px-4 py-20">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-sm leading-7 text-[#4b5563]">
                This follows the Lovable 3-plan structure, with placeholders where we still need to define the real qualification rules and amounts.
              </p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {pricingModels.map((model) => (
                <article
                  key={model.name}
                  className={`flex flex-col justify-between rounded-lg border p-6 ${
                    model.highlighted
                      ? "border-[#1e3a5f] bg-[#1e3a5f]/[0.03] ring-1 ring-[#1e3a5f]/20"
                      : "border-[#d7dfe9] bg-[#f2eee7]"
                  }`}
                >
                  <div>
                    <h3 className="text-lg font-semibold text-[#111827]">{model.name}</h3>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-[#111827]">{model.price}</p>
                    <p className="mt-2 text-sm text-[#6b7280]">{model.description}</p>
                    <ul className="mt-6 space-y-3">
                      {model.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-[#6b7280]">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#4a7a61]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-8">
                    <Link
                      href={model.ctaHref}
                      className={`block w-full rounded-md px-4 py-3 text-center text-sm font-medium transition ${
                        model.highlighted
                          ? "bg-[#1e3a5f] !text-white visited:!text-white hover:!text-white hover:bg-[#18314f]"
                          : "border border-[#cfd8e3] bg-transparent text-[#111827] hover:bg-[#f3efe7]"
                      }`}
                    >
                      {model.ctaLabel}
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-[#d7dfe9] bg-white p-6 shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
              <h3 className="text-xl font-semibold text-[#111827]">What we still need to decide</h3>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[#4b5563]">
                <li>• School size thresholds for each model</li>
                <li>• The exact amount or billing basis for each plan</li>
                <li>• Which modules are included by default in each model</li>
                <li>• Whether onboarding and migration are bundled or separate</li>
                <li>• How support level changes across the three plans</li>
              </ul>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/sign-up" className="rounded-md bg-[#1e3a5f] px-5 py-3 text-sm font-medium !text-white hover:!text-white">
                Create school
              </Link>
              <Link href="/guide" className="rounded-md border border-[#cfd8e3] px-5 py-3 text-sm font-semibold text-[#1f2a37] hover:border-[#9aa7bb]">
                Open guide
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicSiteShell>
  );
}
