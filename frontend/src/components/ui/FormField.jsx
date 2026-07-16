import { AlertCircle } from "lucide-react";

export function FormField({ 
  label, 
  error, 
  required, 
  children, 
  hint,
  // Input props
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
  options,
  as,
  rows,
  ...rest
}) {
  // If children are provided, use them (for custom inputs)
  if (children) {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-[#1A1F2E] mb-1.5">
            {label}
            {required && <span className="text-[#DC2626] ml-0.5">*</span>}
          </label>
        )}
        {children}
        {hint && !error && (
          <p className="text-[#9AA3AE] text-xs mt-1">{hint}</p>
        )}
        {error && (
          <p className="text-[#DC2626] text-xs mt-1 flex items-center gap-1">
            <AlertCircle size={12} className="flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }

  // Otherwise, render based on props
  const inputClasses = `w-full px-3 py-2 text-sm rounded-[6px] border transition-all duration-150 outline-none
   placeholder:text-[#9AA3AE] text-[#1A1F2E]
   ${error
     ? "border-[#DC2626] bg-[#FEF2F2] focus:ring-2 focus:ring-[#DC2626]/20"
     : "border-[#E2E6EA] bg-white focus:border-[#1B3A5C] focus:ring-2 focus:ring-[#1B3A5C]/15"
   } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`;

  let inputElement;

  if (type === 'select') {
    inputElement = (
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={inputClasses}
        {...rest}
      >
        {options?.map((opt, index) => (
          <option key={index} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  } else if (as === 'textarea') {
    inputElement = (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={inputClasses}
        {...rest}
      />
    );
  } else {
    inputElement = (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClasses}
        {...rest}
      />
    );
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-[#1A1F2E] mb-1.5">
          {label}
          {required && <span className="text-[#DC2626] ml-0.5">*</span>}
        </label>
      )}
      {inputElement}
      {hint && !error && (
        <p className="text-[#9AA3AE] text-xs mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-[#DC2626] text-xs mt-1 flex items-center gap-1">
          <AlertCircle size={12} className="flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// Base input class generator
export const inputClass = (error) =>
  `w-full px-3 py-2 text-sm rounded-[6px] border transition-all duration-150 outline-none
   placeholder:text-[#9AA3AE] text-[#1A1F2E]
   ${error
     ? "border-[#DC2626] bg-[#FEF2F2] focus:ring-2 focus:ring-[#DC2626]/20"
     : "border-[#E2E6EA] bg-white focus:border-[#1B3A5C] focus:ring-2 focus:ring-[#1B3A5C]/15"
   }`;

// Number input that prevents leading zeros and negatives
export function NumberInput({ value, onChange, min = 0, placeholder, error, className = "" }) {
  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw === "") { onChange(""); return; }
    // Remove leading zeros
    const cleaned = raw.replace(/^0+(\d)/, "$1");
    // Only allow digits and one decimal point
    if (/^\d*\.?\d*$/.test(cleaned)) onChange(cleaned);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={handleChange}
      onBlur={(e) => {
        const n = parseFloat(e.target.value);
        if (!isNaN(n) && n < min) onChange(String(min));
        if (e.target.value === "") onChange("");
      }}
      placeholder={placeholder || "0"}
      className={`${inputClass(error)} ${className}`}
    />
  );
}
