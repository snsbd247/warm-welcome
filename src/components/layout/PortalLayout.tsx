import { ReactNode } from "react";
import PortalSidebar from "./PortalSidebar";
import DynamicFooter from "@/components/DynamicFooter";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <PortalSidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <main className="flex-1">
          <div className="p-4 sm:p-6 max-w-5xl mx-auto pt-16 md:pt-6">{children}</div>
        </main>
        <DynamicFooter />
      </div>
    </div>
  );
}
