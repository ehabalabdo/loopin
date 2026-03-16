import { getTodayAttendance, getAttendanceHistory } from "./actions";
import { requireAuth } from "@/lib/auth";
import AttendanceView from "@/components/AttendanceView";

export default async function AttendancePage() {
  const session = await requireAuth();
  const today = await getTodayAttendance();
  const history = await getAttendanceHistory();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">الحضور والانصراف</h1>
      <AttendanceView
        today={today ? JSON.parse(JSON.stringify(today)) : null}
        history={JSON.parse(JSON.stringify(history))}
        role={session.role}
      />
    </div>
  );
}
