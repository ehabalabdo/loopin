"use client";

import { useState } from "react";
import { createInvoice, addPayment, createExpense, deleteExpense } from "@/app/(app)/finance/actions";

const statusLabels: Record<string, string> = {
  PENDING: "معلقة",
  PARTIAL: "جزئية",
  PAID: "مدفوعة",
  OVERDUE: "متأخرة",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PARTIAL: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

const methodLabels: Record<string, string> = {
  CASH: "كاش",
  BANK_TRANSFER: "تحويل بنكي",
  CHECK: "شيك",
  CLIQ: "CliQ",
};

const categoryLabels: Record<string, string> = {
  SALARIES: "رواتب",
  RENT: "إيجار",
  SUBSCRIPTIONS: "اشتراكات برامج",
  UTILITIES: "كهرباء ومياه",
  MISCELLANEOUS: "متفرقات",
  GOVERNMENT: "تراخيص/حكومي",
  EQUIPMENT: "أدوات ومعدات",
};

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientPhone: string;
  clientId: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  description: string | null;
  dueDate: string;
  createdAt: string;
  payments: { id: string; amount: number; method: string; reference: string | null; paidAt: string }[];
}

interface ExpenseData {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface FinanceData {
  invoices: InvoiceData[];
  expenses: ExpenseData[];
  clients: { id: string; name: string }[];
}

export default function FinanceView({ data }: { data: FinanceData }) {
  const [tab, setTab] = useState<"invoices" | "expenses" | "reports">("invoices");
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);

