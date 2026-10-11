import type { CategorySlug, ServiceCategory } from "@/types";

/**
 * The full Jogatix catalog — 8 categories with their products, providers and
 * validation rules. Ported 1:1 from the original js/services.js so prices,
 * notes and patterns match the legacy site exactly.
 *
 * To add a product, edit the relevant `products` array here; components read
 * from this data and need no changes.
 */
export const categories: ServiceCategory[] = [
  {
    slug: "pulsa",
    name: "Pulsa",
    type: "prabayar",
    desc: "Isi pulsa untuk tetap terhubung ke semua operator seluler resmi di Indonesia.",
    providers: ["Telkomsel", "Indosat Ooredoo", "XL Axiata", "Tri (3)", "Smartfren"],
    field: {
      label: "Nomor Ponsel",
      placeholder: "Contoh: 081234567890",
      inputmode: "tel",
      pattern: /^08\d{8,11}$/,
      error: "Masukkan nomor ponsel yang diawali 08 (10–13 digit).",
    },
    products: [
      { id: "pulsa-5000", name: "Rp5.000", note: "Masa aktif +7 hari", price: 8000 },
      { id: "pulsa-10000", name: "Rp10.000", note: "Masa aktif +15 hari", price: 13000 },
      { id: "pulsa-15000", name: "Rp15.000", note: "Masa aktif +20 hari", price: 18000 },
      { id: "pulsa-20000", name: "Rp20.000", note: "Masa aktif +30 hari", price: 23000 },
      { id: "pulsa-25000", name: "Rp25.000", note: "Masa aktif +30 hari", price: 28000 },
      { id: "pulsa-30000", name: "Rp30.000", note: "Masa aktif +30 hari", price: 33000 },
      { id: "pulsa-50000", name: "Rp50.000", note: "Masa aktif +45 hari", price: 53000 },
      { id: "pulsa-75000", name: "Rp75.000", note: "Masa aktif +60 hari", price: 78000 },
      { id: "pulsa-100000", name: "Rp100.000", note: "Masa aktif +60 hari", price: 105000 },
      { id: "pulsa-150000", name: "Rp150.000", note: "Masa aktif +90 hari", price: 1550000 },
      { id: "pulsa-200000", name: "Rp200.000", note: "Masa aktif +120 hari", price: 205000 },
      { id: "pulsa-300000", name: "Rp300.000", note: "Masa aktif +180 hari", price: 306000 },
      { id: "pulsa-500000", name: "Rp500.000", note: "Masa aktif +360 hari", price: 505000 },
      { id: "pulsa-1000000", name: "Rp1.000.000", note: "Masa aktif +360 hari", price: 1005000 },
    ],
  },
  {
    slug: "paket-data",
    name: "Paket Data",
    type: "prabayar",
    desc: "Pilihan kuota internet harian, mingguan, hingga bulanan untuk seluruh operator.",
    providers: ["Telkomsel", "Indosat Ooredoo", "XL Axiata", "Tri (3)", "Smartfren"],
    field: {
      label: "Nomor Ponsel",
      placeholder: "Contoh: 081234567890",
      inputmode: "tel",
      pattern: /^08\d{8,11}$/,
      error: "Masukkan nomor ponsel yang diawali 08 (10–13 digit).",
    },
    products: [
      { id: "data-1gb", name: "1 GB Flash / Harian", note: "Masa aktif 3 hari", price: 8000 },
      { id: "data-2gb", name: "2 GB Regular", note: "Masa aktif 7 hari", price: 13000 },
      { id: "data-3gb", name: "3 GB Extra Kuota", note: "Masa aktif 7 hari", price: 18000 },
      { id: "data-5gb", name: "5 GB Bulanan", note: "Masa aktif 30 hari", price: 32000 },
      { id: "data-8gb", name: "8 GB All Network", note: "Masa aktif 30 hari", price: 45000 },
      { id: "data-12gb", name: "12 GB Super Kuota", note: "Masa aktif 30 hari", price: 60000 },
      { id: "data-15gb", name: "15 GB + Unlimited Apps", note: "Masa aktif 30 hari", price: 72000 },
      { id: "data-25gb", name: "25 GB Bulanan Jumbo", note: "Masa aktif 30 hari", price: 98000 },
      { id: "data-30gb", name: "30 GB Heavy User", note: "Masa aktif 30 hari", price: 115000 },
      { id: "data-50gb", name: "50 GB Ultra Stream", note: "Masa aktif 30 hari", price: 155000 },
      { id: "data-100gb", name: "100 GB Max Booster", note: "Masa aktif 30 hari", price: 240000 },
    ],
  },
  {
    slug: "uang-elektronik",
    name: "Uang Elektronik",
    type: "prabayar",
    desc: "Top up saldo dompet digital praktis: GoPay, OVO, DANA, ShopeePay, dan LinkAja.",
    providers: ["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"],
    field: {
      label: "Nomor Akun Dompet Digital / Ponsel",
      placeholder: "Contoh: 081234567890 (Nomor akun terdaftar)",
      inputmode: "tel",
      pattern: /^08\d{8,11}$/,
      error: "Masukkan nomor akun terdaftar yang diawali 08 (10–13 digit).",
    },
    products: [
      { id: "ewallet-10000", name: "Saldo Rp10.000", note: "Top up saldo instan", price: 15000 },
      { id: "ewallet-20000", name: "Saldo Rp20.000", note: "Top up saldo instan", price: 25000 },
      { id: "ewallet-25000", name: "Saldo Rp25.000", note: "Top up saldo instan", price: 30000 },
      { id: "ewallet-50000", name: "Saldo Rp50.000", note: "Paling sering dipilih", price: 55000 },
      { id: "ewallet-75000", name: "Saldo Rp75.000", note: "Top up saldo instan", price: 75000 },
      { id: "ewallet-100000", name: "Saldo Rp100.000", note: "Top up saldo instan", price: 105000 },
      { id: "ewallet-150000", name: "Saldo Rp150.000", note: "Top up saldo instan", price: 155000 },
      { id: "ewallet-200000", name: "Saldo Rp200.000", note: "Top up saldo instan", price: 205000 },
      { id: "ewallet-300000", name: "Saldo Rp300.000", note: "Top up saldo instan", price: 3050000 },
      { id: "ewallet-500000", name: "Saldo Rp500.000", note: "Top up saldo instan", price: 505000 },
      { id: "ewallet-1000000", name: "Saldo Rp1.000.000", note: "Batas harian akun terverifikasi", price: 1005000 },
    ],
  },
  {
    slug: "pln",
    name: "PLN",
    type: "prabayar",
    desc: "Beli token listrik prabayar 20 digit atau bayar tagihan listrik bulanan resmi.",
    providers: ["PLN Prabayar (Token Listrik)", "PLN Pascabayar (Tagihan)"],
    field: {
      label: "Nomor Meter / ID Pelanggan PLN",
      placeholder: "Contoh: 142894109281 (11–12 digit)",
      inputmode: "numeric",
      pattern: /^\d{11,12}$/,
      error: "Nomor meter atau ID Pelanggan PLN berisi 11–12 digit angka.",
    },
    products: [
      { id: "token-20000", name: "Token Listrik Rp20.000", note: "KWH sesuai tarif resmi PLN", price: 23000 },
      { id: "token-50000", name: "Token Listrik Rp50.000", note: "KWH sesuai tarif resmi PLN", price: 53000 },
      { id: "token-100000", name: "Token Listrik Rp100.000", note: "KWH sesuai tarif resmi PLN", price: 103000 },
      { id: "token-200000", name: "Token Listrik Rp200.000", note: "KWH sesuai tarif resmi PLN", price: 203000 },
      { id: "token-500000", name: "Token Listrik Rp500.000", note: "KWH sesuai tarif resmi PLN", price: 503000 },
      { id: "token-1000000", name: "Token Listrik Rp1.000.000", note: "KWH sesuai tarif resmi PLN", price: 1003000 },
      { id: "token-5000000", name: "Token Listrik Rp5.000.000", note: "KWH sesuai tarif resmi PLN", price: 5003000 },
    ],
  },
  {
    slug: "internet",
    name: "Pembayaran Internet",
    type: "tagihan",
    desc: "Pemeriksaan tagihan Wi-Fi rumah & kantor: IndiHome, Biznet, First Media, MyRepublic, CBN.",
    providers: ["IndiHome (Telkom)", "Biznet Home", "First Media", "MyRepublic", "CBN"],
    field: {
      label: "Nomor Pelanggan Internet",
      placeholder: "Contoh: 0218940192 (Sesuai tagihan provider)",
      inputmode: "numeric",
      pattern: /^\d{6,16}$/,
      error: "Nomor pelanggan internet berisi 6–16 digit angka.",
    },
    adminFee: 2500,
  },
  {
    slug: "bpjs",
    name: "BPJS Kesehatan",
    type: "tagihan",
    desc: "Periksa iuran dan bayar tagihan BPJS Kesehatan keluarga dengan nomor Virtual Account resmi.",
    providers: ["BPJS Kesehatan Mandiri / Keluarga"],
    field: {
      label: "Nomor Virtual Account BPJS (16 Digit)",
      placeholder: "Contoh: 8888801234567890",
      inputmode: "numeric",
      pattern: /^\d{16}$/,
      error: "Nomor Virtual Account BPJS harus tepat 16 digit angka.",
    },
    adminFee: 2500,
  },
  {
    slug: "pdam",
    name: "PDAM",
    type: "tagihan",
    desc: "Cek tagihan air bersih PDAM berdasarkan wilayah kabupaten / kota dan nomor pelanggan.",
    providers: [
      "PAM Jaya (DKI Jakarta)",
      "PDAM Surya Sembada (Surabaya)",
      "PDAM Tirta Moedal (Semarang)",
      "PDAM Tirtawening (Bandung)",
      "PDAM Lainnya",
    ],
    field: {
      label: "Nomor Sambungan / Pelanggan PDAM",
      placeholder: "Contoh: 1049281 (Sesuai meteran/rekening air)",
      inputmode: "numeric",
      pattern: /^\d{5,15}$/,
      error: "Nomor pelanggan PDAM berisi 5–15 digit angka.",
    },
    adminFee: 2500,
  },
  {
    slug: "multifinance",
    name: "Multifinance",
    type: "tagihan",
    desc: "Bayar angsuran kredit kendaraan & pembiayaan: FIF Group, BAF, Adira Finance, OTO, WOM.",
    providers: ["FIF Group", "BAF (Bussan Auto Finance)", "Adira Finance", "OTO Kredit", "WOM Finance"],
    field: {
      label: "Nomor Kontrak Pembiayaan",
      placeholder: "Contoh: 1029481920 (Sesuai perjanjian pembiayaan)",
      inputmode: "numeric",
      pattern: /^\d{8,16}$/,
      error: "Nomor kontrak pembiayaan berisi 8–16 digit angka.",
    },
    adminFee: 3500,
  },
];

/** Catalog lookup by slug. */
export function getCategory(slug: string | null | undefined): ServiceCategory | undefined {
  if (!slug) return undefined;
  return categories.find((c) => c.slug === slug);
}

/** Type guard for a valid category slug. */
export function isCategorySlug(value: string | null | undefined): value is CategorySlug {
  return Boolean(value && categories.some((c) => c.slug === value));
}
