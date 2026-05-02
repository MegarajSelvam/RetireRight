import { Card, SectionLabel, SliderInput } from '../ui';

export default function Profile({ state, setState }) {
  const { profile } = state;
  const yearsToRetirement = Math.max(0, profile.retirementAge - profile.currentAge);
  const npsGap = Math.max(0, 60 - profile.retirementAge);

  const set = (key, val) => setState(s => ({ ...s, profile: { ...s.profile, [key]: val } }));

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Personal Profile</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        Your basics help us calculate NPS lock-in and retirement timeline.
      </p>

      <Card>
        <SectionLabel>Your Details</SectionLabel>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Your Name</label>
          <input type="text" placeholder="e.g. Megaraj" value={profile.name}
            onChange={e => set('name', e.target.value)} />
        </div>
        <SliderInput label="Current Age" value={profile.currentAge} min={22} max={65} step={1}
          display={`${profile.currentAge} yrs`} onChange={v => set('currentAge', v)} />
        <SliderInput label="Target Retirement Age" value={profile.retirementAge}
          min={Math.max(profile.currentAge + 1, 30)} max={70} step={1}
          display={`${profile.retirementAge} yrs`} onChange={v => set('retirementAge', v)}
          color="var(--accent-cyan)" />
      </Card>

      {/* Summary strips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <StatBox label="Years to Retire" value={yearsToRetirement} unit="yrs" color="var(--accent-green)" />
        <StatBox label="NPS Lock-in Gap" value={npsGap} unit="yrs" color={npsGap > 0 ? 'var(--accent-orange)' : 'var(--text-muted)'}
          note={npsGap > 0 ? `NPS unlocks at 60` : 'Retiring after 60'} />
        <StatBox label="Retire at Age" value={profile.retirementAge} unit="" color="var(--accent-blue)" />
      </div>

      {npsGap > 0 && (
        <Card style={{ marginTop: 12, borderColor: 'rgba(255, 167, 38, 0.25)', background: 'rgba(255,167,38,0.04)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-orange)', marginBottom: 4 }}>NPS Strategy Note</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                You're retiring {npsGap} years before NPS unlocks at 60. Your NPS corpus will continue growing
                at {state.portfolio.nps.returnRate}% till age 60 and then inject into Bucket 3 automatically.
                Plan your non-NPS corpus to sustain these {npsGap} years.
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatBox({ label, value, unit, color, note }) {
  return (
    <div className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}<span style={{ fontSize: 13, fontWeight: 400 }}> {unit}</span></div>
      {note && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{note}</div>}
    </div>
  );
}
