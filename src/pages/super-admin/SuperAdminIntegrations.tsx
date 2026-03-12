import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, Send, Eye, EyeOff, Wifi, WifiOff, TestTube, Mail, CreditCard, MessageSquare, Globe } from "lucide-react";

// ─── SMTP Tab ───────────────────────────────────────────────
const SMTP_KEYS = ["smtp_host", "smtp_port", "smtp_username", "smtp_password", "smtp_encryption", "smtp_from_email", "smtp_from_name"];

function SmtpSection() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [form, setForm] = useState<Record<string, string>>({
    smtp_host: "", smtp_port: "587", smtp_username: "", smtp_password: "",
    smtp_encryption: "tls", smtp_from_email: "", smtp_from_name: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["sa-smtp-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", SMTP_KEYS);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data as any[])?.forEach((r: any) => { map[r.setting_key] = r.setting_value || ""; });
      return map;
    },
  });

  useEffect(() => {
    if (data) setForm(prev => ({ ...prev, ...data, smtp_password: data.smtp_password ? "••••••••" : "" }));
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const key of SMTP_KEYS) {
        if (key === "smtp_password" && form[key] === "••••••••") continue;
        const { data: existing } = await supabase.from("system_settings").select("id").eq("setting_key", key).maybeSingle();
        if (existing) {
          await supabase.from("system_settings").update({ setting_value: form[key], updated_at: new Date().toISOString() }).eq("setting_key", key);
        } else {
          await supabase.from("system_settings").insert({ setting_key: key, setting_value: form[key] });
        }
      }
      toast.success("SMTP settings saved");
      queryClient.invalidateQueries({ queryKey: ["sa-smtp-settings"] });
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    if (!testEmail) { toast.error("Enter a test email"); return; }
    setTesting(true);
    try {
      const { error } = await supabase.functions.invoke("send-email", {
        body: { to: testEmail, subject: "SMTP Test - ISP Platform", body: "SMTP configuration is working correctly." },
      });
      if (error) throw error;
      toast.success("Test email sent!");
    } catch (err: any) { toast.error(err.message); }
    finally { setTesting(false); }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> SMTP Server Configuration</CardTitle>
          <CardDescription>Central email server used by all tenants for system emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>SMTP Host</Label><Input value={form.smtp_host} onChange={e => setForm({ ...form, smtp_host: e.target.value })} placeholder="smtp.gmail.com" /></div>
            <div className="space-y-1.5"><Label>SMTP Port</Label><Input value={form.smtp_port} onChange={e => setForm({ ...form, smtp_port: e.target.value })} placeholder="587" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Username</Label><Input value={form.smtp_username} onChange={e => setForm({ ...form, smtp_username: e.target.value })} placeholder="user@gmail.com" /></div>
            <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={form.smtp_password} onChange={e => setForm({ ...form, smtp_password: e.target.value })} placeholder="App password" /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Encryption</Label>
            <Select value={form.smtp_encryption} onValueChange={v => setForm({ ...form, smtp_encryption: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tls">TLS</SelectItem>
                <SelectItem value="ssl">SSL</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>From Email</Label><Input type="email" value={form.smtp_from_email} onChange={e => setForm({ ...form, smtp_from_email: e.target.value })} placeholder="noreply@isp.com" /></div>
            <div className="space-y-1.5"><Label>From Name</Label><Input value={form.smtp_from_name} onChange={e => setForm({ ...form, smtp_from_name: e.target.value })} placeholder="ISP Platform" /></div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save SMTP
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Test Email</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com" className="flex-1" />
            <Button onClick={handleTest} disabled={testing} variant="outline">
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Send Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Payment Gateway Tab (bKash + Nagad) ────────────────────
function PaymentGatewaySection({ gatewayName, label }: { gatewayName: string; label: string }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const baseUrls: Record<string, Record<string, string>> = {
    bkash: { sandbox: "https://tokenized.sandbox.bka.sh/v1.2.0-beta", live: "https://tokenized.pay.bka.sh/v1.2.0-beta" },
    nagad: { sandbox: "https://sandbox.mynagad.com:10061/remote-payment-gateway-1.0/api/dfs", live: "https://api.mynagad.com/api/dfs" },
  };

  const [form, setForm] = useState({
    app_key: "", app_secret: "", username: "", password: "",
    merchant_number: "", environment: "sandbox", base_url: baseUrls[gatewayName]?.sandbox || "",
  });

  const { data: gateway, isLoading } = useQuery({
    queryKey: ["sa-gateway", gatewayName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_gateways")
        .select("*")
        .eq("gateway_name", gatewayName)
        .is("tenant_id", null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (gateway) {
      setForm({
        app_key: gateway.app_key || "",
        app_secret: gateway.app_secret ? "••••••••" : "",
        username: gateway.username || "",
        password: gateway.password ? "••••••••" : "",
        merchant_number: gateway.merchant_number || "",
        environment: gateway.environment || "sandbox",
        base_url: gateway.base_url || baseUrls[gatewayName]?.sandbox || "",
      });
    }
  }, [gateway]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        gateway_name: gatewayName,
        app_key: form.app_key,
        username: form.username,
        merchant_number: form.merchant_number,
        environment: form.environment,
        base_url: form.base_url,
        tenant_id: null,
        updated_at: new Date().toISOString(),
      };
      if (form.app_secret !== "••••••••") payload.app_secret = form.app_secret;
      if (form.password !== "••••••••") payload.password = form.password;

      if (gateway) {
        await supabase.from("payment_gateways").update(payload).eq("id", gateway.id);
      } else {
        if (form.app_secret !== "••••••••") payload.app_secret = form.app_secret;
        if (form.password !== "••••••••") payload.password = form.password;
        await supabase.from("payment_gateways").insert(payload);
      }
      toast.success(`${label} settings saved`);
      queryClient.invalidateQueries({ queryKey: ["sa-gateway", gatewayName] });
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> {label} API Configuration</CardTitle>
          <Badge variant={gateway?.status === "connected" ? "default" : "secondary"}>
            {gateway?.status === "connected" ? <><Wifi className="h-3 w-3 mr-1" /> Connected</> : <><WifiOff className="h-3 w-3 mr-1" /> Disconnected</>}
          </Badge>
        </div>
        <CardDescription>Central {label} payment gateway shared by all tenants</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>App Key</Label><Input value={form.app_key} onChange={e => setForm({ ...form, app_key: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>App Secret</Label>
            <div className="relative">
              <Input type={showSecret ? "text" : "password"} value={form.app_secret} onChange={e => setForm({ ...form, app_secret: e.target.value })} />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-10 w-10" onClick={() => setShowSecret(!showSecret)}>
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Username</Label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Merchant Number</Label><Input value={form.merchant_number} onChange={e => setForm({ ...form, merchant_number: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>Environment</Label>
            <Select value={form.environment} onValueChange={v => setForm({ ...form, environment: v, base_url: baseUrls[gatewayName]?.[v] || "" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5"><Label>Base URL</Label><Input value={form.base_url} onChange={e => setForm({ ...form, base_url: e.target.value })} /></div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save {label}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── SMS Gateway Tab ────────────────────────────────────────
function SmsGatewaySection() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const SMS_KEYS = ["sms_gateway_url", "sms_api_key", "sms_sender_id"];

  const [form, setForm] = useState<Record<string, string>>({
    sms_gateway_url: "", sms_api_key: "", sms_sender_id: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["sa-sms-gateway"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", SMS_KEYS);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data as any[])?.forEach((r: any) => { map[r.setting_key] = r.setting_value || ""; });
      return map;
    },
  });

  useEffect(() => {
    if (data) setForm(prev => ({ ...prev, ...data }));
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const key of SMS_KEYS) {
        const { data: existing } = await supabase.from("system_settings").select("id").eq("setting_key", key).maybeSingle();
        if (existing) {
          await supabase.from("system_settings").update({ setting_value: form[key], updated_at: new Date().toISOString() }).eq("setting_key", key);
        } else {
          await supabase.from("system_settings").insert({ setting_key: key, setting_value: form[key] });
        }
      }
      toast.success("SMS gateway settings saved");
      queryClient.invalidateQueries({ queryKey: ["sa-sms-gateway"] });
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> SMS Gateway Configuration</CardTitle>
        <CardDescription>Central SMS gateway shared by all tenants for notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5"><Label>Gateway URL</Label><Input value={form.sms_gateway_url} onChange={e => setForm({ ...form, sms_gateway_url: e.target.value })} placeholder="https://api.greenweb.com.bd/api.php" /></div>
        <div className="space-y-1.5"><Label>API Key / Token</Label><Input type="password" value={form.sms_api_key} onChange={e => setForm({ ...form, sms_api_key: e.target.value })} placeholder="Your API key" /></div>
        <div className="space-y-1.5"><Label>Sender ID</Label><Input value={form.sms_sender_id} onChange={e => setForm({ ...form, sms_sender_id: e.target.value })} placeholder="SmartISP" /></div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save SMS Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function SuperAdminIntegrations() {
  return (
    <SuperAdminLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Globe className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Integrations</h1>
            <p className="text-muted-foreground text-sm">Centralized configurations shared by all tenants</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="smtp" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="smtp" className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> SMTP</TabsTrigger>
          <TabsTrigger value="bkash" className="flex items-center gap-1.5"><CreditCard className="h-4 w-4" /> bKash</TabsTrigger>
          <TabsTrigger value="nagad" className="flex items-center gap-1.5"><CreditCard className="h-4 w-4" /> Nagad</TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="smtp"><SmtpSection /></TabsContent>
        <TabsContent value="bkash"><PaymentGatewaySection gatewayName="bkash" label="bKash" /></TabsContent>
        <TabsContent value="nagad"><PaymentGatewaySection gatewayName="nagad" label="Nagad" /></TabsContent>
        <TabsContent value="sms"><SmsGatewaySection /></TabsContent>
      </Tabs>
    </SuperAdminLayout>
  );
}
