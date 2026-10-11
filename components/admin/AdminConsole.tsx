"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_NAMES, buildDefaultProducts } from "@/lib/admin-defaults";
import { apiFetch } from "@/lib/fetcher";
import { rupiah } from "@/lib/format";
import type { AdminProduct, AdminSettings, BankAccount, CategorySlug, Order, OrderStatus } from "@/types";

type AdminView = "overview" | "products" | "payment" | "whatsapp" | "transactions";
type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const VIEW_META: Record<AdminView, { title: string; sub: string }> = {
  overview: {
    title: "Ringkasan Statistik",
    sub: "Ikhtisar omset, volume pesanan, dan performa transaksi Jogatix",
  },
  products: {
    title: "Kelola Katalog Produk",
    sub: "Atur nominal, harga modal & jual, status aktif, dan variasi layanan",
  },
  payment: {
    title: "Metode Pembayaran & QRIS",
    sub: "Upload foto QRIS resmi, rekening transfer bank, dan e-wallet",
  },
  whatsapp: {
    title: "Pengaturan WhatsApp CS",
    sub: "Atur nomor kontak layanan pelanggan dan template pesan konfirmasi",
  },
  transactions: {
    title: "Kelola Seluruh Transaksi",
    sub: "Verifikasi pembayaran, ubah status pesanan, dan input nomor SN / token",
  },
};

