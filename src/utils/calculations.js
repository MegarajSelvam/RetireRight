// Utility: prevent NaN/undefined from corrupting calculations
/**
 * @param {number} v
 * @returns {number}
 */
const safe = (v) => (isNaN(v) || v == null ? 0 : v);

// ───────────────────────────────────────────────────────────────
// Project future value with monthly contributions (compounding)
// pv: present value, pmt: monthly contribution, annualRate: %, years: duration
export const futureValue = (pv, pmt, annualRate, years) => {
  pv = safe(pv);
  pmt = safe(pmt);
  annualRate = safe(annualRate);
  years = safe(years);

  if (years <= 0) return pv;

  const r = annualRate / 100 / 12; // monthly rate
  const n = years * 12;

  if (r === 0) return pv + pmt * n;

  return (
    pv * Math.pow(1 + r, n) +
    pmt * ((Math.pow(1 + r, n) - 1) / r)
  );
};

// ───────────────────────────────────────────────────────────────
// Inflation multiplier with step increases (e.g. 5% every 3 years)
export const steppedMultiplier = (year, stepPct, freqYears) => {
  stepPct = safe(stepPct);
  freqYears = safe(freqYears);

  if (freqYears <= 0) return 1;

  const periods = Math.floor(year / freqYears);
  return Math.pow(1 + stepPct / 100, periods);
};

