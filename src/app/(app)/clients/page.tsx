import { getClients } from "./actions";
import ClientsView from "@/components/ClientsView";

export default async function ClientsPage() {
  const clients = await getClients();
  const serialized = clients.map((c) => ({
    ...c,
    amount: Number(c.amount),
    startDate: c.startDate?.toISOString() ?? null,
    endDate: c.endDate?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    invoices: c.invoices.map((inv) => ({
      ...inv,
      remainingAmount: Number(inv.remainingAmount),
    })),
  }));

  return <ClientsView clients={serialized} />;
}
