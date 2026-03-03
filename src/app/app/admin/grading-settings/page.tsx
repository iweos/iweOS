import { redirect } from "next/navigation";

export default function LegacyGradingSettingsPage() {
  redirect("/app/admin/grading/assessment-types");
}
