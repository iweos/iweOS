import type { Metadata } from "next";
import Footer from "@/components/home/Footer";
import FAQAccordion from "@/components/home/FAQAccordion";
import FinalCTA from "@/components/home/FinalCTA";
import Header from "@/components/home/Header";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import Pillars from "@/components/home/Pillars";
import Roles from "@/components/home/Roles";
import Testimonials from "@/components/home/Testimonials";
import Trust from "@/components/home/Trust";
import ValueStrip from "@/components/home/ValueStrip";

export const metadata: Metadata = {
  title: "iweOS | School OS for Grading and Payments",
  description:
    "Run grading, school fees, receipts, and reconciliation in one workflow for admins, teachers, and parents.",
  openGraph: {
    title: "iweOS | Run your school like an OS",
    description:
      "Grading, results, and school fees in one simple system for admins, teachers, and parents.",
    type: "website",
    images: [
      {
        url: "/images/iweos-features-concept.svg",
        width: 1200,
        height: 630,
        alt: "iweOS product preview",
      },
    ],
  },
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="overflow-x-hidden bg-[radial-gradient(1000px_420px_at_8%_-5%,rgba(15,118,110,0.08),transparent_50%),radial-gradient(850px_360px_at_100%_0%,rgba(20,83,45,0.08),transparent_45%),#f8f4ee]">
        <Hero />
        <ValueStrip />
        <Pillars />
        <HowItWorks />
        <Roles />
        <Trust />
        <Testimonials />
        <FAQAccordion />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
