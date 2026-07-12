import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  FileText, BarChart3, Settings, LogOut,
  ChevronLeft, ChevronRight, Layers, Truck
} from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";

const NAV_ITEMS = [
  { path: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { path: "/inventory",  label: "Inventory",  icon: Package },
  { path: "/customers",  label: "Customers",  icon: Users },
  { path: "/orders",     label: "Orders",     icon: ShoppingCart },
  { path: "/delivery-challans", label: "Delivery Challans", icon: Truck },
  { path: "/invoices",   label: "Invoices",   icon: FileText },
  { path: "/reports",    label: "Reports",    icon: BarChart3 },
];

const BOTTOM_ITEMS = [
  { path: "/settings", label: "Settings", icon: Settings },
];

function NavItem({ path, label, icon: Icon, isExpanded, onClick }) {
  return (
    <div className="relative group">
      <NavLink
        to={path}
        onClick={onClick}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-[6px] transition-all duration-150 cursor-pointer
           ${isActive
             ? "bg-white/15 text-white border-l-[3px] border-[#E85D26] pl-[calc(0.75rem-3px)]"
             : "text-white/70 hover:text-white hover:bg-white/10 border-l-[3px] border-transparent"
           }
           ${!isExpanded ? "justify-center px-0 w-10 mx-auto" : ""}`
        }
      >
        <Icon size={18} className="flex-shrink-0" />
        {isExpanded && (
          <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300">
            {label}
          </span>
        )}
      </NavLink>

      {/* Tooltip — only when collapsed */}
      {!isExpanded && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5
                        bg-[#0F2237] text-white text-xs rounded-[6px] whitespace-nowrap
                        opacity-0 group-hover:opacity-100 pointer-events-none
                        transition-opacity duration-150 z-50 shadow-lg">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4
                          border-transparent border-r-[#0F2237]" />
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { isExpanded, isMobileOpen, toggleSidebar, closeMobile } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = () => {
    closeMobile();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          bg-[#1B3A5C] flex flex-col
          transition-all duration-300 ease-in-out flex-shrink-0
          ${isExpanded ? "w-60" : "w-16"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          h-screen
        `}
      >
        {/* Logo + Toggle */}
        <div className={`flex items-center h-16 px-3 border-b border-white/10
                         ${isExpanded ? "justify-between" : "justify-center"}`}>
          {isExpanded && (
            <div className="flex items-center gap-2 overflow-hidden">
              <Layers size={20} className="text-[#E85D26] flex-shrink-0" />
              <span className="text-white font-heading font-bold text-base whitespace-nowrap">
                SteelTrack ERP
              </span>
            </div>
          )}

          {/* Toggle button */}
          <button
            onClick={toggleSidebar}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center
                       text-white/60 hover:text-white hover:bg-white/10
                       transition-colors duration-150 flex-shrink-0"
            title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded
              ? <ChevronLeft size={16} />
              : <ChevronRight size={16} />
            }
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.path}
              {...item}
              isExpanded={isExpanded}
              onClick={closeMobile}
            />
          ))}

          <div className="my-3 border-t border-white/10" />

          {BOTTOM_ITEMS.map(item => (
            <NavItem
              key={item.path}
              {...item}
              isExpanded={isExpanded}
              onClick={closeMobile}
            />
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-white/10">
          <div className="relative group">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px]
                          text-white/70 hover:text-white hover:bg-white/10
                          transition-all duration-150
                          ${!isExpanded ? "justify-center px-0 w-10 mx-auto" : ""}`}
            >
              <LogOut size={18} className="flex-shrink-0" />
              {isExpanded && <span className="text-sm font-medium">Logout</span>}
            </button>

            {!isExpanded && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5
                              bg-[#0F2237] text-white text-xs rounded-[6px] whitespace-nowrap
                              opacity-0 group-hover:opacity-100 pointer-events-none
                              transition-opacity duration-150 z-50 shadow-lg">
                Logout
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4
                                border-transparent border-r-[#0F2237]" />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
