import { getDashboardData } from "./actions";

const methodLabels: Record<string, string> = {
  CASH: "كاش",
  BANK_TRANSFER: "تحويل بنكي",
  CHECK: "شيك",
  CLIQ: "CliQ",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#181719]">لوحة التحكم</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.role !== "EMPLOYEE" && (
          <>
            <StatCard
              title="إيرادات الشهر"
              value={`${data.monthlyRevenue.toFixed(3)} د.أ`}
              color="bg-[#9ddad0]"
              icon="💰"
            />
            <StatCard
              title="مصاريف الشهر"
              value={`${data.monthlyExpenses.toFixed(3)} د.أ`}
              color="bg-[#eea9c9]"
              icon="📉"
            />
            <StatCard
              title="فواتير غير مدفوعة"
              value={String(data.unpaidInvoices)}
              color="bg-[#74bae1]"
              icon="📄"
            />
            <StatCard
              title="عملاء نشطين"
              value={String(data.activeClients)}
              color="bg-[#e5dac5]"
              icon="👥"
            />
          </>
        )}

        {data.role === "MANAGER" && (
          <>
            <StatCard
              title="الموظفين"
              value={String(data.activeEmployees)}
              color="bg-[#998dc0]"
              icon="👨‍💼"
            />
            <StatCard
              title="إجازات معلقة"
              value={String(data.pendingLeaves)}
              color="bg-[#c1d9c1]"
              icon="🏖️"
            />
          </>
        )}

        {data.role === "EMPLOYEE" && (
          <StatCard
            title="إجازاتي المعلقة"
            value={String(data.pendingLeaves)}
            color="bg-[#c1d9c1]"
            icon="🏖️"
          />
        )}
      </div>

      {data.role !== "EMPLOYEE" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* آخر الدفعات */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-[#181719] mb-4">آخر الدفعات</h3>
            <div className="space-y-3">
              {data.recentPayments.length === 0 ? (
                <p className="text-gray-400 text-center py-4">لا توجد دفعات</p>
              ) : (
                data.recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-sm">{p.clientName}</p>
                      <p className="text-xs text-gray-500">
                        {methodLabels[p.method]} • {new Date(p.paidAt).toLocaleDateString("ar-JO")}
                      </p>
                    </div>
                    <span className="font-bold text-[#9ddad0]">{p.amount.toFixed(3)} د.أ</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* فواتير متأخرة */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-[#181719] mb-4">فواتير متأخرة</h3>
            <div className="space-y-3">
              {data.overdueInvoices.length === 0 ? (
                <p className="text-gray-400 text-center py-4">لا توجد فواتير متأخرة 🎉</p>
              ) : (
                data.overdueInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                    <div>
                      <p className="font-medium text-sm">{inv.clientName}</p>
                      <p className="text-xs text-gray-500">
                        متبقي: {inv.remaining.toFixed(3)} د.أ • استحقاق: {new Date(inv.dueDate).toLocaleDateString("ar-JO")}
                      </p>
                    </div>
                    <a
                      href={`https://wa.me/${inv.clientPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `مرحباً ${inv.clientName}،\n\nنود تذكيركم بأن لديكم مبلغ مستحق بقيمة ${inv.remaining.toFixed(3)} د.أ.\n\nنرجو التكرم بتسوية المبلغ في أقرب وقت.\n\nشكراً لتعاونكم،\nفريق Loop للدعاية والإعلان`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition"
                    >
                      تذكير واتساب
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color, icon }: { title: string; value: string; color: string; icon: string }) {
  return (
    <div className={`${color} rounded-2xl p-6 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#181719]/70">{title}</p>
          <p className="text-2xl font-bold text-[#181719] mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
