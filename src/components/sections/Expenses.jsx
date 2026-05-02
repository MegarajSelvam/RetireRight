import { Card, SectionLabel, AmountInput, SliderInput } from '../ui';
import { fmtINR } from '../../utils/formatters';
import { steppedMultiplier } from '../../utils/calculations';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

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

  // Calculate housing multiplier for a given year
  const getHousingMultiplier = (yr) => {
    if (inflation.housingType === 'fixed') {
      return 1 + (inflation.housingAnnual / expenses.housing) * yr;
    } else {
      return Math.pow(1 + inflation.housingAnnual / 100, yr);
    }
  };

  // What will expenses look like in year 5, 10, 15
  const project = (yr) => {
    const gm = steppedMultiplier(yr, inflation.generalStep, inflation.generalFreq);
    const mm = steppedMultiplier(yr, inflation.medicalStep, inflation.medicalFreq);
    const hm = getHousingMultiplier(yr);
    const edu = yr < expenses.education.years ? expenses.education.amount : 0;
    const housing = expenses.housing * hm;
    const otherNonMed = (CATEGORIES.filter(c => c.key !== 'housing').reduce((s, c) => s + (expenses[c.key] || 0), 0) +
      edu + (expenses.travel / 12)) * gm;
    return housing + otherNonMed + medMonthly * mm;
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Monthly Expenses</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        Enter your current monthly expenses. We'll apply realistic stepped inflation going forward.
      </p>
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
        {expenses.education.amount > 0 && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(100,181,246,0.08)', borderRadius: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            Education will stop being charged after {expenses.education.years} years.
          </div>
        )}
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

      {/* Housing — separate inflation */}
      <Card style={{ borderColor: 'rgba(26,198,204,0.2)', background: 'rgba(26,198,204,0.03)' }}>
        <SectionLabel>🏠 Housing Rent / EMI Adjustment</SectionLabel>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          Housing costs typically increase annually on a fixed or percentage basis, separate from general inflation.
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Increase Type</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setInfl('housingType', 'fixed')}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 6,
                background: inflation.housingType === 'fixed' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${inflation.housingType === 'fixed' ? 'var(--accent-cyan)' : 'var(--border)'}`,
                color: inflation.housingType === 'fixed' ? '#000' : 'var(--text-primary)',
                cursor: 'pointer', fontWeight: 500, fontSize: 12
              }}>
              Fixed ₹/Year
            </button>
            <button onClick={() => setInfl('housingType', 'percentage')}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 6,
                background: inflation.housingType === 'percentage' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${inflation.housingType === 'percentage' ? 'var(--accent-cyan)' : 'var(--border)'}`,
                color: inflation.housingType === 'percentage' ? '#000' : 'var(--text-primary)',
                cursor: 'pointer', fontWeight: 500, fontSize: 12
              }}>
              % / Year
            </button>
          </div>
        </div>

        {inflation.housingType === 'fixed' ? (
          <SliderInput label="Annual Fixed Increase" value={inflation.housingAnnual}
            min={100} max={5000} step={100} display={`₹${inflation.housingAnnual}/yr`}
            onChange={v => setInfl('housingAnnual', v)} color="var(--accent-cyan)" />
        ) : (
          <SliderInput label="Annual Percentage Increase" value={inflation.housingAnnual}
            min={1} max={15} step={0.5} display={`${inflation.housingAnnual}%/yr`}
            onChange={v => setInfl('housingAnnual', v)} color="var(--accent-cyan)" />
        )}

        <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(26,198,204,0.1)', borderRadius: 6, fontSize: 10, color: 'var(--text-muted)' }}>
          Current housing: {fmtINR(expenses.housing)}/month
          {inflation.housingType === 'fixed' 
            ? ` → Year 5: ${fmtINR(expenses.housing + (inflation.housingAnnual * 5))}/month`
            : ` → Year 5: ${fmtINR(expenses.housing * Math.pow(1 + inflation.housingAnnual / 100, 5))}/month`
          }
        </div>
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
        <SectionLabel>Expense Growth Over Time</SectionLabel>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
          See how general and medical costs grow separately with stepped inflation.
        </p>
        
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={[0, 5, 10, 15, 20].map(yr => {
            const gm = steppedMultiplier(yr, inflation.generalStep, inflation.generalFreq);
            const mm = steppedMultiplier(yr, inflation.medicalStep, inflation.medicalFreq);
            const hm = getHousingMultiplier(yr);
            const edu = yr < expenses.education.years ? expenses.education.amount : 0;
            const housing = expenses.housing * hm;
            const otherNonMed = (CATEGORIES.filter(c => c.key !== 'housing').reduce((s, c) => s + (expenses[c.key] || 0), 0) + edu + (expenses.travel / 12)) * gm;
            const med = medMonthly * mm;
            return {
              year: yr === 0 ? 'Today' : `Yr ${yr}`,
              'Housing': Math.round(housing),
              'Other Expenses': Math.round(otherNonMed),
              'Medical': Math.round(med),
              total: Math.round(housing + otherNonMed + med)
            };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,181,246,0.1)" />
            <XAxis dataKey="year" stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip 
              contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6 }}
              formatter={(v) => fmtINR(v)}
              labelStyle={{ color: 'var(--text-primary)' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
            <Bar dataKey="Housing" fill="var(--accent-cyan)" stackId="a" />
            <Bar dataKey="Other Expenses" fill="var(--accent-blue)" stackId="a" />
            <Bar dataKey="Medical" fill="var(--accent-red)" stackId="a" />
          </BarChart>
        </ResponsiveContainer>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 16 }}>
          {[0, 5, 10, 15, 20].map(yr => {
            const gm = steppedMultiplier(yr, inflation.generalStep, inflation.generalFreq);
            const mm = steppedMultiplier(yr, inflation.medicalStep, inflation.medicalFreq);
            const hm = getHousingMultiplier(yr);
            const edu = yr < expenses.education.years ? expenses.education.amount : 0;
            const housing = expenses.housing * hm;
            const otherNonMed = (CATEGORIES.filter(c => c.key !== 'housing').reduce((s, c) => s + (expenses[c.key] || 0), 0) + edu + (expenses.travel / 12)) * gm;
            const med = medMonthly * mm;
            const total = housing + otherNonMed + med;
            return (
              <div key={yr} style={{
                background: 'rgba(255,255,255,0.02)', borderRadius: 8,
                border: '1px solid var(--border)', padding: '10px 12px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
                  {yr === 0 ? 'Today' : `Year ${yr}`}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                  {fmtINR(housing)}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 4, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                  Housing
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                  {fmtINR(otherNonMed)}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 4, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                  Other Exp
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                  {fmtINR(med)}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                  Medical
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Expense breakdown by category */}
      <Card style={{ marginBottom: 20 }}>
        <SectionLabel>Where Your Money Goes</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center' }}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={CATEGORIES
                  .map(c => ({ name: c.label.split('(')[0].trim(), value: expenses[c.key], icon: c.icon }))
                  .filter(c => c.value > 0)
                  .sort((a, b) => b.value - a.value)}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
                paddingAngle={2}
              >
                {['var(--accent-cyan)', 'var(--accent-blue)', 'var(--accent-green)', 'var(--accent-orange)', 'var(--accent-purple)', '#FF6B6B', '#4ECDC4', '#95E1D3'].map((color, i) => (
                  <Cell key={i} fill={color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => fmtINR(v)} />
            </PieChart>
          </ResponsiveContainer>

          <div style={{ fontSize: 11 }}>
            {CATEGORIES
              .map(c => ({ ...c, val: expenses[c.key] }))
              .filter(c => c.val > 0)
              .sort((a, b) => b.val - a.val)
              .map((cat, i) => (
                <div key={cat.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <span>{cat.icon} {cat.label}</span>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(cat.val)}</span>
                </div>
              ))}
            {expenses.education.amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span>🎓 Education</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(expenses.education.amount)}</span>
              </div>
            )}
            {expenses.travel / 12 > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>✈️ Travel (Monthly)</span>
                <span style={{ color: 'var(--accent-orange)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(expenses.travel / 12)}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

       {/* Total */}
      <Card style={{ marginBottom: 20, background: 'rgba(100,181,246,0.05)', borderColor: 'rgba(100,181,246,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>TOTAL MONTHLY EXPENSE TODAY</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{fmtINR(totalMonthly)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Yearly</div>
            <div style={{ fontSize: 16, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{fmtINR(totalMonthly * 12)}</div>
          </div>
        </div>

        {/* Medical vs Non-Medical split */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ background: 'rgba(100,181,246,0.1)', padding: '10px 12px', borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Non-Medical</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{fmtINR(nonMedTotal)}</div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>{((nonMedTotal / totalMonthly) * 100).toFixed(0)}% of total</div>
          </div>
          <div style={{ background: 'rgba(239,83,80,0.1)', padding: '10px 12px', borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Medical & Health</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>{fmtINR(medMonthly)}</div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>{((medMonthly / totalMonthly) * 100).toFixed(0)}% of total</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
