import axios from "axios";
import { API_BASE_URL, IS_LOVABLE_RUNTIME } from "@/lib/apiBaseUrl";
import { supabase } from "@/integrations/supabase/client";

interface FetchOptions {
  include_profile?: boolean;
  include_bills?: boolean;
  include_payments?: boolean;
  include_ledger?: boolean;
}

export async function fetchCustomerData(sessionToken: string, options: FetchOptions) {
  try {
    const { data } = await axios.post(`${API_BASE_URL}/customer/verify`, {
      session_token: sessionToken,
      ...options,
    });
    return data;
  } catch (err: any) {
    const isNetworkError = !err?.response && (err?.message === "Network Error" || err?.code === "ERR_NETWORK");
    if (!IS_LOVABLE_RUNTIME || !isNetworkError) throw err;

    const { data, error } = await supabase.functions.invoke("customer-verify", {
      body: {
        session_token: sessionToken,
        ...options,
      },
    });

    if (error) {
      throw new Error(error.message || "Failed to verify customer session");
    }

    return data;
  }
}
