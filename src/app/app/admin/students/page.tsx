import { redirect } from "next/navigation";

export default function AdminStudentsPage() {
  redirect("/app/admin/students/manage");
}
