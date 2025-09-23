
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SettingsForm from "../components/SettingsForm";
import { getSettings } from "@/lib/actions";
import type { Settings } from "@/lib/types";
import { cookies } from "next/headers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


export default async function SettingsPage() {
  const settings: Settings = await getSettings();
  const cookieStore = cookies();
  const role = cookieStore.get('session_role')?.value ?? 'readonly';
  const isReadOnly = role === 'readonly';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline">Pengaturan</h1>
        <p className="text-muted-foreground">
          Atur parameter dasar dan tampilan untuk aplikasi kas kelas.
        </p>
      </div>
      {isReadOnly && (
         <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Mode Read-Only</AlertTitle>
          <AlertDescription>
            Anda tidak dapat mengubah pengaturan dalam mode read-only.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Umum</CardTitle>
          <CardDescription>
            Ubah nama aplikasi, logo (via URL), dan parameter iuran kas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm currentSettings={settings} isReadOnly={isReadOnly} />
        </CardContent>
      </Card>
    </div>
  );
}
