"use client";

import { useCallback, useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CommissionRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  projectTypeAr: string;
  projectTypeEn: string | null;
  descriptionAr: string;
  budgetRange: string | null;
  timelineWeeks: number | null;
  referenceUrls: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

// ── Labels ────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  reviewing: "قيد المراجعة",
  accepted: "مقبول",
  rejected: "مرفوض",
};

const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  reviewing: "#f59e0b",
  accepted: "#10b981",
  rejected: "#ef4444",
};

const BUDGET_LABELS: Record<string, string> = {
  "< 5000": "أقل من 5,000 ريال",
  "5000-15000": "5,000 – 15,000 ريال",
  "15000+": "أكثر من 15,000 ريال",
  "undecided": "لم يحدد بعد",
};

const TIMELINE_LABELS: Record<number, string> = {
  2: "1–2 أسبوع",
  4: "3–4 أسابيع",
  8: "1–2 شهر",
  12: "+شهرين",
};

// ── Detail panel ──────────────────────────────────────────────────────────────

function RequestDetail({
  req,
  onUpdate,
  onClose,
}: {
  req: CommissionRequest;
  onUpdate: () => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState(req.status);
  const [notes, setNotes] = useState(req.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function save(newStatus?: string) {
    setSaving(true);
    const body: Record<string, string> = {};
    if (newStatus) body.status = newStatus;
    body.notes = notes;

    await fetch(`/api/admin/commissioned/${req.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (newStatus) setStatus(newStatus);
    setSaving(false);
    onUpdate();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <h3>{req.name}</h3>
            <span className="req-badge" style={{ color: STATUS_COLORS[status] }}>
              {STATUS_LABELS[status] ?? status}
            </span>
          </div>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="req-detail-body">
          {/* Meta */}
          <div className="req-meta">
            <div className="req-meta-row">
              <span>البريد</span>
              <a href={`mailto:${req.email}`} dir="ltr">{req.email}</a>
            </div>
            {req.phone && (
              <div className="req-meta-row">
                <span>الجوال</span>
                <a href={`tel:${req.phone}`} dir="ltr">{req.phone}</a>
              </div>
            )}
            <div className="req-meta-row">
              <span>المشروع</span>
              <strong>{req.projectTypeAr}{req.projectTypeEn ? ` / ${req.projectTypeEn}` : ""}</strong>
            </div>
            {req.budgetRange && (
              <div className="req-meta-row">
                <span>الميزانية</span>
                <span>{BUDGET_LABELS[req.budgetRange] ?? req.budgetRange}</span>
              </div>
            )}
            {req.timelineWeeks && (
              <div className="req-meta-row">
                <span>الجدول</span>
                <span>{TIMELINE_LABELS[req.timelineWeeks] ?? `${req.timelineWeeks} أسابيع`}</span>
              </div>
            )}
            <div className="req-meta-row">
              <span>التاريخ</span>
              <span>
                {new Date(req.createdAt).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="req-section-label">الوصف</div>
          <div className="req-body-text">{req.descriptionAr}</div>

          {/* Reference URLs */}
          {req.referenceUrls && (
            <>
              <div className="req-section-label">روابط مرجعية</div>
              <div className="req-body-text" dir="ltr" style={{ fontSize: "0.825rem" }}>
                {req.referenceUrls.split("\n").map((url, i) =>
                  url.trim() ? (
                    <a key={i} href={url.trim()} target="_blank" rel="noopener noreferrer" style={{ display: "block", color: "var(--text-primary)" }}>
                      {url.trim()}
                    </a>
                  ) : null
                )}
              </div>
            </>
          )}

          {/* Notes */}
          <div className="req-section-label">ملاحظات داخلية</div>
          <textarea
            className="req-notes-input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أضف ملاحظاتك هنا..."
          />

          {/* Status actions */}
          <div className="req-actions">
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <button
                key={val}
                onClick={() => save(val)}
                disabled={saving || status === val}
                className={`req-status-btn ${status === val ? "current" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Save notes button */}
          <button
            className="req-save-notes"
            onClick={() => save()}
            disabled={saving}
          >
            {saving ? "جاري الحفظ..." : "حفظ الملاحظات"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CommissionedAdminPage() {
  const [requests, setRequests] = useState<CommissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<CommissionRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    const url = `/api/admin/commissioned${params.toString() ? "?" + params.toString() : ""}`;
    const res = await fetch(url);
    if (res.ok) setRequests(await res.json());
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const newCount = requests.filter((r) => r.status === "new").length;

  return (
    <div className="com-page">
      <div className="com-header">
        <div>
          <h1 className="com-title">
            أعمال بالطلب
            {newCount > 0 && <span className="com-new-badge">{newCount}</span>}
          </h1>
          <p className="com-subtitle">{requests.length} طلب</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="com-filters">
        <div className="filter-group">
          <span className="filter-label">الحالة:</span>
          <div className="filter-tabs">
            {["all", ...Object.keys(STATUS_LABELS)].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`filter-tab ${statusFilter === s ? "active" : ""}`}
              >
                {s === "all" ? "الكل" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="com-empty">جاري التحميل...</div>
      ) : requests.length === 0 ? (
        <div className="com-empty">لا توجد طلبات</div>
      ) : (
        <div className="com-list">
          {requests.map((req) => (
            <button
              key={req.id}
              className={`com-card ${req.status === "new" ? "unread" : ""}`}
              onClick={() => setSelected(req)}
            >
              <div className="com-card-left">
                <div className="com-card-top">
                  <strong className="com-name">{req.name}</strong>
                  <span className="com-project-type">
                    {req.projectTypeAr}
                  </span>
                  {req.budgetRange && (
                    <span className="com-budget">
                      {BUDGET_LABELS[req.budgetRange] ?? req.budgetRange}
                    </span>
                  )}
                </div>
                <p className="com-preview">
                  {req.descriptionAr.length > 100
                    ? req.descriptionAr.slice(0, 100) + "..."
                    : req.descriptionAr}
                </p>
                <span className="com-email" dir="ltr">{req.email}</span>
              </div>
              <div className="com-card-right">
                <span
                  className="com-status"
                  style={{ color: STATUS_COLORS[req.status] }}
                >
                  {STATUS_LABELS[req.status] ?? req.status}
                </span>
                <span className="com-date">
                  {new Date(req.createdAt).toLocaleDateString("ar-SA")}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <RequestDetail
          req={selected}
          onUpdate={() => { fetchRequests(); setSelected(null); }}
          onClose={() => setSelected(null)}
        />
      )}

      <style>{`
        .com-page { max-width: 900px; margin: 0 auto; }

        .com-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .com-title {
          font-size: 1.5rem; font-weight: 600; color: var(--text-primary);
          margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem;
        }

        .com-new-badge {
          font-size: 0.75rem; background: #3b82f6; color: #fff;
          padding: 0.15rem 0.5rem; border-radius: 999px; font-weight: 600;
        }

        .com-subtitle { font-size: 0.875rem; color: var(--text-muted); }

        .com-filters { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.25rem; }
        .filter-group { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .filter-label { font-size: 0.8125rem; color: var(--text-muted); white-space: nowrap; }
        .filter-tabs { display: flex; gap: 0.25rem; flex-wrap: wrap; }
        .filter-tab {
          padding: 0.25rem 0.75rem; border: 1px solid var(--border);
          background: transparent; color: var(--text-muted);
          border-radius: 999px; font-size: 0.8125rem; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .filter-tab.active {
          background: var(--text-primary); color: var(--bg-primary);
          border-color: var(--text-primary);
        }

        .com-empty {
          text-align: center; color: var(--text-muted);
          padding: 3rem 1rem; font-size: 0.9375rem;
        }

        .com-list { display: flex; flex-direction: column; gap: 0.5rem; }

        .com-card {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1rem; padding: 1rem 1.25rem;
          background: var(--bg-primary); border: 1px solid var(--border);
          border-radius: var(--radius-md); cursor: pointer; text-align: right; width: 100%;
          transition: border-color var(--transition-fast);
        }
        .com-card:hover { border-color: var(--text-muted); }
        .com-card.unread { border-inline-start: 3px solid #3b82f6; }

        .com-card-left { flex: 1; min-width: 0; }
        .com-card-top { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem; flex-wrap: wrap; }
        .com-name { font-size: 0.9375rem; color: var(--text-primary); }
        .com-project-type, .com-budget {
          font-size: 0.7rem; color: var(--text-muted); background: var(--bg-secondary);
          padding: 0.125rem 0.5rem; border-radius: 999px; border: 1px solid var(--border);
        }
        .com-preview {
          font-size: 0.875rem; color: var(--text-secondary);
          margin-bottom: 0.375rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 480px;
        }
        .com-email { font-size: 0.75rem; color: var(--text-subtle); }

        .com-card-right {
          display: flex; flex-direction: column; align-items: flex-end;
          gap: 0.375rem; flex-shrink: 0;
        }
        .com-status { font-size: 0.75rem; font-weight: 500; }
        .com-date { font-size: 0.75rem; color: var(--text-subtle); white-space: nowrap; }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 50; padding: 1rem;
        }
        .modal-box {
          background: var(--bg-primary); border-radius: var(--radius-lg);
          width: 100%; max-width: 560px; max-height: 88vh;
          overflow: hidden; display: flex; flex-direction: column;
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .modal-header-left { display: flex; align-items: center; gap: 0.625rem; }
        .modal-header h3 { font-size: 1rem; font-weight: 500; color: var(--text-primary); }
        .req-badge { font-size: 0.75rem; font-weight: 500; }
        .modal-close {
          width: 28px; height: 28px; border: none; background: transparent;
          color: var(--text-muted); cursor: pointer; font-size: 1.25rem;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }
        .modal-close:hover { background: var(--bg-secondary); }

        .req-detail-body { overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }

        .req-meta {
          display: flex; flex-direction: column; gap: 0.5rem;
          background: var(--bg-secondary); border-radius: var(--radius-md); padding: 0.875rem;
        }
        .req-meta-row { display: flex; gap: 0.75rem; font-size: 0.875rem; align-items: center; }
        .req-meta-row span:first-child { color: var(--text-muted); width: 70px; flex-shrink: 0; }
        .req-meta-row a { color: var(--text-primary); }

        .req-section-label {
          font-size: 0.75rem; color: var(--text-muted); font-weight: 500;
          text-transform: uppercase; letter-spacing: 0.05em;
        }

        .req-body-text {
          font-size: 0.9rem; line-height: 1.7; color: var(--text-primary);
          padding: 0.875rem; background: var(--bg-secondary); border-radius: var(--radius-md);
          white-space: pre-wrap;
        }

        .req-notes-input {
          width: 100%; padding: 0.75rem; resize: vertical;
          border: 1px solid var(--border); border-radius: var(--radius-md);
          background: var(--bg-secondary); color: var(--text-primary);
          font-size: 0.875rem; font-family: inherit; min-height: 80px;
        }
        .req-notes-input:focus { outline: none; border-color: var(--text-primary); }

        .req-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .req-status-btn {
          flex: 1; min-width: 80px; padding: 0.5rem 0.75rem;
          background: transparent; color: var(--text-secondary);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          font-size: 0.8125rem; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .req-status-btn:hover:not(:disabled):not(.current) {
          border-color: var(--text-secondary); color: var(--text-primary);
        }
        .req-status-btn.current {
          background: var(--text-primary); color: var(--bg-primary);
          border-color: var(--text-primary); cursor: default;
        }
        .req-status-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .req-save-notes {
          align-self: flex-start; padding: 0.5rem 1.25rem;
          background: transparent; color: var(--text-secondary);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          font-size: 0.8125rem; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .req-save-notes:hover:not(:disabled) { border-color: var(--text-primary); color: var(--text-primary); }
        .req-save-notes:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
