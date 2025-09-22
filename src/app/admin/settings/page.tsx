
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SettingsForm from "../components/SettingsForm";
import { getSettings } from "@/lib/actions";
import type { Settings } from "@/lib/types";

export default async function SettingsPage() {
  const settings: Settings = await getSettings();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline">Pengaturan</h1>
        <p className="text-muted-foreground">
          Atur parameter dasar dan tampilan untuk aplikasi kas kelas.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Umum</CardTitle>
          <CardDescription>
            Ubah nama aplikasi, logo, dan parameter iuran kas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm currentSettings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
