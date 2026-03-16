"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface SidebarProps {
  role: string;
  userName: string;
}

const allLinks = [
  { href: "/dashboard", label: "لوحة التحكم", icon: "📊", roles: ["MANAGER", "ACCOUNTANT", "EMPLOYEE"] },
  { href: "/clients", label: "العملاء", icon: "👥", roles: ["MANAGER", "ACCOUNTANT"] },
  { href: "/finance", label: "المالية", icon: "💰", roles: ["MANAGER", "ACCOUNTANT"] },
  { href: "/employees", label: "الموظفين", icon: "👨‍💼", roles: ["MANAGER"] },
  { href: "/attendance", label: "الحضور", icon: "⏰", roles: ["MANAGER", "ACCOUNTANT", "EMPLOYEE"] },
  { href: "/payroll", label: "الرواتب", icon: "💳", roles: ["MANAGER", "ACCOUNTANT", "EMPLOYEE"] },
  { href: "/leaves", label: "الإجازات", icon: "🏖️", roles: ["MANAGER", "EMPLOYEE"] },
  { href: "/news", label: "الأخبار", icon: "📢", roles: ["MANAGER", "ACCOUNTANT", "EMPLOYEE"] },
  { href: "/settings", label: "الإعدادات", icon: "⚙️", roles: ["MANAGER"] },
];

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const links = allLinks.filter((l) => l.roles.includes(role));

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 bg-[#181719] text-white flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Loop" width={40} height={40} />
          <div>
            <h1 className="text-lg font-bold text-[#9ddad0]">Loopin</h1>
            <p className="text-xs text-gray-400">نظام إدارة لوب</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                isActive
                  ? "bg-[#9ddad0] text-[#181719] font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#74bae1] flex items-center justify-center text-[#181719] font-bold">
            {userName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-gray-400">
              {role === "MANAGER" ? "مدير" : role === "ACCOUNTANT" ? "محاسب" : "موظف"}
            </p>
          </div>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full text-sm text-gray-400 hover:text-red-400 transition text-right"
          >
            تسجيل الخروج
          </button>
        </form>
      </div>
    </aside>
  );
}
