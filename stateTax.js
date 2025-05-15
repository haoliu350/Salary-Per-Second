// stateTax.js
"use strict";

/**
 * Canonical state‐name lookup keyed by lower-case postal code
 * or lower-case full state name →
 *   { type: 'none' | 'flat' | 'progressive',
 *     rate: 0-1,                   // for flat
 *     brackets: [{ threshold, rate }, …] } // for progressive
 *
 * Thresholds are the lower bound (inclusive) at which the
 * stated marginal rate begins.
 */
const STATE_RULES = (() => {
  const rules = {
    // --- No-income-tax states --------------------
    alaska:      { type: "none" },
    florida:     { type: "none" },
    nevada:      { type: "none" },
    "new hampshire": { type: "none" }, // wages not taxed
    southdakota: { type: "none" },
    tennessee:   { type: "none" },
    texas:       { type: "none" },
    washington:  { type: "none" }, // wage income
    wyoming:     { type: "none" },

    // --- Flat-tax states -------------------------
    arizona:     { type: "flat", rate: 0.025 },
    colorado:    { type: "flat", rate: 0.044 },
    georgia:     { type: "flat", rate: 0.0539 },
    idaho:       { type: "flat", rate: 0.058 },
    illinois:    { type: "flat", rate: 0.0495 },
    indiana:     { type: "flat", rate: 0.0305 },
    kentucky:    { type: "flat", rate: 0.04 },
    michigan:    { type: "flat", rate: 0.0425 },
    "north carolina": { type: "flat", rate: 0.045 },
    pennsylvania:{ type: "flat", rate: 0.0307 },
    utah:        { type: "flat", rate: 0.0455 },

    // --- Progressive states ----------------------
    alabama: {
      type: "progressive",
      brackets: [
        { threshold: 0,    rate: 0.02 },
        { threshold: 500,  rate: 0.04 },
        { threshold: 3000, rate: 0.05 }
      ]
    },
    arkansas: {
      type: "progressive",
      brackets: [
        { threshold: 0,    rate: 0.02 },
        { threshold: 4400, rate: 0.04 },
        { threshold: 8800, rate: 0.044 }
      ]
    },
    california: {
      type: "progressive",
      brackets: [
        { threshold: 0,        rate: 0.01  },
        { threshold: 10412,    rate: 0.02  },
        { threshold: 24684,    rate: 0.04  },
        { threshold: 38959,    rate: 0.06  },
        { threshold: 54081,    rate: 0.08  },
        { threshold: 68350,    rate: 0.093 },
        { threshold: 349137,   rate: 0.103 },
        { threshold: 418961,   rate: 0.113 },
        { threshold: 698271,   rate: 0.123 },
        { threshold: 1000000,  rate: 0.133 }
      ]
    },
    connecticut: {
      type: "progressive",
      brackets: [
        { threshold: 0,      rate: 0.02   },
        { threshold: 10000,  rate: 0.045  },
        { threshold: 50000,  rate: 0.055  },
        { threshold: 100000, rate: 0.06   },
        { threshold: 200000, rate: 0.065  },
        { threshold: 500000, rate: 0.0699 }
      ]
    },
    delaware: {
      type: "progressive",
      brackets: [
        { threshold: 2000,  rate: 0.022 },
        { threshold: 5000,  rate: 0.039 },
        { threshold: 10000, rate: 0.048 },
        { threshold: 20000, rate: 0.052 },
        { threshold: 25000, rate: 0.0555 },
        { threshold: 60000, rate: 0.066 }
      ]
    },
    hawaii: {
      type: "progressive",
      brackets: [
        { threshold: 0,      rate: 0.014 },
        { threshold: 2400,   rate: 0.032 },
        { threshold: 4800,   rate: 0.055 },
        { threshold: 9600,   rate: 0.064 },
        { threshold: 14400,  rate: 0.068 },
        { threshold: 19200,  rate: 0.072 },
        { threshold: 24000,  rate: 0.076 },
        { threshold: 36000,  rate: 0.079 },
        { threshold: 48000,  rate: 0.0825 },
        { threshold: 150000, rate: 0.09  },
        { threshold: 175000, rate: 0.10  },
        { threshold: 200000, rate: 0.11  }
      ]
    },
    iowa: {
      type: "progressive",
      brackets: [
        { threshold: 0,    rate: 0.044 },
        { threshold: 6210, rate: 0.0482 },
        { threshold: 31050,rate: 0.057 }
      ]
    },
    kansas: {
      type: "progressive",
      brackets: [
        { threshold: 0,     rate: 0.031 },
        { threshold: 15000, rate: 0.0525 },
        { threshold: 30000, rate: 0.057 }
      ]
    },
    louisiana: {
      type: "progressive",
      brackets: [
        { threshold: 0,     rate: 0.0185 },
        { threshold: 12500, rate: 0.035  },
        { threshold: 50000, rate: 0.0425 }
      ]
    },
    maine: {
      type: "progressive",
      brackets: [
        { threshold: 0,     rate: 0.058 },
        { threshold: 26050, rate: 0.0675 },
        { threshold: 61600, rate: 0.0715 }
      ]
    },
    maryland: {
      type: "progressive",
      brackets: [
        { threshold: 0,      rate: 0.02  },
        { threshold: 1000,   rate: 0.03  },
        { threshold: 2000,   rate: 0.04  },
        { threshold: 3000,   rate: 0.0475},
        { threshold: 100000, rate: 0.05  },
        { threshold: 125000, rate: 0.0525},
        { threshold: 150000, rate: 0.055 },
        { threshold: 250000, rate: 0.0575}
      ]
    },
    massachusetts: {
      type: "progressive",
      brackets: [
        { threshold: 0,       rate: 0.05 },
        { threshold: 1000000, rate: 0.09 } // “millionaire’s surtax”
      ]
    },
    minnesota: {
      type: "progressive",
      brackets: [
        { threshold: 0,      rate: 0.0535 },
        { threshold: 31690,  rate: 0.068  },
        { threshold: 104090, rate: 0.0785 },
        { threshold: 193240, rate: 0.0985 }
      ]
    },
    mississippi: {
      type: "progressive",
      brackets: [
        { threshold: 10000, rate: 0.047 } // first $10 k untaxed
      ]
    },
    missouri: {
      type: "progressive",
      brackets: [
        { threshold: 1273, rate: 0.02  },
        { threshold: 2546, rate: 0.025 },
        { threshold: 3819, rate: 0.03  },
        { threshold: 5092, rate: 0.035 },
        { threshold: 6365, rate: 0.04  },
        { threshold: 7638, rate: 0.045 },
        { threshold: 8911, rate: 0.048 }
      ]
    },
    montana: {
      type: "progressive",
      brackets: [
        { threshold: 0,     rate: 0.047 },
        { threshold: 20500, rate: 0.059 }
      ]
    },
    nebraska: {
      type: "progressive",
      brackets: [
        { threshold: 0,     rate: 0.0246 },
        { threshold: 3700,  rate: 0.0351 },
        { threshold: 22170, rate: 0.0501 },
        { threshold: 35730, rate: 0.0584 }
      ]
    },
    "new jersey": {
      type: "progressive",
      brackets: [
        { threshold: 0,      rate: 0.014  },
        { threshold: 20000,  rate: 0.0175 },
        { threshold: 35000,  rate: 0.035  },
        { threshold: 40000,  rate: 0.05525},
        { threshold: 75000,  rate: 0.0637 },
        { threshold: 500000, rate: 0.0897 },
        { threshold: 1000000,rate: 0.1075 }
      ]
    },
    "new mexico": {
      type: "progressive",
      brackets: [
        { threshold: 0,      rate: 0.017 },
        { threshold: 5500,   rate: 0.032 },
        { threshold: 11000,  rate: 0.047 },
        { threshold: 16000,  rate: 0.049 },
        { threshold: 210000, rate: 0.059 }
      ]
    },
    "new york": {
      type: "progressive",
      brackets: [
        { threshold: 0,       rate: 0.04  },
        { threshold: 8500,    rate: 0.045 },
        { threshold: 11700,   rate: 0.0525},
        { threshold: 13900,   rate: 0.055 },
        { threshold: 80650,   rate: 0.06  },
        { threshold: 215400,  rate: 0.0685},
        { threshold: 1077550, rate: 0.0965},
        { threshold: 5000000, rate: 0.103 },
        { threshold: 25000000,rate: 0.109 }
      ]
    },
    "north dakota": {
      type: "progressive",
      brackets: [
        { threshold: 44725,  rate: 0.0195 },
        { threshold: 225975, rate: 0.025  }
      ]
    },
    ohio: {
      type: "progressive",
      brackets: [
        { threshold: 26050, rate: 0.02765 },
        { threshold: 92150, rate: 0.035 }
      ]
    },
    oklahoma: {
      type: "progressive",
      brackets: [
        { threshold: 0,    rate: 0.0025 },
        { threshold: 1000, rate: 0.0075 },
        { threshold: 2500, rate: 0.0175 },
        { threshold: 3750, rate: 0.0275 },
        { threshold: 4900, rate: 0.0375 },
        { threshold: 7200, rate: 0.0475 }
      ]
    },
    oregon: {
      type: "progressive",
      brackets: [
        { threshold: 0,     rate: 0.0475 },
        { threshold: 4300,  rate: 0.0675 },
        { threshold: 10750, rate: 0.0875 },
        { threshold: 125000,rate: 0.099 }
      ]
    },
    "rhode island": {
      type: "progressive",
      brackets: [
        { threshold: 0,      rate: 0.0375 },
        { threshold: 77450,  rate: 0.0475 },
        { threshold: 176050, rate: 0.0599 }
      ]
    },
    "south carolina": {
      type: "progressive",
      brackets: [
        { threshold: 3460,  rate: 0.03 },
        { threshold: 17330, rate: 0.064 }
      ]
    },
    vermont: {
      type: "progressive",
      brackets: [
        { threshold: 0,      rate: 0.0335 },
        { threshold: 45400,  rate: 0.066  },
        { threshold: 110050, rate: 0.076  },
        { threshold: 229550, rate: 0.0875 }
      ]
    },
    virginia: {
      type: "progressive",
      brackets: [
        { threshold: 0,    rate: 0.02  },
        { threshold: 3000, rate: 0.03  },
        { threshold: 5000, rate: 0.05  },
        { threshold: 17000,rate: 0.0575 }
      ]
    },
    "west virginia": {
      type: "progressive",
      brackets: [
        { threshold: 0,    rate: 0.0236 },
        { threshold: 10000,rate: 0.0315 },
        { threshold: 25000,rate: 0.0354 },
        { threshold: 40000,rate: 0.0472 },
        { threshold: 60000,rate: 0.0512 }
      ]
    },
    wisconsin: {
      type: "progressive",
      brackets: [
        { threshold: 0,     rate: 0.035 },
        { threshold: 14320, rate: 0.044 },
        { threshold: 28640, rate: 0.053 },
        { threshold: 315310,rate: 0.0765 }
      ]
    }
  };

  // Add two-letter postal codes for convenience
  const postal = {
    AL:"alabama", AK:"alaska", AZ:"arizona", AR:"arkansas", CA:"california",
    CO:"colorado", CT:"connecticut", DE:"delaware", FL:"florida", GA:"georgia",
    HI:"hawaii", ID:"idaho", IL:"illinois", IN:"indiana", IA:"iowa", KS:"kansas",
    KY:"kentucky", LA:"louisiana", ME:"maine", MD:"maryland", MA:"massachusetts",
    MI:"michigan", MN:"minnesota", MS:"mississippi", MO:"missouri", MT:"montana",
    NE:"nebraska", NV:"nevada", NH:"new hampshire", NJ:"new jersey",
    NM:"new mexico", NY:"new york", NC:"north carolina", ND:"north dakota",
    OH:"ohio", OK:"oklahoma", OR:"oregon", PA:"pennsylvania", RI:"rhode island",
    SC:"south carolina", SD:"southdakota", TN:"tennessee", TX:"texas", UT:"utah",
    VT:"vermont", VA:"virginia", WA:"washington", WV:"west virginia",
    WI:"wisconsin", WY:"wyoming"
  };
  for (const [code, name] of Object.entries(postal)) {
    rules[code.toLowerCase()] = rules[name];
  }
  return rules;
})();

/**
 * Calculate rough 2024 state income tax for a single filer.
 *
 * @param {number} annualIncome – gross income (≥ 0)
 * @param {string} state        – full name or 2-letter code
 * @returns {number}            – approximate tax dollars (rounded)
 */
function calculateStateTax(annualIncome, state) {
  if (annualIncome <= 0) return 0;
  if (typeof state !== "string") throw new Error("State must be a string");

  const key = state.trim().toLowerCase().replace(/\s+/g, " ");
  const rule = STATE_RULES[key];
  if (!rule) {
    throw new Error(`Unsupported state: "${state}"`);
  }

  switch (rule.type) {
    case "none":
      return 0;

    case "flat":
      return Math.round(annualIncome * rule.rate);

    case "progressive": {
      let tax = 0;
      const brackets = rule.brackets;
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

    default:
      throw new Error("Unknown rule type");
  }
}

// --- Example usage -----------------------------------------
// if (require.main === module) {
//   console.log(calculateStateTax(85000, "CA")); // ≈ California tax on $85 k
//   console.log(calculateStateTax(85000, "TX")); // 0 – no income tax
//   console.log(calculateStateTax(85000, "NC")); // flat-tax state
// }

module.exports = { calculateStateTax };
