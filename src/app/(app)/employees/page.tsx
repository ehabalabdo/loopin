import { getEmployees } from "./actions";
import { requireRole } from "@/lib/auth";
import EmployeesView from "@/components/EmployeesView";

export default async function EmployeesPage() {
  await requireRole(["MANAGER"]);
  const employees = await getEmployees();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">إدارة الموظفين</h1>
      <EmployeesView employees={JSON.parse(JSON.stringify(employees))} />
    </div>
  );
}
