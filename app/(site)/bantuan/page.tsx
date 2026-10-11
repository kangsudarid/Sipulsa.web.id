import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Bantuan & Kendala - Sipulsa",
  description:
    "Pusat bantuan Jogatix. Periksa status pesanan terlebih dahulu, siapkan ID transaksi, dan telusuri panduan penanganan kendala pembayaran serta pengiriman produk.",
  path: "/bantuan",
});

const helpTopics = [
  {
    title: "Pembayaran belum terkonfirmasi",
    body: "Pastikan pembayaran sudah selesai. Status pesanan akan diperbarui setelah sistem menerima dan memverifikasi konfirmasi pembayaran.",
  },
  {
    title: "Produk belum diterima",
    body: "Periksa apakah transaksi masih diproses. Jika status tidak berubah, hubungi bantuan dengan menyertakan ID transaksi.",
  },
  {
    title: "Nominal atau data pelanggan salah",
    body: "Periksa kembali data sebelum menyelesaikan pesanan. Perubahan atau pembatalan setelah pembayaran mengikuti ketentuan layanan yang berlaku.",
  },
  {
    title: "Transaksi gagal",
    body: "Periksa detail pesanan dan status pembayaran. Jika pembayaran sudah diterima, penyelesaiannya memerlukan pemeriksaan lebih lanjut.",
  },
];

export default function BantuanPage() {
  return (
    <div className="container help-container">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Beranda", path: "/" },
          { name: "Bantuan", path: "/bantuan" },
        ])}
      />

      <section className="page-hero-banner" style={{ textAlign: "left", padding: "48px 0 32px" }}>
        <div className="section-kicker">PUSAT BANTUAN</div>
        <h1 style={{ fontSize: "clamp(2.3rem, 3.8vw, 3.2rem)", marginBottom: 12, color: "#0E1126" }}>
          Ada kendala? Mulai dari sini.
        </h1>
        <p className="section-desc" style={{ maxWidth: 640 }}>
          Periksa status transaksi terlebih dahulu. Jika masalah belum selesai, siapkan ID pesanan
          agar proses pemeriksaan lebih mudah.
        </p>
      </section>

      {/* Quick action to the tracker */}
      <div
        style={{
          background: "#EEF2FF",
          border: "1.5px solid #C7D2FE",
          borderRadius: 16,
          padding: "22px 26px",
          marginBottom: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: "#4338CA", fontSize: 15, marginBottom: 4 }}>
            Langkah Pertama Penanganan Kendala
          </div>
          <div style={{ fontSize: 14, color: "#4338CA" }}>
            Gunakan ID pesanan untuk melihat status terbaru yang tercatat di sistem penyedia.
          </div>
        </div>
        <Link href="/cek-transaksi" className="btn-primary" style={{ padding: "11px 22px", fontSize: 14 }}>
          Periksa ID Transaksi
        </Link>
      </div>

      <div className="help-topics-list">
        {helpTopics.map((topic) => (
          <article className="help-topic-item" key={topic.title}>
            <h2>{topic.title}</h2>
            <p>{topic.body}</p>
          </article>
        ))}
      </div>

      <div className="help-contact-box" id="kontak">
        <h2>Cara menghubungi bantuan</h2>
        <p>
          Untuk menjaga keamanan transaksi dan kejelasan informasi, gunakan kanal bantuan resmi yang
          terhubung dengan akun layanan kamu. Siapkan ID transaksi agar penanganan kendala dapat
          diverifikasi secara akurat.
        </p>

        <div className="official-channel-info">
          <strong>Kanal Bantuan Resmi:</strong> Layanan bantuan pelanggan dapat diakses melalui
          portal resmi sistem Jogatix saat akun dan integrasi produksi diaktifkan. Harap waspada
          terhadap pihak tidak bertanggung jawab yang mengatasnamakan Jogatix di luar kanal yang
          terverifikasi.
        </div>
      </div>
    </div>
  );
}
