"use client";

import { useState } from "react";
import { checkIn, breakOut, breakIn, checkOut } from "@/app/(app)/attendance/actions";

interface AttendanceRecord {
  id: string;
  checkIn: string;
  checkOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  totalHours: number | null;
  status: string;
  user?: { name: string };
}

export default function AttendanceView({
  today,
  history,
  role,
}: {
  today: AttendanceRecord | null;
  history: AttendanceRecord[];
  role: string;
}) {
  const [error, setError] = useState("");
  const [showReport, setShowReport] = useState(false);

  const handleAction = async (action: () => Promise<void>) => {
    setError("");
    try {
      await action();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    }
  };

  const getStatus = () => {
    if (!today) return "لم تسجل دخولك";
    if (today.checkOut) return "انتهى الدوام";
    if (today.breakStart && !today.breakEnd) return "في استراحة";
    return "في الدوام";
  };

  const getStatusColor = () => {
    if (!today) return "bg-gray-100 text-gray-600";
    if (today.checkOut) return "bg-blue-100 text-blue-700";
    if (today.breakStart && !today.breakEnd) return "bg-orange-100 text-orange-700";
    return "bg-green-100 text-green-700";
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ar-JO", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200">{error}</div>
      )}

      {/* حالة اليوم */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold mb-2">حالة اليوم</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {getStatus()}
            </span>
          </div>

          {today && (
            <div className="flex gap-4 text-sm text-gray-600">
              <div>تسجيل الدخول: <strong>{formatTime(today.checkIn)}</strong></div>
              {today.breakStart && <div>بداية الاستراحة: <strong>{formatTime(today.breakStart)}</strong></div>}
              {today.breakEnd && <div>نهاية الاستراحة: <strong>{formatTime(today.breakEnd)}</strong></div>}
              {today.checkOut && <div>تسجيل الخروج: <strong>{formatTime(today.checkOut)}</strong></div>}
              {today.totalHours !== null && <div>إجمالي الساعات: <strong>{today.totalHours}</strong></div>}
            </div>
          )}
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex gap-3 mt-4 flex-wrap">
          {!today && (
            <button
              onClick={() => handleAction(checkIn)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 text-lg"
            >
              ✅ تسجيل الدخول
            </button>
          )}

          {today && !today.checkOut && !today.breakStart && (
            <button
              onClick={() => handleAction(breakOut)}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600"
            >
              ☕ بداية استراحة
            </button>
          )}

          {today && today.breakStart && !today.breakEnd && (
            <button
              onClick={() => handleAction(breakIn)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              🔙 نهاية استراحة
            </button>
          )}

          {today && !today.checkOut && (!today.breakStart || today.breakEnd) && (
            <button
              onClick={() => setShowReport(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
            >
              🚪 تسجيل الخروج
            </button>
          )}
        </div>
      </div>

      {/* نموذج التقرير اليومي */}
      {showReport && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-200">
          <h3 className="font-bold text-lg mb-3">📝 التقرير اليومي (مطلوب قبل الخروج)</h3>
          <form
            action={async (formData) => {
              setError("");
              try {
                await checkOut(formData);
                setShowReport(false);
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "حدث خطأ");
              }
            }}
            className="space-y-4"
          >
            <textarea
              name="report"
              required
              rows={5}
              placeholder="اكتب ملخص ما أنجزته اليوم... (10 أحرف على الأقل)"
              className="w-full p-3 rounded-lg border border-gray-200 resize-none"
            />
            <div className="flex gap-3">
              <button type="submit" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg hover:opacity-90">
                إرسال التقرير وتسجيل الخروج
              </button>
              <button type="button" onClick={() => setShowReport(false)} className="px-6 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* سجل الحضور */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <h3 className="p-4 font-bold text-lg border-b border-gray-100">سجل الحضور</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {role === "MANAGER" && <th className="p-3 text-right">الموظف</th>}
              <th className="p-3 text-right">التاريخ</th>
              <th className="p-3 text-right">الدخول</th>
              <th className="p-3 text-right">الاستراحة</th>
              <th className="p-3 text-right">الخروج</th>
              <th className="p-3 text-right">الساعات</th>
              <th className="p-3 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record) => (
              <tr key={record.id} className="border-t border-gray-100 hover:bg-gray-50">
                {role === "MANAGER" && <td className="p-3 font-medium">{record.user?.name}</td>}
                <td className="p-3">{formatDate(record.checkIn)}</td>
                <td className="p-3">{formatTime(record.checkIn)}</td>
                <td className="p-3 text-gray-500">
                  {record.breakStart
                    ? `${formatTime(record.breakStart)}${record.breakEnd ? ` - ${formatTime(record.breakEnd)}` : " (مستمرة)"}`
                    : "-"}
                </td>
                <td className="p-3">{record.checkOut ? formatTime(record.checkOut) : "-"}</td>
                <td className="p-3">{record.totalHours !== null ? record.totalHours : "-"}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    record.status === "PRESENT"
                      ? "bg-green-100 text-green-700"
                      : record.status === "LEAVE"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {record.status === "PRESENT" ? "حاضر" : record.status === "LEAVE" ? "إجازة" : record.status}
                  </span>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={role === "MANAGER" ? 7 : 6} className="p-8 text-center text-gray-400">
                  لا يوجد سجلات حضور
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