  const totalRevenue = data.invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#181719]">المالية والمحاسبة</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#9ddad0] rounded-2xl p-6">
          <p className="text-sm text-[#181719]/70">إجمالي الإيرادات</p>
          <p className="text-2xl font-bold text-[#181719]">{totalRevenue.toFixed(3)} د.أ</p>
        </div>
        <div className="bg-[#eea9c9] rounded-2xl p-6">
          <p className="text-sm text-[#181719]/70">إجمالي المصاريف</p>
          <p className="text-2xl font-bold text-[#181719]">{totalExpenses.toFixed(3)} د.أ</p>
        </div>
        <div className={`${profit >= 0 ? "bg-[#c1d9c1]" : "bg-red-100"} rounded-2xl p-6`}>
          <p className="text-sm text-[#181719]/70">صافي الربح</p>
          <p className="text-2xl font-bold text-[#181719]">{profit.toFixed(3)} د.أ</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["invoices", "expenses", "reports"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition ${
              tab === t ? "bg-[#181719] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t === "invoices" ? "الفواتير" : t === "expenses" ? "المصاريف" : "التقارير"}
          </button>
        ))}
      </div>

      {/* Invoices Tab */}
      {tab === "invoices" && (
        <div className="space-y-4">
          <button
            onClick={() => setShowInvoiceForm(!showInvoiceForm)}
            className="px-6 py-2 bg-[#181719] text-white rounded-xl hover:bg-[#2a2a2c] transition"
          >
            {showInvoiceForm ? "إلغاء" : "+ فاتورة جديدة"}
          </button>

          {showInvoiceForm && (
            <form
              action={async (fd) => { await createInvoice(fd); setShowInvoiceForm(false); }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">العميل *</label>
                  <select name="clientId" required className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]">
                    <option value="">اختر عميل</option>
                    {data.clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المبلغ (د.أ) *</label>
                  <input name="amount" type="number" step="0.001" required dir="ltr" className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">تاريخ الاستحقاق *</label>
                  <input name="dueDate" type="date" required className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الوصف</label>
                  <input name="description" className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]" />
                </div>
              </div>
              <button type="submit" className="px-6 py-2 bg-[#9ddad0] text-[#181719] rounded-xl font-medium">حفظ الفاتورة</button>
            </form>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">رقم الفاتورة</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">العميل</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">المبلغ</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">المدفوع</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">المتبقي</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">الحالة</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">الاستحقاق</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono" dir="ltr">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm">{inv.clientName}</td>
                    <td className="px-6 py-4 text-sm">{inv.amount.toFixed(3)}</td>
                    <td className="px-6 py-4 text-sm text-green-600">{inv.paidAmount.toFixed(3)}</td>
                    <td className="px-6 py-4 text-sm text-red-600">{inv.remainingAmount.toFixed(3)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${statusColors[inv.status]}`}>
                        {statusLabels[inv.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{new Date(inv.dueDate).toLocaleDateString("ar-JO")}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {inv.status !== "PAID" && (
                          <button
                            onClick={() => setPayingInvoice(payingInvoice === inv.id ? null : inv.id)}
                            className="px-3 py-1 bg-[#74bae1] text-white text-xs rounded-lg"
                          >
                            تسجيل دفعة
                          </button>
                        )}
                        {inv.status !== "PAID" && (
                          <a
                            href={`https://wa.me/${inv.clientPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `مرحباً ${inv.clientName}،\n\nنود تذكيركم بأن لديكم فاتورة رقم ${inv.invoiceNumber} بمبلغ مستحق ${inv.remainingAmount.toFixed(3)} د.أ.\nتاريخ الاستحقاق: ${new Date(inv.dueDate).toLocaleDateString("ar-JO")}\n\nنرجو التكرم بتسوية المبلغ في أقرب وقت.\n\nشكراً لتعاونكم،\nفريق Loop للدعاية والإعلان`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg"
                          >
                            تذكير
                          </a>
                        )}
                      </div>
                      {payingInvoice === inv.id && (
                        <form
                          action={async (fd) => { await addPayment(fd); setPayingInvoice(null); }}
                          className="mt-3 p-3 bg-blue-50 rounded-xl space-y-2"
                        >
                          <input type="hidden" name="invoiceId" value={inv.id} />
                          <input name="amount" type="number" step="0.001" required placeholder="المبلغ" dir="ltr" className="w-full px-3 py-2 border rounded-lg text-sm" />
                          <select name="method" required className="w-full px-3 py-2 border rounded-lg text-sm">
                            <option value="CASH">كاش</option>
                            <option value="BANK_TRANSFER">تحويل بنكي</option>
                            <option value="CHECK">شيك</option>
                            <option value="CLIQ">CliQ</option>
                          </select>
                          <input name="reference" placeholder="رقم الحوالة/الشيك" dir="ltr" className="w-full px-3 py-2 border rounded-lg text-sm" />
                          <input name="notes" placeholder="ملاحظات" className="w-full px-3 py-2 border rounded-lg text-sm" />
                          <button type="submit" className="px-4 py-1 bg-[#74bae1] text-white text-sm rounded-lg">تأكيد الدفعة</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.invoices.length === 0 && (
              <div className="text-center py-12 text-gray-400">لا توجد فواتير</div>
            )}
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {tab === "expenses" && (
        <div className="space-y-4">
          <button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="px-6 py-2 bg-[#181719] text-white rounded-xl hover:bg-[#2a2a2c] transition"
          >
            {showExpenseForm ? "إلغاء" : "+ مصروف جديد"}
          </button>

          {showExpenseForm && (
            <form
              action={async (fd) => { await createExpense(fd); setShowExpenseForm(false); }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الفئة *</label>
                  <select name="category" required className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]">
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المبلغ (د.أ) *</label>
                  <input name="amount" type="number" step="0.001" required dir="ltr" className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الوصف *</label>
                  <input name="description" required className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">التاريخ *</label>
                  <input name="date" type="date" required className="w-full px-4 py-2 border rounded-xl bg-[#f2f2f1]" />
                </div>
              </div>
              <button type="submit" className="px-6 py-2 bg-[#9ddad0] text-[#181719] rounded-xl font-medium">حفظ المصروف</button>
            </form>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">الفئة</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">الوصف</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">المبلغ</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">التاريخ</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{categoryLabels[exp.category]}</td>
                    <td className="px-6 py-4 text-sm">{exp.description}</td>
                    <td className="px-6 py-4 text-sm font-medium">{exp.amount.toFixed(3)} د.أ</td>
                    <td className="px-6 py-4 text-sm">{new Date(exp.date).toLocaleDateString("ar-JO")}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={async () => {
                          if (confirm("حذف هذا المصروف؟")) await deleteExpense(exp.id);
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.expenses.length === 0 && (
              <div className="text-center py-12 text-gray-400">لا توجد مصاريف</div>
            )}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {tab === "reports" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4">تقرير الأرباح والخسائر</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-green-50 rounded-xl">
                <span>إجمالي الإيرادات</span>
                <span className="font-bold text-green-600">{totalRevenue.toFixed(3)} د.أ</span>
              </div>
              <div className="flex justify-between p-3 bg-red-50 rounded-xl">
                <span>إجمالي المصاريف</span>
                <span className="font-bold text-red-600">{totalExpenses.toFixed(3)} د.أ</span>
              </div>
              <hr />
              <div className={`flex justify-between p-3 rounded-xl ${profit >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                <span className="font-bold">صافي الربح</span>
                <span className={`font-bold ${profit >= 0 ? "text-green-700" : "text-red-700"}`}>{profit.toFixed(3)} د.أ</span>
              </div>
            </div>
          </div>

          {/* Expenses by Category */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4">المصاريف حسب الفئة</h3>
            <div className="space-y-2">
              {Object.entries(categoryLabels).map(([key, label]) => {
                const total = data.expenses
                  .filter((e) => e.category === key)
                  .reduce((sum, e) => sum + e.amount, 0);
                if (total === 0) return null;
                const percent = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                return (
                  <div key={key} className="flex items-center gap-4">
                    <span className="text-sm w-32">{label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4">
                      <div
                        className="bg-[#eea9c9] h-4 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-28 text-left" dir="ltr">{total.toFixed(3)} د.أ</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
