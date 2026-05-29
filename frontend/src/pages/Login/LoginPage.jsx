import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers, Package, ShoppingCart, BarChart3,
  Eye, EyeOff, ArrowRight, CheckCircle2,
  TrendingUp, Users, FileText, Shield
} from "lucide-react";

const FEATURES = [
  {
    icon: Package,
    title: "Inventory Control",
    desc: "Real-time stock tracking with low-stock alerts",
    stat: "89 SKUs tracked",
  },
  {
    icon: ShoppingCart,
    title: "Order Management",
    desc: "From order creation to delivery in one place",
    stat: "1,284 orders managed",
  },
  {
    icon: BarChart3,
    title: "Business Reports",
    desc: "Revenue insights and sales analytics",
    stat: "₹48L+ revenue tracked",
  },
];

const STATS = [
  { label: "Revenue This Month", value: "₹16.8L", icon: TrendingUp, color: "#E85D26" },
  { label: "Active Customers",   value: "342",     icon: Users,      color: "#2E7D52" },
  { label: "Pending Invoices",   value: "12",      icon: FileText,   color: "#D97706" },
];

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1200);
  };

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      
      {/* ─── LEFT PANEL ─── */}
      <div className="relative md:w-[42%] bg-[#1B3A5C] flex flex-col
                      justify-between overflow-hidden px-8 py-10 min-h-[300px] md:min-h-screen">
        
        {/* Background decorative SVG — pipe grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]"
             xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pipe-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="12" fill="none" stroke="white" strokeWidth="2"/>
              <line x1="30" y1="0" x2="30" y2="18" stroke="white" strokeWidth="2"/>
              <line x1="30" y1="42" x2="30" y2="60" stroke="white" strokeWidth="2"/>
              <line x1="0" y1="30" x2="18" y2="30" stroke="white" strokeWidth="2"/>
              <line x1="42" y1="30" x2="60" y2="30" stroke="white" strokeWidth="2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pipe-grid)"/>
        </svg>

        {/* Glowing blob accent */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full
                        bg-[#E85D26] opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full
                        bg-[#1D6FB5] opacity-15 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 bg-[#E85D26] rounded-[8px] flex items-center justify-center">
              <Layers size={18} className="text-white" />
            </div>
            <span className="text-white font-heading font-bold text-xl tracking-tight">
              SteelTrack ERP
            </span>
          </div>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs mt-3">
            Complete business management platform for steel pipe trading companies.
          </p>
        </div>

        {/* Live Stats Row */}
        <div className="relative z-10 grid grid-cols-3 gap-3 my-6">
          {STATS.map(({ label, value, icon: Icon, color }) => (
            <div key={label}
                 className="bg-white/[0.07] backdrop-blur-sm border border-white/10
                            rounded-[10px] p-3 text-center">
              <Icon size={16} className="mx-auto mb-1" style={{ color }} />
              <div className="text-white font-heading font-bold text-base leading-none">
                {value}
              </div>
              <div className="text-white/50 text-[10px] mt-0.5 leading-tight">{label}</div>
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="relative z-10 space-y-3">
          {FEATURES.map(({ icon: Icon, title, desc, stat }) => (
            <div key={title}
                 className="flex items-start gap-3 bg-white/[0.06] hover:bg-white/[0.1]
                            border border-white/10 rounded-[10px] px-4 py-3
                            transition-colors duration-200 cursor-default group">
              <div className="w-8 h-8 rounded-[8px] bg-[#E85D26]/20 border border-[#E85D26]/30
                              flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={15} className="text-[#E85D26]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm">{title}</div>
                <div className="text-white/55 text-xs mt-0.5 leading-relaxed">{desc}</div>
              </div>
              <div className="text-white/40 text-[10px] text-right whitespace-nowrap
                              group-hover:text-[#E85D26]/80 transition-colors pt-0.5">
                {stat}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 mt-6">
          <Shield size={13} className="text-white/30" />
          <span className="text-white/30 text-xs">
            SteelTrack v1.0 © 2025 · Secured with JWT
          </span>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-[#EBF1F8] text-[#1B3A5C]
                            text-xs font-medium px-3 py-1.5 rounded-full mb-4">
              <div className="w-1.5 h-1.5 bg-[#2E7D52] rounded-full animate-pulse" />
              System Online
            </div>
            <h1 className="font-heading font-bold text-[#1A1F2E] text-3xl mb-2">
              Welcome back
            </h1>
            <p className="text-[#5A6473] text-sm">
              Sign in to your SteelTrack account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="admin@steeltrack.com"
                className={`w-full px-3.5 py-2.5 text-sm rounded-[8px] border
                           transition-all duration-150 outline-none
                           placeholder:text-[#9AA3AE] text-[#1A1F2E]
                           ${errors.email
                             ? "border-[#DC2626] bg-[#FEF2F2] focus:ring-2 focus:ring-[#DC2626]/20"
                             : "border-[#E2E6EA] bg-white focus:border-[#1B3A5C] focus:ring-2 focus:ring-[#1B3A5C]/15"
                           }`}
              />
              {errors.email && (
                <p className="text-[#DC2626] text-xs mt-1.5 flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#DC2626] text-white
                                   flex items-center justify-center text-[9px] font-bold flex-shrink-0">!</span>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#1A1F2E]">Password</label>
                <button type="button"
                        className="text-xs text-[#E85D26] hover:text-[#C94D1E] font-medium
                                   transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="Enter your password"
                  className={`w-full px-3.5 py-2.5 pr-11 text-sm rounded-[8px] border
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA3AE]
                             hover:text-[#5A6473] transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[#DC2626] text-xs mt-1.5 flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#DC2626] text-white
                                   flex items-center justify-center text-[9px] font-bold flex-shrink-0">!</span>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
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
                  className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-[4px] border-2 cursor-pointer
                             flex items-center justify-center transition-all duration-150
                             ${form.remember
                               ? "bg-[#1B3A5C] border-[#1B3A5C]"
                               : "bg-white border-[#C8CDD3] hover:border-[#1B3A5C]"
                             }`}
                >
                  {form.remember && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                </div>
              </div>
              <label
                htmlFor="remember"
                onClick={() => setForm(p => ({ ...p, remember: !p.remember }))}
                className="text-sm text-[#5A6473] cursor-pointer select-none"
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2.5
                         py-2.5 px-4 rounded-[8px] text-sm font-semibold font-heading
                         transition-all duration-200 mt-2
                         ${loading
                           ? "bg-[#142D47] text-white/70 cursor-not-allowed"
                           : "bg-[#1B3A5C] hover:bg-[#142D47] active:scale-[0.98] text-white shadow-md hover:shadow-lg"
                         }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white/70"
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
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Credentials hint */}
          <div className="mt-6 p-3.5 bg-[#F7F8FA] border border-[#E2E6EA]
                          rounded-[8px] text-center">
            <p className="text-[#9AA3AE] text-xs mb-1 font-medium uppercase tracking-wide">
              Demo Credentials
            </p>
            <p className="text-[#5A6473] text-sm font-mono">
              admin@steeltrack.com
            </p>
            <p className="text-[#5A6473] text-sm font-mono">Admin123</p>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-4">
            {["256-bit SSL", "GDPR Safe", "JWT Auth"].map(badge => (
              <div key={badge} className="flex items-center gap-1 text-[#9AA3AE] text-xs">
                <CheckCircle2 size={12} className="text-[#2E7D52]" />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
