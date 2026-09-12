import { redirect } from "next/navigation";
import { AdminSubnav } from "@/components/AdminSubnav";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="space-y-4">
      <AdminSubnav />
      {children}
    </div>
  );
}
