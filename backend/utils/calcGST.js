const STATE_GST_CODES = {
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
  "jk": "01", "hp": "02", "pb": "03", "ch": "04", "ut": "05", "hr": "06", "dl": "07",
  "rj": "08", "up": "09", "br": "10", "sk": "11", "ar": "12", "nl": "13", "mn": "14",
  "mz": "15", "tr": "16", "ml": "17", "as": "18", "wb": "19", "jh": "20", "or": "21",
  "od": "21", "cg": "22", "mp": "23", "gj": "24", "dd": "25", "dn": "26", "mh": "27",
  "ap": "28", "ka": "29", "ga": "30", "ld": "31", "kl": "32", "tn": "33", "py": "34",
  "an": "35", "ts": "36", "tg": "36", "la": "38"
};

const getGSTStateCode = (stateName) => {
  if (!stateName) return null;
  const cleanState = stateName.trim().toLowerCase().replace(/\.+/g, '').replace(/\s+/g, ' ');
  if (/^\d{2}$/.test(cleanState)) return cleanState;
  return STATE_GST_CODES[cleanState] || null;
};

/**
 * Calculate GST for an order.
 * Same state → CGST + SGST (9% each), different state → IGST (18%)
 * @param {number} taxableAmount
 * @param {string} customerState
 * @param {string} customerGstNumber
 * @param {string} companyState  defaults to "Gujarat"
 * @param {string} companyGstNumber defaults to "24AAACS1234Z1ZP"
 */
const calcGST = (taxableAmount, customerState, customerGstNumber = null, companyState = "Gujarat", companyGstNumber = "24AAACS1234Z1ZP") => {
  const amount = parseFloat(taxableAmount) || 0;
  
  let isSameState = true;

  if (customerGstNumber && companyGstNumber) {
    const custCode = customerGstNumber.trim().substring(0, 2);
    const compCode = companyGstNumber.trim().substring(0, 2);
    if (/^\d{2}$/.test(custCode) && /^\d{2}$/.test(compCode)) {
      isSameState = (custCode === compCode);
    } else {
      isSameState = customerState?.trim().toLowerCase() === companyState.trim().toLowerCase();
    }
  } else if (customerState) {
    const custStateCode = getGSTStateCode(customerState);
    const compStateCode = getGSTStateCode(companyState);
    if (custStateCode && compStateCode) {
      isSameState = (custStateCode === compStateCode);
    } else {
      isSameState = customerState.trim().toLowerCase() === companyState.trim().toLowerCase();
    }
  }

  if (isSameState) {
    const cgst = parseFloat((amount * 0.09).toFixed(2));
    const sgst = parseFloat((amount * 0.09).toFixed(2));
    return { cgst, sgst, igst: 0, totalTax: cgst + sgst };
  } else {
    const igst = parseFloat((amount * 0.18).toFixed(2));
    return { cgst: 0, sgst: 0, igst, totalTax: igst };
  }
};

module.exports = calcGST;