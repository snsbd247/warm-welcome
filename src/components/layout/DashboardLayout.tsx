import React, { ReactNode } from "react";
import AppSidebar from "./AppSidebar";

const DashboardLayout = React.forwardRef<HTMLDivElement, { children: ReactNode }>(
  ({ children }, ref) => {
    return (
      <div ref={ref} className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    );
  }
);
DashboardLayout.displayName = "DashboardLayout";

export default DashboardLayout;
