import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Only store minimal, non-sensitive fields in localStorage
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

// Full profile with sensitive fields — only fetched on demand from server
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

  // Validate session on load
  useEffect(() => {
    const validateSession = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setLoading(false);
        return;
      }

      try {
        const session: CustomerSession = JSON.parse(saved);

        // Client-side expiry check
        if (new Date(session.expires_at) < new Date()) {
          localStorage.removeItem(STORAGE_KEY);
          setLoading(false);
          return;
        }

        // Server-side validation
        const res = await fetch(`${SUPABASE_URL}/functions/v1/customer-verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_token: session.session_token }),
        });

        if (res.ok) {
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
  }, []);

  const signIn = async (pppoeUsername: string, pppoePassword: string) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/customer-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pppoe_username: pppoeUsername, pppoe_password: pppoePassword }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "Login failed");
    }

    const data = result.customer;
    const session: CustomerSession = {
      id: data.id,
      customer_id: data.customer_id,
      name: data.name,
      phone: data.phone,
      area: data.area,
      status: data.status,
      monthly_bill: Number(data.monthly_bill),
      package_id: data.package_id,
      photo_url: data.photo_url,
      session_token: result.session_token,
      expires_at: result.expires_at,
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
      const res = await fetch(`${SUPABASE_URL}/functions/v1/customer-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: customer.session_token, include_profile: true }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          signOut();
        }
        return null;
      }

      const data = await res.json();
      return data.customer as CustomerProfile;
    } catch {
      return null;
    }
  }, [customer?.session_token, signOut]);

  return (
    <CustomerAuthContext.Provider value={{ customer, loading, signIn, signOut, fetchProfile }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export const useCustomerAuth = () => {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
};
