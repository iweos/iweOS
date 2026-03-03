import { redirect } from "next/navigation";

export default async function AdminSchoolPage() {
  redirect("/app/admin/dashboard");
}
