import { getFinanceData } from "./actions";
import FinanceView from "@/components/FinanceView";

export default async function FinancePage() {
  const data = await getFinanceData();
  
  const serialized = {
    invoices: data.invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.client.name,
      clientPhone: inv.client.phone,
      clientId: inv.clientId,
      amount: Number(inv.amount),
      paidAmount: Number(inv.paidAmount),
      remainingAmount: Number(inv.remainingAmount),
      status: inv.status,
      description: inv.description,
      dueDate: inv.dueDate.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      payments: inv.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        reference: p.reference,
        paidAt: p.paidAt.toISOString(),
      })),
    })),
    expenses: data.expenses.map((e) => ({
      id: e.id,
      category: e.category,
      amount: Number(e.amount),
      description: e.description,
      date: e.date.toISOString(),
    })),
    clients: data.clients,
  };

  return <FinanceView data={serialized} />;
}
