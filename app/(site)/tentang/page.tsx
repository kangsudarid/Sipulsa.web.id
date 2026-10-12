import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Tentang Sipulsa - Transaksi Digital Jelas & Terstruktur",
  description:
    "Jogatix dirancang sebagai tempat untuk menemukan layanan digital dan mengurus berbagai transaksi dalam satu alur yang jelas.",
  path: "/tentang",
});

const commitments = [
  "Informasi pesanan yang jelas.",
  "Ringkasan harga sebelum pembayaran.",
  "Status transaksi yang mudah diperiksa.",
  "Informasi bantuan untuk kendala pesanan.",
];

export default function TentangPage() {
  return (
    <div className="container about-container">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Beranda", path: "/" },
          { name: "Tentang Jogatix", path: "/tentang" },
        ])}
      />

      <section className="page-hero-banner" style={{ textAlign: "left", padding: "48px 0 32px" }}>
        <div className="section-kicker">TENTANG SIPUL</div>
        <h1 style={{ fontSize: "clamp(2.3rem, 3.8vw, 3.2rem)", marginBottom: 14, color: "#0E1126" }}>
          Kebutuhan digital, lebih mudah dijangkau.
        </h1>
        <p className="section-desc" style={{ maxWidth: 660, fontSize: 17 }}>
          Jogatix dirancang sebagai tempat untuk menemukan layanan digital dan mengurus berbagai
          transaksi dalam satu alur yang jelas.
        </p>
      </section>

      <section className="about-card-section">
        <h2>Apa yang ingin kami hadirkan?</h2>
        <p>
          Pengalaman transaksi yang mudah dipahami, dengan informasi produk, harga, dan status
          pesanan yang bisa diperiksa sesuai data yang tersedia.
        </p>
      </section>

      <section className="about-card-section">
        <h2>Cara kami bekerja</h2>
        <p>
          Setiap layanan memiliki kebutuhan yang berbeda. Karena itu, informasi pelanggan, pilihan
          produk, pembayaran, dan hasil transaksi perlu ditampilkan sesuai proses masing-masing.
        </p>
      </section>

      <section className="about-card-section">
        <h2>Komitmen layanan</h2>
        <ul className="commitments-list">
          {commitments.map((item) => (
            <li key={item}>
              <CheckIcon width={18} height={18} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="about-card-section"
        style={{
          background: "linear-gradient(160deg, #121532 0%, #0A0D21 100%)",
          color: "white",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <h2 style={{ color: "white" }}>Mulai dari kebutuhanmu.</h2>
        <p style={{ color: "rgba(255, 255, 255, 0.8)", marginBottom: 24 }}>
          Pilih layanan yang diperlukan dan periksa detailnya sebelum melakukan pembayaran.
        </p>
        <Link href="/layanan" className="btn-lime">
          Lihat Semua Layanan
          <ArrowRightIcon width={16} height={16} strokeWidth={2.5} />
        </Link>
      </section>
    </div>
  );
}
