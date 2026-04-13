import { lazy } from "react";
import { Navigate } from "react-router-dom";
import { isTenantDomain } from "@/lib/tenantDomain";

const LandingPage = lazy(() => import("@/pages/LandingPage"));

/**
 * Smart home route:
 * - Central domain (smartispapp.com) → Landing page
 * - Tenant domain (subdomain/custom) → Customer login portal
 */
export default function SmartHomeRoute() {
  if (isTenantDomain()) {
    return <Navigate to="/portal/login" replace />;
  }
  return <LandingPage />;
}
