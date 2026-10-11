import type { AdminProduct, AdminSettings, CategorySlug } from "@/types";
import { categories } from "@/lib/catalog";

/**
 * Default admin configuration. These values are the seed for a fresh Supabase
 * project (lib/supabase/store.ts inserts them on first run) and the source for
 * the admin console's "Reset Bawaan" button.
 */


/** slug → display name, used when the admin form creates a new product. */
export const CATEGORY_NAMES: Record<CategorySlug, string> = {
  pulsa: "Pulsa",
  "paket-data": "Paket Data",
  "uang-elektronik": "Uang Elektronik",
  pln: "PLN",
  internet: "Pembayaran Internet",
  bpjs: "BPJS Kesehatan",
  pdam: "PDAM",
  multifinance: "Multifinance",
};

export const defaultSettings: AdminSettings = {
  whatsappNumber: "081357266414",
  whatsappAdminName: "Customer Care Sipulsa",
  whatsappHours: "07:00 - 22:00 WIB Setiap Hari",
  whatsappTemplateOrder:
    "Halo Admin Sipulsa, saya ingin konfirmasi pembayaran pesanan dengan ID: {id} ({produk}) sebesar {total}. Mohon segera diverifikasi. Terima kasih!",
  whatsappTemplateSuccess:
    "Halo Kak! Pesanan Sipulsa ID: {id} untuk {produk} telah BERHASIL diproses. Nomor SN / Token Anda: {sn}. Terima kasih telah bertransaksi di Jogatix!",
  qrisImage: "",
  qrisMerchant: "Sudar Abadi Makmur",
  qrisNmid: "ID1025368251597",
  qrisActive: true,
  qrisInstructions:
    "Buka aplikasi GoPay, OVO, DANA, ShopeePay, BCA Mobile, atau m-banking lainnya, lalu scan kode QR di atas.",
  banks: [
    { id: "bca", name: "BCA", code: "bca", accNo: "8901289104", accName: "JOGATIX INDONESIA", active: true },
    { id: "mandiri", name: "Mandiri", code: "mandiri", accNo: "1370019284019", accName: "JOGATIX INDONESIA", active: true },
    { id: "bri", name: "BRI", code: "bri", accNo: "020601002948301", accName: "JOGATIX INDONESIA", active: true },
    { id: "bni", name: "BNI", code: "bni", accNo: "0819284910", accName: "JOGATIX INDONESIA", active: true },
  ],
  ewallets: [
    { id: "gopay", name: "GoPay", accNo: "0850855399521", accName: "Sudarmanto", active: true },
    { id: "dana", name: "DANA", accNo: "081357266414", accName: "Sudarmanto", active: true },
    { id: "ovo", name: "OVO", accNo: "085855399521", accName: "Sudarmanto", active: true },
    { id: "shopeepay", name: "ShopeePay", accNo: "081357266414", accName: "Sudarmanto", active: true },
  ],
  adminFeeBill: 2500,
};

/** Flattens the shared catalog into the admin product list (default state). */
export function buildDefaultProducts(): AdminProduct[] {
  const flat: AdminProduct[] = [];
  for (const category of categories) {
    if (!category.products?.length) continue;
    for (const product of category.products) {
      flat.push({
        id: product.id,
        categorySlug: category.slug,
        categoryName: category.name,
        provider: category.providers[0] ?? "",
        name: product.name,
        price: product.price,
        note: product.note,
        active: true,
      });
    }
  }
  return flat;
}
