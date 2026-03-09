import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface FetchOptions {
  include_profile?: boolean;
  include_bills?: boolean;
  include_payments?: boolean;
  include_ledger?: boolean;
}

export async function fetchCustomerData(sessionToken: string, options: FetchOptions) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/customer-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_token: sessionToken, ...options }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }

  return res.json();
}
