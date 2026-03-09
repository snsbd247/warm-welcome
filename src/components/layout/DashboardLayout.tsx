import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        {/* pt-14 on mobile for fixed header, md:pt-0 for desktop */}
        <div className="p-4 sm:p-6 max-w-7xl mx-auto pt-16 md:pt-6">{children}</div>
      </main>
    </div>
  );
}
