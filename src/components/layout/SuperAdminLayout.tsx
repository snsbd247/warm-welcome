import { ReactNode } from "react";
import SuperAdminSidebar from "./SuperAdminSidebar";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <main className="flex-1">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto pt-16 md:pt-6">{children}</div>
        </main>
        <footer className="border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">
          Smart ISP Platform &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