// ───────────────────────────────────────────────────────────────
// Main simulation engine
export const runSimulation = (state) => {
  const { profile, portfolio, expenses, inflation, buckets } = state;

  // Validate bucket allocation (must sum to 100%)
  const totalPct = safe(buckets.b1Pct) + safe(buckets.b2Pct) + safe(buckets.b3Pct);
  if (Math.round(totalPct) !== 100) {
    throw new Error("Bucket allocation must sum to 100%");
  }

  const yearsToRetirement = Math.max(0, profile.retirementAge - profile.currentAge);
  const npsGapYears = Math.max(0, 60 - profile.retirementAge);
  const hasNPSInHorizon = profile.retirementAge < 60;

  // ── Project assets to retirement ──────────────────────────────
  const npsAtRetirement = futureValue(
    portfolio.nps.current, portfolio.nps.monthly,
    portfolio.nps.returnRate, yearsToRetirement
  );

  const pfAtRetirement = futureValue(
    portfolio.pf.current, portfolio.pf.monthly,
    portfolio.pf.returnRate, yearsToRetirement
  );

  const marketAtRetirement = futureValue(
    portfolio.market.current, portfolio.market.monthly,
    portfolio.market.returnRate, yearsToRetirement
  );

  const physGoldAtRetirement = futureValue(
    portfolio.physicalGold.current, 0,
    portfolio.physicalGold.returnRate, yearsToRetirement
  );

  const goldETFAtRetirement = futureValue(
    portfolio.goldETF.current, portfolio.goldETF.monthly,
    portfolio.goldETF.returnRate, yearsToRetirement
  );

  const sgbAtRetirement = futureValue(
    portfolio.sgb.current, portfolio.sgb.monthly,
    portfolio.sgb.returnRate, yearsToRetirement
  );

  // ── NPS projection to age 60 ──────────────────────────────────
  const npsAtSixty = futureValue(npsAtRetirement, 0, portfolio.nps.returnRate, npsGapYears);

  const npsLumpsum = npsAtSixty * 0.6;
  const npsAnnualAnnuity = npsAtSixty * 0.4 * (portfolio.nps.annuityRate / 100);
  const npsMonthlyAnnuity = npsAnnualAnnuity / 12;

  // ── SWP corpus (exclude locked NPS) ───────────────────────────
  const physGoldSWP = portfolio.physicalGold.includeSWP ? physGoldAtRetirement : 0;

  const naturalB1 = pfAtRetirement;
  const naturalB2 = goldETFAtRetirement + sgbAtRetirement;
  const naturalB3 = marketAtRetirement + physGoldSWP;

  const swpCorpus = naturalB1 + naturalB2 + naturalB3;

  // Apply bucket allocation
  let b1 = swpCorpus * (buckets.b1Pct / 100);
  let b2 = swpCorpus * (buckets.b2Pct / 100);
  let b3 = swpCorpus * (buckets.b3Pct / 100);

  // ── Base expense (today) ──────────────────────────────────────
  const eduMonthly = safe(expenses.education?.amount);

  const baseMonthlyExpense =
    safe(expenses.housing) +
    safe(expenses.groceries) +
    eduMonthly +
    safe(expenses.parents) +
    safe(expenses.medical) +
    safe(expenses.utilities) +
    safe(expenses.transport) +
    safe(expenses.insurance) +
    safe(expenses.travel) / 12 +
    safe(expenses.lifestyle) +
    safe(expenses.misc);

  // ── Simulation loop ───────────────────────────────────────────
  let npsInjected = false;
  let sustainedYears = 0;
  const simData = [];

  for (let yr = 0; yr <= 60; yr++) {
    const age = profile.retirementAge + yr;

    // Inflation multipliers
    const genMult = steppedMultiplier(yr, inflation.generalStep, inflation.generalFreq);
    const medMult = steppedMultiplier(yr, inflation.medicalStep, inflation.medicalFreq);

    // Housing inflation (clean separation: fixed vs %)
    let housingMonthly;
    if (inflation.housingType === 'fixed') {
      housingMonthly = safe(expenses.housing) + safe(inflation.housingAnnual) * yr;
    } else {
      housingMonthly = safe(expenses.housing) *
        Math.pow(1 + safe(inflation.housingAnnual) / 100, yr);
    }

    const eduActive = yr < safe(expenses.education?.years);

    const otherMonthly =
      (safe(expenses.groceries) +
        (eduActive ? eduMonthly : 0) +
        safe(expenses.parents) +
        safe(expenses.utilities) +
        safe(expenses.transport) +
        safe(expenses.insurance) +
        safe(expenses.travel) / 12 +
        safe(expenses.lifestyle) +
        safe(expenses.misc)) * genMult;

    const medMonthly = safe(expenses.medical) * medMult;

    const totalMonthlyExpense = housingMonthly + otherMonthly + medMonthly;
    const totalYearlyExpense = totalMonthlyExpense * 12;

    // Reduce expense by annuity income (post 60)
    const annuityIncome = (age >= 60 && hasNPSInHorizon)
      ? npsAnnualAnnuity
      : 0;

    let withdrawal = Math.max(0, totalYearlyExpense - annuityIncome);

    // ── Step 1: Apply returns ───────────────────────────────────
    const b1Returns = b1 * (buckets.b1Return / 100);
    const b2Returns = b2 * (buckets.b2Return / 100);
    const b3Returns = b3 * (buckets.b3Return / 100);

    b1 += b1Returns;
    b2 += b2Returns;
    b3 += b3Returns;

    // ── Step 2: NPS injection at 60 ─────────────────────────────
    let npsInjectionThisYear = false;
    if (age >= 60 && hasNPSInHorizon && !npsInjected) {
      b1 += npsLumpsum * 0.4;
      b2 += npsLumpsum * 0.3;
      b3 += npsLumpsum * 0.3;
      npsInjected = true;
      npsInjectionThisYear = true;
    }

    // ── Step 3: Withdrawal cascade (B1 → B2 → B3) ───────────────
    const takeFrom = (bucket, amount) => {
      const used = Math.min(bucket, amount);
      return [bucket - used, amount - used];
    };

    [b1, withdrawal] = takeFrom(b1, withdrawal);
    [b2, withdrawal] = takeFrom(b2, withdrawal);
    [b3, withdrawal] = takeFrom(b3, withdrawal);

    // No negative buckets allowed
    b1 = Math.max(0, b1);
    b2 = Math.max(0, b2);
    b3 = Math.max(0, b3);

    const totalCorpus = b1 + b2 + b3;

    // Track survival correctly
    if (totalCorpus > 0) sustainedYears = yr;

    // ── Record year snapshot ────────────────────────────────────
    simData.push({
      year: yr,
      age,
      bucket1: Math.round(b1),
      bucket2: Math.round(b2),
      bucket3: Math.round(b3),
      total: Math.round(totalCorpus),
      withdrawal: Math.round(totalYearlyExpense),
      b1Returns: Math.round(b1Returns),
      b2Returns: Math.round(b2Returns),
      b3Returns: Math.round(b3Returns),
      totalReturns: Math.round(b1Returns + b2Returns + b3Returns),
      monthlyExpense: Math.round(totalMonthlyExpense),
      annuityIncome: Math.round(npsMonthlyAnnuity), // correct monthly display
      npsInjectionThisYear,
    });

    // Stop when corpus is exhausted
    if (totalCorpus <= 0) break;
  }

  // ── Today portfolio value ─────────────────────────────────────
  const todayTotal =
    safe(portfolio.nps.current) +
    safe(portfolio.pf.current) +
    safe(portfolio.market.current) +
    safe(portfolio.physicalGold.current) +
    safe(portfolio.goldETF.current) +
    safe(portfolio.sgb.current);

  return {
    npsAtRetirement,
    npsAtSixty,
    npsLumpsum,
    npsMonthlyAnnuity,
    pfAtRetirement,
    marketAtRetirement,
    physGoldAtRetirement,
    goldETFAtRetirement,
    sgbAtRetirement,
    swpCorpus,
    totalCorpusWithNPS: swpCorpus + npsAtRetirement,

    totalB1: b1,
    totalB2: b2,
    totalB3: b3,

    todayTotal,
    baseMonthlyExpense,

    sustainedYears,
    simData,

    yearsToRetirement,
    npsGapYears,
    hasNPSInHorizon,
    retirementAge: profile.retirementAge,
  };
};