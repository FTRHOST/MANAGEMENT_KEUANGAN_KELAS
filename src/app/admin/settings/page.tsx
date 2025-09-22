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
          Atur parameter dasar untuk perhitungan kas kelas.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Iuran Kas</CardTitle>
          <CardDescription>
            Atur tanggal mulai, jumlah, dan frekuensi iuran kas kelas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm currentSettings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
