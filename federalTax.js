// federalTax.js
"use strict";

/**
 * Federal tax brackets for 2024 (single filer)
 * Structure matches state tax implementation for consistency
 */
const FEDERAL_RULES = {
  type: "progressive",
  brackets: [
    { threshold: 0,      rate: 0.10 },
    { threshold: 11601,  rate: 0.12 },
    { threshold: 47151,  rate: 0.22 },
    { threshold: 100526, rate: 0.24 },
    { threshold: 191951, rate: 0.32 },
    { threshold: 243726, rate: 0.35 },
    { threshold: 609351, rate: 0.37 }
  ]
};

/**
 * Calculate 2024 federal income tax for a single filer.
 *
 * @param {number} annualIncome – gross income (≥ 0)
 * @returns {number}            – approximate tax dollars (rounded)
 */
function calculateFederalTax(annualIncome) {
  if (annualIncome <= 0) return 0;

  let tax = 0;
  const brackets = FEDERAL_RULES.brackets;
  
  for (let i = 0; i < brackets.length; i++) {
    const { threshold, rate } = brackets[i];
    const nextThreshold = 
      i + 1 < brackets.length ? brackets[i + 1].threshold : Infinity;

    if (annualIncome > threshold) {
      const taxableHere = Math.min(annualIncome, nextThreshold) - threshold;
      tax += taxableHere * rate;
    } else {
      break; // income below this threshold → done
    }
  }

  return Math.round(tax);
}

module.exports = { calculateFederalTax };