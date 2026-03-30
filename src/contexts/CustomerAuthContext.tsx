import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { IS_LOVABLE } from "@/lib/environment";
import { supabase } from "@/integrations/supabase/client";
import api from "@/lib/api";

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

  const verifySession = useCallback(async (sessionToken: string, extra: Record<string, any> = {}) => {
    if (IS_LOVABLE) {
      // Supabase: check customer_sessions table
      const { data: session } = await supabase
        .from('customer_sessions')
        .select('*, customers(*)')
        .eq('session_token', sessionToken)
        .gte('expires_at', new Date().toISOString())
        .single();
      if (!session) throw new Error('Invalid session');
      return { valid: true, customer: session.customers };
    }
    const { data } = await api.post("/customer/verify", { session_token: sessionToken, ...extra });
    return data;
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
        const res = await verifySession(session.session_token);
        if (res?.valid) setCustomer(session);
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      setLoading(false);
    };
    validateSession();
  }, [verifySession]);

  const signIn = async (pppoeUsername: string, pppoePassword: string) => {
    if (IS_LOVABLE) {
      // Supabase: find customer by pppoe_username, verify password
      const { data: cust, error } = await supabase
        .from('customers')
        .select('*')
        .eq('pppoe_username', pppoeUsername)
        .single();
      if (error || !cust) throw new Error('Customer not found');

      // Simple password check (plaintext match for Lovable demo)
      if (cust.pppoe_password !== pppoePassword) throw new Error('Invalid password');

      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('customer_sessions').insert({
        customer_id: cust.id,
        session_token: token,
        expires_at: expiresAt,
      });

      const session: CustomerSession = {
        id: cust.id,
        customer_id: cust.customer_id,
        name: cust.name,
        phone: cust.phone,
        area: cust.area,
        status: cust.status,
        monthly_bill: Number(cust.monthly_bill),
        package_id: cust.package_id,
        photo_url: cust.photo_url,
        session_token: token,
        expires_at: expiresAt,
      };
      setCustomer(session);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return;
    }

    // Laravel
    const { data } = await api.post("/customer/login", {
      pppoe_username: pppoeUsername,
      pppoe_password: pppoePassword,
    });
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
      if (IS_LOVABLE) {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customer.id)
          .single();
        return data as CustomerProfile;
      }
      const data = await verifySession(customer.session_token, { include_profile: true });
      return data.customer as CustomerProfile;
    } catch (err: any) {
      if (err.response?.status === 401) signOut();
      return null;
    }
  }, [customer?.session_token, customer?.id, signOut, verifySession]);

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
