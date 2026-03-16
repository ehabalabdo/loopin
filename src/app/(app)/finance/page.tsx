import { getFinanceData } from "./actions";
import FinanceView from "@/components/FinanceView";

export default async function FinancePage() {
  const data = await getFinanceData();
  return <FinanceView data={data} />;
}
