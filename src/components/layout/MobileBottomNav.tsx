import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Receipt, CreditCard, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/billing", icon: Receipt, label: "Billing" },
  { to: "/payments", icon: CreditCard, label: "Payments" },
  { to: "/reporting/daily", icon: BarChart3, label: "Reports" },
];

export default function MobileBottomNav() {
  const location = useLocation();

  // Don't show on login, portal, super admin, or landing pages
  const hiddenPaths = ["/admin/login", "/login", "/portal", "/super", "/landing", "/pay-bill"];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {mobileNavItems.map(item => {
          const isActive = item.to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
