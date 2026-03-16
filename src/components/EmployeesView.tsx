"use client";

import { useState } from "react";
import { createEmployee, updateEmployee, sendWarning, deleteEmployee } from "@/app/(app)/employees/actions";

const DAYS = [
  { key: "sunday", label: "الأحد" },
  { key: "monday", label: "الاثنين" },
  { key: "tuesday", label: "الثلاثاء" },
  { key: "wednesday", label: "الأربعاء" },
  { key: "thursday", label: "الخميس" },
  { key: "friday", label: "الجمعة" },
  { key: "saturday", label: "السبت" },
];

const ROLES = [
  { value: "EMPLOYEE", label: "موظف" },
  { value: "ACCOUNTANT", label: "محاسب" },
  { value: "MANAGER", label: "مدير" },
];

const WARNING_TYPES = [
  { value: "NOTICE", label: "تنبيه" },
  { value: "WARNING", label: "إنذار" },
  { value: "DEDUCTION", label: "خصم" },
];

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  salary: number;
  workType: string | null;
  timezone: string | null;
  isActive: boolean;
  workSchedule: {
    sunday: boolean;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    startTime: string;
    endTime: string;
  } | null;
}

export default function EmployeesView({ employees: initialEmployees }: { employees: Employee[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = initialEmployees.filter(
    (e) =>
      e.name.includes(search) ||
      e.email.includes(search) ||
      (e.phone && e.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* شريط البحث والإضافة */}
      <div className="flex items-center gap-4 flex-wrap">
        <input
          type="text"
          placeholder="بحث عن موظف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] p-2 rounded-lg border border-gray-200 bg-white"
        />
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          {showAdd ? "إلغاء" : "➕ إضافة موظف"}
        </button>
      </div>

      {/* نموذج إضافة موظف */}
      {showAdd && (
        <form
          action={async (formData) => {
            await createEmployee(formData);
            setShowAdd(false);
          }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4"
        >
          <h3 className="font-bold text-lg">إضافة موظف جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">الاسم</label>
              <input name="name" required className="w-full p-2 rounded-lg border border-gray-200" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">البريد الإلكتروني</label>
              <input name="email" type="email" required className="w-full p-2 rounded-lg border border-gray-200" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">كلمة المرور</label>
              <input name="password" type="password" required className="w-full p-2 rounded-lg border border-gray-200" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">الهاتف</label>
              <input name="phone" className="w-full p-2 rounded-lg border border-gray-200" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">الدور</label>
              <select name="role" required className="w-full p-2 rounded-lg border border-gray-200">
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">الراتب (د.أ)</label>
              <input name="salary" type="number" step="0.001" required className="w-full p-2 rounded-lg border border-gray-200" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">نوع العمل</label>
              <select name="workType" className="w-full p-2 rounded-lg border border-gray-200">
                <option value="ONSITE">حضوري</option>
                <option value="REMOTE">عن بعد</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">المنطقة الزمنية</label>
              <input name="timezone" defaultValue="Asia/Amman" className="w-full p-2 rounded-lg border border-gray-200" />
            </div>
          </div>

          {/* جدول العمل */}
          <div>
            <h4 className="font-semibold mb-2">جدول العمل</h4>
            <div className="flex flex-wrap gap-3 mb-3">
              {DAYS.map((d) => (
                <label key={d.key} className="flex items-center gap-1 text-sm">
                  <input type="checkbox" name={d.key} defaultChecked={!["friday", "saturday"].includes(d.key)} />
                  {d.label}
                </label>
              ))}
            </div>
            <div className="flex gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">بداية الدوام</label>
                <input name="startTime" type="time" defaultValue="09:00" className="p-2 rounded-lg border border-gray-200" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">نهاية الدوام</label>
                <input name="endTime" type="time" defaultValue="17:00" className="p-2 rounded-lg border border-gray-200" />
              </div>
            </div>
          </div>

          <button type="submit" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg hover:opacity-90">
            إضافة
          </button>
        </form>
      )}

      {/* جدول الموظفين */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-right">الاسم</th>
              <th className="p-3 text-right">البريد</th>
              <th className="p-3 text-right">الهاتف</th>
              <th className="p-3 text-right">الدور</th>
              <th className="p-3 text-right">الراتب</th>
              <th className="p-3 text-right">نوع العمل</th>
              <th className="p-3 text-right">الحالة</th>
              <th className="p-3 text-right">الدوام</th>
              <th className="p-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3 font-medium">{emp.name}</td>
                <td className="p-3 text-gray-600">{emp.email}</td>
                <td className="p-3 text-gray-600">{emp.phone || "-"}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    emp.role === "MANAGER"
                      ? "bg-purple-100 text-purple-700"
                      : emp.role === "ACCOUNTANT"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {ROLES.find((r) => r.value === emp.role)?.label}
                  </span>
                </td>
                <td className="p-3">{emp.salary.toFixed(3)} د.أ</td>
                <td className="p-3">{emp.workType === "REMOTE" ? "عن بعد" : "حضوري"}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${emp.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {emp.isActive ? "نشط" : "معطل"}
                  </span>
                </td>
                <td className="p-3 text-xs text-gray-500">
                  {emp.workSchedule
                    ? `${emp.workSchedule.startTime} - ${emp.workSchedule.endTime}`
                    : "-"}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowWarning(showWarning === emp.id ? null : emp.id)}
                      className="text-orange-600 hover:bg-orange-50 px-2 py-1 rounded text-xs"
                    >
                      ⚠️ تنبيه/خصم
                    </button>
                    <form action={async () => {
                      const formData = new FormData();
                      formData.append("isActive", emp.isActive ? "false" : "true");
                      formData.append("name", emp.name);
                      formData.append("email", emp.email);
                      formData.append("role", emp.role);
                      formData.append("salary", emp.salary.toString());
                      formData.append("workType", emp.workType || "ONSITE");
                      formData.append("timezone", emp.timezone || "Asia/Amman");
                      await updateEmployee(emp.id, formData);
                    }}>
                      <button type="submit" className={`px-2 py-1 rounded text-xs ${emp.isActive ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}>
                        {emp.isActive ? "تعطيل" : "تفعيل"}
                      </button>
                    </form>
                    {emp.phone && (
                      <a
                        href={`https://wa.me/${emp.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs"
                      >
                        واتساب
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-400">لا يوجد موظفين</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* نموذج إرسال تنبيه/إنذار/خصم */}
      {showWarning && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-200 space-y-4">
          <h3 className="font-bold text-lg text-orange-700">
            إرسال تنبيه/إنذار/خصم - {initialEmployees.find((e) => e.id === showWarning)?.name}
          </h3>
          <form
            action={async (formData) => {
              formData.append("userId", showWarning);
              await sendWarning(formData);
              setShowWarning(null);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">النوع</label>
                <select name="type" required className="w-full p-2 rounded-lg border border-gray-200">
                  {WARNING_TYPES.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">مبلغ الخصم (اختياري)</label>
                <input name="amount" type="number" step="0.001" className="w-full p-2 rounded-lg border border-gray-200" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">السبب</label>
              <textarea name="reason" required rows={3} className="w-full p-2 rounded-lg border border-gray-200" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:opacity-90">
                إرسال
              </button>
              <button type="button" onClick={() => setShowWarning(null)} className="px-6 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
