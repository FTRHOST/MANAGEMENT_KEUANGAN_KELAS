import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SettingsForm from "../components/SettingsForm";

export default function SettingsPage() {
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
          <CardTitle>Tanggal Mulai Kas</CardTitle>
          <CardDescription>
            Tanggal ini digunakan sebagai titik awal untuk menghitung total
            iuran mingguan yang harus dibayar setiap anggota.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm />
        </CardContent>
      </Card>
    </div>
  );
}
