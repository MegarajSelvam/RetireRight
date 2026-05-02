import { Card, SectionLabel, SliderInput } from '../ui';
import { fmtINR } from '../../utils/formatters';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const BUCKET_COLORS = ['var(--accent-cyan)', 'var(--accent-blue)', 'var(--accent-green)'];

// ─────────────────────────────────────────────
// Tooltip (safe rendering)
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload || {};

  return (
    <div style={{
      background: '#0a1628',
      border: '1px solid rgba(100,181,246,0.2)',
      borderRadius: 8,
      padding: '10px 14px',
      fontFamily: 'var(--font-mono)',
      fontSize: 12
    }}>
      <div style={{ color: 'var(--accent-blue)', marginBottom: 6 }}>
        Year {label} (Age {row.age})
      </div>

      {payload.map((p, i) => p.value > 0 && (
        <div key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: {fmtINR(p.value)}
        </div>
      ))}

      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.1)',
        marginTop: 6,
        paddingTop: 6,
        color: 'var(--text-secondary)'
      }}>
        Expense: {fmtINR(row.monthlyExpense || 0)}/mo
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Component
export default function Summary({ state, setState, results }) {
  if (!results) return null;

  const {
    sustainedYears,
    simData,
    swpCorpus,
    totalCorpusWithNPS,
    baseMonthlyExpense,
    totalB1,
    totalB2,
    totalB3,
    npsAtRetirement,
    npsLumpsum,
    npsMonthlyAnnuity,
    yearsToRetirement,
    hasNPSInHorizon
  } = results;

  const { profile } = state;

  const isHealthy = sustainedYears >= 25;

  // ── Quick-edit handlers ─────────────────────
  const setMarketReturn = (v) =>
    setState(s => ({
      ...s,
      portfolio: {
        ...s.portfolio,
        market: { ...s.portfolio.market, returnRate: v }
      }
    }));

  const setB3Return = (v) =>
    setState(s => ({
      ...s,
      buckets: { ...s.buckets, b3Return: v }
    }));

  // ── Pie data (use current totals safely) ─────
  const pieData = [
    { name: 'Bucket 1 – Liquid', value: Math.max(0, Math.round(totalB1)) },
    { name: 'Bucket 2 – Debt', value: Math.max(0, Math.round(totalB2)) },
    { name: 'Bucket 3 – Equity', value: Math.max(0, Math.round(totalB3)) },
  ];

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
        Retirement Summary
      </h2>

      {/* HERO */}
      <div style={{
        background: isHealthy ? 'rgba(102,187,106,0.06)' : 'rgba(239,83,80,0.06)',
        border: `1px solid ${isHealthy ? 'rgba(102,187,106,0.25)' : 'rgba(239,83,80,0.25)'}`,
        borderRadius: 'var(--radius)',
        padding: '24px',
        marginBottom: 20,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2.5, color: 'var(--text-muted)' }}>
          EXPECTED RUNOUT AGE
        </div>

        <div style={{
          fontSize: 64,
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          color: isHealthy ? 'var(--accent-green)' : 'var(--accent-red)'
        }}>
          {profile.retirementAge + sustainedYears}
        </div>

        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Corpus lasts {sustainedYears} years
        </div>
      </div>

      {/* KEY METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
        <MetricTile label="SWP Corpus" value={fmtINR(swpCorpus)} />
        <MetricTile label="Total Incl NPS" value={fmtINR(totalCorpusWithNPS)} />
        <MetricTile label="Monthly Expense" value={fmtINR(baseMonthlyExpense)} />
        <MetricTile label="Years to Retirement" value={`${yearsToRetirement}`} />
      </div>

      {/* NPS */}
      {hasNPSInHorizon && (
        <Card style={{ marginBottom: 20 }}>
          <SectionLabel>NPS at 60</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <MetricTile label="At Retirement" value={fmtINR(npsAtRetirement)} />
            <MetricTile label="Lump Sum" value={fmtINR(npsLumpsum)} sub="40% B1 / 30% B2 / 30% B3" />
            <MetricTile label="Monthly Pension" value={fmtINR(npsMonthlyAnnuity)} />
          </div>
        </Card>
      )}

      {/* TABLE */}
      <Card>
        <SectionLabel>Year-by-Year Simulation</SectionLabel>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 10 }}>
            <thead>
              <tr>
                <th>Year</th>
                <th>Age</th>
                <th>Withdrawal</th>
                <th>B1</th>
                <th>B1 Ret</th>
                <th>B2</th>
                <th>B2 Ret</th>
                <th>B3</th>
                <th>B3 Ret</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {simData.map((row, i) => {
                const total = row.bucket1 + row.bucket2 + row.bucket3;
                const isDead = total <= 0;

                return (
                  <tr key={i} style={{
                    color: isDead ? 'var(--accent-red)' : 'var(--text-primary)'
                  }}>
                    <td>{row.year}</td>
                    <td>{row.age}</td>
                    <td>{fmtINR(row.withdrawal)}</td>
                    <td>{fmtINR(row.bucket1)}</td>
                    <td>+{fmtINR(row.b1Returns)}</td>
                    <td>{fmtINR(row.bucket2)}</td>
                    <td>+{fmtINR(row.b2Returns)}</td>
                    <td>{fmtINR(row.bucket3)}</td>
                    <td>+{fmtINR(row.b3Returns)}</td>
                    <td>{fmtINR(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
function MetricTile({ label, value, sub }) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 12
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 10 }}>{sub}</div>}
    </div>
  );
}