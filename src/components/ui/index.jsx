import { fmtINR } from '../../utils/formatters';

// ── Slider Input ─────────────────────────────────────────────────
export function SliderInput({ label, value, min, max, step = 1, onChange, display, suffix = '', color = 'var(--accent-blue)' }) {
  const shown = display !== undefined ? display : (typeof value === 'number' && value >= 1000 ? fmtINR(value) : value);
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
          {shown}{suffix}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}

// ── Amount Input (slider + manual number) ───────────────────────
export function AmountInput({ label, value, onChange, max = 10000000, step = 10000, color = 'var(--accent-blue)' }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, color, fontFamily: 'var(--font-mono)' }}>{fmtINR(value)}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="range" min={0} max={max} step={step} value={Math.min(value, max)}
          onChange={e => onChange(Number(e.target.value))}
          style={{ flex: 1 }} />
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
          style={{ width: 110 }} />
      </div>
    </div>
  );
}

// ── Section Card ─────────────────────────────────────────────────
export function Card({ children, style = {}, className = '' }) {
  return (
    <div className={`card ${className}`} style={{ padding: '20px 24px', marginBottom: 16, ...style }}>
      {children}
    </div>
  );
}

// ── Section Label ────────────────────────────────────────────────
export function SectionLabel({ children, style = {} }) {
  return (
    <div style={{
      fontSize: 10,
      letterSpacing: 2.5,
      color: 'var(--text-muted)',
      fontWeight: 600,
      textTransform: 'uppercase',
      marginBottom: 16,
      ...style
    }}>
      {children}
    </div>
  );
}

// ── Toggle ───────────────────────────────────────────────────────
export function Toggle({ value, onChange, label }) {
  return (
    <div className="toggle-wrap" onClick={() => onChange(!value)}>
      <div className={`toggle ${value ? 'on' : ''}`} />
      {label && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>}
    </div>
  );
}

// ── Asset Row ────────────────────────────────────────────────────
export function AssetRow({ icon, label, color, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${color}`,
      borderRadius: 'var(--radius-sm)',
      padding: '16px 18px',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 14, color }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

// ── Metric Card ──────────────────────────────────────────────────
export function MetricCard({ label, value, sub, color = 'var(--accent-blue)', large = false }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: large ? 26 : 20, fontWeight: 700, color, fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
