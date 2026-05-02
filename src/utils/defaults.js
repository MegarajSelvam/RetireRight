export const DEFAULT_STATE = {
  profile: {
    name: '',
    currentAge: 35,
    retirementAge: 50,
  },
  portfolio: {
    nps: { current: 500000, monthly: 5000, returnRate: 10, annuityRate: 6 },
    pf:  { current: 800000, monthly: 8000, returnRate: 8.15 },
    market: { current: 1000000, monthly: 10000, returnRate: 12 },
    physicalGold: { current: 300000, includeSWP: false, returnRate: 8 },
    goldETF: { current: 100000, monthly: 2000, returnRate: 8 },
    sgb: { current: 200000, monthly: 0, returnRate: 10.5 },
  },
  expenses: {
    housing: 15000,
    groceries: 8000,
    education: { amount: 5000, years: 10 },
    parents: 5000,
    medical: 3000,
    utilities: 3000,
    transport: 4000,
    insurance: 3000,
    travel: 60000,
    lifestyle: 5000,
    misc: 3000,
  },
  inflation: {
    generalStep: 15,
    generalFreq: 3,
    medicalStep: 20,
    medicalFreq: 3,
    housingType: 'fixed', // 'fixed' or 'percentage'
    housingAnnual: 500, // ₹ per year if fixed, % per year if percentage
  },
  buckets: {
    b1Pct: 20,
    b2Pct: 30,
    b3Pct: 50,
    b1Return: 6.5,
    b2Return: 9,
    b3Return: 13,
  },
};
