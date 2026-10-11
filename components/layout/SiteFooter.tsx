import Link from "next/link";
import { BrandBoltIcon } from "@/components/icons";
import { footerInfoLinks } from "@/lib/site";
import { serviceLinks } from "@/lib/services";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="footer-brand-logo" aria-label="Jogatix Beranda">
              <span className="brand-icon-mark" aria-hidden="true">
                <BrandBoltIcon width={20} height={20} />
              </span>
              <span className="footer-brand-name">
                Si<span>Pulsa</span>
              </span>
            </Link>
            <p className="footer-brand-desc">
              Solusi transaksi digital untuk kebutuhan sehari-hari. Beli pulsa, paket data, token
              listrik, top up uang elektronik, hingga bayar berbagai tagihan dalam satu platform.
            </p>
            <p className="footer-brand-sub">
              Nikmati pengalaman transaksi yang praktis dengan informasi harga yang jelas dan
              kemudahan memantau status pesanan.
            </p>
          </div>

          <div>
            <h4 className="footer-heading">Layanan</h4>
            <ul className="footer-links-grid">
              {serviceLinks.map((service) => (
                <li key={service.slug}>
                  <Link href={service.href}>{service.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Informasi</h4>
            <ul className="footer-links-list">
              {footerInfoLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-copy">
            &copy; <span className="current-year">{year}</span> Jogatix. Hak Cipta Dilindungi.
          </div>
        </div>
      </div>
    </footer>
  );
}
