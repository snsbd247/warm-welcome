import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL, IS_LOVABLE_RUNTIME } from "@/lib/apiBaseUrl";
import { supabase } from "@/integrations/supabase/client";

interface CustomerSession {
  id: string;
  customer_id: string;
  name: string;
  phone: string;
  area: string;
  status: string;
  monthly_bill: number;
  package_id: string | null;
  photo_url: string | null;
  session_token: string;
  expires_at: string;
}

export interface CustomerProfile {
  id: string;
  customer_id: string;
  name: string;
  phone: string;
  area: string;
  road: string | null;
  house: string | null;
  city: string | null;
  email: string | null;
  package_id: string | null;
  monthly_bill: number;
  ip_address: string | null;
  pppoe_username: string | null;
  onu_mac: string | null;
  router_mac: string | null;
  installation_date: string | null;
  status: string;
  username: string | null;
  father_name: string | null;
  mother_name: string | null;
  occupation: string | null;
  nid: string | null;
  alt_phone: string | null;
  permanent_address: string | null;
  gateway: string | null;
  subnet: string | null;
  discount: number | null;
  connectivity_fee: number | null;
  due_date_day: number | null;
  photo_url: string | null;
}

interface CustomerAuthContextType {
  customer: CustomerSession | null;
  loading: boolean;
  signIn: (pppoeUsername: string, pppoePassword: string) => Promise<void>;
  signOut: () => void;
  fetchProfile: () => Promise<CustomerProfile | null>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);
const STORAGE_KEY = "customer_portal_session";

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);

  const verifyCustomerSession = useCallback(async (sessionToken: string, extra: Record<string, any> = {}) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/customer/verify`, {
        session_token: sessionToken,
        ...extra,
      });
      return data;
    } catch (err: any) {
      const isNetworkError = !err?.response && (err?.message === "Network Error" || err?.code === "ERR_NETWORK");
      if (!IS_LOVABLE_RUNTIME || !isNetworkError) throw err;

      const { data, error } = await supabase.functions.invoke("customer-verify", {
        body: {
          session_token: sessionToken,
          ...extra,
        },
      });

      if (error) throw new Error(error.message || "Session verification failed");
      return data;
    }
  }, []);

  useEffect(() => {
    const validateSession = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) { setLoading(false); return; }

      try {
        const session: CustomerSession = JSON.parse(saved);
        if (new Date(session.expires_at) < new Date()) {
          localStorage.removeItem(STORAGE_KEY);
          setLoading(false);
          return;
        }

        const res = await verifyCustomerSession(session.session_token);

        if (res?.valid) {
          setCustomer(session);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      setLoading(false);
    };
    validateSession();
  }, [verifyCustomerSession]);

  const signIn = async (pppoeUsername: string, pppoePassword: string) => {
    let data: any;

    try {
      const response = await axios.post(`${API_BASE_URL}/customer/login`, {
        pppoe_username: pppoeUsername,
        pppoe_password: pppoePassword,
      });
      data = response.data;
    } catch (err: any) {
      const isNetworkError = !err?.response && (err?.message === "Network Error" || err?.code === "ERR_NETWORK");
      if (!IS_LOVABLE_RUNTIME || !isNetworkError) {
        throw new Error(err?.response?.data?.error || err?.message || "Login failed");
      }

      const fallback = await supabase.functions.invoke("customer-login", {
        body: {
          pppoe_username: pppoeUsername,
          pppoe_password: pppoePassword,
        },
      });

      if (fallback.error) {
        throw new Error(fallback.error.message || "Login failed");
      }

      data = fallback.data;
    }

    const session: CustomerSession = {
      ...data.customer,
      monthly_bill: Number(data.customer.monthly_bill),
      session_token: data.session_token,
      expires_at: data.expires_at,
    };

    setCustomer(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  };

  const signOut = useCallback(() => {
    setCustomer(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const fetchProfile = useCallback(async (): Promise<CustomerProfile | null> => {
    if (!customer?.session_token) return null;

    try {
      const data = await verifyCustomerSession(customer.session_token, {
        include_profile: true,
      });
      return data.customer as CustomerProfile;
    } catch (err: any) {
      if (err.response?.status === 401) signOut();
      return null;
    }
  }, [customer?.session_token, signOut, verifyCustomerSession]);

  return (
    <CustomerAuthContext.Provider value={{ customer, loading, signIn, signOut, fetchProfile }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

const fallbackCustomerAuth: CustomerAuthContextType = {
  customer: null,
  loading: true,
  signIn: async () => { throw new Error("CustomerAuthProvider not mounted"); },
  signOut: () => {},
  fetchProfile: async () => null,
};

export const useCustomerAuth = () => {
  const ctx = useContext(CustomerAuthContext);
  return ctx ?? fallbackCustomerAuth;
};
