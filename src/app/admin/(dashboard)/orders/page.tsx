"use client";

import { useCallback, useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string | null;
  status: string;
  notes: string | null;
  priceSent: number | null;
  createdAt: string;
  acquireItem: {
    work: { id: string; code: string; titleAr: string; imageUrl: string };
  };
  size: { id: string; label: string };
}

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  reviewing: "قيد المراجعة",
  accepted: "مقبول",
  rejected: "مرفوض",
  completed: "مكتمل",
};

const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  reviewing: "#f59e0b",
  accepted: "#10b981",
  rejected: "#ef4444",
  completed: "#6b7280",
};

// ── Order Detail Panel ────────────────────────────────────────────────────────

function OrderDetail({
  order,
  onUpdate,
  onClose,
}: {
  order: Order;
  onUpdate: () => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState(order.status);
  const [notes, setNotes] = useState(order.notes ?? "");
  const [price, setPrice] = useState(order.priceSent?.toString() ?? "");
  const [sendPrice, setSendPrice] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    const body: Record<string, unknown> = { status, notes };
    if (price) {
      body.priceSent = Number(price);
      body.sendPrice = sendPrice;
    }
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setSaved(true);
    setSendPrice(false);
    setTimeout(() => setSaved(false), 2500);
    onUpdate();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box detail-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>تفاصيل الطلب</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="detail-body">
          {/* Work info */}
          <div className="detail-work">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={order.acquireItem.work.imageUrl} alt="" />
            <div>
              <p className="detail-work-code">{order.acquireItem.work.code}</p>
              <p className="detail-work-title">{order.acquireItem.work.titleAr}</p>
              <p className="detail-work-size">{order.size.label}</p>
            </div>
          </div>

          {/* Customer info */}
          <div className="detail-section">
            <h4 className="detail-section-title">بيانات المقتني</h4>
            <div className="detail-row"><span>الاسم</span><strong>{order.customerName}</strong></div>
            <div className="detail-row"><span>البريد</span><a href={`mailto:${order.customerEmail}`} dir="ltr">{order.customerEmail}</a></div>
            <div className="detail-row"><span>الجوال</span><span dir="ltr">{order.customerPhone}</span></div>
            {order.message && (
              <div className="detail-row align-top"><span>الرسالة</span><p>{order.message}</p></div>
            )}
          </div>

          {/* Status */}
          <div className="detail-section">
            <h4 className="detail-section-title">الحالة</h4>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="detail-select"
            >
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div className="detail-section">
            <h4 className="detail-section-title">السعر</h4>
            <div className="detail-price-row">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="المبلغ بـ SAR"
                min={0}
                className="detail-price-input"
              />
              {price && (
                <label className="detail-send-check">
                  <input
                    type="checkbox"
                    checked={sendPrice}
                    onChange={(e) => setSendPrice(e.target.checked)}
                  />
                  إرسال للمقتني بالبريد
                </label>
              )}
            </div>
            {order.priceSent && (
              <p className="detail-price-sent">
                آخر سعر مُرسل: <strong>{order.priceSent.toLocaleString("ar-SA")} SAR</strong>
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="detail-section">
            <h4 className="detail-section-title">ملاحظات داخلية</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات لا تظهر للمقتني"
              rows={3}
              className="detail-notes"
            />
          </div>

          <div className="detail-footer">
            <p className="detail-date">
              {new Date(order.createdAt).toLocaleDateString("ar-SA", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? "جاري الحفظ..." : saved ? "✓ تم" : "حفظ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    const url = filter === "all" ? "/api/orders" : `/api/orders?status=${filter}`;
    const res = await fetch(url);
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <h1 className="orders-title">الطلبات</h1>
          <p className="orders-subtitle">{orders.length} طلب</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="orders-tabs">
        {["all", ...Object.keys(STATUS_LABELS)].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`orders-tab ${filter === s ? "active" : ""}`}
          >
            {s === "all" ? "الكل" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="orders-loading">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="orders-empty">لا توجد طلبات</div>
      ) : (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>العمل</th>
                <th>المقتني</th>
                <th>المقاس</th>
                <th>الحالة</th>
                <th>السعر</th>
                <th>التاريخ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="orders-row">
                  <td>
                    <div className="orders-work-cell">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={order.acquireItem.work.imageUrl} alt="" />
                      <div>
                        <p className="orders-work-code">{order.acquireItem.work.code}</p>
                        <p className="orders-work-title">{order.acquireItem.work.titleAr}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="orders-customer-name">{order.customerName}</p>
                    <p className="orders-customer-email">{order.customerEmail}</p>
                  </td>
                  <td><span dir="ltr">{order.size.label}</span></td>
                  <td>
                    <span
                      className="orders-status-dot"
                      style={{ color: STATUS_COLORS[order.status] }}
                    >
                      ● {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td>
                    {order.priceSent
                      ? `${order.priceSent.toLocaleString("ar-SA")} SAR`
                      : <span className="orders-no-price">—</span>}
                  </td>
                  <td className="orders-date">
                    {new Date(order.createdAt).toLocaleDateString("ar-SA")}
                  </td>
                  <td>
                    <button
                      onClick={() => setSelected(order)}
                      className="btn-outline btn-sm"
                    >
                      عرض
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <OrderDetail
          order={selected}
          onUpdate={() => { fetchOrders(); setSelected(null); }}
          onClose={() => setSelected(null)}
        />
      )}

      <style>{`
        .orders-page { max-width: 1000px; margin: 0 auto; }

        .orders-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 1.5rem; gap: 1rem;
        }
        .orders-title { font-size: 1.5rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem; }
        .orders-subtitle { font-size: 0.875rem; color: var(--text-muted); }

        .orders-tabs {
          display: flex; gap: 0; margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--border); flex-wrap: wrap;
        }
        .orders-tab {
          padding: 0.5rem 1rem; border: none; background: transparent;
          color: var(--text-muted); font-size: 0.875rem; cursor: pointer;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          transition: color var(--transition-fast), border-color var(--transition-fast);
          white-space: nowrap;
        }
        .orders-tab.active { color: var(--text-primary); border-bottom-color: var(--text-primary); font-weight: 500; }

        .orders-loading, .orders-empty {
          text-align: center; color: var(--text-muted);
          padding: 3rem 1rem; font-size: 0.9375rem;
        }

        .orders-table-wrap { overflow-x: auto; }
        .orders-table {
          width: 100%; border-collapse: collapse;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .orders-table th {
          padding: 0.75rem 1rem; text-align: right;
          font-size: 0.75rem; font-weight: 600; color: var(--text-muted);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
        }
        .orders-row td {
          padding: 0.875rem 1rem;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .orders-row:last-child td { border-bottom: none; }
        .orders-row:hover td { background: var(--bg-secondary); }

        .orders-work-cell { display: flex; align-items: center; gap: 0.625rem; }
        .orders-work-cell img { width: 40px; height: 40px; object-fit: cover; border-radius: var(--radius-sm); flex-shrink: 0; }
        .orders-work-code { font-size: 0.7rem; color: var(--text-muted); }
        .orders-work-title { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); }
        .orders-customer-name { font-weight: 500; color: var(--text-primary); }
        .orders-customer-email { font-size: 0.75rem; color: var(--text-muted); direction: ltr; }
        .orders-status-dot { font-size: 0.8125rem; font-weight: 500; white-space: nowrap; }
        .orders-no-price { color: var(--text-subtle); }
        .orders-date { font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; }

        /* Order detail modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 50; padding: 1rem;
        }
        .modal-box {
          background: var(--bg-primary); border-radius: var(--radius-lg);
          width: 100%; max-width: 520px; max-height: 90vh;
          overflow: hidden; display: flex; flex-direction: column;
        }
        .detail-box { max-width: 560px; }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .modal-header h3 { font-size: 1rem; font-weight: 500; color: var(--text-primary); }
        .modal-close {
          width: 28px; height: 28px; border: none; background: transparent;
          color: var(--text-muted); cursor: pointer; font-size: 1.25rem;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }
        .modal-close:hover { background: var(--bg-secondary); }

        .detail-body { overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; }

        .detail-work {
          display: flex; gap: 0.875rem; align-items: flex-start;
          background: var(--bg-secondary); border-radius: var(--radius-md); padding: 0.875rem;
        }
        .detail-work img { width: 72px; height: 72px; object-fit: cover; border-radius: var(--radius-sm); flex-shrink: 0; }
        .detail-work-code { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.125rem; }
        .detail-work-title { font-size: 1rem; font-weight: 500; color: var(--text-primary); margin-bottom: 0.125rem; }
        .detail-work-size { font-size: 0.8125rem; color: var(--text-muted); direction: ltr; }

        .detail-section { display: flex; flex-direction: column; gap: 0.5rem; }
        .detail-section-title { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

        .detail-row {
          display: flex; gap: 0.75rem; align-items: center;
          font-size: 0.875rem;
        }
        .detail-row.align-top { align-items: flex-start; }
        .detail-row span:first-child, .detail-row p:first-child { color: var(--text-muted); width: 70px; flex-shrink: 0; }
        .detail-row a { color: var(--text-primary); }

        .detail-select {
          width: 100%; height: 36px; padding: 0 0.75rem;
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: var(--bg-secondary); color: var(--text-primary);
          font-size: 0.875rem; outline: none;
        }

        .detail-price-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
        .detail-price-input {
          width: 160px; height: 36px; padding: 0 0.75rem;
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: var(--bg-secondary); color: var(--text-primary);
          font-size: 0.875rem; outline: none;
        }
        .detail-price-input:focus { border-color: var(--text-primary); }
        .detail-send-check {
          display: flex; align-items: center; gap: 0.375rem;
          font-size: 0.8125rem; color: var(--text-secondary); cursor: pointer;
        }
        .detail-price-sent { font-size: 0.8125rem; color: var(--text-muted); }

        .detail-notes {
          width: 100%; padding: 0.625rem 0.75rem;
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: var(--bg-secondary); color: var(--text-primary);
          font-size: 0.875rem; outline: none; resize: vertical; line-height: 1.6;
        }
        .detail-notes:focus { border-color: var(--text-primary); }

        .detail-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 0.75rem; border-top: 1px solid var(--border); margin-top: 0.25rem;
        }
        .detail-date { font-size: 0.8rem; color: var(--text-subtle); }

        .btn-primary {
          padding: 0.5rem 1.25rem; background: var(--text-primary); color: var(--bg-primary);
          border: none; border-radius: var(--radius-md);
          font-size: 0.875rem; font-weight: 500; cursor: pointer;
          transition: opacity var(--transition-fast);
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.85; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-outline {
          padding: 0.375rem 0.875rem; background: transparent; color: var(--text-secondary);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          font-size: 0.8125rem; cursor: pointer;
          transition: border-color var(--transition-fast), color var(--transition-fast);
        }
        .btn-outline:hover { border-color: var(--text-secondary); color: var(--text-primary); }

        .btn-sm { padding: 0.25rem 0.625rem; font-size: 0.75rem; }
      `}</style>
    </div>
  );
}