/** Small helper so every admin SVG uses consistent stroke defaults. */
function Stroke({ children, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export function AdminConsole() {
  const router = useRouter();
  const [view, setView] = useState<AdminView>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // The console renders client-only (see AdminConsoleClient) and hydrates from
  // the Supabase-backed admin routes. `settings === null` therefore means "not
  // loaded yet" and gates the whole dashboard below.
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<Record<string, Order>>({});
  const [loadFailed, setLoadFailed] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modal visibility state (ids are null for "create" mode).
  const [productModal, setProductModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [bankModal, setBankModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [ewalletModal, setEwalletModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [txModal, setTxModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [manualModal, setManualModal] = useState(false);

  // Mirror of `orders` so persistOrders can diff against the last known state
  // without being re-created on every change.
  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const pushToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 3200);
  }, []);

  /** Pure fetch: no state updates, so callers decide when to apply the result. */
  const fetchConsoleData = useCallback(async () => {
    const [settingsData, productsData, ordersData] = await Promise.all([
      apiFetch<{ settings: AdminSettings }>("/api/admin/settings"),
      apiFetch<{ products: AdminProduct[] }>("/api/admin/products"),
      apiFetch<{ orders: Record<string, Order> }>("/api/admin/orders"),
    ]);
    return {
      settings: settingsData.settings,
      products: productsData.products,
      orders: ordersData.orders,
    };
  }, []);

  const applyConsoleData = useCallback(
    (data: { settings: AdminSettings; products: AdminProduct[]; orders: Record<string, Order> }) => {
      setSettings(data.settings);
      setProducts(data.products);
      setOrders(data.orders);
      ordersRef.current = data.orders;
      setLoadFailed(false);
    },
    [],
  );

  /** A 401 means the session expired, so bounce back to the login screen. */
  const handleLoadFailure = useCallback(
    (error: unknown) => {
      if (error instanceof Error && error.name === "ApiError401") {
        router.replace("/admin/login");
        return;
      }
      setLoadFailed(true);
    },
    [router],
  );

  /** Re-reads everything; used by the retry button and after a failed write. */
  const reload = useCallback(async () => {
    try {
      applyConsoleData(await fetchConsoleData());
    } catch (error) {
      handleLoadFailure(error);
    }
  }, [applyConsoleData, fetchConsoleData, handleLoadFailure]);

  // Initial load. The result is applied from the promise callback instead of
  // synchronously, so mounting never cascades an extra render.
  useEffect(() => {
    let cancelled = false;
    fetchConsoleData()
      .then((data) => {
        if (!cancelled) applyConsoleData(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) handleLoadFailure(error);
      });
    return () => {
      cancelled = true;
    };
  }, [applyConsoleData, fetchConsoleData, handleLoadFailure]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } catch {
      /* Even if the request fails, send the admin back to the login screen. */
    }
    router.replace("/admin/login");
    router.refresh();
  }, [router]);

  /** Any write failure surfaces as an error toast and a full reload from the DB. */
  const reportFailure = useCallback(
    (message: string) => {
      pushToast(message, "error");
      void reload();
    },
    [reload, pushToast],
  );

  const persistSettings = useCallback(
    (next: AdminSettings) => {
      setSettings(next);
      apiFetch<{ settings: AdminSettings }>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(next),
      })
        .then(({ settings: saved }) => setSettings(saved))
        .catch((error: unknown) =>
          reportFailure(error instanceof Error ? error.message : "Gagal menyimpan pengaturan."),
        );
    },
    [reportFailure],
  );

  const persistProducts = useCallback(
    (next: AdminProduct[]) => {
      setProducts(next);
      apiFetch<{ products: AdminProduct[] }>("/api/admin/products", {
        method: "PUT",
        body: JSON.stringify(next),
      })
        .then(({ products: saved }) => setProducts(saved))
        .catch((error: unknown) =>
          reportFailure(error instanceof Error ? error.message : "Gagal menyimpan produk."),
        );
    },
    [reportFailure],
  );

  const persistOrders = useCallback(
    (next: Record<string, Order>) => {
      const previous = ordersRef.current;
      setOrders(next);
      ordersRef.current = next;

      // The modals hand back the whole map, so diff it to find what to write.
      const writes: Promise<unknown>[] = [];
      for (const order of Object.values(next)) {
        const before = previous[order.id];
        if (!before || JSON.stringify(before) !== JSON.stringify(order)) {
          writes.push(
            apiFetch(`/api/admin/orders/${encodeURIComponent(order.id)}`, {
              method: "PUT",
              body: JSON.stringify(order),
            }),
          );
        }
      }
      for (const id of Object.keys(previous)) {
        if (!next[id]) {
          writes.push(apiFetch(`/api/admin/orders/${encodeURIComponent(id)}`, { method: "DELETE" }));
        }
      }

      if (writes.length === 0) return;
      Promise.all(writes).catch((error: unknown) =>
        reportFailure(error instanceof Error ? error.message : "Gagal menyimpan transaksi."),
      );
    },
    [reportFailure],
  );

  const switchView = useCallback((next: AdminView) => {
    setView(next);
    setSidebarOpen(false);
  }, []);

  const meta = VIEW_META[view];

  if (!settings) {
    return loadFailed ? <ConsoleError onRetry={() => void reload()} /> : <ConsoleLoading />;
  }

  return (
    <>
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`} id="admin-sidebar">
          <div className="sidebar-header">
            <Link href="/admin" className="admin-brand">
              <div className="admin-brand-icon">
                <Stroke width={22} height={22} strokeWidth={2.5}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </Stroke>
              </div>
              <div className="admin-brand-text">
                <span className="admin-brand-title">
                  Si<span>Pulsa</span>
                </span>
                <span className="admin-badge-sub">Admin Console</span>
              </div>
            </Link>
            <button
              type="button"
              className="sidebar-close-btn"
              id="sidebar-close-btn"
              aria-label="Tutup Menu"
              onClick={() => setSidebarOpen(false)}
            >
              <Stroke width={20} height={20}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </Stroke>
            </button>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-title">Menu Utama</div>

            <button
              type="button"
              className={`nav-item-btn${view === "overview" ? " active" : ""}`}
              data-view="overview"
              onClick={() => switchView("overview")}
            >
              <Stroke width={18} height={18}>
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </Stroke>
              <span>Ringkasan</span>
            </button>

            <button
              type="button"
              className={`nav-item-btn${view === "products" ? " active" : ""}`}
              data-view="products"
              onClick={() => switchView("products")}
            >
              <Stroke width={18} height={18}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </Stroke>
              <span>Atur Produk</span>
              <span className="nav-item-badge" id="badge-prod-nav">
                {products.length || "-"}
              </span>
            </button>

            <button
              type="button"
              className={`nav-item-btn${view === "transactions" ? " active" : ""}`}
              data-view="transactions"
              onClick={() => switchView("transactions")}
            >
              <Stroke width={18} height={18}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </Stroke>
              <span>Kelola Transaksi</span>
              <span className="nav-item-badge" id="badge-order-nav">
                {Object.keys(orders).length || "-"}
              </span>
            </button>

            <div className="nav-section-title">Konfigurasi Pembayaran</div>

            <button
              type="button"
              className={`nav-item-btn${view === "payment" ? " active" : ""}`}
              data-view="payment"
              onClick={() => switchView("payment")}
            >
              <Stroke width={18} height={18}>
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </Stroke>
              <span>QRIS &amp; Pembayaran</span>
            </button>

            <button
              type="button"
              className={`nav-item-btn${view === "whatsapp" ? " active" : ""}`}
              data-view="whatsapp"
              onClick={() => switchView("whatsapp")}
            >
              <Stroke width={18} height={18}>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </Stroke>
              <span>Pengaturan WhatsApp</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="system-status-indicator">
              <div className="pulse-dot" />
              <span>Sistem &amp; Sinkronisasi Online</span>
            </div>
            <Link href="/" className="btn-open-store" target="_blank">
              <Stroke width={16} height={16}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </Stroke>
              <span>Lihat Web Pelanggan</span>
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="admin-main">
          <header className="admin-topbar">
            <div className="topbar-left">
              <button
                type="button"
                className="sidebar-toggle-btn"
                id="sidebar-toggle-btn"
                aria-label="Buka Menu"
                onClick={() => setSidebarOpen((open) => !open)}
              >
                <Stroke width={20} height={20}>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </Stroke>
              </button>
              <div className="topbar-breadcrumbs">
                <h1 className="topbar-breadcrumbs-title" id="topbar-breadcrumbs-title">
                  {meta.title}
                </h1>
                <span className="topbar-breadcrumbs-sub" id="topbar-breadcrumbs-sub">
                  {meta.sub}
                </span>
              </div>
            </div>

            <div className="topbar-right">
              <Link href="/layanan" className="btn-admin-action-alt" target="_blank" title="Buka Halaman Layanan">
                <Stroke width={15} height={15}>
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </Stroke>
                <span>Katalog Web</span>
              </Link>

              <button
                type="button"
                className="btn-admin-action-alt"
                title="Keluar dari dashboard admin"
                onClick={() => void handleLogout()}
              >
                <Stroke width={15} height={15}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </Stroke>
                <span>Keluar</span>
              </button>

              <div className="admin-profile-pill">
                <div className="admin-avatar">AD</div>
                <div className="admin-profile-info">
                  <span className="admin-profile-name">Administrator</span>
                  <span className="admin-profile-role">Super Admin</span>
                </div>
              </div>
            </div>
          </header>

          <div className="admin-content-container">
            <OverviewView
              orders={orders}
              active={view === "overview"}
              onOpenOrder={(id) => setTxModal({ open: true, id })}
              onGoto={switchView}
            />

            <ProductsView
              products={products}
              active={view === "products"}
              pushToast={pushToast}
              persistProducts={persistProducts}
              onEdit={(id) => setProductModal({ open: true, id })}
              onAdd={() => setProductModal({ open: true, id: null })}
            />

            <PaymentView
              settings={settings}
              active={view === "payment"}
              pushToast={pushToast}
              persistSettings={persistSettings}
              onEditBank={(id) => setBankModal({ open: true, id })}
              onAddBank={() => setBankModal({ open: true, id: null })}
              onEditEwallet={(id) => setEwalletModal({ open: true, id })}
            />

            <WhatsAppView
              settings={settings}
              active={view === "whatsapp"}
              pushToast={pushToast}
              persistSettings={persistSettings}
            />

            <TransactionsView
              orders={orders}
              active={view === "transactions"}
              pushToast={pushToast}
              persistOrders={persistOrders}
              settings={settings}
              onEdit={(id) => setTxModal({ open: true, id })}
              onAddManual={() => setManualModal(true)}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      {productModal.open && (
        <ProductModal
          key={productModal.id ?? "new"}
          productId={productModal.id}
          products={products}
          onClose={() => setProductModal({ open: false, id: null })}
          onSave={persistProducts}
          pushToast={pushToast}
        />
      )}

      {bankModal.open && (
        <BankModal
          key={bankModal.id ?? "new"}
          bankId={bankModal.id}
          settings={settings}
          onClose={() => setBankModal({ open: false, id: null })}
          onSave={persistSettings}
          pushToast={pushToast}
        />
      )}

      {ewalletModal.open && (
        <EwalletModal
          key={ewalletModal.id ?? "new"}
          ewalletId={ewalletModal.id}
          settings={settings}
          onClose={() => setEwalletModal({ open: false, id: null })}
          onSave={persistSettings}
          pushToast={pushToast}
        />
      )}

      {txModal.open && txModal.id && (
        <TransactionModal
          key={txModal.id}
          orderId={txModal.id}
          orders={orders}
          settings={settings}
          onClose={() => setTxModal({ open: false, id: null })}
          onSave={persistOrders}
          pushToast={pushToast}
        />
      )}

      {manualModal && (
        <ManualTransactionModal
          orders={orders}
          onClose={() => setManualModal(false)}
          onSave={persistOrders}
          pushToast={pushToast}
        />
      )}

      <div className="admin-toast-container" id="admin-toast-container">
        {toasts.map((toast) => (
          <div className={`admin-toast ${toast.type}`} key={toast.id}>
            <ToastIcon type={toast.type} />
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A", flex: 1 }}>
              {toast.message}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success") {
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (type === "error") {
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );
  }
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   View 1 — Overview
   ------------------------------------------------------------------------- */

function statusMeta(status: OrderStatus): { cls: string; text: string } {
  if (status === "SUCCESS") return { cls: "success", text: "Berhasil" };
  if (status === "PENDING") return { cls: "pending", text: "Diproses" };
  if (status === "FAILED") return { cls: "failed", text: "Gagal" };
  return { cls: "waiting", text: "Menunggu" };
}

function OverviewView({
  orders,
  active,
  onOpenOrder,
  onGoto,
}: {
  orders: Record<string, Order>;
  active: boolean;
  onOpenOrder: (id: string) => void;
  onGoto: (view: AdminView) => void;
}) {
  const list = Object.values(orders);
  const stats = useMemo(() => {
    let revenue = 0;
    let success = 0;
    let pending = 0;
    let waiting = 0;
    for (const order of list) {
      if (order.status === "SUCCESS") {
        success += 1;
        revenue += Number(order.total) || 0;
      } else if (order.status === "WAITING") waiting += 1;
      else if (order.status === "PENDING") pending += 1;
    }
    return { revenue, success, pending, waiting, total: list.length };
  }, [list]);

  const recent = [...list].slice(-5).reverse();

  return (
    <section className={`admin-view-panel${active ? " active" : ""}`} id="view-overview">
      <div className="stats-grid-4">
        <StatCard label="Total Omset Sukses" value={rupiah(stats.revenue)} icon="money" trend="Omset Terverifikasi" trendCls="trend-up" />
        <StatCard label="Total Pesanan" value={String(stats.total)} icon="file" trend="Semua Transaksi Masuk" trendCls="trend-neutral" />
        <StatCard label="Transaksi Berhasil" value={String(stats.success)} icon="check" trend="Telah Terbit SN / Token" trendCls="trend-up" />
        <StatCard label="Menunggu / Diproses" value={String(stats.pending + stats.waiting)} icon="clock" trend="Perlu Konfirmasi" trendCls="trend-warning" />
      </div>

      <div className="admin-card">
        <div className="card-header-flex">
          <div className="card-title-group">
            <h2>5 Transaksi Terkini</h2>
            <p>Pantau pesanan terbaru yang dibuat oleh pelanggan secara real-time.</p>
          </div>
          <button type="button" className="btn-secondary-admin" onClick={() => onGoto("transactions")}>
            <span>Lihat Seluruh Transaksi</span>
            <Stroke width={16} height={16}>
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </Stroke>
          </button>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>ID Transaksi</th>
                <th>Produk / Pelanggan</th>
                <th>Nominal</th>
                <th>Metode</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="recent-orders-table-body">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#94A3B8", padding: 24 }}>
                    Belum ada riwayat transaksi.
                  </td>
                </tr>
              ) : (
                recent.map((order) => {
                  const badge = statusMeta(order.status);
                  return (
                    <tr key={order.id}>
                      <td>
                        <span className="tx-id-badge">{order.id}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#0F172A" }}>{order.product || order.category}</div>
                        <div style={{ fontSize: 12, color: "#64748B" }}>{order.customer || "-"}</div>
                      </td>
                      <td>
                        <b>{rupiah(order.total)}</b>
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, color: "#475569" }}>{order.paymentMethod || "QRIS"}</span>
                      </td>
                      <td>
                        <span className={`status-pill-admin ${badge.cls}`}>
                          <span className="status-dot-sm" />
                          {badge.text}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon-square btn-open-detail"
                          title="Kelola Transaksi"
                          onClick={() => onOpenOrder(order.id)}
                        >
                          <Stroke width={16} height={16}>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </Stroke>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>Kelola QRIS &amp; Rekening</h3>
          <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>
            Ganti foto barcode QRIS atau perbarui nomor rekening bank BCA, Mandiri, BRI tujuan
            transfer pelanggan.
          </p>
          <button type="button" className="btn-primary-admin" onClick={() => onGoto("payment")}>
            Buka Pengaturan Pembayaran
          </button>
        </div>

        <div className="admin-card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>Pengaturan Nomor WhatsApp</h3>
          <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>
            Pastikan nomor WhatsApp aktif agar pembeli dapat langsung konfirmasi bukti pembayaran ke
            kamu.
          </p>
          <button type="button" className="btn-secondary-admin" onClick={() => onGoto("whatsapp")}>
            Atur Nomor WhatsApp CS
          </button>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  icon,
  trend,
  trendCls,
}: {
  label: string;
  value: string;
  icon: "money" | "file" | "check" | "clock";
  trend: string;
  trendCls: string;
}) {
  const iconClass = {
    money: "stat-icon-indigo",
    file: "stat-icon-cyan",
    check: "stat-icon-emerald",
    clock: "stat-icon-amber",
  }[icon];
  return (
    <div className="stat-card-modern">
      <div className="stat-top-row">
        <span className="stat-label">{label}</span>
        <div className={`stat-icon-wrap ${iconClass}`}>
          <Stroke width={22} height={22}>
            {icon === "money" && (
              <>
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </>
            )}
            {icon === "file" && (
              <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </>
            )}
            {icon === "check" && <polyline points="20 6 9 17 4 12" />}
            {icon === "clock" && (
              <>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </>
            )}
          </Stroke>
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className={`stat-trend-tag ${trendCls}`}>{trend}</div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   View 2 — Products
   ------------------------------------------------------------------------- */

function ProductsView({
  products,
  active,
  pushToast,
  persistProducts,
  onEdit,
  onAdd,
}: {
  products: AdminProduct[];
  active: boolean;
  pushToast: (m: string, t?: ToastType) => void;
  persistProducts: (p: AdminProduct[]) => void;
  onEdit: (id: string) => void;
  onAdd: () => void;
}) {
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = filterCat === "all" || p.categorySlug === filterCat;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.provider ?? "").toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, filterCat, search]);

  function handleToggle(id: string, checked: boolean) {
    const next = products.map((p) => (p.id === id ? { ...p, active: checked } : p));
    persistProducts(next);
    const target = next.find((p) => p.id === id);
    if (target) pushToast(`Status produk "${target.name}" berhasil diubah.`);
  }

  function handleDelete(id: string) {
    if (!window.confirm("Yakin ingin menghapus produk ini dari katalog?")) return;
    persistProducts(products.filter((p) => p.id !== id));
    pushToast("Produk telah dihapus.");
  }

  function handleReset() {
    if (
      !window.confirm(
        "Apakah kamu yakin ingin mengembalikan seluruh daftar produk ke konfigurasi bawaan katalog Jogatix?",
      )
    )
      return;
    persistProducts(buildDefaultProducts());
    pushToast("Katalog produk telah di-reset ke pengaturan standar bawaan.");
  }

  return (
    <section className={`admin-view-panel${active ? " active" : ""}`} id="view-products">
      <div className="admin-card">
        <div className="card-header-flex">
          <div className="card-title-group">
            <h2>Katalog Produk &amp; Harga</h2>
            <p>Tambah, sesuaikan harga jual, kelola status aktif/nonaktif, dan provider layanan.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn-secondary-admin" id="btn-reset-catalog" title="Kembalikan ke daftar bawaan" onClick={handleReset}>
              <Stroke width={15} height={15}>
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </Stroke>
              <span>Reset Bawaan</span>
            </button>
            <button type="button" className="btn-primary-admin" id="btn-add-product" onClick={onAdd}>
              <Stroke width={16} height={16} strokeWidth={2.5}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </Stroke>
              <span>Tambah Produk Baru</span>
            </button>
          </div>
        </div>

        <div className="admin-toolbar-flex">
          <div className="toolbar-search-box">
            <Stroke width={16} height={16}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </Stroke>
            <input
              type="text"
              id="search-products-input"
              placeholder="Cari nama produk, provider, nominal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="toolbar-filter-group">
            <select
              className="admin-select"
              id="filter-product-cat"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="all">Semua Kategori</option>
              <option value="pulsa">Pulsa</option>
              <option value="paket-data">Paket Data</option>
              <option value="uang-elektronik">Uang Elektronik</option>
              <option value="pln">PLN</option>
              <option value="internet">Pembayaran Internet</option>
              <option value="bpjs">BPJS Kesehatan</option>
              <option value="pdam">PDAM</option>
              <option value="multifinance">Multifinance</option>
            </select>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Nama / Nominal</th>
                <th>Provider</th>
                <th>Harga (Rp)</th>
                <th>Keterangan</th>
                <th>Aktif</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="products-table-body">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#94A3B8", padding: 32 }}>
                    Tidak ditemukan produk sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isActive = p.active !== false;
                  return (
                    <tr key={p.id}>
                      <td>
                        <span style={{ fontWeight: 700, color: "#4F46E5", background: "#EEF2FF", padding: "3px 8px", borderRadius: 6, fontSize: 12 }}>
                          {p.categoryName || p.categorySlug}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: "#64748B" }}>ID: {p.id}</div>
                      </td>
                      <td>
                        <span style={{ display: "inline-block", padding: "2px 8px", background: "#F1F5F9", borderRadius: 4, fontSize: 12.5, fontWeight: 600, color: "#334155" }}>
                          {p.provider || "-"}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 14 }}>{rupiah(p.price)}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, color: "#64748B" }}>{p.note || "-"}</span>
                      </td>
                      <td>
                        <label style={{ position: "relative", display: "inline-block", width: 38, height: 20, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            className="toggle-product-active"
                            checked={isActive}
                            onChange={(e) => handleToggle(p.id, e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{ position: "absolute", inset: 0, backgroundColor: isActive ? "#4F46E5" : "#CBD5E1", borderRadius: 20, transition: "0.2s" }}>
                            <span style={{ position: "absolute", left: isActive ? 20 : 3, top: 3, width: 14, height: 14, background: "white", borderRadius: "50%", transition: "0.2s" }} />
                          </span>
                        </label>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" className="btn-icon-square btn-edit-prod" title="Edit Produk" onClick={() => onEdit(p.id)}>
                            <Stroke width={15} height={15}>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </Stroke>
                          </button>
                          <button type="button" className="btn-icon-square danger btn-delete-prod" title="Hapus Produk" onClick={() => handleDelete(p.id)}>
                            <Stroke width={15} height={15}>
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </Stroke>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   View 3 — Payment (QRIS, banks, e-wallets)
   ------------------------------------------------------------------------- */

function PaymentView({
  settings,
  active,
  pushToast,
  persistSettings,
  onEditBank,
  onAddBank,
  onEditEwallet,
}: {
  settings: AdminSettings;
  active: boolean;
  pushToast: (m: string, t?: ToastType) => void;
  persistSettings: (s: AdminSettings) => void;
  onEditBank: (id: string) => void;
  onAddBank: () => void;
  onEditEwallet: (id: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragover, setDragover] = useState(false);
  const [draft, setDraft] = useState({
    qrisActive: settings.qrisActive,
    qrisMerchant: settings.qrisMerchant,
    qrisNmid: settings.qrisNmid,
    qrisInstructions: settings.qrisInstructions,
    adminFeeBill: settings.adminFeeBill,
  });

  function processFile(file: File) {
    if (!file.type.startsWith("image/")) {
      window.alert("Silakan pilih file gambar yang valid (PNG, JPG, JPEG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = String(event.target?.result ?? "");
      persistSettings({ ...settings, qrisImage: base64 });
      pushToast("Foto QRIS berhasil diunggah dan disimpan!");
    };
    reader.readAsDataURL(file);
  }

  function saveQris(event: React.FormEvent) {
    event.preventDefault();
    persistSettings({
      ...settings,
      qrisActive: draft.qrisActive,
      qrisMerchant: draft.qrisMerchant.trim(),
      qrisNmid: draft.qrisNmid.trim(),
      qrisInstructions: draft.qrisInstructions.trim(),
      adminFeeBill: Number(draft.adminFeeBill) || 2500,
    });
    pushToast("Pengaturan pembayaran & QRIS berhasil disimpan!");
  }

  function clearQris() {
    if (!window.confirm("Gunakan kembali template QRIS bawaan Jogatix?")) return;
    persistSettings({ ...settings, qrisImage: "" });
    pushToast("Foto QRIS di-reset ke template standar.");
  }

  return (
    <section className={`admin-view-panel${active ? " active" : ""}`} id="view-payment">
      <form id="form-qris-settings" onSubmit={saveQris}>
        <div className="admin-card">
          <div className="card-header-flex">
            <div className="card-title-group">
              <h2>Pengaturan Foto QRIS &amp; Merchant</h2>
              <p>Upload gambar barcode QRIS usahamu agar pelanggan dapat langsung melakukan scan saat checkout.</p>
            </div>
            <button type="submit" className="btn-primary-admin">
              <Stroke width={16} height={16}>
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </Stroke>
              <span>Simpan Pengaturan QRIS</span>
            </button>
          </div>

          <div className="switch-container">
            <div>
              <div className="switch-label-title">Aktifkan Metode Pembayaran QRIS</div>
              <div className="switch-label-desc">Tampilkan opsi pembayaran QRIS otomatis pada proses transaksi pelanggan.</div>
            </div>
            <label style={{ position: "relative", display: "inline-block" }}>
              <input
                type="checkbox"
                id="setting-qris-active"
                className="switch-input-hidden"
                checked={draft.qrisActive}
                onChange={(e) => setDraft({ ...draft, qrisActive: e.target.checked })}
              />
              <span className="custom-switch-slider" />
            </label>
          </div>

          <div className="qris-config-grid" style={{ marginTop: 24 }}>
            <div>
              <div className="form-group-admin">
                <label className="form-label-admin" htmlFor="setting-qris-merchant">Nama Merchant QRIS</label>
                <input
                  type="text"
                  className="form-input-admin"
                  id="setting-qris-merchant"
                  placeholder="Contoh: JOGATIX DIGITAL STORE"
                  value={draft.qrisMerchant}
                  onChange={(e) => setDraft({ ...draft, qrisMerchant: e.target.value })}
                />
              </div>

              <div className="form-group-admin">
                <label className="form-label-admin" htmlFor="setting-qris-nmid">Nomor NMID QRIS Resmi</label>
                <input
                  type="text"
                  className="form-input-admin"
                  id="setting-qris-nmid"
                  placeholder="Contoh: ID1020039102910"
                  value={draft.qrisNmid}
                  onChange={(e) => setDraft({ ...draft, qrisNmid: e.target.value })}
                />
              </div>

              <div className="form-group-admin">
                <label className="form-label-admin">Unggah Foto Barcode QRIS</label>
                <div
                  className={`qris-dropzone${dragover ? " dragover" : ""}`}
                  id="qris-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragover(true);
                  }}
                  onDragLeave={() => setDragover(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragover(false);
                    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
                  }}
                >
                  <Stroke width={36} height={36}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </Stroke>
                  <div className="qris-dropzone-title">Klik atau Tarik Foto QRIS ke Sini</div>
                  <div className="qris-dropzone-subtitle">Mendukung format PNG, JPG, JPEG (Ukuran gambar disarankan persegi).</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="qris-file-input"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) processFile(e.target.files[0]);
                    }}
                  />
                </div>
              </div>

              <div className="form-group-admin">
                <label className="form-label-admin" htmlFor="setting-qris-instructions">Petunjuk Scan untuk Pembeli</label>
                <textarea
                  className="form-textarea-admin"
                  id="setting-qris-instructions"
                  rows={2}
                  value={draft.qrisInstructions}
                  onChange={(e) => setDraft({ ...draft, qrisInstructions: e.target.value })}
                />
              </div>

              <div className="form-group-admin">
                <label className="form-label-admin" htmlFor="setting-admin-fee">Biaya Administrasi Transaksi Tagihan (Rp)</label>
                <input
                  type="number"
                  className="form-input-admin"
                  id="setting-admin-fee"
                  min={0}
                  step={500}
                  value={draft.adminFeeBill}
                  onChange={(e) => setDraft({ ...draft, adminFeeBill: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="qris-preview-card">
              <div className="qris-badge-top">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                QRIS RESMI
              </div>
              <div className="qris-merchant-display" id="preview-qris-merchant">
                {draft.qrisMerchant || "JOGATIX DIGITAL STORE"}
              </div>
              <div className="qris-nmid-display" id="preview-qris-nmid">
                NMID: {draft.qrisNmid || "ID1020039102910"}
              </div>

              <div className="qris-image-frame" id="preview-qris-image-frame">
                {settings.qrisImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.qrisImage}
                    alt="Pratinjau barcode QRIS merchant"
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <svg width={180} height={180} viewBox="0 0 100 100" fill="#0E1126" aria-hidden="true">
                    <rect width="100" height="100" fill="#FFFFFF" />
                    <rect x="10" y="10" width="25" height="25" fill="#0E1126" />
                    <rect x="15" y="15" width="15" height="15" fill="#FFFFFF" />
                    <rect x="65" y="10" width="25" height="25" fill="#0E1126" />
                    <rect x="70" y="15" width="15" height="15" fill="#FFFFFF" />
                    <rect x="10" y="65" width="25" height="25" fill="#0E1126" />
                    <rect x="15" y="70" width="15" height="15" fill="#FFFFFF" />
                    <rect x="45" y="15" width="10" height="10" fill="#0E1126" />
                    <rect x="40" y="40" width="20" height="20" fill="#0E1126" />
                    <rect x="65" y="55" width="15" height="10" fill="#0E1126" />
                    <rect x="45" y="75" width="20" height="15" fill="#0E1126" />
                    <rect x="75" y="75" width="15" height="15" fill="#0E1126" />
                  </svg>
                )}
              </div>

              <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 12 }}>
                Dicetak &amp; diverifikasi standar ASPI / Bank Indonesia
              </div>

              <button
                type="button"
                className="btn-secondary-admin"
                id="btn-clear-qris-image"
                style={{ width: "100%", fontSize: 12.5 }}
                onClick={clearQris}
              >
                Gunakan Barcode Bawaan
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="admin-card">
        <div className="card-header-flex">
          <div className="card-title-group">
            <h2>Rekening Bank / Virtual Account</h2>
            <p>Kelola daftar rekening bank tujuan transfer (BCA, Mandiri, BRI, BNI) yang ditampilkan ke pembeli.</p>
          </div>
          <button type="button" className="btn-primary-admin" id="btn-add-bank" onClick={onAddBank}>
            <Stroke width={16} height={16} strokeWidth={2.5}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </Stroke>
            <span>Tambah Rekening Bank</span>
          </button>
        </div>

        <div className="bank-cards-grid" id="bank-accounts-list">
          {settings.banks.map((bank) => (
            <div className={`bank-card-item${bank.active ? "" : " inactive"}`} key={bank.id}>
              <div>
                <div className="bank-card-header">
                  <span className={`bank-logo-badge bank-${bank.code || "custom"}`}>{bank.name}</span>
                  <label style={{ position: "relative", display: "inline-block", width: 36, height: 18, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      className="toggle-bank-active"
                      checked={bank.active}
                      onChange={(e) => {
                        const next = {
                          ...settings,
                          banks: settings.banks.map((b) =>
                            b.id === bank.id ? { ...b, active: e.target.checked } : b,
                          ),
                        };
                        persistSettings(next);
                        pushToast(`Status rekening ${bank.name} diubah.`);
                      }}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{ position: "absolute", inset: 0, backgroundColor: bank.active ? "#10B981" : "#CBD5E1", borderRadius: 20, transition: "0.2s" }}>
                      <span style={{ position: "absolute", left: bank.active ? 19 : 2, top: 2, width: 14, height: 14, background: "white", borderRadius: "50%", transition: "0.2s" }} />
                    </span>
                  </label>
                </div>
                <div className="bank-card-accno">{bank.accNo}</div>
                <div className="bank-card-accname">a.n. {bank.accName}</div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid #F1F5F9", paddingTop: 10 }}>
                <button type="button" className="btn-icon-square btn-edit-bank" title="Edit Rekening" onClick={() => onEditBank(bank.id)}>
                  <Stroke width={14} height={14}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </Stroke>
                </button>
                <button
                  type="button"
                  className="btn-icon-square danger btn-delete-bank"
                  title="Hapus Rekening"
                  onClick={() => {
                    if (!window.confirm("Hapus rekening bank ini?")) return;
                    persistSettings({ ...settings, banks: settings.banks.filter((b) => b.id !== bank.id) });
                    pushToast("Rekening bank berhasil dihapus.");
                  }}
                >
                  <Stroke width={14} height={14}>
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </Stroke>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <div className="card-header-flex">
          <div className="card-title-group">
            <h2>Akun Dompet Digital (E-Wallet)</h2>
            <p>Nomor HP akun dompet digital yang digunakan untuk menerima transfer dari pelanggan.</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }} id="ewallet-accounts-list">
          {settings.ewallets.map((wallet) => (
            <div
              key={wallet.id}
              style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div>
                <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14 }}>{wallet.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "#4F46E5", fontSize: 13.5 }}>{wallet.accNo}</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>a.n. {wallet.accName}</div>
              </div>
              <button type="button" className="btn-icon-square btn-edit-ewallet" title="Edit E-Wallet" onClick={() => onEditEwallet(wallet.id)}>
                <Stroke width={14} height={14}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </Stroke>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   View 4 — WhatsApp
   ------------------------------------------------------------------------- */

function WhatsAppView({
  settings,
  active,
  pushToast,
  persistSettings,
}: {
  settings: AdminSettings;
  active: boolean;
  pushToast: (m: string, t?: ToastType) => void;
  persistSettings: (s: AdminSettings) => void;
}) {
  const [draft, setDraft] = useState({
    whatsappNumber: settings.whatsappNumber,
    whatsappAdminName: settings.whatsappAdminName,
    whatsappHours: settings.whatsappHours,
    whatsappTemplateOrder: settings.whatsappTemplateOrder,
    whatsappTemplateSuccess: settings.whatsappTemplateSuccess,
  });

  function save(event: React.FormEvent) {
    event.preventDefault();
    persistSettings({
      ...settings,
      whatsappNumber: draft.whatsappNumber.trim(),
      whatsappAdminName: draft.whatsappAdminName.trim(),
      whatsappHours: draft.whatsappHours.trim(),
      whatsappTemplateOrder: draft.whatsappTemplateOrder.trim(),
      whatsappTemplateSuccess: draft.whatsappTemplateSuccess.trim(),
    });
    pushToast("Pengaturan nomor WhatsApp & template berhasil disimpan!");
  }

  function testWhatsApp() {
    let num = draft.whatsappNumber.trim().replace(/[^0-9]/g, "");
    if (num.startsWith("0")) num = "62" + num.slice(1);
    const msg = encodeURIComponent("Halo Admin Jogatix, ini pesan uji coba koneksi WhatsApp dari Dashboard Admin.");
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  }

  return (
    <section className={`admin-view-panel${active ? " active" : ""}`} id="view-whatsapp">
      <div className="admin-card">
        <div className="card-header-flex">
          <div className="card-title-group">
            <h2>Nomor WhatsApp &amp; Layanan Pelanggan</h2>
            <p>Atur nomor WhatsApp resmi toko Jogatix untuk menerima notifikasi pembayaran dan melayani bantuan pembeli.</p>
          </div>
        </div>

        <form id="form-whatsapp-settings" onSubmit={save}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            <div className="form-group-admin">
              <label className="form-label-admin" htmlFor="setting-wa-number">Nomor WhatsApp Admin / CS</label>
              <input
                type="text"
                className="form-input-admin"
                id="setting-wa-number"
                placeholder="Contoh: 081234567890 atau 6281234567890"
                value={draft.whatsappNumber}
                onChange={(e) => setDraft({ ...draft, whatsappNumber: e.target.value })}
              />
              <span style={{ fontSize: 12, color: "#64748B", marginTop: 4, display: "block" }}>Format: diawali 08 atau 628.</span>
            </div>

            <div className="form-group-admin">
              <label className="form-label-admin" htmlFor="setting-wa-name">Nama Layanan / Kontak</label>
              <input
                type="text"
                className="form-input-admin"
                id="setting-wa-name"
                placeholder="Contoh: Customer Care Jogatix"
                value={draft.whatsappAdminName}
                onChange={(e) => setDraft({ ...draft, whatsappAdminName: e.target.value })}
              />
            </div>

            <div className="form-group-admin">
              <label className="form-label-admin" htmlFor="setting-wa-hours">Jam Operasional Layanan</label>
              <input
                type="text"
                className="form-input-admin"
                id="setting-wa-hours"
                placeholder="Contoh: 07:00 - 23:00 WIB Setiap Hari"
                value={draft.whatsappHours}
                onChange={(e) => setDraft({ ...draft, whatsappHours: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group-admin" style={{ marginTop: 10 }}>
            <label className="form-label-admin" htmlFor="setting-wa-tpl-order">
              Template Pesan Konfirmasi Pembayaran Pembeli
              <span className="sub">(Variabel yang tersedia: {"{id}"}, {"{produk}"}, {"{total}"}, {"{customer}"})</span>
            </label>
            <textarea
              className="form-textarea-admin"
              id="setting-wa-tpl-order"
              rows={3}
              value={draft.whatsappTemplateOrder}
              onChange={(e) => setDraft({ ...draft, whatsappTemplateOrder: e.target.value })}
            />
          </div>

          <div className="form-group-admin">
            <label className="form-label-admin" htmlFor="setting-wa-tpl-success">
              Template Pesan Pengiriman Nomor SN / Bukti Berhasil
              <span className="sub">(Variabel yang tersedia: {"{id}"}, {"{produk}"}, {"{sn}"}, {"{pembeli}"})</span>
            </label>
            <textarea
              className="form-textarea-admin"
              id="setting-wa-tpl-success"
              rows={3}
              value={draft.whatsappTemplateSuccess}
              onChange={(e) => setDraft({ ...draft, whatsappTemplateSuccess: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end", marginTop: 24, paddingTop: 16, borderTop: "1px solid #E2E8F0" }}>
            <button type="button" className="btn-secondary-admin" id="btn-test-wa" onClick={testWhatsApp}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>Uji Coba Hubungi WhatsApp</span>
            </button>
            <button type="submit" className="btn-primary-admin">
              <Stroke width={16} height={16}>
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </Stroke>
              <span>Simpan Pengaturan WhatsApp</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   View 5 — Transactions
   ------------------------------------------------------------------------- */

function TransactionsView({
  orders,
  active,
  pushToast,
  persistOrders,
  settings,
  onEdit,
  onAddManual,
}: {
  orders: Record<string, Order>;
  active: boolean;
  pushToast: (m: string, t?: ToastType) => void;
  persistOrders: (o: Record<string, Order>) => void;
  settings: AdminSettings;
  onEdit: (id: string) => void;
  onAddManual: () => void;
}) {
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");

  const list = Object.values(orders);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list
      .filter((o) => {
        const matchStatus = filter === "all" || o.status === filter;
        const matchSearch =
          !q ||
          o.id.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          (o.product ?? "").toLowerCase().includes(q) ||
          (o.provider ?? "").toLowerCase().includes(q);
        return matchStatus && matchSearch;
      })
      .sort((a, b) => (b.id || "").localeCompare(a.id || ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, filter, search]);

  function chatCustomer(order: Order) {
    if (!order.customer) {
      window.alert("Nomor pelanggan tidak tersedia untuk transaksi ini.");
      return;
    }
    let phone = order.customer.replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) phone = "62" + phone.slice(1);
    const template =
      order.status === "SUCCESS"
        ? settings.whatsappTemplateSuccess
        : "Halo Kak, konfirmasi pesanan Jogatix ID {id} untuk {produk} status: {status}. Nominal: {total}. Hubungi kami jika ada pertanyaan.";
    const msg = template
      .replace(/{id}/g, order.id)
      .replace(/{produk}/g, order.product || order.category)
      .replace(/{total}/g, rupiah(order.total))
      .replace(/{customer}/g, order.customer)
      .replace(/{pembeli}/g, order.customer)
      .replace(/{sn}/g, order.sn || "-")
      .replace(/{status}/g, order.statusLabel || order.status);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function exportJson() {
    const json = JSON.stringify(orders, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `jogatix-transaksi-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    pushToast("File rekapan transaksi berhasil diunduh!");
  }

  return (
    <section className={`admin-view-panel${active ? " active" : ""}`} id="view-transactions">
      <div className="admin-card">
        <div className="card-header-flex">
          <div className="card-title-group">
            <h2>Manajemen Transaksi &amp; Pesanan</h2>
            <p>Verifikasi pembayaran, ubah status pesanan, dan input nomor SN atau token PLN pelanggan.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn-secondary-admin" id="btn-export-tx" title="Unduh data JSON" onClick={exportJson}>
              <Stroke width={15} height={15}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </Stroke>
              <span>Export Data</span>
            </button>
            <button type="button" className="btn-primary-admin" id="btn-add-manual-tx" onClick={onAddManual}>
              <Stroke width={16} height={16} strokeWidth={2.5}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </Stroke>
              <span>+ Transaksi Manual</span>
            </button>
          </div>
        </div>

        <div className="admin-toolbar-flex">
          <div className="toolbar-search-box">
            <Stroke width={16} height={16}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </Stroke>
            <input
              type="text"
              id="search-transactions-input"
              placeholder="Cari ID transaksi (JGX-...), nomor HP, produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-tabs-nav">
            {(
              [
                { id: "all", label: "Semua" },
                { id: "WAITING", label: "Menunggu" },
                { id: "PENDING", label: "Diproses" },
                { id: "SUCCESS", label: "Berhasil" },
                { id: "FAILED", label: "Gagal" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`filter-tab-btn${filter === tab.id ? " active" : ""}`}
                data-status={tab.id}
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 13, color: "#64748B", marginBottom: 14 }} id="tx-filter-count-label">
          Menampilkan {filtered.length} dari {list.length} transaksi
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>ID / Waktu</th>
                <th>Produk &amp; Provider</th>
                <th>Nomor Pelanggan</th>
                <th>Nominal / Bayar</th>
                <th>Status</th>
                <th>Nomor Seri (SN)</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="transactions-table-body">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "#94A3B8", padding: 32 }}>
                    Tidak ada transaksi yang cocok dengan filter atau pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const badge = statusMeta(order.status);
                  return (
                    <tr key={order.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="tx-id-badge">{order.id}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>{order.createdAt || "-"}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 13.5 }}>{order.product || order.category}</div>
                        <div style={{ fontSize: 12, color: "#64748B" }}>{order.provider ? `Provider: ${order.provider}` : order.category || "-"}</div>
                      </td>
                      <td>
                        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "#334155" }}>{order.customer || "-"}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: "#0F172A" }}>{rupiah(order.total)}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{order.paymentMethod || "QRIS"}</div>
                      </td>
                      <td>
                        <span className={`status-pill-admin ${badge.cls}`}>
                          <span className="status-dot-sm" />
                          {badge.text}
                        </span>
                      </td>
                      <td>
                        {order.sn ? (
                          <span className="tx-sn-code">{order.sn}</span>
                        ) : (
                          <span style={{ color: "#CBD5E1", fontSize: 12 }}>Belum ada SN</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" className="btn-icon-square btn-tx-detail" title="Ubah Status & Detail" onClick={() => onEdit(order.id)}>
                            <Stroke width={15} height={15}>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </Stroke>
                          </button>
                          <button type="button" className="btn-icon-square btn-tx-wa" title="Chat WA Pembeli" onClick={() => chatCustomer(order)}>
                            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="btn-icon-square danger btn-tx-delete"
                            title="Hapus Transaksi"
                            onClick={() => {
                              if (!window.confirm(`Apakah Anda yakin ingin menghapus transaksi ${order.id}? Tindakan ini tidak dapat dibatalkan.`)) return;
                              const next = { ...orders };
                              delete next[order.id];
                              persistOrders(next);
                              pushToast(`Transaksi ${order.id} telah dihapus.`);
                            }}
                          >
                            <Stroke width={15} height={15}>
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </Stroke>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Modals
   ------------------------------------------------------------------------- */

function ModalShell({
  id,
  title,
  extraTitle,
  wide,
  onClose,
  children,
  footer,
}: {
  id: string;
  title: string;
  extraTitle?: React.ReactNode;
  wide?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="admin-modal-backdrop active" id={id} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`admin-modal-box${wide ? " wide" : ""}`}>
        <div className="modal-header-admin">
          <div>
            <h3 className="modal-title-admin">
              {title} {extraTitle}
            </h3>
          </div>
          <button type="button" className="modal-close-btn" aria-label="Tutup Modal" onClick={onClose}>
            <Stroke width={20} height={20}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </Stroke>
          </button>
        </div>
        <div className="modal-body-admin">{children}</div>
        <div className="modal-footer-admin">{footer}</div>
      </div>
    </div>
  );
}

function ProductModal({
  productId,
  products,
  onClose,
  onSave,
  pushToast,
}: {
  productId: string | null;
  products: AdminProduct[];
  onClose: () => void;
  onSave: (p: AdminProduct[]) => void;
  pushToast: (m: string, t?: ToastType) => void;
}) {
  const editing = productId ? products.find((p) => p.id === productId) : undefined;
  const [form, setForm] = useState({
    categorySlug: (editing?.categorySlug ?? "pulsa") as CategorySlug,
    provider: editing?.provider ?? "",
    name: editing?.name ?? "",
    price: editing ? String(editing.price) : "",
    note: editing?.note ?? "",
    active: editing?.active !== false,
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const price = Number(form.price) || 0;
    if (!form.name.trim() || price <= 0) {
      window.alert("Mohon isi nama produk dan nominal harga yang valid.");
      return;
    }

    if (editing) {
      onSave(
        products.map((p) =>
          p.id === editing.id
            ? {
                ...p,
                categorySlug: form.categorySlug,
                categoryName: CATEGORY_NAMES[form.categorySlug],
                provider: form.provider.trim(),
                name: form.name.trim(),
                price,
                note: form.note.trim(),
                active: form.active,
              }
            : p,
        ),
      );
    } else {
      const newId = `${form.categorySlug}-${Date.now().toString().slice(-6)}`;
      onSave([
        {
          id: newId,
          categorySlug: form.categorySlug,
          categoryName: CATEGORY_NAMES[form.categorySlug],
          provider: form.provider.trim(),
          name: form.name.trim(),
          price,
          note: form.note.trim(),
          active: form.active,
        },
        ...products,
      ]);
    }
    onClose();
    pushToast(editing ? "Produk berhasil diperbarui!" : "Produk baru berhasil ditambahkan!");
  }

  return (
    <ModalShell
      id="modal-product"
      title={editing ? "Edit Produk" : "Tambah Produk Baru"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary-admin modal-close-btn" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="form-product-edit" className="btn-primary-admin">
            Simpan Produk
          </button>
        </>
      }
    >
      <form id="form-product-edit" onSubmit={submit}>
        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="prod-input-cat">Kategori Layanan</label>
          <select
            className="form-input-admin"
            id="prod-input-cat"
            required
            value={form.categorySlug}
            onChange={(e) => setForm({ ...form, categorySlug: e.target.value as CategorySlug })}
          >
            <option value="pulsa">Pulsa</option>
            <option value="paket-data">Paket Data</option>
            <option value="uang-elektronik">Uang Elektronik</option>
            <option value="pln">PLN (Token Listrik)</option>
            <option value="internet">Pembayaran Internet</option>
            <option value="bpjs">BPJS Kesehatan</option>
            <option value="pdam">PDAM</option>
            <option value="multifinance">Multifinance</option>
          </select>
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="prod-input-provider">Provider / Operator (Opsional)</label>
          <input
            type="text"
            className="form-input-admin"
            id="prod-input-provider"
            placeholder="Contoh: Telkomsel, GoPay, DANA, PLN, IndiHome"
            value={form.provider}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
          />
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="prod-input-name">Nama / Nominal Produk</label>
          <input
            type="text"
            className="form-input-admin"
            id="prod-input-name"
            placeholder="Contoh: Rp50.000 atau Saldo Rp50.000"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="prod-input-price">Harga Jual (Rp)</label>
          <input
            type="number"
            className="form-input-admin"
            id="prod-input-price"
            placeholder="51500"
            min={0}
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="prod-input-note">Keterangan / Catatan Masa Aktif</label>
          <input
            type="text"
            className="form-input-admin"
            id="prod-input-note"
            placeholder="Contoh: Masa aktif +45 hari atau Top up instan"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>

        <div className="switch-container">
          <div>
            <div className="switch-label-title">Status Produk Aktif</div>
            <div className="switch-label-desc">Produk ini dapat dipilih dan dibeli oleh pelanggan di web.</div>
          </div>
          <label style={{ position: "relative", display: "inline-block" }}>
            <input
              type="checkbox"
              id="prod-input-active"
              className="switch-input-hidden"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span className="custom-switch-slider" />
          </label>
        </div>
      </form>
    </ModalShell>
  );
}

function BankModal({
  bankId,
  settings,
  onClose,
  onSave,
  pushToast,
}: {
  bankId: string | null;
  settings: AdminSettings;
  onClose: () => void;
  onSave: (s: AdminSettings) => void;
  pushToast: (m: string, t?: ToastType) => void;
}) {
  const editing = bankId ? settings.banks.find((b) => b.id === bankId) : undefined;
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    accNo: editing?.accNo ?? "",
    accName: editing?.accName ?? "",
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.accNo.trim() || !form.accName.trim()) {
      window.alert("Mohon lengkapi seluruh kolom rekening bank.");
      return;
    }
    let banks: BankAccount[];
    if (editing) {
      banks = settings.banks.map((b) =>
        b.id === editing.id ? { ...b, name: form.name.trim(), accNo: form.accNo.trim(), accName: form.accName.trim() } : b,
      );
    } else {
      const newId = `bank-${Date.now().toString().slice(-5)}`;
      banks = [
        ...settings.banks,
        {
          id: newId,
          code: form.name.trim().toLowerCase().replace(/[^a-z0-9]/g, ""),
          name: form.name.trim(),
          accNo: form.accNo.trim(),
          accName: form.accName.trim(),
          active: true,
        },
      ];
    }
    onSave({ ...settings, banks });
    onClose();
    pushToast("Data rekening bank berhasil disimpan!");
  }

  return (
    <ModalShell
      id="modal-bank"
      title={editing ? "Edit Rekening Bank" : "Tambah Rekening Bank"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary-admin modal-close-btn" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="form-bank-edit" className="btn-primary-admin">
            Simpan Rekening
          </button>
        </>
      }
    >
      <form id="form-bank-edit" onSubmit={submit}>
        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="bank-input-name">Nama Bank</label>
          <input
            type="text"
            className="form-input-admin"
            id="bank-input-name"
            placeholder="Contoh: BCA, Mandiri, BRI, BNI, BSI"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="bank-input-accno">Nomor Rekening / Virtual Account</label>
          <input
            type="text"
            className="form-input-admin"
            id="bank-input-accno"
            placeholder="Contoh: 8901289104"
            required
            value={form.accNo}
            onChange={(e) => setForm({ ...form, accNo: e.target.value })}
          />
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="bank-input-accname">Atas Nama Pemilik (a.n.)</label>
          <input
            type="text"
            className="form-input-admin"
            id="bank-input-accname"
            placeholder="Contoh: JOGATIX INDONESIA"
            required
            value={form.accName}
            onChange={(e) => setForm({ ...form, accName: e.target.value })}
          />
        </div>
      </form>
    </ModalShell>
  );
}

