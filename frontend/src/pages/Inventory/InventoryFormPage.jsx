import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mockInventory } from "../../data/mockData";
import { validators, validateForm } from "../../utils/validators";
import { FormField, NumberInput, inputClass } from "../../components/ui/FormField";
import { ArrowLeft, Save } from "lucide-react";

const PIPE_TYPES = ["ERW", "Seamless", "Hollow Section", "GI Pipe", "MS Pipe"];
const GRADES = ["IS 1239", "IS 3589", "IS 4923", "ASTM A53", "ASTM A106", "EN 10255"];
const UNITS = ["Kg", "Ton", "Piece", "Meter"];

const EMPTY_FORM = {
  name: "", pipeType: "", grade: "",
  outerDiameter: "", wallThickness: "", lengthPerPiece: "6",
  weightPerMeter: "",
  unit: "Kg", stockQty: "", reorderLevel: "",
  purchasePrice: "", sellingPrice: "",
  hsnCode: "", location: "", description: "",
};

export default function InventoryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Pre-fill on edit
  useEffect(() => {
    if (isEdit) {
      const item = mockInventory.find(i => i.id === id);
      if (item) setForm({ ...EMPTY_FORM, ...item });
    }
  }, [id, isEdit]);

  // Auto-calculate weight per meter when OD or thickness changes
  useEffect(() => {
    const od = parseFloat(form.outerDiameter);
    const t = parseFloat(form.wallThickness);
    if (!isNaN(od) && !isNaN(t) && od > 0 && t > 0 && t < od / 2) {
      const weight = (Math.PI * (od - t) * t * 7.85 / 1000).toFixed(3);
      setForm(p => ({ ...p, weightPerMeter: weight }));
    } else {
      setForm(p => ({ ...p, weightPerMeter: "" }));
    }
  }, [form.outerDiameter, form.wallThickness]);

  const set = (field) => (e) => {
    const val = e.target ? e.target.value : e;
    setForm(p => ({ ...p, [field]: val }));
    if (submitted) {
      // Re-validate on change after first submit attempt
      setErrors(p => ({ ...p, [field]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    const errs = validateForm(form, {
      name:          [validators.required, validators.minLength(3)],
      pipeType:      validators.required,
      grade:         validators.required,
      outerDiameter: [validators.required, validators.positiveNumber],
      wallThickness: [validators.required, validators.positiveNumber],
      stockQty:      [validators.required, validators.nonNegativeNumber],
      reorderLevel:  [validators.required, validators.nonNegativeNumber],
      purchasePrice: [validators.required, validators.positiveNumber],
      sellingPrice:  [validators.required, validators.positiveNumber],
    });

    // Cross-field: selling price > purchase price
    if (!errs.sellingPrice && !errs.purchasePrice) {
      const err = validators.sellingGtPurchase(form.sellingPrice, form.purchasePrice);
      if (err) errs.sellingPrice = err;
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to first error
      const firstErrorEl = document.querySelector("[data-field-error]");
      if (firstErrorEl) firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    console.log("Saving inventory item:", form);
    navigate("/inventory");
  };

  // Helper to render field container with error
  const Field = ({ label, field, required, hint, children }) => (
    <div data-field-error={errors[field] ? true : undefined}>
      <FormField label={label} error={errors[field]} required={required} hint={hint}>
        {children}
      </FormField>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/inventory")}
                className="p-2 rounded-[6px] text-[#5A6473] hover:bg-white
                           hover:text-[#1A1F2E] border border-transparent
                           hover:border-[#E2E6EA] transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-heading font-bold text-[#1A1F2E] text-xl">
            {isEdit ? "Edit Inventory Item" : "Add Inventory Item"}
          </h1>
          <p className="text-sm text-[#5A6473]">
            {isEdit ? "Update item details" : "Add a new steel pipe to inventory"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-white border border-[#E2E6EA] rounded-[8px] shadow-sm p-6 space-y-6">
          
          {/* Section: Basic Info */}
          <div>
            <h3 className="font-heading font-semibold text-[#1A1F2E] text-sm
                           uppercase tracking-wide text-[#9AA3AE] mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Item Name" field="name" required>
                <input type="text" value={form.name} onChange={set("name")}
                       placeholder='e.g. 2" ERW Pipe IS 1239'
                       className={inputClass(errors.name)} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label="Pipe Type" field="pipeType" required>
                <select value={form.pipeType} onChange={set("pipeType")}
                        className={inputClass(errors.pipeType)}>
                  <option value="">Select pipe type</option>
                  {PIPE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Grade / Standard" field="grade" required>
                <select value={form.grade} onChange={set("grade")}
                        className={inputClass(errors.grade)}>
                  <option value="">Select grade</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <div className="border-t border-[#E2E6EA]" />

          {/* Section: Dimensions */}
          <div>
            <h3 className="font-heading font-semibold text-[#9AA3AE] text-xs
                           uppercase tracking-wide mb-4">
              Dimensions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Outer Diameter (mm)" field="outerDiameter" required>
                <NumberInput value={form.outerDiameter} onChange={set("outerDiameter")}
                             error={errors.outerDiameter} placeholder="60.3" min={1} />
              </Field>
              <Field label="Wall Thickness (mm)" field="wallThickness" required>
                <NumberInput value={form.wallThickness} onChange={set("wallThickness")}
                             error={errors.wallThickness} placeholder="3.25" min={0.1} />
              </Field>
              <Field label="Length / Piece (m)" field="lengthPerPiece">
                <NumberInput value={form.lengthPerPiece} onChange={set("lengthPerPiece")}
                             error={errors.lengthPerPiece} placeholder="6" min={0.1} />
              </Field>
              <Field label="Weight / Meter (kg/m)" field="weightPerMeter"
                     hint="Auto-calculated from OD & thickness">
                <input type="text" value={form.weightPerMeter} readOnly
                       placeholder="Auto"
                       className="w-full px-3 py-2 text-sm rounded-[6px] border
                                  border-[#E2E6EA] bg-[#F7F8FA] text-[#5A6473]
                                  cursor-not-allowed" />
              </Field>
            </div>
          </div>

          <div className="border-t border-[#E2E6EA]" />

          {/* Section: Stock */}
          <div>
            <h3 className="font-heading font-semibold text-[#9AA3AE] text-xs
                           uppercase tracking-wide mb-4">
              Stock & Pricing
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Unit" field="unit" required>
                <select value={form.unit} onChange={set("unit")}
                        className={inputClass(errors.unit)}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="Stock Quantity" field="stockQty" required>
                <NumberInput value={form.stockQty} onChange={set("stockQty")}
                             error={errors.stockQty} placeholder="0" min={0} />
              </Field>
              <Field label="Reorder Level" field="reorderLevel" required
                     hint="Alert when stock falls below this">
                <NumberInput value={form.reorderLevel} onChange={set("reorderLevel")}
                             error={errors.reorderLevel} placeholder="0" min={0} />
              </Field>
              <Field label="Purchase Price (₹/unit)" field="purchasePrice" required>
                <NumberInput value={form.purchasePrice} onChange={set("purchasePrice")}
                             error={errors.purchasePrice} placeholder="0.00" min={0.01} />
              </Field>
              <Field label="Selling Price (₹/unit)" field="sellingPrice" required>
                <NumberInput value={form.sellingPrice} onChange={set("sellingPrice")}
                             error={errors.sellingPrice} placeholder="0.00" min={0.01} />
              </Field>
            </div>
          </div>

          <div className="border-t border-[#E2E6EA]" />

          {/* Section: Other */}
          <div>
            <h3 className="font-heading font-semibold text-[#9AA3AE] text-xs
                           uppercase tracking-wide mb-4">
              Other Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="HSN Code" field="hsnCode"
                     hint="For GST invoice generation">
                <input type="text" value={form.hsnCode} onChange={set("hsnCode")}
                       placeholder="73063010" maxLength={8}
                       className={inputClass(errors.hsnCode)} />
              </Field>
              <Field label="Warehouse Location" field="location">
                <input type="text" value={form.location} onChange={set("location")}
                       placeholder="e.g. Warehouse A - Rack 1"
                       className={inputClass(errors.location)} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Description / Notes" field="description">
                <textarea value={form.description} onChange={set("description")}
                          rows={3} placeholder="Additional notes about this item..."
                          className={`${inputClass(errors.description)} resize-none`} />
              </Field>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-5 bg-white
                        border border-[#E2E6EA] rounded-[8px] px-5 py-3.5">
          <p className="text-xs text-[#9AA3AE] text-center sm:text-left">
            Fields marked <span className="text-[#DC2626]">*</span> are required
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button type="button" onClick={() => navigate("/inventory")}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-[#5A6473]
                               border border-[#E2E6EA] rounded-[6px]
                               hover:bg-[#F7F8FA] transition-colors">
              Cancel
            </button>
            <button type="submit"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium
                               bg-[#E85D26] hover:bg-[#C94D1E] text-white
                               rounded-[6px] transition-colors active:scale-[0.98]">
              <Save size={15} />
              {isEdit ? "Update Item" : "Save Item"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
