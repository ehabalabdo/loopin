"use client";

import { useState } from "react";
import { generatePayslip, generateAllPayslips, markPayslipPaid } from "@/app/(app)/payroll/actions";

interface Deduction {
  id: string;
  amount: number;
  reason: string;
}

interface Payslip {
  id: string;
  isPaid: boolean;
  paidAt: string | null;
}

interface PayrollEntry {
  user: { id: string; name: string; email: string; salary: number };
  workingDays: number;
  totalHours: number;
  deductions: Deduction[];
  totalDeductions: number;
  netSalary: number;
  payslip: Payslip | null;
}

export default function PayrollView({
  payroll,
  role,
  currentMonth,
  currentYear,
}: {
  payroll: PayrollEntry[];
  role: string;
  currentMonth: number;
  currentYear: number;
}) {
  const [month] = useState(currentMonth);
  const [year] = useState(currentYear);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const MONTHS = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];

  const totalSalaries = payroll.reduce((sum, p) => sum + p.netSalary, 0);
  const totalDeductions = payroll.reduce((sum, p) => sum + p.totalDeductions, 0);
  const paidCount = payroll.filter((p) => p.payslip?.isPaid).length;

  return (
    <div className="space-y-6">
      {/* ملخص الشهر */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold">
          {MONTHS[month - 1]} {year}
        </h2>
        {role === "MANAGER" && (
          <form action={async () => { await generateAllPayslips(month, year); }}>
            <button type="submit" className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90">
              📋 إصدار جميع كشوف الرواتب
            </button>
          </form>
        )}
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">إجمالي الرواتب</div>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{totalSalaries.toFixed(3)} د.أ</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">إجمالي الخصومات</div>
          <div className="text-2xl font-bold text-red-600">{totalDeductions.toFixed(3)} د.أ</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">تم الدفع</div>
          <div className="text-2xl font-bold text-green-600">{paidCount} / {payroll.length}</div>
        </div>
      </div>

      {/* جدول الرواتب */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-right">الموظف</th>
              <th className="p-3 text-right">الراتب الأساسي</th>
              <th className="p-3 text-right">أيام العمل</th>
              <th className="p-3 text-right">الساعات</th>
              <th className="p-3 text-right">الخصومات</th>
              <th className="p-3 text-right">صافي الراتب</th>
              <th className="p-3 text-right">الحالة</th>
              {role === "MANAGER" && <th className="p-3 text-right">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {payroll.map((entry) => (
              <>
                <tr key={entry.user.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">
                    <button
                      onClick={() => setExpandedId(expandedId === entry.user.id ? null : entry.user.id)}
                      className="hover:text-[var(--color-primary)]"
                    >
                      {entry.user.name}
                    </button>
                  </td>
                  <td className="p-3">{entry.user.salary.toFixed(3)} د.أ</td>
                  <td className="p-3">{entry.workingDays} يوم</td>
                  <td className="p-3">{entry.totalHours} ساعة</td>
                  <td className="p-3 text-red-600">
                    {entry.totalDeductions > 0 ? `-${entry.totalDeductions.toFixed(3)}` : "0"} د.أ
                  </td>
                  <td className="p-3 font-bold text-[var(--color-primary)]">{entry.netSalary.toFixed(3)} د.أ</td>
                  <td className="p-3">
                    {entry.payslip ? (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        entry.payslip.isPaid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {entry.payslip.isPaid ? "مدفوع" : "صدر - غير مدفوع"}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">لم يصدر</span>
                    )}
                  </td>
                  {role === "MANAGER" && (
                    <td className="p-3">
                      <div className="flex gap-2">
                        <form action={async () => { await generatePayslip(entry.user.id, month, year); }}>
                          <button type="submit" className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs">
                            إصدار
                          </button>
                        </form>
                        {entry.payslip && !entry.payslip.isPaid && (
                          <form action={async () => { await markPayslipPaid(entry.payslip!.id); }}>
                            <button type="submit" className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs">
                              تم الدفع
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
                {expandedId === entry.user.id && entry.deductions.length > 0 && (
                  <tr key={`${entry.user.id}-details`} className="bg-red-50">
                    <td colSpan={role === "MANAGER" ? 8 : 7} className="p-3">
                      <div className="text-sm">
                        <strong>الخصومات:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {entry.deductions.map((d) => (
                            <li key={d.id}>
                              {d.reason} - <span className="text-red-600">{d.amount.toFixed(3)} د.أ</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
