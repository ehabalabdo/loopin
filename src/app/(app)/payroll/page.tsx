import { getPayrollData } from "./actions";
import { requireAuth } from "@/lib/auth";
import PayrollView from "@/components/PayrollView";

export default async function PayrollPage() {
  const session = await requireAuth();
  const now = new Date();
  const payroll = await getPayrollData(now.getMonth() + 1, now.getFullYear());

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">كشوف الرواتب</h1>
      <PayrollView
        payroll={JSON.parse(JSON.stringify(payroll))}
        role={session.role}
        currentMonth={now.getMonth() + 1}
        currentYear={now.getFullYear()}
      />
    </div>
  );
}
