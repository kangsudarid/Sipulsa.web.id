import type { FaqItem } from "@/types";

/** Home page FAQ accordion content (also reused for FAQPage structured data). */
export const faqItems: FaqItem[] = [
  {
    id: "faq-1",
    badge: "Panduan",
    question: "Bagaimana cara bertransaksi di Sipul?",
    answer: [
      {
        type: "text",
        text: "Pilih layanan yang Anda butuhkan dari katalog (pulsa, kuota, token PLN, e-wallet, atau tagihan), masukkan nomor tujuan atau ID pelanggan, lalu tentukan produk yang diinginkan. Pada halaman checkout, pilih metode pembayaran yang tersedia (seperti QRIS atau Virtual Account). Setelah pembayaran selesai, sistem otomatis memproses dan memperbarui status pesanan.",
      },
    ],
  },
  {
    id: "faq-2",
    badge: "Akun",
    question: "Apakah saya wajib membuat akun untuk bertransaksi?",
    answer: [
      {
        type: "text",
        text: "Tidak perlu. Sipul dapat digunakan secara langsung tanpa kewajiban registrasi atau login akun. Cukup simpan ID Transaksi unik yang diterbitkan setelah checkout untuk memantau status pembayaran dan pengiriman produk kapan saja.",
      },
    ],
  },
  {
    id: "faq-3",
    badge: "Kecepatan",
    question: "Berapa lama waktu proses hingga transaksi berhasil?",
    answer: [
      {
        type: "text",
        text: "Sebagian besar produk digital diproses otomatis secara instan dalam 1 hingga 5 menit setelah sistem memverifikasi pembayaran. Khusus untuk token listrik PLN, kode token 20 digit langsung ditampilkan di halaman status transaksi dan siap diinput ke meteran listrik.",
      },
    ],
  },
  {
    id: "faq-4",
    badge: "Pembayaran",
    question: "Metode pembayaran apa saja yang didukung?",
    answer: [
      {
        type: "text",
        text: "Kami mendukung pembayaran via QRIS yang kompatibel dengan seluruh aplikasi e-wallet (GoPay, OVO, DANA, ShopeePay, LinkAja) dan mobile banking (BCA, Mandiri, BRI, BNI), serta transfer Virtual Account resmi dengan verifikasi otomatis tanpa konfirmasi manual.",
      },
    ],
  },
  {
    id: "faq-5",
    badge: "Pelacakan",
    question: "Bagaimana cara memeriksa status pesanan saya?",
    answer: [
      { type: "text", text: "Buka halaman " },
      { type: "link", text: "Cek Transaksi", href: "/cek-transaksi" },
      {
        type: "text",
        text: " atau masukkan ID pesanan pada kolom cek transaksi cepat di bawah. Anda dapat memantau status pembayaran, waktu pemrosesan, nomor serial (SN), dan rincian produk secara langsung.",
      },
    ],
  },
  {
    id: "faq-6",
    badge: "Kendala",
    question: "Pembayaran berhasil tetapi produk belum masuk, apa solusinya?",
    answer: [
      {
        type: "text",
        text: "Beri jeda 5 hingga 10 menit untuk pemrosesan antrean operator. Jika status di halaman Cek Transaksi belum berubah atau mengalami kendala, kunjungi halaman ",
      },
      { type: "link", text: "Pusat Bantuan", href: "/bantuan" },
      {
        type: "text",
        text: " dan siapkan ID Transaksi Anda untuk penanganan prioritas.",
      },
    ],
  },
  {
    id: "faq-7",
    badge: "Transparansi",
    question: "Apakah ada biaya tambahan atau biaya tersembunyi?",
    answer: [
      {
        type: "text",
        text: "Sama sekali tidak ada. Semua biaya di Jogatix bersifat transparan. Rincian harga dasar produk dan biaya admin metode pembayaran selalu dipaparkan secara jelas di ringkasan pesanan sebelum Anda melakukan pembayaran.",
      },
    ],
  },
];

/** Plain-text answers, used when emitting FAQPage JSON-LD. */
export function faqPlainAnswer(item: FaqItem): string {
  return item.answer.map((segment) => segment.text).join("");
}
