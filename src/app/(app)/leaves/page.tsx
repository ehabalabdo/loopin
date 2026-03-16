import { getLeaves } from "./actions";
import { requireAuth } from "@/lib/auth";
import LeavesView from "@/components/LeavesView";

export default async function LeavesPage() {
  const session = await requireAuth();
  const leaves = await getLeaves();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">الإجازات</h1>
      <LeavesView leaves={JSON.parse(JSON.stringify(leaves))} role={session.role} />
    </div>
  );
}
