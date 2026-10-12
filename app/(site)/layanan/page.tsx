import type { Metadata } from "next";
import { ServiceDesk } from "@/components/layanan/ServiceDesk";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, createMetadata, serviceCatalogSchema } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Semua Layanan - Sipulsa",
  description:
    "Temukan layanan yang kamu butuhkan. Mulai dari pulsa, paket data, uang elektronik, PLN, sampai pembayaran tagihan. Pilih kategori dan lihat produk yang tersedia.",
  path: "/layanan",
  keywords: ["katalog layanan", "pulsa", "paket data", "token listrik", "bayar tagihan"],
});

export default function LayananPage() {
  return (
    <div className="container">
      <JsonLd data={serviceCatalogSchema()} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Beranda", path: "/" },
          { name: "Layanan", path: "/layanan" },
        ])}
      />

      <section className="page-hero-banner">
        <div className="section-kicker">KATALOG RESMI LAYANAN</div>
        <h1>Temukan layanan yang kamu butuhkan.</h1>
        <p className="section-desc">
          Mulai dari pulsa, paket data, uang elektronik, token listrik, hingga pembayaran tagihan.
          Pilih kategori dan lihat produk yang tersedia secara transparan.
        </p>
      </section>

      <ServiceDesk />
    </div>
  );
}
