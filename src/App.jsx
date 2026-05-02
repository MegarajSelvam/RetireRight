import { useState, useEffect, useCallback, useRef } from 'react';
import Profile from './components/sections/Profile';
import Portfolio from './components/sections/Portfolio';
import Expenses from './components/sections/Expenses';
import BucketStrategy from './components/sections/BucketStrategy';
import Summary from './components/sections/Summary';
import { saveToStorage, loadFromStorage, exportJSON, importJSON } from './utils/storage';
import { runSimulation } from './utils/calculations';
import { DEFAULT_STATE } from './utils/defaults';
import { fmtINR } from './utils/formatters';

const STEPS = [
  { id: 'profile',   label: 'Profile',    icon: '👤', short: 'Profile' },
  { id: 'portfolio', label: 'Portfolio',  icon: '💰', short: 'Assets'  },
  { id: 'expenses',  label: 'Expenses',   icon: '🧾', short: 'Expenses'},
  { id: 'buckets',   label: 'Buckets',    icon: '🪣', short: 'Buckets' },
  { id: 'summary',   label: 'Summary',    icon: '📊', short: 'Summary' },
];

export default function App() {
  const [active, setActive]   = useState('profile');
  const [state, setStateRaw]  = useState(() => loadFromStorage() || DEFAULT_STATE);
  const [results, setResults] = useState(null);
  const [saved, setSaved]     = useState(false);
  const importRef             = useRef();

  // Auto-save to localStorage on every change
  const setState = useCallback((updater) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveToStorage(next);
      return next;
    });
  }, []);

  // Recalculate whenever state changes
  useEffect(() => {
    try {
      const r = runSimulation(state);
      setResults(r);
    } catch (e) {
      console.error('Simulation error', e);
    }
  }, [state]);

  const handleExport = () => {
    exportJSON(state);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await importJSON(file);
      setState(data);
      setActive('profile');
    } catch {
      alert('Could not read file. Please use a valid RetireRight export.');
    }
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('Reset all data to defaults? This cannot be undone.')) {
      setState(DEFAULT_STATE);
      setActive('profile');
    }
  };

  const currentIdx  = STEPS.findIndex(s => s.id === active);
  const isLastStep  = currentIdx === STEPS.length - 1;
  const sustainYrs  = results?.sustainedYears ?? 0;
  const health      = sustainYrs >= 25 ? 'green' : sustainYrs >= 15 ? 'orange' : 'red';
  const healthColor = health === 'green' ? 'var(--accent-green)' : health === 'orange' ? 'var(--accent-orange)' : 'var(--accent-red)';

  const renderSection = () => {
    const props = { state, setState, results };
    switch (active) {
      case 'profile':   return <Profile   {...props} />;
      case 'portfolio': return <Portfolio {...props} />;
      case 'expenses':  return <Expenses  {...props} />;
      case 'buckets':   return <BucketStrategy {...props} />;
      case 'summary':   return <Summary   {...props} />;
      default:          return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── Top Status Bar ─────────────────────────────────────── */}
      <header style={{
        height: 52,
        background: 'rgba(6,13,20,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🏦</span>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.5 }}>
            Retire<span style={{ color: 'var(--accent-blue)' }}>Right</span>
          </span>
          {state.profile.name && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
              · {state.profile.name}
            </span>
          )}
        </div>

        {/* Live metrics — hidden on very small screens */}
        {results && (
          <div style={{
            display: 'flex', gap: 16, alignItems: 'center',
            fontSize: 11, fontFamily: 'var(--font-mono)',
          }} className="header-metrics">
            <span style={{ color: 'var(--text-muted)' }}>
              Corpus: <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{fmtINR(results.swpCorpus)}</span>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              Sustains: <span style={{ color: healthColor, fontWeight: 600 }}>{sustainYrs} yrs</span>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              Expense: <span style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>{fmtINR(results.baseMonthlyExpense)}/mo</span>
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          <ActionBtn onClick={() => importRef.current.click()} title="Import">📂</ActionBtn>
          <ActionBtn onClick={handleExport} title={saved ? 'Saved!' : 'Export'} highlight={saved}>
            {saved ? '✅' : '💾'}
          </ActionBtn>
          <ActionBtn onClick={handleReset} title="Reset">🔄</ActionBtn>
        </div>
      </header>

      {/* ── Body (Sidebar + Content) ───────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar — desktop only */}
        <aside style={{
          width: 200,
          background: 'rgba(6,13,20,0.8)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 0',
          flexShrink: 0,
          overflowY: 'auto',
        }} className="sidebar">
          {STEPS.map((step, i) => {
            const isActive = active === step.id;
            const isDone   = i < currentIdx;
            return (
              <button key={step.id} onClick={() => setActive(step.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px',
                  background: isActive ? 'rgba(100,181,246,0.1)' : 'transparent',
                  borderLeft: `3px solid ${isActive ? 'var(--accent-blue)' : 'transparent'}`,
                  border: 'none',
                  borderBottom: '1px solid transparent',
                  color: isActive ? 'var(--text-primary)' : isDone ? 'var(--text-secondary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.15s',
                  fontFamily: 'var(--font-main)',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  borderLeft: `3px solid ${isActive ? 'var(--accent-blue)' : 'transparent'}`,
                }}>
                <span style={{ fontSize: 17 }}>{step.icon}</span>
                <span>{step.label}</span>
                {isDone && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent-green)' }}>✓</span>}
              </button>
            );
          })}

          {/* Sidebar bottom — sustain indicator */}
          {results && (
            <div style={{
              marginTop: 'auto', margin: '16px 12px 0',
              background: `${healthColor}15`,
              border: `1px solid ${healthColor}30`,
              borderRadius: 8, padding: '12px 14px', textAlign: 'center'
            }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, marginBottom: 4 }}>SUSTAINS</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: healthColor, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                {sustainYrs}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>years</div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 24px 120px',
        }}>
          {renderSection()}

          {/* Prev / Next navigation */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 32,
            borderTop: '1px solid var(--border)', paddingTop: 20
          }}>
            <button onClick={() => setActive(STEPS[Math.max(0, currentIdx - 1)].id)}
              disabled={currentIdx === 0}
              style={navBtnStyle(false, currentIdx === 0)}>
              ← {currentIdx > 0 ? STEPS[currentIdx - 1].label : 'Back'}
            </button>
            <button onClick={() => setActive(STEPS[Math.min(STEPS.length - 1, currentIdx + 1)].id)}
              disabled={isLastStep}
              style={navBtnStyle(true, isLastStep)}>
              {!isLastStep ? `${STEPS[currentIdx + 1].label} →` : 'Summary ✓'}
            </button>
          </div>
        </main>
      </div>

      {/* ── Bottom FAB Nav — mobile only ────────────────────────── */}
      <nav style={{
        display: 'none',
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: 64,
        background: 'rgba(6,13,20,0.97)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border)',
        zIndex: 200,
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0 4px',
      }} className="fab-nav">
        {STEPS.map(step => {
          const isActive = active === step.id;
          return (
            <button key={step.id} onClick={() => setActive(step.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, flex: 1, padding: '8px 4px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: isActive ? 'var(--accent-blue)' : 'var(--text-dim)',
                transition: 'color 0.15s',
              }}>
              <span style={{
                fontSize: 22,
                filter: isActive ? 'none' : 'grayscale(0.8) opacity(0.5)',
                transition: 'filter 0.15s',
              }}>{step.icon}</span>
              <span style={{ fontSize: 9, fontWeight: isActive ? 600 : 400, letterSpacing: 0.5 }}>
                {step.short}
              </span>
              {isActive && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-blue)' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .fab-nav { display: flex !important; }
          .header-metrics { display: none !important; }
          main { padding: 16px 16px 88px !important; }
        }
        @media (max-width: 480px) {
          header { padding: 0 12px !important; }
        }
      `}</style>
    </div>
  );
}

// Helper components
function ActionBtn({ onClick, title, children, highlight }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        background: highlight ? 'rgba(102,187,106,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${highlight ? 'rgba(102,187,106,0.3)' : 'var(--border)'}`,
        color: 'var(--text-secondary)', borderRadius: 6,
        padding: '4px 10px', cursor: 'pointer', fontSize: 14,
        transition: 'all 0.15s', fontFamily: 'var(--font-main)',
      }}>
      {children} <span style={{ fontSize: 10, display: title === 'Saved!' ? 'none' : '' }}>{title}</span>
    </button>
  );
}

function navBtnStyle(isPrimary, disabled) {
  return {
    padding: '10px 24px',
    background: disabled ? 'transparent' : isPrimary ? 'rgba(21,101,192,0.3)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${disabled ? 'var(--border)' : isPrimary ? 'rgba(100,181,246,0.4)' : 'var(--border)'}`,
    color: disabled ? 'var(--text-dim)' : isPrimary ? 'var(--accent-blue)' : 'var(--text-secondary)',
    borderRadius: 8, cursor: disabled ? 'default' : 'pointer',
    fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-main)',
    transition: 'all 0.15s',
  };
}
