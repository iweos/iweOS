import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";

export default function AdminGradingPromotionPage() {
  return (
    <Section>
      <PageHeader
        title="Promotion"
        subtitle="Promotion workflow placeholder. We will wire the actual session rollover and class promotion logic in the next phase."
      />
      <Card>
        <p className="section-subtle mb-0">
          This menu is ready for the promotion build-out. The next step will be defining how students move from one
          session/class to the next.
        </p>
      </Card>
    </Section>
  );
}
