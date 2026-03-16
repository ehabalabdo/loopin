import { getSettings } from "./actions";
import { requireRole } from "@/lib/auth";
import SettingsView from "@/components/SettingsView";

export default async function SettingsPage() {
  await requireRole(["MANAGER"]);
  const settings = await getSettings();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">الإعدادات</h1>
      <SettingsView settings={settings ? JSON.parse(JSON.stringify(settings)) : null} />
    </div>
  );
}