function EwalletModal({
  ewalletId,
  settings,
  onClose,
  onSave,
  pushToast,
}: {
  ewalletId: string | null;
  settings: AdminSettings;
  onClose: () => void;
  onSave: (s: AdminSettings) => void;
  pushToast: (m: string, t?: ToastType) => void;
}) {
  const editing = ewalletId ? settings.ewallets.find((w) => w.id === ewalletId) : undefined;
  const [form, setForm] = useState({
    accNo: editing?.accNo ?? "",
    accName: editing?.accName ?? "",
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const ewallets = settings.ewallets.map((w) =>
      w.id === editing.id ? { ...w, accNo: form.accNo.trim(), accName: form.accName.trim() } : w,
    );
    onSave({ ...settings, ewallets });
    onClose();
    pushToast(`Nomor akun ${editing.name} berhasil diperbarui!`);
  }

  return (
    <ModalShell
      id="modal-ewallet"
      title="Edit Akun Dompet Digital"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary-admin modal-close-btn" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="form-ewallet-edit" className="btn-primary-admin">
            Simpan Akun
          </button>
        </>
      }
    >
      <form id="form-ewallet-edit" onSubmit={submit}>
        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="ewallet-input-name">Nama Provider E-Wallet</label>
          <input className="form-input-admin" id="ewallet-input-name" readOnly style={{ background: "#F1F5F9" }} value={editing?.name ?? ""} />
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="ewallet-input-accno">Nomor HP Akun Penerima</label>
          <input
            type="text"
            className="form-input-admin"
            id="ewallet-input-accno"
            placeholder="Contoh: 081234567890"
            required
            value={form.accNo}
            onChange={(e) => setForm({ ...form, accNo: e.target.value })}
          />
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="ewallet-input-accname">Nama Akun Terdaftar (a.n.)</label>
          <input
            type="text"
            className="form-input-admin"
            id="ewallet-input-accname"
            placeholder="Contoh: Jogatix Official"
            required
            value={form.accName}
            onChange={(e) => setForm({ ...form, accName: e.target.value })}
          />
        </div>
      </form>
    </ModalShell>
  );
}

