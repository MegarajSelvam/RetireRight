import { Card, SectionLabel, AmountInput, SliderInput } from '../ui';
import { fmtINR } from '../../utils/formatters';
import { steppedMultiplier } from '../../utils/calculations';

const CATEGORIES = [
  { key: 'housing',   icon: '🏠', label: 'Housing (Rent / EMI)',       max: 200000 },
  { key: 'groceries', icon: '🛒', label: 'Groceries & Household',       max: 100000 },
  { key: 'parents',   icon: '👨‍👩‍👧', label: 'Parents Maintenance',         max: 100000 },
  { key: 'utilities', icon: '⚡', label: 'Utilities (Electricity, Net, Phone)', max: 30000 },
  { key: 'transport', icon: '🚗', label: 'Transport & Fuel',            max: 50000 },
  { key: 'insurance', icon: '🛡️', label: 'Insurance Premiums',          max: 50000 },
  { key: 'lifestyle', icon: '🎭', label: 'Lifestyle & Entertainment',   max: 100000 },
  { key: 'misc',      icon: '🔧', label: 'Miscellaneous',               max: 50000 },
];

export default function Expenses({ state, setState }) {
  const { expenses, inflation } = state;

  const setExp = (key, val) =>
    setState(s => ({ ...s, expenses: { ...s.expenses, [key]: val } }));

  const setInfl = (key, val) =>
    setState(s => ({ ...s, inflation: { ...s.inflation, [key]: val } }));

  const medMonthly = expenses.medical;
  const nonMedTotal = CATEGORIES.reduce((s, c) => s + (expenses[c.key] || 0), 0) +
    expenses.education.amount + (expenses.travel / 12);
  const totalMonthly = nonMedTotal + medMonthly;

  // What will expenses look like in year 5, 10, 15
  const project = (yr) => {
    const gm = steppedMultiplier(yr, inflation.generalStep, inflation.generalFreq);
    const mm = steppedMultiplier(yr, inflation.medicalStep, inflation.medicalFreq);
    const edu = yr < expenses.education.years ? expenses.education.amount : 0;
    const nonMed = (CATEGORIES.reduce((s, c) => s + (expenses[c.key] || 0), 0) +
      edu + (expenses.travel / 12)) * gm;
    return nonMed + medMonthly * mm;
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Monthly Expenses</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        Enter your current monthly expenses. We'll apply realistic stepped inflation going forward.
      </p>

      {/* Total */}
      <Card style={{ marginBottom: 20, background: 'rgba(100,181,246,0.05)', borderColor: 'rgba(100,181,246,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>TOTAL MONTHLY EXPENSE TODAY</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{fmtINR(totalMonthly)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Yearly</div>
            <div style={{ fontSize: 16, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{fmtINR(totalMonthly * 12)}</div>
          </div>
        </div>
      </Card>

      {/* Standard categories */}
      <Card>
        <SectionLabel>Regular Monthly Expenses</SectionLabel>
        {CATEGORIES.map(cat => (
          <AmountInput key={cat.key} label={`${cat.icon} ${cat.label}`}
            value={expenses[cat.key]} max={cat.max} step={500}
            onChange={v => setExp(cat.key, v)} />
        ))}
      </Card>

      {/* Education — time-bound */}
      <Card>
        <SectionLabel>🎓 Children's Education</SectionLabel>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          This expense will automatically drop to ₹0 after the specified years.
        </div>
        <AmountInput label="Monthly Education Expense" value={expenses.education.amount}
          max={100000} step={500} onChange={v => setExp('education', { ...expenses.education, amount: v })} />
        <SliderInput label="For how many more years?" value={expenses.education.years}
          min={0} max={25} step={1} display={`${expenses.education.years} yrs`}
          onChange={v => setExp('education', { ...expenses.education, years: v })}
          color="var(--accent-cyan)" />
      </Card>

      {/* Medical — separate inflation */}
      <Card style={{ borderColor: 'rgba(239,83,80,0.2)', background: 'rgba(239,83,80,0.03)' }}>
        <SectionLabel>🏥 Medical & Health</SectionLabel>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          Medical costs in India rise faster — we apply a separate higher inflation step here.
        </div>
        <AmountInput label="Monthly Medical Expense" value={expenses.medical}
          max={100000} step={500} color="var(--accent-red)" onChange={v => setExp('medical', v)} />
      </Card>

      {/* Travel — annual */}
      <Card>
        <SectionLabel>✈️ Travel & Vacation (Annual)</SectionLabel>
        <AmountInput label="Annual Travel Budget" value={expenses.travel}
          max={1000000} step={5000} onChange={v => setExp('travel', v)} />
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          = {fmtINR(expenses.travel / 12)} / month
        </div>
      </Card>

      {/* Inflation Model */}
      <Card>
        <SectionLabel>📈 Inflation Model (Stepped — Realistic)</SectionLabel>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
          Instead of a fixed annual %, we apply a step jump every few years —
          matching how Indian household expenses actually grow.
        </div>
        <SliderInput label="General Expense Step" value={inflation.generalStep}
          min={5} max={30} step={1} display={`+${inflation.generalStep}%`}
          onChange={v => setInfl('generalStep', v)} />
        <SliderInput label="Every (years)" value={inflation.generalFreq}
          min={2} max={6} step={1} display={`${inflation.generalFreq} yrs`}
          onChange={v => setInfl('generalFreq', v)} />
        <SliderInput label="Medical Expense Step" value={inflation.medicalStep}
          min={10} max={40} step={1} display={`+${inflation.medicalStep}%`}
          onChange={v => setInfl('medicalStep', v)} color="var(--accent-red)" />
        <SliderInput label="Medical — Every (years)" value={inflation.medicalFreq}
          min={2} max={6} step={1} display={`${inflation.medicalFreq} yrs`}
          onChange={v => setInfl('medicalFreq', v)} color="var(--accent-red)" />
      </Card>

      {/* Inflation projection */}
      <Card>
        <SectionLabel>Expense Projection</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[0, 5, 10, 15].map(yr => (
            <div key={yr} style={{
              background: 'rgba(255,255,255,0.02)', borderRadius: 8,
              border: '1px solid var(--border)', padding: '12px 14px', textAlign: 'center'
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                {yr === 0 ? 'Today' : `Year ${yr}`}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: yr === 0 ? 'var(--accent-blue)' : 'var(--accent-orange)', fontFamily: 'var(--font-mono)' }}>
                {fmtINR(project(yr))}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>/ month</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
