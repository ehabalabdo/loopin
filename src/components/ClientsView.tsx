"use client";

import { useState } from "react";
import { createClient, deleteClient } from "@/app/(app)/clients/actions";

const serviceLabels: Record<string, string> = {
  SOCIAL_MEDIA: "إدارة سوشال ميديا",
  VIDEO: "إنتاج فيديو",
};

const subLabels: Record<string, string> = {
  MONTHLY: "شهري",
  QUARTERLY: "3 أشهر",
  SEMI_ANNUAL: "6 أشهر",
  ANNUAL: "سنوي",
};

interface ClientData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  serviceType: string;
  subscriptionType: string | null;
  amount: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  invoices: { id: string; status: string; remainingAmount: number }[];
}

export default function ClientsView({ clients }: { clients: ClientData[] }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = clients.filter((c) =>
    c.name.includes(search) || c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#181719]">إدارة العملاء</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-[#181719] text-white rounded-xl hover:bg-[#2a2a2c] transition"
        >
          {showForm ? "إلغاء" : "+ عميل جديد"}
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="ابحث بالاسم أو الهاتف..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#74bae1]"
      />

      {/* Add Form */}
      {showForm && (
        <form
          action={async (formData) => {
            await createClient(formData);
            setShowForm(false);
          }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">اسم العميل *</label>
              <input name="name" required className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">رقم الهاتف (واتساب) *</label>
              <input name="phone" required dir="ltr" className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]" placeholder="+962..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
              <input name="email" type="email" dir="ltr" className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نوع الخدمة *</label>
              <select name="serviceType" required className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]">
                <option value="SOCIAL_MEDIA">إدارة سوشال ميديا</option>
                <option value="VIDEO">إنتاج فيديو</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نوع الاشتراك</label>
              <select name="subscriptionType" className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]">
                <option value="">بدون اشتراك (جلسة)</option>
                <option value="MONTHLY">شهري</option>
                <option value="QUARTERLY">3 أشهر</option>
                <option value="SEMI_ANNUAL">6 أشهر</option>
                <option value="ANNUAL">سنوي</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المبلغ (د.أ) *</label>
              <input name="amount" type="number" step="0.001" required dir="ltr" className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ البداية</label>
              <input name="startDate" type="date" className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ملاحظات</label>
              <input name="notes" className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]" />
            </div>
          </div>
          <button type="submit" className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 transition">
            ✅ حفظ العميل
          </button>
        </form>
      )}

      {/* Clients Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">العميل</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">الخدمة</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">الاشتراك</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">المبلغ</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">الحالة</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((client) => {
              const totalUnpaid = client.invoices
                .filter((i) => i.status !== "PAID")
                .reduce((sum, i) => sum + i.remainingAmount, 0);

              return (
                <tr key={client.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-sm">{client.name}</p>
                    <p className="text-xs text-gray-500" dir="ltr">{client.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">{serviceLabels[client.serviceType]}</td>
                  <td className="px-6 py-4 text-sm">
                    {client.subscriptionType ? subLabels[client.subscriptionType] : "جلسة"}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{client.amount.toFixed(3)} د.أ</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${client.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {client.isActive ? "نشط" : "غير نشط"}
                    </span>
                    {totalUnpaid > 0 && (
                      <span className="mr-2 px-2 py-1 rounded-full text-xs bg-red-100 text-red-600">
                        متبقي: {totalUnpaid.toFixed(3)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <a
                        href={`https://wa.me/${client.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                          `مرحباً ${client.name}،\n\nنود تذكيركم بموعد تسديد المبلغ المستحق.\n\nنرجو التكرم بتسوية المبلغ في أقرب وقت.\n\nشكراً لتعاونكم،\nفريق Loop للدعاية والإعلان`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition"
                      >
                        واتساب
                      </a>
                      <button
                        onClick={async () => {
                          if (confirm("هل أنت متأكد من حذف هذا العميل؟")) {
                            await deleteClient(client.id);
                          }
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">لا يوجد عملاء</div>
        )}
      </div>
    </div>
  );
}