function TransactionModal({
  orderId,
  orders,
  settings,
  onClose,
  onSave,
  pushToast,
}: {
  orderId: string;
  orders: Record<string, Order>;
  settings: AdminSettings;
  onClose: () => void;
  onSave: (o: Record<string, Order>) => void;
  pushToast: (m: string, t?: ToastType) => void;
}) {
  const order = orders[orderId];
  const [status, setStatus] = useState<OrderStatus>((order?.status ?? "SUCCESS") as OrderStatus);
  const [sn, setSn] = useState(order?.sn ?? "");
  const [message, setMessage] = useState(order?.systemMessage ?? "");

  if (!order) return null;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const labels: Record<OrderStatus, string> = {
      SUCCESS: "Berhasil Dikonfirmasi",
      PENDING: "Sedang Diproses",
      WAITING: "Menunggu Pembayaran",
      FAILED: "Transaksi Gagal",
    };
    onSave({
      ...orders,
      [orderId]: { ...order, status, sn: sn.trim(), systemMessage: message.trim(), statusLabel: labels[status] },
    });
    onClose();
    pushToast(`Status transaksi ${orderId} berhasil diperbarui menjadi ${status}!`);
  }

  function chat() {
    let phone = (order.customer || "").replace(/[^0-9]/g, "");
    if (!phone) {
      window.alert("Nomor pelanggan tidak tersedia untuk transaksi ini.");
      return;
    }
    if (phone.startsWith("0")) phone = "62" + phone.slice(1);
    const template =
      order.status === "SUCCESS"
        ? settings.whatsappTemplateSuccess
        : "Halo Kak, konfirmasi pesanan Jogatix ID {id} untuk {produk} status: {status}. Nominal: {total}. Hubungi kami jika ada pertanyaan.";
    const msg = template
      .replace(/{id}/g, order.id)
      .replace(/{produk}/g, order.product || order.category)
      .replace(/{total}/g, rupiah(order.total))
      .replace(/{customer}/g, order.customer)
      .replace(/{pembeli}/g, order.customer)
      .replace(/{sn}/g, order.sn || "-")
      .replace(/{status}/g, order.statusLabel || order.status);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <ModalShell
      id="modal-transaction"
      title="Kelola Transaksi"
      extraTitle={<span style={{ color: "#4F46E5", fontFamily: "var(--font-mono)" }}>{order.id}</span>}
      wide
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary-admin" id="btn-tx-modal-wa" onClick={chat}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span>Kirim Update ke WhatsApp Pembeli</span>
          </button>
          <button type="submit" form="form-tx-detail-edit" className="btn-primary-admin">
            Simpan Pembaruan Status
          </button>
        </>
      }
    >
      <form id="form-tx-detail-edit" onSubmit={submit}>
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, fontSize: 13.5 }}>
            <DetailField label="Kategori:" value={order.category || "-"} />
            <DetailField label="Provider:" value={order.provider || "-"} />
            <DetailField label="Produk:" value={order.product || "-"} />
            <DetailField label="Nomor Tujuan / Pelanggan:" value={order.customer} mono primary />
            <DetailField label="Total Tagihan:" value={rupiah(order.total)} />
            <DetailField label="Metode Pembayaran:" value={order.paymentMethod || "QRIS"} />
            <DetailField label="Waktu Checkout:" value={order.createdAt || "-"} />
          </div>
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="tx-edit-status">Status Transaksi</label>
          <select className="form-input-admin" id="tx-edit-status" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
            <option value="WAITING">WAITING — Menunggu Pembayaran</option>
            <option value="PENDING">PENDING — Sedang Diproses Provider</option>
            <option value="SUCCESS">SUCCESS — Berhasil Dikonfirmasi</option>
            <option value="FAILED">FAILED — Transaksi Gagal / Dibatalkan</option>
          </select>
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="tx-edit-sn">
            Nomor Seri (Serial Number / Token Listrik / Bukti SN)
            <span className="sub">(Nomor ini akan tampil saat pelanggan cek transaksi)</span>
          </label>
          <input
            type="text"
            className="form-input-admin"
            id="tx-edit-sn"
            placeholder="Contoh: 2981-4920-1940-2819 atau TRX-GOPAY-9014521"
            value={sn}
            onChange={(e) => setSn(e.target.value)}
          />
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="tx-edit-msg">Pesan Sistem / Keterangan untuk Pelanggan</label>
          <textarea
            className="form-textarea-admin"
            id="tx-edit-msg"
            rows={2}
            placeholder="Catatan konfirmasi atau instruksi lanjutan untuk pelanggan."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
      </form>
    </ModalShell>
  );
}

