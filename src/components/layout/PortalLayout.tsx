import { ReactNode } from "react";
import PortalSidebar from "./PortalSidebar";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <PortalSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pt-16 md:pt-6">{children}</div>
      </main>
    </div>
  );
}
