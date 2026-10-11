"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandBoltIcon, CloseIcon, MenuIcon, SearchIcon } from "@/components/icons";
import { primaryNav } from "@/lib/site";

/** True when `href` is the current route (root matches exactly). */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <header className="site-header">
      <div className="container header-container">
        <Link href="/" className="brand-logo" aria-label="Jogatix Beranda">
          <span className="brand-icon-mark" aria-hidden="true">
            <BrandBoltIcon width={20} height={20} />
          </span>
          <span className="brand-name">
            Si<span>Pulsa</span>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Navigasi Utama">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${isActive(pathname, item.href) ? " active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link
            href="/cek-transaksi"
            className="btn-header-status"
            title="Periksa status pesanan kamu"
          >
            <SearchIcon width={16} height={16} />
            <span className="btn-text">Cek Transaksi</span>
          </Link>
          <button
            type="button"
            className="mobile-nav-toggle"
            aria-label="Buka navigasi mobile"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((open) => !open)}
          >
            {drawerOpen ? <CloseIcon width={20} height={20} /> : <MenuIcon width={20} height={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`mobile-nav-drawer${drawerOpen ? " open" : ""}`} aria-label="Menu Mobile">
        {primaryNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link${isActive(pathname, item.href) ? " active" : ""}`}
            onClick={closeDrawer}
          >
            {item.label}
          </Link>
        ))}
        <Link href="/cek-transaksi" className="btn-header-status" onClick={closeDrawer}>
          <SearchIcon width={16} height={16} />
          <span>Cek Transaksi</span>
        </Link>
      </div>
    </header>
  );
}
