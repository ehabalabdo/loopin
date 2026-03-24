"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 right-4 z-50 lg:hidden bg-[#181719] text-white p-2 rounded-lg shadow-lg"
        aria-label="فتح القائمة"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`fixed right-0 top-0 h-screen w-64 bg-[#181719] text-white flex flex-col z-50 transition-transform duration-300 ${
        mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      }`}>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 left-4 lg:hidden text-gray-400 hover:text-white"
          aria-label="إغلاق القائمة"
        >
          ✕
        </button>

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
    </>
  );
}
