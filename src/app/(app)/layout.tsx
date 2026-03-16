import { requireAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-[#f2f2f1]">
      <Sidebar role={session.role} userName={session.name} />
      
      {/* Main Content */}
      <div className="mr-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#181719]">مرحباً، {session.name}</h2>
            <p className="text-sm text-gray-500">
              {session.role === "MANAGER" ? "مدير النظام" : session.role === "ACCOUNTANT" ? "محاسب" : "موظف"}
            </p>
          </div>
          <NotificationBell userId={session.id} />
        </header>

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
