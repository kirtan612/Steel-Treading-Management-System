import { useSidebar } from "../../context/SidebarContext";
import { Menu, Search, Bell, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TopNavbar() {
  const { toggleMobile } = useSidebar();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

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

        {/* Notifications */}
        <button className="relative p-2 rounded-[6px] text-[#5A6473]
                           hover:bg-[#F7F8FA] hover:text-[#1A1F2E] transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#E85D26] text-white
                           text-[10px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
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
              AD
            </div>
            <span className="hidden sm:block text-sm font-medium text-[#1A1F2E]">
              Admin User
            </span>
            <ChevronDown size={14} className="hidden sm:block text-[#9AA3AE]" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E2E6EA]
                              rounded-[8px] shadow-card py-1 z-20">
                <button className="w-full text-left px-4 py-2 text-sm text-[#1A1F2E]
                                   hover:bg-[#F7F8FA] transition-colors">
                  Profile
                </button>
                <button
                  onClick={() => navigate("/settings")}
                  className="w-full text-left px-4 py-2 text-sm text-[#1A1F2E]
                             hover:bg-[#F7F8FA] transition-colors"
                >
                  Settings
                </button>
                <div className="my-1 border-t border-[#E2E6EA]" />
                <button
                  onClick={() => navigate("/login")}
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
