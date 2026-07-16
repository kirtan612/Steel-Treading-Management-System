import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers, Eye, EyeOff, ArrowRight, CheckCircle2, Shield
} from "lucide-react";
import { api } from "../../utils/api";
import toast from "react-hot-toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const result = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });
      if (result.success && result.data?.accessToken) {
        localStorage.setItem("token", result.data.accessToken);
        localStorage.setItem("user", JSON.stringify(result.data.user));
        toast.success("Logged in successfully!");
        navigate("/dashboard");
      } else {
        toast.error(result.message || "Invalid login response");
      }
    } catch (error) {
      toast.error(error.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#F8FAFC] to-[#EBF1F8]">
      
      {/* ─── LEFT PANEL ─── */}
      <div className="relative md:w-[45%] bg-gradient-to-br from-[#1B3A5C] to-[#0F2942] flex flex-col
                      justify-center items-center overflow-hidden px-8 py-12 min-h-[300px] md:min-h-screen">
        
        {/* Background Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]"
             xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="white"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>

        {/* Floating Blobs */}
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full
                        bg-[#E85D26] opacity-10 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full
                        bg-[#1D6FB5] opacity-15 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-[#E85D26] to-[#C94D1E] rounded-2xl 
                            flex items-center justify-center shadow-xl">
              <Layers size={28} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-heading font-bold text-3xl tracking-tight">
              SteelTrack
            </span>
          </div>

          {/* Tagline */}
          <h2 className="text-white text-2xl font-bold mb-4 leading-tight">
            Complete ERP Solution for<br />Steel Pipe Trading
          </h2>
          
          <p className="text-white/70 text-base leading-relaxed mb-8">
            Manage inventory, orders, customers, invoices, and delivery challans all in one powerful platform.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['Real-time Tracking', 'GST Compliant', 'E-Way Bills', 'Analytics'].map(feature => (
              <div key={feature} className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 
                                           rounded-full text-white/90 text-sm font-medium">
                {feature}
              </div>
            ))}
          </div>

          {/* Security Badge */}
          <div className="mt-12 flex items-center justify-center gap-2">
            <Shield size={16} className="text-white/40" />
            <span className="text-white/40 text-sm">
              Secured with JWT Authentication
            </span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          
          {/* Status Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white border border-[#E2E6EA]
                            text-xs font-medium px-4 py-2 rounded-full shadow-sm">
              <div className="w-2 h-2 bg-[#2E7D52] rounded-full animate-pulse" />
              <span className="text-[#5A6473]">System Online & Ready</span>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#E2E6EA] p-8">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-heading font-bold text-[#1A1F2E] text-3xl mb-2">
                Welcome Back
              </h1>
              <p className="text-[#5A6473] text-sm">
                Please sign in to access your dashboard
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="your.email@company.com"
                  className={`w-full px-4 py-3 text-sm rounded-xl border
                             transition-all duration-150 outline-none
                             placeholder:text-[#9AA3AE] text-[#1A1F2E]
                             ${errors.email
                               ? "border-[#DC2626] bg-[#FEF2F2] focus:ring-2 focus:ring-[#DC2626]/20"
                               : "border-[#E2E6EA] bg-white focus:border-[#1B3A5C] focus:ring-2 focus:ring-[#1B3A5C]/15"
                             }`}
                />
                {errors.email && (
                  <p className="text-[#DC2626] text-xs mt-2 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#DC2626] text-white
                                     flex items-center justify-center text-[10px] font-bold">!</span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange("password")}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 pr-12 text-sm rounded-xl border
                               transition-all duration-150 outline-none
                               placeholder:text-[#9AA3AE] text-[#1A1F2E]
                               ${errors.password
                                 ? "border-[#DC2626] bg-[#FEF2F2] focus:ring-2 focus:ring-[#DC2626]/20"
                                 : "border-[#E2E6EA] bg-white focus:border-[#1B3A5C] focus:ring-2 focus:ring-[#1B3A5C]/15"
                               }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9AA3AE]
                               hover:text-[#5A6473] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[#DC2626] text-xs mt-2 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#DC2626] text-white
                                     flex items-center justify-center text-[10px] font-bold">!</span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={form.remember}
                    onChange={e => setForm(p => ({ ...p, remember: e.target.checked }))}
                    className="sr-only"
                  />
                  <div
                    onClick={() => setForm(p => ({ ...p, remember: !p.remember }))}
                    className={`w-5 h-5 rounded-md border-2 cursor-pointer
                               flex items-center justify-center transition-all duration-150
                               ${form.remember
                                 ? "bg-[#1B3A5C] border-[#1B3A5C]"
                                 : "bg-white border-[#C8CDD3] hover:border-[#1B3A5C]"
                               }`}
                  >
                    {form.remember && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                  </div>
                </div>
                <label
                  htmlFor="remember"
                  onClick={() => setForm(p => ({ ...p, remember: !p.remember }))}
                  className="text-sm text-[#5A6473] cursor-pointer select-none"
                >
                  Keep me signed in
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-3
                           py-3.5 px-4 rounded-xl text-sm font-bold font-heading
                           transition-all duration-200 mt-6
                           ${loading
                             ? "bg-[#142D47] text-white/70 cursor-not-allowed"
                             : "bg-gradient-to-r from-[#1B3A5C] to-[#0F2942] hover:from-[#0F2942] hover:to-[#1B3A5C] active:scale-[0.98] text-white shadow-lg hover:shadow-xl"
                           }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5 text-white/70"
                         xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                              stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Note */}
          <p className="text-center text-[#9AA3AE] text-xs mt-6">
            Users are created by system administrator only
          </p>
        </div>
      </div>
    </div>
  );
}
