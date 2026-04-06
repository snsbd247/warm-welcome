import { ReactNode } from "react";
import PortalSidebar from "./PortalSidebar";
import DynamicFooter from "@/components/DynamicFooter";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <PortalSidebar />
      <div className="flex-1 flex flex-col overflow-auto main-scroll">
        <main className="flex-1">
          <div className="p-4 sm:p-6 max-w-5xl mx-auto pt-16 md:pt-6 pb-20 md:pb-6 animate-page-enter">{children}</div>
        </main>
        <DynamicFooter />
      </div>
    </div>
  );
}
