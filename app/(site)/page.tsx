import type { Metadata } from "next";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeServicesGrid } from "@/components/home/HomeServicesGrid";
import { HomeFaq } from "@/components/home/HomeFaq";
import { HomeTimeline } from "@/components/home/HomeTimeline";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata, faqSchema } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Sipulsa — Urus Kebutuhan Digital, Lebih Gampang",
  description:
    "Platform transaksi digital terpercaya untuk pulsa, paket data, uang elektronik, PLN, dan pembayaran berbagai tagihan dengan alur transparan.",
  path: "/",
  keywords: ["pulsa", "paket data", "uang elektronik", "token listrik", "bayar tagihan", "Jogatix"],
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqSchema()} />
      <HomeHero />
      <HomeServicesGrid />
      <HomeFaq />
      <HomeTimeline />
    </>
  );
}
