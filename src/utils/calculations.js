// Project future value with monthly contributions
export const futureValue = (pv, pmt, annualRate, years) => {
  if (years <= 0) return pv;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return pv + pmt * n;
  return pv * Math.pow(1 + r, n) + pmt * ((Math.pow(1 + r, n) - 1) / r);
};

// Calculate stepped inflation multiplier
export const steppedMultiplier = (year, stepPct, freqYears) => {
  const periods = Math.floor(year / freqYears);
  return Math.pow(1 + stepPct / 100, periods);
};

// Main simulation engine
export const runSimulation = (state) => {
  const { profile, portfolio, expenses, inflation, buckets } = state;

  const yearsToRetirement = Math.max(0, profile.retirementAge - profile.currentAge);
  const npsGapYears = Math.max(0, 60 - profile.retirementAge);
  const hasNPSInHorizon = profile.retirementAge < 60;

  // ── Project each asset to retirement ──────────────────────────
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

  // ── NPS at age 60 (grows during gap) ──────────────────────────
  const npsAtSixty = futureValue(npsAtRetirement, 0, portfolio.nps.returnRate, npsGapYears);
  const npsLumpsum = npsAtSixty * 0.6;
  const npsAnnualAnnuity = npsAtSixty * 0.4 * (portfolio.nps.annuityRate / 100);
  const npsMonthlyAnnuity = npsAnnualAnnuity / 12;

  // ── SWP corpus (available at retirement, excluding locked NPS) ─
  // Bucket 1 (Liquid): PF
  // Bucket 2 (Debt): GoldETF + SGB
  // Bucket 3 (Equity): Market + PhysGold(if SWP on)
  const physGoldSWP = portfolio.physicalGold.includeSWP ? physGoldAtRetirement : 0;

  // Natural asset → bucket mapping
  const naturalB1 = pfAtRetirement;
  const naturalB2 = goldETFAtRetirement + sgbAtRetirement;
  const naturalB3 = marketAtRetirement + physGoldSWP;

  const swpCorpus = naturalB1 + naturalB2 + naturalB3;

  // Apply percentage splits to total
  const totalB1 = swpCorpus * (buckets.b1Pct / 100);
  const totalB2 = swpCorpus * (buckets.b2Pct / 100);
  const totalB3 = swpCorpus * (buckets.b3Pct / 100);

  // ── Monthly expense at today's level ──────────────────────────
  const eduMonthly = expenses.education.amount;
  const baseMonthlyExpense =
    expenses.housing + expenses.groceries + eduMonthly +
    expenses.parents + expenses.medical + expenses.utilities +
    expenses.transport + expenses.insurance +
    (expenses.travel / 12) + expenses.lifestyle + expenses.misc;

  // ── Run year-by-year simulation post retirement ────────────────
  let b1 = totalB1;
  let b2 = totalB2;
  let b3 = totalB3;
  let npsInjected = false;
  let sustainedYears = 0;
  const simData = [];

  for (let yr = 0; yr <= 60; yr++) {
    const age = profile.retirementAge + yr;

    // NPS injection at age 60
    if (age >= 60 && hasNPSInHorizon && !npsInjected) {
      b3 += npsLumpsum;
      npsInjected = true;
    }

    // This year's expenses (stepped inflation)
    const genMult = steppedMultiplier(yr, inflation.generalStep, inflation.generalFreq);
    const medMult = steppedMultiplier(yr, inflation.medicalStep, inflation.medicalFreq);

    const eduActive = yr < expenses.education.years;
    const nonMedMonthly = (
      expenses.housing + expenses.groceries +
      (eduActive ? eduMonthly : 0) + expenses.parents +
      expenses.utilities + expenses.transport + expenses.insurance +
      (expenses.travel / 12) + expenses.lifestyle + expenses.misc
    ) * genMult;

    const medMonthly = expenses.medical * medMult;
    const totalMonthlyExpense = nonMedMonthly + medMonthly;
    const totalYearlyExpense = totalMonthlyExpense * 12;

    // NPS annuity reduces withdrawal burden from age 60
    const annuityIncome = (age >= 60 && hasNPSInHorizon) ? npsMonthlyAnnuity * 12 : 0;
    const netYearlyWithdrawal = Math.max(0, totalYearlyExpense - annuityIncome);

    const totalCorpus = Math.max(0, b1 + b2 + b3);

    simData.push({
      year: yr,
      age,
      bucket1: Math.max(0, Math.round(b1)),
      bucket2: Math.max(0, Math.round(b2)),
      bucket3: Math.max(0, Math.round(b3)),
      total: Math.max(0, Math.round(totalCorpus)),
      monthlyExpense: Math.round(totalMonthlyExpense),
      annuityIncome: Math.round(annuityIncome / 12),
      netMonthlyWithdrawal: Math.round(netYearlyWithdrawal / 12),
    });

    if (totalCorpus > 0) sustainedYears = yr;
    if (totalCorpus <= 0) break;

    // Grow buckets for next year
    b1 = b1 * (1 + buckets.b1Return / 100);
    b2 = b2 * (1 + buckets.b2Return / 100);
    b3 = b3 * (1 + buckets.b3Return / 100);

    // Withdraw from B1 first
    b1 -= netYearlyWithdrawal;
    if (b1 < 0) { b2 += b1; b1 = 0; }
    if (b2 < 0) { b3 += b2; b2 = 0; }
    if (b3 < 0) b3 = 0;
  }

  // ── Portfolio composition today ────────────────────────────────
  const todayTotal =
    portfolio.nps.current + portfolio.pf.current + portfolio.market.current +
    portfolio.physicalGold.current + portfolio.goldETF.current + portfolio.sgb.current;

  return {
    // Projections at retirement
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

    // Bucket split at retirement
    totalB1,
    totalB2,
    totalB3,

    // Today
    todayTotal,
    baseMonthlyExpense,

    // Simulation
    sustainedYears,
    simData,

    // Meta
    yearsToRetirement,
    npsGapYears,
    hasNPSInHorizon,
    retirementAge: profile.retirementAge,
  };
};
