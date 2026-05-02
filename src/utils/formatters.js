export const fmtINR = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '₹0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)} L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)} K`;
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
};

export const fmtINRShort = (n) => {
  if (!n && n !== 0) return '₹0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`;
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
};

export const fmtNum = (n) => {
  if (!n && n !== 0) return '0';
  return Math.round(n).toLocaleString('en-IN');
};
