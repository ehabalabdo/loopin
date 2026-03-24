"use client";

import { useState, useEffect } from "react";
import { checkIn, breakOut, breakIn, checkOut } from "@/app/(app)/attendance/actions";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

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
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    // Check if WebAuthn is supported
    const supported = typeof window !== "undefined" && !!window.PublicKeyCredential;
    setBiometricSupported(supported);

    // Check if user has registered biometrics
    fetch("/api/webauthn/status")
      .then((r) => r.json())
      .then((d) => setBiometricRegistered(d.registered))
      .catch(() => {});
  }, []);

  // Register biometric (fingerprint/Face ID)
  const registerBiometric = async () => {
    setError("");
    setBiometricLoading(true);
    try {
      const optRes = await fetch("/api/webauthn/register");
      if (!optRes.ok) throw new Error("فشل بدء التسجيل");
      const options = await optRes.json();

      const attestation = await startRegistration({ optionsJSON: options });

      const verRes = await fetch("/api/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attestation),
      });

      if (!verRes.ok) {
        const data = await verRes.json();
        throw new Error(data.error || "فشل تسجيل البصمة");
      }

      setBiometricRegistered(true);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "NotAllowedError") {
        setError("تم إلغاء تسجيل البصمة");
      } else {
        setError(e instanceof Error ? e.message : "فشل تسجيل البصمة");
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  // Verify biometric before action
  const verifyBiometric = async (): Promise<boolean> => {
    if (!biometricRegistered) return true; // Skip if no biometric registered
    try {
      const optRes = await fetch("/api/webauthn/verify");
      if (!optRes.ok) return true; // Skip if error
      const options = await optRes.json();

      const assertion = await startAuthentication({ optionsJSON: options });

      const verRes = await fetch("/api/webauthn/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });

      if (!verRes.ok) {
        const data = await verRes.json();
        throw new Error(data.error || "فشل التحقق");
      }
      return true;
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "NotAllowedError") {
        setError("تم إلغاء التحقق من البصمة");
      } else {
        setError(e instanceof Error ? e.message : "فشل التحقق من الهوية");
      }
      return false;
    }
  };

  const handleAction = async (action: () => Promise<void>) => {
    setError("");
    try {
      // Verify biometric before attendance actions
      const verified = await verifyBiometric();
      if (!verified) return;
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
            <div className="flex gap-4 text-sm text-gray-600 flex-wrap">
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
              {biometricRegistered ? "🔐" : "✅"} تسجيل الدخول {biometricRegistered ? "(بالبصمة)" : ""}
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

      {/* تسجيل البصمة */}
      {biometricSupported && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                🔐 البصمة / Face ID
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {biometricRegistered
                  ? "✅ تم تسجيل البصمة - سيتم التحقق من هويتك عند كل بصمة حضور"
                  : "سجّل بصمتك أو Face ID لتأكيد هويتك عند تسجيل الحضور"}
              </p>
            </div>
            <button
              onClick={registerBiometric}
              disabled={biometricLoading}
              className={`px-6 py-3 rounded-lg font-medium ${
                biometricRegistered
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-[#181719] text-white hover:opacity-90"
              }`}
            >
              {biometricLoading
                ? "⏳ جاري التسجيل..."
                : biometricRegistered
                ? "📱 تسجيل جهاز إضافي"
                : "📱 تسجيل البصمة / Face ID"}
            </button>
          </div>
        </div>
      )}

      {/* نموذج التقرير اليومي */}
      {showReport && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-200">
          <h3 className="font-bold text-lg mb-3">📝 التقرير اليومي (مطلوب قبل الخروج)</h3>
          <form
            action={async (formData) => {
              setError("");
              try {
                const verified = await verifyBiometric();
                if (!verified) return;
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
