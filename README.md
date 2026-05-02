# 🏦 RetireRight — Indian Retirement Planner

A comprehensive, India-specific retirement planning tool built for people who want to retire early and plan smart.

---

## 🔗 Quick Start

**Live Demo:** [megarajselvam.github.io/RetireRight](https://megarajselvam.github.io/RetireRight/) ✨

**Or run locally:**

```bash
git clone https://github.com/MegarajSelvam/RetireRight.git
cd RetireRight
npm install
npm run dev
```

Then open **[http://localhost:5173](http://localhost:5173)** in your browser. 🎉

---

## ✨ What It Does

RetireRight helps you answer the single most important question:

> **"If I retire today, how long will my money last?"**

It uses real Indian market data, realistic stepped inflation, NPS-aware planning, and a 3-bucket SWP strategy to give you an honest picture.

---

## 🧩 Features

### 👤 Personal Profile
- Current age + target retirement age
- Automatic NPS lock-in gap calculation (retirement → age 60)

### 💰 Portfolio Tracker
Track all your Indian savings instruments:
- **NPS** — locked till 60, 60% lump sum + 40% annuity at maturity
- **PF / EPF** — first withdrawal source (Bucket 1)
- **Market Investments** — combined Equity + Mutual Funds (Bucket 3)
- **Physical Gold** — optional SWP inclusion toggle
- **Gold ETF / Gold BeES** — liquid, goes to Bucket 2
- **SGB** — Sovereign Gold Bonds, 2.5% interest + gold upside (Bucket 2)

### 🧾 Expense Planner
Full Indian expense categories including:
- Parents maintenance
- Children's education (auto-drops after specified years)
- Medical with **separate higher inflation**
- Housing, Groceries, Transport, Insurance, Travel, Lifestyle, Utilities

### 📈 Realistic Stepped Inflation
Not a blind 6% compounding. Instead:
- Expenses stay stable for 2–3 years, then jump
- General: +15% every 3 years (default)
- Medical: +20% every 3 years (default, higher due to healthcare inflation)
- Both fully adjustable

### 🪣 3-Bucket Retirement Strategy
| Bucket | Default % | Purpose | Return |
|--------|-----------|---------|--------|
| Bucket 1 – Liquid/FD | 20% | Immediate withdrawals | ~6.5% |
| Bucket 2 – Debt/BAF | 30% | Mid-term buffer | ~9% |
| Bucket 3 – Equity | 50% | Long-term growth | ~13% |

Money flows: B1 → B2 → B3 (equity grows undisturbed for years)

### 📊 Summary Dashboard (Cockpit View)
- Sustainability years — big and clear
- Bucket depletion chart
- NPS injection at age 60
- Year-by-year table
- Live quick-edit sliders (change return %, inflation, see impact instantly)

---

## 💾 Data Storage
- **Auto-saves** to browser LocalStorage on every change
- **Export** as `.json` file — your data, your ownership
- **Import** on any device — full data restore in one click
- No login, no server, no tracking

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & Run
```bash
git clone https://github.com/YOUR_USERNAME/RetireRight.git
cd RetireRight
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for Production
```bash
npm run build
```

### Deploy to GitHub Pages
1. Update `vite.config.js` — set `base` to your repo name:
```js
base: '/RetireRight/'
```
2. Install gh-pages (already in devDependencies):
```bash
npm run deploy
```
3. In your GitHub repo → Settings → Pages → Source: `gh-pages` branch

---

## 📱 Device Support
- ✅ Desktop — Left sidebar navigation
- ✅ Tablet — Responsive layout
- ✅ Mobile — Bottom FAB navigation (5 icons)

---

## 🛠️ Tech Stack
- React 18
- Vite 5
- Recharts (charts)
- Pure CSS (no Tailwind dependency)
- Zero backend

---

## 📊 Assumptions & Defaults
| Parameter | Default | Reason |
|-----------|---------|--------|
| NPS return | 10% | Historical Tier-1 equity scheme avg |
| PF return | 8.15% | FY 2023-24 declared rate |
| Market return | 12% | Conservative Nifty 50 long-term CAGR |
| Gold appreciation | 8% | 10-year average |
| SGB total return | 10.5% | 8% gold + 2.5% interest |
| General inflation step | +15% every 3yr | Realistic Indian household pattern |
| Medical inflation step | +20% every 3yr | Healthcare inflation in India |
| NPS annuity rate | 6% | Conservative LIC annuity estimate |

*All defaults are editable within the tool.*

---

## ⚠️ Disclaimer
RetireRight is a **personal planning tool**, not financial advice. Returns are assumed constant — real markets are volatile. Always consult a SEBI-registered financial advisor before making retirement decisions.

---

## 🤝 Contributing
PRs welcome! Open an issue for bugs or feature requests.

---

*Built with ❤️ for Indian early retirement planners.*
