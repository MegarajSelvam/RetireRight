import { Card, SectionLabel, AmountInput, SliderInput, AssetRow, Toggle } from '../ui';
import { fmtINR } from '../../utils/formatters';
import { futureValue } from '../../utils/calculations';

export default function Portfolio({ state, setState }) {
  const { portfolio, profile } = state;
  const yearsToRetire = Math.max(0, profile.retirementAge - profile.currentAge);

  const setAsset = (asset, key, val) =>
    setState(s => ({ ...s, portfolio: { ...s.portfolio, [asset]: { ...s.portfolio[asset], [key]: val } } }));

  // Calculate total invested + projected for each asset
  const calcAssetProjection = (asset) => {
    const current = portfolio[asset].current || 0;
    const monthly = portfolio[asset].monthly || 0;
    const totalContributed = current + (monthly * yearsToRetire * 12);
    const projected = futureValue(current, monthly, portfolio[asset].returnRate, yearsToRetire);
    const gain = projected - totalContributed;
    return { totalContributed, projected, gain };
  };

  const proj = (asset) => {
    const { projected } = calcAssetProjection(asset);
    return fmtINR(projected);
  };

  const totalToday = Object.values(portfolio).reduce((s, a) => s + (a.current || 0), 0);
  const totalContributed = (() => {
    let sum = totalToday;
    Object.keys(portfolio).forEach(key => {
      const monthly = portfolio[key].monthly || 0;
      sum += monthly * yearsToRetire * 12;
    });
    return sum;
  })();
  
  const totalAtRetirement =
    futureValue(portfolio.nps.current, portfolio.nps.monthly, portfolio.nps.returnRate, yearsToRetire) +
    futureValue(portfolio.pf.current, portfolio.pf.monthly, portfolio.pf.returnRate, yearsToRetire) +
    futureValue(portfolio.market.current, portfolio.market.monthly, portfolio.market.returnRate, yearsToRetire) +
    futureValue(portfolio.physicalGold.current, 0, portfolio.physicalGold.returnRate, yearsToRetire) +
    futureValue(portfolio.goldETF.current, portfolio.goldETF.monthly, portfolio.goldETF.returnRate, yearsToRetire) +
    futureValue(portfolio.sgb.current, portfolio.sgb.monthly, portfolio.sgb.returnRate, yearsToRetire);

  const totalGain = totalAtRetirement - totalContributed;

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Portfolio Tracker</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        Enter your current savings and monthly contributions across all assets.
      </p>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: '16px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Total You'll Invest</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{fmtINR(totalContributed)}</div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>Current + {yearsToRetire}yr contributions</div>
        </div>
        <div className="card" style={{ padding: '16px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>At Retirement (Age {profile.retirementAge})</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>{fmtINR(totalAtRetirement)}</div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>After growth & returns</div>
        </div>
        <div className="card" style={{ padding: '16px 18px', textAlign: 'center', background: totalGain > 0 ? 'rgba(102,187,106,0.08)' : 'rgba(239,83,80,0.08)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Total Gain</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: totalGain > 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>{fmtINR(totalGain)}</div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>{totalContributed > 0 ? ((totalGain / totalContributed * 100).toFixed(1)) : 0}% returns</div>
        </div>
      </div>

         {/* PF */}
      <AssetRow icon="💼" label="PF / EPF" color="var(--accent-blue)">
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
          Goes to Bucket 1 (Liquid) at retirement · First to withdraw
        </div>
        <AmountInput label="Current Balance" value={portfolio.pf.current} onChange={v => setAsset('pf', 'current', v)} />
        <AmountInput label="Monthly Contribution (Employee + Employer)" value={portfolio.pf.monthly} max={100000} step={500} onChange={v => setAsset('pf', 'monthly', v)} />
        <SliderInput label="Expected Return" value={portfolio.pf.returnRate} min={6} max={10} step={0.05}
          display={`${portfolio.pf.returnRate}%`} onChange={v => setAsset('pf', 'returnRate', v)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12, fontSize: 11 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>You'll Invest</div>
            <div style={{ color: 'var(--accent-blue)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(calcAssetProjection('pf').totalContributed)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>At Retirement</div>
            <div style={{ color: 'var(--accent-blue)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{proj('pf')}</div>
          </div>
          <div style={{ background: 'rgba(102,187,106,0.08)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>Your Gain</div>
            <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(calcAssetProjection('pf').gain)}</div>
          </div>
        </div>
      </AssetRow>

      {/* Market */}
      <AssetRow icon="📈" label="Market Investments (Equity + Mutual Funds)" color="var(--accent-green)">
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
          Combined value of all stocks and MFs · Goes to Bucket 3 (Equity)
        </div>
        <AmountInput label="Current Value" value={portfolio.market.current} onChange={v => setAsset('market', 'current', v)} />
        <AmountInput label="Monthly SIP" value={portfolio.market.monthly} max={500000} step={1000} onChange={v => setAsset('market', 'monthly', v)} />
        <SliderInput label="Expected Blended Return" value={portfolio.market.returnRate} min={8} max={18} step={0.5}
          display={`${portfolio.market.returnRate}%`} onChange={v => setAsset('market', 'returnRate', v)} color="var(--accent-green)" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12, fontSize: 11 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>You'll Invest</div>
            <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(calcAssetProjection('market').totalContributed)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>At Retirement</div>
            <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{proj('market')}</div>
          </div>
          <div style={{ background: 'rgba(102,187,106,0.08)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>Your Gain</div>
            <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(calcAssetProjection('market').gain)}</div>
          </div>
        </div>
      </AssetRow>

      {/* NPS */}
      <AssetRow icon="🏛️" label="NPS — National Pension System" color="var(--accent-orange)">
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
          Locked till age 60 · 60% lump sum + 40% annuity at maturity
        </div>
        <AmountInput label="Current Value" value={portfolio.nps.current} onChange={v => setAsset('nps', 'current', v)} />
        <AmountInput label="Monthly Contribution" value={portfolio.nps.monthly} max={100000} step={500} onChange={v => setAsset('nps', 'monthly', v)} />
        <SliderInput label="Expected Return" value={portfolio.nps.returnRate} min={6} max={14} step={0.5}
          display={`${portfolio.nps.returnRate}%`} onChange={v => setAsset('nps', 'returnRate', v)} color="var(--accent-orange)" />
        <SliderInput label="Annuity Rate (at 60)" value={portfolio.nps.annuityRate} min={4} max={9} step={0.25}
          display={`${portfolio.nps.annuityRate}%`} onChange={v => setAsset('nps', 'annuityRate', v)} color="var(--accent-orange)" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12, fontSize: 11 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>You'll Invest</div>
            <div style={{ color: 'var(--accent-orange)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(calcAssetProjection('nps').totalContributed)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>At Retirement</div>
            <div style={{ color: 'var(--accent-orange)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{proj('nps')}</div>
          </div>
          <div style={{ background: 'rgba(102,187,106,0.08)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>Your Gain</div>
            <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(calcAssetProjection('nps').gain)}</div>
          </div>
        </div>
      </AssetRow>

      {/* Physical Gold */}
      <AssetRow icon="🪙" label="Physical Gold (Jewellery / Coins / Bars)" color="var(--accent-orange)">
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
          Family / generational asset · Optional SWP inclusion
        </div>
        <AmountInput label="Current Value" value={portfolio.physicalGold.current} onChange={v => setAsset('physicalGold', 'current', v)} />
        <SliderInput label="Expected Appreciation" value={portfolio.physicalGold.returnRate} min={4} max={14} step={0.5}
          display={`${portfolio.physicalGold.returnRate}%`} onChange={v => setAsset('physicalGold', 'returnRate', v)} color="var(--accent-orange)" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12, fontSize: 11 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>You'll Invest</div>
            <div style={{ color: 'var(--accent-orange)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(calcAssetProjection('physicalGold').totalContributed)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>At Retirement</div>
            <div style={{ color: 'var(--accent-orange)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{proj('physicalGold')}</div>
          </div>
          <div style={{ background: 'rgba(102,187,106,0.08)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>Your Gain</div>
            <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(calcAssetProjection('physicalGold').gain)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>Include in SWP?</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {portfolio.physicalGold.includeSWP ? '→ Goes to Bucket 3 (Equity)' : '→ Tracked only, not touched'}
            </div>
          </div>
          <Toggle value={portfolio.physicalGold.includeSWP}
            onChange={v => setAsset('physicalGold', 'includeSWP', v)} />
        </div>
      </AssetRow>

      {/* Gold ETF */}
      <AssetRow icon="📊" label="Gold ETF / Gold BeES" color="#FFD700">
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
          Liquid, exchange-traded · Goes to Bucket 2 (Debt/BAF)
        </div>
        <AmountInput label="Current Value" value={portfolio.goldETF.current} onChange={v => setAsset('goldETF', 'current', v)} />
        <AmountInput label="Monthly Investment" value={portfolio.goldETF.monthly} max={100000} step={500} onChange={v => setAsset('goldETF', 'monthly', v)} />
        <SliderInput label="Expected Return" value={portfolio.goldETF.returnRate} min={4} max={14} step={0.5}
          display={`${portfolio.goldETF.returnRate}%`} onChange={v => setAsset('goldETF', 'returnRate', v)} color="#FFD700" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12, fontSize: 11 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>You'll Invest</div>
            <div style={{ color: '#FFD700', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(calcAssetProjection('goldETF').totalContributed)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>At Retirement</div>
            <div style={{ color: '#FFD700', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{proj('goldETF')}</div>
          </div>
          <div style={{ background: 'rgba(102,187,106,0.08)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>Your Gain</div>
            <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(calcAssetProjection('goldETF').gain)}</div>
          </div>
        </div>
      </AssetRow>

      {/* SGB */}
      <AssetRow icon="🏅" label="SGB — Sovereign Gold Bonds" color="#FFC107">
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
          2.5% fixed interest + gold appreciation + tax-free at maturity · Bucket 2
        </div>
        <AmountInput label="Current Value" value={portfolio.sgb.current} onChange={v => setAsset('sgb', 'current', v)} />
        <AmountInput label="Monthly Investment" value={portfolio.sgb.monthly} max={100000} step={500} onChange={v => setAsset('sgb', 'monthly', v)} />
        <SliderInput label="Expected Return (default 10.5%)" value={portfolio.sgb.returnRate} min={6} max={16} step={0.5}
          display={`${portfolio.sgb.returnRate}%`} onChange={v => setAsset('sgb', 'returnRate', v)} color="#FFC107" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12, fontSize: 11 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>You'll Invest</div>
            <div style={{ color: '#FFC107', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(calcAssetProjection('sgb').totalContributed)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>At Retirement</div>
            <div style={{ color: '#FFC107', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{proj('sgb')}</div>
          </div>
          <div style={{ background: 'rgba(102,187,106,0.08)', padding: '8px 10px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 4 }}>Your Gain</div>
            <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(calcAssetProjection('sgb').gain)}</div>
          </div>
        </div>
      </AssetRow>
    </div>
  );
}
