import { useSidebar } from "../../context/SidebarContext";
import { Menu, Search, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import toast from "react-hot-toast";

export default function TopNavbar() {
  const { toggleMobile } = useSidebar();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.name || "Admin User";
  const initials = userName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout API call failed, continuing with client-side cleanup", error);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-[#E2E6EA] flex items-center
                       px-4 gap-4 flex-shrink-0 z-30">
      {/* Mobile hamburger */}
      <button
        onClick={toggleMobile}
        className="md:hidden p-2 rounded-[6px] text-[#5A6473] hover:bg-[#F7F8FA]
                   hover:text-[#1A1F2E] transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="hidden md:flex flex-1 max-w-md relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3AE]" />
        <input
          type="text"
          placeholder="Search orders, customers, inventory..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-[#F7F8FA] border border-[#E2E6EA]
                     rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20
                     focus:border-[#1B3A5C] transition-all placeholder:text-[#9AA3AE]"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Mobile search icon */}
        <button className="md:hidden p-2 rounded-[6px] text-[#5A6473] hover:bg-[#F7F8FA]">
          <Search size={18} />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(p => !p)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-[6px]
                       hover:bg-[#F7F8FA] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#EBF1F8] text-[#1B3A5C]
                            flex items-center justify-center text-xs font-bold font-heading">
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-medium text-[#1A1F2E]">
              {userName}
            </span>
            <ChevronDown size={14} className="hidden sm:block text-[#9AA3AE]" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E2E6EA]
                              rounded-[8px] shadow-card py-1 z-20">
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#1A1F2E]
                             hover:bg-[#F7F8FA] transition-colors"
                >
                  Profile & Settings
                </button>
                <div className="my-1 border-t border-[#E2E6EA]" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-[#DC2626]
                             hover:bg-[#FEF2F2] transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
