import { requireProfile } from "@/lib/server/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireProfile();
  return children;
}
