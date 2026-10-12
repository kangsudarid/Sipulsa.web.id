import type { Metadata } from "next";
import { TransactionTracker } from "@/components/tracker/TransactionTracker";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Cek Transaksi - Sipulsa",
  description:
    "Cari tahu status pesananmu. Masukkan ID transaksi untuk melihat perkembangan pesanan digital kamu di Jogatix.",
  path: "/cek-transaksi",
});

export default function CekTransaksiPage() {
  return (
    <div className="container tx-check-container">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Beranda", path: "/" },
          { name: "Cek Transaksi", path: "/cek-transaksi" },
        ])}
      />
      <TransactionTracker />
    </div>
  );
}
