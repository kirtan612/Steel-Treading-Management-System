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
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val.trim())
      ? null : "Invalid GST format (e.g. 24AAACM1234A1ZP)";
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
