import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = "Sipulsa — Kebutuhan Digital, Lebih Gampang";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded social share image generated at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #121532 0%, #0A0D21 100%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "linear-gradient(135deg, #4338CA 0%, #312E81 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            ⚡
          </div>
          <div style={{ fontSize: 40, fontWeight: 800 }}>Jogatix</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 900 }}>
            Semua Kebutuhan Digital, Satu Tempat.
          </div>
          <div style={{ fontSize: 28, color: "#C7D2FE", maxWidth: 820 }}>
            {siteConfig.description}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 24, color: "#C7F36B" }}>
          <span>Pulsa</span>
          <span>·</span>
          <span>Paket Data</span>
          <span>·</span>
          <span>PLN</span>
          <span>·</span>
          <span>Uang Elektronik</span>
          <span>·</span>
          <span>Tagihan</span>
        </div>
      </div>
    ),
    size,
  );
}
