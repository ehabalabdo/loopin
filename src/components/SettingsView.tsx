"use client";

import { updateSettings } from "@/app/(app)/settings/actions";
import { useState } from "react";

interface Settings {
  id: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string | null;
  efatooraApiKey: string | null;
}

export default function SettingsView({ settings }: { settings: Settings | null }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6">
      {saved && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg border border-green-200">
          ✅ تم حفظ الإعدادات بنجاح
        </div>
      )}

      <form
        action={async (formData) => {
          await updateSettings(formData);
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6"
      >
        <h3 className="font-bold text-lg">معلومات الشركة</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">اسم الشركة</label>
            <input
              name="companyName"
              required
              defaultValue={settings?.companyName || "شركة لوب للدعاية والإعلان"}
              className="w-full p-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">البريد الإلكتروني</label>
            <input
              name="companyEmail"
              type="email"
              required
              defaultValue={settings?.companyEmail || ""}
              className="w-full p-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">رقم الهاتف</label>
            <input
              name="companyPhone"
              defaultValue={settings?.companyPhone || ""}
              className="w-full p-2 rounded-lg border border-gray-200"
            />
          </div>
        </div>

        <hr className="border-gray-200" />

        <h3 className="font-bold text-lg">الفوترة الإلكترونية (e-Fatoora)</h3>
        <p className="text-sm text-gray-500">
          مفتاح API لنظام الفوترة الإلكترونية الأردني. سيتم تفعيل الربط قريباً.
        </p>
        <div>
          <label className="block text-sm text-gray-600 mb-1">مفتاح API</label>
          <input
            name="efatooraApiKey"
            defaultValue={settings?.efatooraApiKey || ""}
            placeholder="أدخل مفتاح API هنا عند الحصول عليه"
            className="w-full p-2 rounded-lg border border-gray-200"
          />
        </div>

        <button type="submit" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg hover:opacity-90">
          💾 حفظ الإعدادات
        </button>
      </form>
    </div>
  );
}
