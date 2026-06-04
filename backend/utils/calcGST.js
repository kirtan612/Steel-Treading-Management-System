/**
 * Calculate GST for an order.
 * Same state → CGST + SGST (9% each), different state → IGST (18%)
 * @param {number} taxableAmount
 * @param {string} customerState
 * @param {string} companyState  defaults to "Gujarat"
 */
const calcGST = (taxableAmount, customerState, companyState = "Gujarat") => {
  const amount = parseFloat(taxableAmount) || 0;
  const isSameState = customerState?.trim().toLowerCase() === companyState.trim().toLowerCase();

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