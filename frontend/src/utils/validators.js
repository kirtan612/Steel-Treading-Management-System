export const validators = {
  required: (val) =>
    val === "" || val === null || val === undefined || String(val).trim() === ""
      ? "This field is required" : null,

  positiveNumber: (val) => {
    if (val === "" || val === null || val === undefined) return "This field is required";
    const n = Number(val);
    if (isNaN(n) || n <= 0) return "Must be a positive number";
    return null;
  },

  nonNegativeNumber: (val) => {
    if (val === "" || val === null || val === undefined) return "This field is required";
    const n = Number(val);
    if (isNaN(n) || n < 0) return "Must be 0 or greater";
    return null;
  },

  minLength: (min) => (val) =>
    val && val.trim().length < min ? `Minimum ${min} characters required` : null,

  gstNumber: (val) => {
    if (!val || val.trim() === "") return null;
    const trimmed = val.trim().toUpperCase();
    const patternValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(trimmed);
    if (!patternValid) return "Invalid GST format (e.g. 24AAACM1234A1ZP)";
    
    // Check if the state code is valid (first 2 digits)
    const stateCode = trimmed.substring(0, 2);
    const validCodes = Object.values(STATE_GST_CODES);
    if (!validCodes.includes(stateCode)) {
      return `Invalid GST state code "${stateCode}"`;
    }
    return null;
  },

  panNumber: (val) => {
    if (!val || val.trim() === "") return null;
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val.trim().toUpperCase())
      ? null : "Invalid PAN format (e.g. ABCDE1234F)";
  },

  gstMatchesState: (gst, stateName) => {
    if (!gst || !stateName) return null;
    const stateCode = gst.trim().substring(0, 2);
    const expectedCode = getGSTStateCode(stateName);
    if (!expectedCode) return null; // Can't determine, skip strict match
    
    if (stateCode !== expectedCode) {
      return `GSTIN state code (${stateCode}) doesn't match selected state "${stateName}" (${expectedCode})`;
    }
    return null;
  },

  phone: (val) => {
    if (!val || val.trim() === "") return "Phone number is required";
    return /^[6-9]\d{9}$/.test(val.trim())
      ? null : "Enter a valid 10-digit Indian mobile number";
  },

  email: (val) => {
    if (!val || val.trim() === "") return "Email is required";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
      ? null : "Enter a valid email address";
  },

  pincode: (val) => {
    if (!val || val.trim() === "") return "Pincode is required";
    return /^[1-9][0-9]{5}$/.test(val.trim())
      ? null : "Enter a valid 6-digit pincode";
  },

  percentage: (val) => {
    const n = Number(val);
    if (isNaN(n) || n < 0 || n > 100) return "Must be between 0 and 100";
    return null;
  },

  sellingGtPurchase: (selling, purchase) => {
    if (Number(selling) <= Number(purchase)) return "Selling price must be greater than purchase price";
    return null;
  },
};

export const validateForm = (fields, rules) => {
  const errors = {};
  Object.keys(rules).forEach((field) => {
    const fieldRules = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
    for (const rule of fieldRules) {
      const error = rule(fields[field]);
      if (error) { errors[field] = error; break; }
    }
  });
  return errors;
};

export const STATE_GST_CODES = {
  "jammu & kashmir": "01",
  "jammu and kashmir": "01",
  "himachal pradesh": "02",
  "punjab": "03",
  "chandigarh": "04",
  "uttarakhand": "05",
  "uttaranchal": "05",
  "haryana": "06",
  "delhi": "07",
  "ncr": "07",
  "rajasthan": "08",
  "uttar pradesh": "09",
  "bihar": "10",
  "sikkim": "11",
  "arunachal pradesh": "12",
  "nagaland": "13",
  "manipur": "14",
  "mizoram": "15",
  "tripura": "16",
  "meghalaya": "17",
  "assam": "18",
  "west bengal": "19",
  "jharkhand": "20",
  "odisha": "21",
  "orissa": "21",
  "chhattisgarh": "22",
  "madhya pradesh": "23",
  "gujarat": "24",
  "daman & diu": "25",
  "daman and diu": "25",
  "dadra & nagar haveli": "26",
  "dadra and nagar haveli": "26",
  "maharashtra": "27",
  "andhra pradesh": "28",
  "karnataka": "29",
  "goa": "30",
  "lakshadweep": "31",
  "kerala": "32",
  "tamil nadu": "33",
  "puducherry": "34",
  "pondicherry": "34",
  "andaman & nicobar islands": "35",
  "andaman and nicobar islands": "35",
  "telangana": "36",
  "andhra pradesh (new)": "37",
  "ladakh": "38",
  "other territory": "97",
  
  // State Abbreviations
  "jk": "01",
  "hp": "02",
  "pb": "03",
  "ch": "04",
  "ut": "05",
  "hr": "06",
  "dl": "07",
  "rj": "08",
  "up": "09",
  "br": "10",
  "sk": "11",
  "ar": "12",
  "nl": "13",
  "mn": "14",
  "mz": "15",
  "tr": "16",
  "ml": "17",
  "as": "18",
  "wb": "19",
  "jh": "20",
  "or": "21",
  "od": "21",
  "cg": "22",
  "mp": "23",
  "gj": "24",
  "dd": "25",
  "dn": "26",
  "mh": "27",
  "ap": "28",
  "ka": "29",
  "ga": "30",
  "ld": "31",
  "kl": "32",
  "tn": "33",
  "py": "34",
  "an": "35",
  "ts": "36",
  "tg": "36",
  "la": "38"
};

export const getGSTStateCode = (stateName) => {
  if (!stateName) return null;
  const cleanState = stateName.trim().toLowerCase().replace(/\.+/g, '').replace(/\s+/g, ' ');
  if (/^\d{2}$/.test(cleanState)) return cleanState;
  return STATE_GST_CODES[cleanState] || null;
};

