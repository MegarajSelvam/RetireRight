import { Card, SectionLabel, SliderInput } from '../ui';
import { fmtINR } from '../../utils/formatters';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const BUCKET_COLORS = ['var(--accent-cyan)', 'var(--accent-blue)', 'var(--accent-green)'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0a1628', border: '1px solid rgba(100,181,246,0.2)',
      borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12
    }}>
      <div style={{ color: 'var(--accent-blue)', marginBottom: 6 }}>Year {label} (Age {payload[0]?.payload?.age})</div>
      {payload.map((p, i) => p.value > 0 && (
        <div key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: {fmtINR(p.value)}
        </div>
      ))}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 6, paddingTop: 6, color: 'var(--text-secondary)' }}>
        Expense: {fmtINR(payload[0]?.payload?.monthlyExpense)}/mo
      </div>
    </div>
  );
};

export default function Summary({ state, setState, results }) {
  if (!results) return null;

  const { sustainedYears, simData, swpCorpus, totalCorpusWithNPS, baseMonthlyExpense,
    totalB1, totalB2, totalB3, npsAtRetirement, npsLumpsum, npsMonthlyAnnuity,
    yearsToRetirement, hasNPSInHorizon } = results;

  const { profile } = state;
  const ageAtEnd = profile.retirementAge + sustainedYears;
  const isHealthy = sustainedYears >= 25;

  // Quick-edit summary handlers
  const setMarketReturn = (v) =>
    setState(s => ({ ...s, portfolio: { ...s.portfolio, market: { ...s.portfolio.market, returnRate: v } } }));
  const setB3Return = (v) =>
    setState(s => ({ ...s, buckets: { ...s.buckets, b3Return: v } }));

  const pieData = [
    { name: 'Bucket 1 – Liquid', value: Math.round(totalB1) },
    { name: 'Bucket 2 – Debt', value: Math.round(totalB2) },
    { name: 'Bucket 3 – Equity', value: Math.round(totalB3) },
  ];

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Retirement Summary</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Your complete retirement picture. Use the quick-edit sliders to see live changes.
      </p>

      {/* HERO — Big Numbers */}
      <div style={{
        background: isHealthy ? 'rgba(102,187,106,0.06)' : 'rgba(239,83,80,0.06)',
        border: `1px solid ${isHealthy ? 'rgba(102,187,106,0.25)' : 'rgba(239,83,80,0.25)'}`,
        borderRadius: 'var(--radius)', padding: '24px', marginBottom: 20, textAlign: 'center'
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2.5, color: 'var(--text-muted)', marginBottom: 8 }}>
          CORPUS SUSTAINS FOR
        </div>
        <div style={{
          fontSize: 64, fontWeight: 800, fontFamily: 'var(--font-mono)',
          color: isHealthy ? 'var(--accent-green)' : 'var(--accent-red)', lineHeight: 1
        }}>
          {sustainedYears}
        </div>
        <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 4 }}>
          years after retirement · Until age <strong style={{ color: isHealthy ? 'var(--accent-green)' : 'var(--accent-red)' }}>{ageAtEnd}</strong>
        </div>
        {!isHealthy && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--accent-red)', background: 'rgba(239,83,80,0.1)', borderRadius: 8, padding: '8px 14px', display: 'inline-block' }}>
            ⚠️ Corpus runs out before 25 years — consider increasing savings or reducing withdrawal
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        <MetricTile label="SWP Corpus at Retirement" value={fmtINR(swpCorpus)} sub="Excluding NPS (locked)" color="var(--accent-blue)" />
        <MetricTile label="Total Incl. NPS" value={fmtINR(totalCorpusWithNPS)} sub="NPS unlocks at 60" color="var(--accent-orange)" />
        <MetricTile label="Monthly Expense Today" value={fmtINR(baseMonthlyExpense)} sub="Current level" color="var(--text-secondary)" />
        <MetricTile label="Years to Retirement" value={`${yearsToRetirement} yrs`} sub={`Retire at ${profile.retirementAge}`} color="var(--accent-cyan)" />
      </div>

      {hasNPSInHorizon && (
        <Card style={{ marginBottom: 20, borderColor: 'rgba(255,167,38,0.2)', background: 'rgba(255,167,38,0.04)' }}>
          <SectionLabel>🏛️ NPS at Age 60</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <MetricTile label="NPS at Retirement" value={fmtINR(npsAtRetirement)} color="var(--accent-orange)" />
            <MetricTile label="Lump Sum (60%)" value={fmtINR(npsLumpsum)} sub="→ Bucket 3" color="var(--accent-orange)" />
            <MetricTile label="Monthly Annuity" value={fmtINR(npsMonthlyAnnuity)} sub="From age 60 onwards" color="var(--accent-green)" />
          </div>
        </Card>
      )}

      {/* Depletion Chart */}
      <Card style={{ marginBottom: 20 }}>
        <SectionLabel>Corpus Depletion — Bucket by Bucket</SectionLabel>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={simData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {['cyan', 'blue', 'green'].map((c, i) => (
                <linearGradient key={i} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BUCKET_COLORS[i]} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={BUCKET_COLORS[i]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,181,246,0.06)" />
            <XAxis dataKey="year" stroke="var(--text-dim)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              tickFormatter={v => `Yr ${v}`} />
            <YAxis stroke="var(--text-dim)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              tickFormatter={v => v >= 1e7 ? `${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `${(v / 1e5).toFixed(0)}L` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
            <Area type="monotone" dataKey="bucket3" name="Bucket 3 – Equity" stackId="a"
              stroke={BUCKET_COLORS[2]} fill="url(#grad2)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="bucket2" name="Bucket 2 – Debt" stackId="a"
              stroke={BUCKET_COLORS[1]} fill="url(#grad1)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="bucket1" name="Bucket 1 – Liquid" stackId="a"
              stroke={BUCKET_COLORS[0]} fill="url(#grad0)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Bucket Pie + Quick Edit side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <Card>
          <SectionLabel>Corpus Split at Retirement</SectionLabel>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={BUCKET_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmtINR(v)} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionLabel>⚡ Quick Edit</SectionLabel>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
            Adjust key levers to see live impact on sustainability.
          </p>
          <SliderInput label="Market Return %" value={state.portfolio.market.returnRate}
            min={8} max={18} step={0.5} display={`${state.portfolio.market.returnRate}%`}
            onChange={setMarketReturn} color="var(--accent-green)" />
          <SliderInput label="Bucket 3 Return %" value={state.buckets.b3Return}
            min={8} max={20} step={0.5} display={`${state.buckets.b3Return}%`}
            onChange={setB3Return} color="var(--accent-green)" />
          <SliderInput label="Inflation Step %" value={state.inflation.generalStep}
            min={5} max={30} step={1} display={`+${state.inflation.generalStep}%`}
            onChange={v => setState(s => ({ ...s, inflation: { ...s.inflation, generalStep: v } }))}
            color="var(--accent-orange)" />
        </Card>
      </div>

      {/* Year-by-year table (first 10 years) */}
      <Card>
        <SectionLabel>Year-by-Year Snapshot (First 15 Years)</SectionLabel>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                {['Year', 'Age', 'Monthly Expense', 'NPS Annuity', 'Bucket 1', 'Bucket 2', 'Bucket 3', 'Total'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {simData.slice(0, 15).map((row, i) => (
                <tr key={i} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  color: row.total === 0 ? 'var(--accent-red)' : 'var(--text-primary)'
                }}>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-muted)' }}>{row.year}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{row.age}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--accent-orange)' }}>{fmtINR(row.monthlyExpense)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--accent-green)' }}>{row.annuityIncome > 0 ? fmtINR(row.annuityIncome) : '—'}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--accent-cyan)' }}>{fmtINR(row.bucket1)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--accent-blue)' }}>{fmtINR(row.bucket2)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--accent-green)' }}>{fmtINR(row.bucket3)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{fmtINR(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MetricTile({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '14px 16px'
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
