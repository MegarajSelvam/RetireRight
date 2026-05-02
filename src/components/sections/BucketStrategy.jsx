import { Card, SectionLabel, SliderInput } from '../ui';
import { fmtINR } from '../../utils/formatters';

export default function BucketStrategy({ state, setState, results }) {
  const { buckets } = state;

  const setB = (key, val) =>
    setState(s => ({ ...s, buckets: { ...s.buckets, [key]: val } }));

  // Keep b1+b2+b3 = 100 when one changes
  const setB1 = (v) => {
    const remaining = 100 - v;
    const ratio = buckets.b2Pct / (buckets.b2Pct + buckets.b3Pct) || 0.4;
    setB('b1Pct', v);
    setB('b2Pct', Math.round(remaining * ratio));
    setB('b3Pct', Math.round(remaining * (1 - ratio)));
  };

  const bucketInfo = [
    {
      id: 'B1',
      key: 'b1',
      label: 'Bucket 1 — Liquid / FD',
      icon: '💧',
      color: 'var(--accent-cyan)',
      desc: 'Instant access, zero risk. First withdrawal source.',
      assets: 'PF / EPF + FD / Liquid MF',
      pct: buckets.b1Pct,
      value: results?.totalB1 || 0,
      returnKey: 'b1Return',
      defaultReturn: 6.5,
    },
    {
      id: 'B2',
      key: 'b2',
      label: 'Bucket 2 — Debt / BAF',
      icon: '⚖️',
      color: 'var(--accent-blue)',
      desc: 'Moderate risk. Feeds Bucket 1 when depleted.',
      assets: 'Gold ETF + SGB + Debt MF + BAF',
      pct: buckets.b2Pct,
      value: results?.totalB2 || 0,
      returnKey: 'b2Return',
      defaultReturn: 9,
    },
    {
      id: 'B3',
      key: 'b3',
      label: 'Bucket 3 — Equity',
      icon: '🚀',
      color: 'var(--accent-green)',
      desc: 'High risk, high return. Long-term growth engine.',
      assets: 'Market Investments + Physical Gold (if SWP on) + NPS at 60',
      pct: buckets.b3Pct,
      value: results?.totalB3 || 0,
      returnKey: 'b3Return',
      defaultReturn: 13,
    },
  ];

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>3-Bucket Strategy</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        Your retirement corpus is split into 3 buckets at retirement. Withdrawals cascade from Bucket 1 → 2 → 3.
      </p>

      {/* Flow Diagram */}
      <Card style={{ marginBottom: 20 }}>
        <SectionLabel>Withdrawal Flow</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {bucketInfo.map((b, i) => (
            <>
              <div key={b.id} style={{
                flex: 1, minWidth: 120,
                background: `${b.color}15`,
                border: `1px solid ${b.color}40`,
                borderRadius: 10, padding: '14px 16px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{b.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: b.color, marginBottom: 2 }}>{b.id}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{b.pct}% of corpus</div>
                {results && <div style={{ fontSize: 12, color: b.color, fontWeight: 600, marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                  {fmtINR(b.value)}
                </div>}
              </div>
              {i < 2 && (
                <div key={`arrow-${i}`} style={{ fontSize: 18, color: 'var(--text-dim)', flexShrink: 0 }}>→</div>
              )}
            </>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6 }}>
          Monthly withdrawals go from Bucket 1. When B1 runs low, it gets refilled from B2. 
          When B2 depletes, B3 takes over. This lets equity grow undisturbed for years.
        </div>
      </Card>

      {/* Allocation Sliders */}
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Bucket Allocation (Total = 100%)</SectionLabel>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {bucketInfo.map(b => (
            <div key={b.id} style={{
              flex: b.pct, height: 8, borderRadius: 4,
              background: b.color, transition: 'flex 0.3s'
            }} />
          ))}
        </div>
        <SliderInput label="Bucket 1 — Liquid %" value={buckets.b1Pct}
          min={5} max={40} step={5} display={`${buckets.b1Pct}%`}
          onChange={setB1} color="var(--accent-cyan)" />
        <SliderInput label="Bucket 2 — Debt %" value={buckets.b2Pct}
          min={10} max={50} step={5} display={`${buckets.b2Pct}%`}
          onChange={v => setB('b2Pct', v)} color="var(--accent-blue)" />
        <SliderInput label="Bucket 3 — Equity %" value={buckets.b3Pct}
          min={20} max={70} step={5} display={`${buckets.b3Pct}%`}
          onChange={v => setB('b3Pct', v)} color="var(--accent-green)" />
        <div style={{ fontSize: 11, color: buckets.b1Pct + buckets.b2Pct + buckets.b3Pct === 100 ? 'var(--accent-green)' : 'var(--accent-red)', marginTop: 8 }}>
          Total: {buckets.b1Pct + buckets.b2Pct + buckets.b3Pct}% {buckets.b1Pct + buckets.b2Pct + buckets.b3Pct === 100 ? '✓' : '⚠ Should be 100%'}
        </div>
      </Card>

      {/* Return rates per bucket */}
      <Card>
        <SectionLabel>Expected Returns Per Bucket</SectionLabel>
        {bucketInfo.map(b => (
          <SliderInput key={b.returnKey} label={`${b.icon} ${b.label}`}
            value={buckets[b.returnKey]} min={3} max={20} step={0.5}
            display={`${buckets[b.returnKey]}%`}
            onChange={v => setB(b.returnKey, v)} color={b.color} />
        ))}
      </Card>

      {/* Bucket breakdown */}
      {results && (
        <div style={{ display: 'grid', gap: 12 }}>
          {bucketInfo.map(b => (
            <div key={b.id} style={{
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${b.color}30`,
              borderLeft: `3px solid ${b.color}`,
              borderRadius: 10, padding: '16px 18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: b.color }}>{b.icon} {b.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{b.desc}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: b.color, fontFamily: 'var(--font-mono)' }}>{fmtINR(b.value)}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{b.pct}% of corpus</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8, marginTop: 6 }}>
                Contains: {b.assets}
              </div>
            </div>
          ))}
        </div>
      )}

      {results?.hasNPSInHorizon && (
        <Card style={{ marginTop: 16, borderColor: 'rgba(255,167,38,0.25)', background: 'rgba(255,167,38,0.04)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🏛️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-orange)', marginBottom: 4 }}>NPS at Age 60</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                NPS lump sum ({fmtINR(results.npsLumpsum)}) auto-injects into Bucket 3 at age 60.
                Monthly annuity of {fmtINR(results.npsMonthlyAnnuity)} begins, reducing withdrawal pressure.
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
