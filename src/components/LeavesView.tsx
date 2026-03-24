"use client";

import { useState } from "react";
import { requestLeave, updateLeaveStatus } from "@/app/(app)/leaves/actions";

const LEAVE_TYPES = [
  { value: "ANNUAL", label: "سنوية" },
  { value: "SICK", label: "مرضية" },
  { value: "UNPAID", label: "بدون راتب" },
];

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
}

export default function LeavesView({ leaves, role }: { leaves: LeaveRequest[]; role: string }) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const filtered = filter === "ALL" ? leaves : leaves.filter((l) => l.status === filter);

  const pendingCount = leaves.filter((l) => l.status === "PENDING").length;
  const approvedCount = leaves.filter((l) => l.status === "APPROVED").length;
  const rejectedCount = leaves.filter((l) => l.status === "REJECTED").length;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ar-JO", { year: "numeric", month: "short", day: "numeric" });

  const getDays = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="space-y-6">
      {/* إحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">قيد الانتظار</div>
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">موافق عليها</div>
          <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">مرفوضة</div>
          <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
        </div>
      </div>

      {/* أزرار التصفية والإضافة */}
      <div className="flex items-center gap-3 flex-wrap">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm ${
              filter === s ? "bg-[var(--color-primary)] text-white" : "bg-white border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s === "ALL" ? "الكل" : s === "PENDING" ? "قيد الانتظار" : s === "APPROVED" ? "موافق عليها" : "مرفوضة"}
          </button>
        ))}
        <button
          onClick={() => setShowForm(!showForm)}
          className="mr-auto bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          {showForm ? "إلغاء" : "➕ طلب إجازة"}
        </button>
      </div>

      {/* نموذج طلب إجازة */}
      {showForm && (
        <form
          action={async (formData) => {
            await requestLeave(formData);
            setShowForm(false);
          }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4"
        >
          <h3 className="font-bold text-lg">طلب إجازة جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">نوع الإجازة</label>
              <select name="type" required className="w-full p-2 rounded-lg border border-gray-200">
                {LEAVE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">من تاريخ</label>
              <input name="startDate" type="date" required className="w-full p-2 rounded-lg border border-gray-200" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">إلى تاريخ</label>
              <input name="endDate" type="date" required className="w-full p-2 rounded-lg border border-gray-200" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">السبب</label>
            <textarea name="reason" rows={3} className="w-full p-2 rounded-lg border border-gray-200" />
          </div>
          <button type="submit" className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-bold text-base">
            ✅ إرسال الطلب
          </button>
        </form>
      )}

      {/* جدول الإجازات */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {role === "MANAGER" && <th className="p-3 text-right">الموظف</th>}
              <th className="p-3 text-right">النوع</th>
              <th className="p-3 text-right">من</th>
              <th className="p-3 text-right">إلى</th>
              <th className="p-3 text-right">المدة</th>
              <th className="p-3 text-right">السبب</th>
              <th className="p-3 text-right">الحالة</th>
              {role === "MANAGER" && <th className="p-3 text-right">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((leave) => (
              <tr key={leave.id} className="border-t border-gray-100 hover:bg-gray-50">
                {role === "MANAGER" && <td className="p-3 font-medium">{leave.user.name}</td>}
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    leave.type === "ANNUAL" ? "bg-blue-100 text-blue-700" :
                    leave.type === "SICK" ? "bg-orange-100 text-orange-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {LEAVE_TYPES.find((t) => t.value === leave.type)?.label}
                  </span>
                </td>
                <td className="p-3">{formatDate(leave.startDate)}</td>
                <td className="p-3">{formatDate(leave.endDate)}</td>
                <td className="p-3">{getDays(leave.startDate, leave.endDate)} يوم</td>
                <td className="p-3 text-gray-600 max-w-[200px] truncate">{leave.reason || "-"}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    leave.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                    leave.status === "APPROVED" ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {leave.status === "PENDING" ? "قيد الانتظار" : leave.status === "APPROVED" ? "موافق" : "مرفوض"}
                  </span>
                </td>
                {role === "MANAGER" && (
                  <td className="p-3">
                    {leave.status === "PENDING" && (
                      <div className="flex gap-2">
                        <form action={async () => { await updateLeaveStatus(leave.id, "APPROVED"); }}>
                          <button type="submit" className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs">
                            ✅ موافقة
                          </button>
                        </form>
                        <form action={async () => { await updateLeaveStatus(leave.id, "REJECTED"); }}>
                          <button type="submit" className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs">
                            ❌ رفض
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={role === "MANAGER" ? 8 : 7} className="p-8 text-center text-gray-400">
                  لا يوجد طلبات إجازة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
