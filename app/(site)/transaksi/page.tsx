import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Transaksi & Checkout - Sipulsa",
  description:
    "Alur transaksi terstruktur Jogatix. Periksa data pelanggan, pilih produk, telusuri rincian harga, selesaikan pembayaran, dan pantau status transaksi.",
  path: "/transaksi",
});

export default function TransaksiPage() {
  return <CheckoutFlow />;
}