function DetailField({
  label,
  value,
  mono,
  primary,
}: {
  label: string;
  value: string;
  mono?: boolean;
  primary?: boolean;
}) {
  return (
    <div>
      <span style={{ color: "#64748B", display: "block", fontSize: 12 }}>{label}</span>
      <b
        style={{
          fontFamily: mono ? "var(--font-mono)" : undefined,
          color: primary ? "#4F46E5" : "#0F172A",
        }}
      >
        {value}
      </b>
    </div>
  );
}

function ManualTransactionModal({
  orders,
  onClose,
  onSave,
  pushToast,
}: {
  orders: Record<string, Order>;
  onClose: () => void;
  onSave: (o: Record<string, Order>) => void;
  pushToast: (m: string, t?: ToastType) => void;
}) {
  const [form, setForm] = useState({
    category: "Pulsa",
    provider: "",
    product: "",
    customer: "",
    price: "",
    method: "QRIS",
    status: "SUCCESS" as Extract<OrderStatus, "SUCCESS" | "PENDING" | "WAITING">,
    sn: "",
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const price = Number(form.price) || 0;
    if (!form.product.trim() || !form.customer.trim() || price <= 0) {
      window.alert("Mohon lengkapi produk, nomor pelanggan, dan nominal harga.");
      return;
    }
    const orderId = `JGX-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const prov = form.provider.trim();
    const statusLabels: Record<string, string> = {
      SUCCESS: "Berhasil Dikonfirmasi",
      PENDING: "Sedang Diproses",
      WAITING: "Menunggu Pembayaran",
    };
    onSave({
      ...orders,
      [orderId]: {
        id: orderId,
        category: form.category,
        categorySlug: form.category.toLowerCase().replace(/[^a-z]/g, "-") as CategorySlug,
        provider: prov,
        product: (prov ? `${prov} — ` : "") + form.product.trim(),
        customer: form.customer.trim(),
        createdAt: new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }),
        paymentMethod: form.method,
        total: price,
        totalFormatted: rupiah(price),
        sn: form.sn.trim() || `TRX-${(prov || "JGX").toUpperCase().slice(0, 5)}-${Date.now().toString().slice(-6)}`,
        status: form.status,
        statusLabel: statusLabels[form.status],
        systemMessage: "Transaksi manual dicatat oleh Administrator Jogatix.",
      },
    });
    onClose();
    pushToast(`Transaksi manual ${orderId} berhasil dibuat!`);
  }

  return (
    <ModalShell
      id="modal-manual-tx"
      title="Tambah Transaksi Manual"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary-admin modal-close-btn" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="form-manual-tx" className="btn-primary-admin">
            Simpan Transaksi
          </button>
        </>
      }
    >
      <form id="form-manual-tx" onSubmit={submit}>
        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="manual-tx-cat">Kategori</label>
          <select className="form-input-admin" id="manual-tx-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="Pulsa">Pulsa</option>
            <option value="Paket Data">Paket Data</option>
            <option value="Uang Elektronik">Uang Elektronik</option>
            <option value="PLN">PLN</option>
            <option value="Pembayaran Internet">Pembayaran Internet</option>
            <option value="BPJS Kesehatan">BPJS Kesehatan</option>
            <option value="PDAM">PDAM</option>
            <option value="Multifinance">Multifinance</option>
          </select>
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="manual-tx-provider">Provider</label>
          <input className="form-input-admin" id="manual-tx-provider" placeholder="Contoh: Telkomsel, GoPay, DANA" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="manual-tx-product">Nama Produk</label>
          <input className="form-input-admin" id="manual-tx-product" placeholder="Contoh: Telkomsel 50.000" required value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="manual-tx-cust">Nomor Pelanggan / HP</label>
          <input className="form-input-admin" id="manual-tx-cust" placeholder="081234567890" required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="manual-tx-price">Total Pembayaran (Rp)</label>
          <input
            type="number"
            className="form-input-admin"
            id="manual-tx-price"
            placeholder="51500"
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="manual-tx-method">Metode Pembayaran</label>
          <select className="form-input-admin" id="manual-tx-method" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            <option value="QRIS">QRIS</option>
            <option value="BANK TRANSFER">Bank Transfer (BCA / Mandiri / BRI)</option>
            <option value="DOMPET DIGITAL">Dompet Digital (E-Wallet)</option>
            <option value="TUNAI / OFFLINE">Tunai / Offline</option>
          </select>
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="manual-tx-status">Status Transaksi</label>
          <select
            className="form-input-admin"
            id="manual-tx-status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
          >
            <option value="SUCCESS">SUCCESS — Berhasil</option>
            <option value="PENDING">PENDING — Diproses</option>
            <option value="WAITING">WAITING — Menunggu</option>
          </select>
        </div>

        <div className="form-group-admin">
          <label className="form-label-admin" htmlFor="manual-tx-sn">Nomor Serial / SN (Opsional)</label>
          <input className="form-input-admin" id="manual-tx-sn" placeholder="Contoh: SN20261010..." value={form.sn} onChange={(e) => setForm({ ...form, sn: e.target.value })} />
        </div>
      </form>
    </ModalShell>
  );
}

/* ---------------------------------------------------------------------------
   Load states — shown until the Supabase data arrives
   ------------------------------------------------------------------------- */

function ConsoleLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F1F5F9",
        color: "#64748B",
        fontSize: 14.5,
      }}
    >
      Memuat dashboard admin…
    </div>
  );
}

function ConsoleError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        background: "#F1F5F9",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 20, color: "#0F172A" }}>Gagal memuat data dashboard</h1>
      <p style={{ fontSize: 14, color: "#64748B", maxWidth: 460, lineHeight: 1.6 }}>
        Dashboard tidak dapat terhubung ke database. Periksa koneksi internet lalu coba lagi.
      </p>
      <button
        type="button"
        className="btn-primary-admin"
        onClick={onRetry}
        style={{ marginTop: 8 }}
      >
        Coba Lagi
      </button>
    </div>
  );
}
