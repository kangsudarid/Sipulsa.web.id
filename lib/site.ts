import type { NavItem } from "@/types";

/**
 * Global site configuration.
 *
 * NOTE: values marked "manual" were not present in the original static HTML
 * (it shipped placeholder/demo data) and must be filled in before going live.
 */
export const siteConfig = {
  name: "Sipulsa",
  legalName: "Sipulsa Digital Commerce",
  /** Manual: set NEXT_PUBLIC_SITE_URL to the production domain. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sipulsa.web.id",
  locale: "id_ID",
  description:
    "Platform transaksi digital untuk pulsa, paket data, uang elektronik, PLN, dan pembayaran berbagai tagihan dengan alur transparan.",
  /** Manual: replace with the real customer-care number. */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "081357266414",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "halo@jogatix.id",
} as const;

/** Primary navigation, shared by the header drawer and footer. */
export const primaryNav: NavItem[] = [
  { label: "Beranda", href: "/" },
  { label: "Layanan", href: "/layanan" },
  { label: "Cek Transaksi", href: "/cek-transaksi" },
  { label: "Bantuan", href: "/bantuan" },
  { label: "Tentang Jogatix", href: "/tentang" },
];

/** Informational links shown in the footer. */
export const footerInfoLinks: NavItem[] = [
  { label: "Tentang Jogatix", href: "/tentang" },
  { label: "Cek Transaksi", href: "/cek-transaksi" },
  { label: "Bantuan", href: "/bantuan" },
  { label: "Kebijakan Privasi", href: "/bantuan#kebijakan" },
  { label: "Syarat dan Ketentuan", href: "/bantuan#ketentuan" },
];
