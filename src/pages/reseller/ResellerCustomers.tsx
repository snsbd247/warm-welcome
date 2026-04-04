import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/client";
import { useResellerAuth } from "@/contexts/ResellerAuthContext";
import ResellerLayout from "@/components/reseller/ResellerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Users, Plus, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CustomerForm {
  name: string;
  phone: string;
  area: string;
  email: string;
  address: string;
  package_id: string;
  monthly_bill: string;
  connection_status: string;
  zone_id: string;
}

const emptyForm: CustomerForm = {
  name: "", phone: "", area: "", email: "", address: "",
  package_id: "", monthly_bill: "", connection_status: "offline", zone_id: "",
};

/** Generate a unique PPPoE username */
function generatePPPoEUsername(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CUST-${ts.slice(-4)}${rand}`;
}

/** Generate a secure random PPPoE password */
function generatePPPoEPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export default function ResellerCustomers() {
  const { reseller } = useResellerAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [generatedPPPoE, setGeneratedPPPoE] = useState<{ username: string; password: string } | null>(null);

  // Fetch reseller's allow_all_packages flag
  const { data: resellerInfo } = useQuery({
    queryKey: ["reseller-info", reseller?.id],
    queryFn: async () => {
      const { data } = await (db as any).from("resellers").select("allow_all_packages").eq("id", reseller!.id).single();
      return data;
    },
    enabled: !!reseller?.id,
  });

  const allowAll = resellerInfo?.allow_all_packages ?? false;

  // Fetch assigned package IDs for this reseller
  const { data: assignedPkgIds } = useQuery({
    queryKey: ["reseller-assigned-pkg-ids", reseller?.id],
    queryFn: async () => {
      const { data } = await (db as any).from("reseller_packages").select("package_id").eq("reseller_id", reseller!.id).eq("status", "active");
      return (data || []).map((r: any) => r.package_id) as string[];
    },
    enabled: !!reseller?.id && !allowAll,
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["reseller-packages", reseller?.tenant_id, allowAll, assignedPkgIds],
    queryFn: async () => {
      let q = (db as any).from("packages").select("id, name, monthly_price").eq("tenant_id", reseller!.tenant_id).eq("is_active", true).order("name");
      if (!allowAll && assignedPkgIds && assignedPkgIds.length > 0) {
        q = q.in("id", assignedPkgIds);
      } else if (!allowAll) {
        return [];
      }
      const { data } = await q;
      return (data || []).map((p: any) => ({ ...p, price: p.monthly_price }));
    },
    enabled: !!reseller?.tenant_id && (allowAll || assignedPkgIds !== undefined),
  });

  // Fetch reseller's own zones
  const { data: zones = [] } = useQuery({
    queryKey: ["reseller-zones", reseller?.id],
    queryFn: async () => {
      const { data } = await (db as any)
        .from("reseller_zones")
        .select("id, name")
        .eq("reseller_id", reseller!.id)
        .eq("tenant_id", reseller!.tenant_id)
        .eq("status", "active")
        .order("name");
      return data || [];
    },
    enabled: !!reseller?.id,
  });

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["reseller-customers", reseller?.id],
    queryFn: async () => {
      const { data, error } = await (db as any)
        .from("customers")
        .select("id, customer_id, name, phone, area, monthly_bill, connection_status, status, package_id, email, zone_id, packages(name, monthly_price), reseller_zones(name)")
        .eq("reseller_id", reseller!.id)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!reseller?.id,
  });

  const { data: walletData } = useQuery({
    queryKey: ["reseller-wallet-quick", reseller?.id],
    queryFn: async () => {
      const { data } = await (db as any).from("resellers").select("wallet_balance").eq("id", reseller!.id).single();
      return data;
    },
    enabled: !!reseller?.id,
  });

  const generateCustomerId = () => {
    const prefix = reseller?.company_name?.slice(0, 2).toUpperCase() || "RS";
    return `${prefix}${Date.now().toString().slice(-6)}`;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.phone || !form.area) throw new Error("Name, phone and area are required");

      const selectedPkg = packages.find((p: any) => p.id === form.package_id);
      const monthlyBill = parseFloat(form.monthly_bill) || (selectedPkg ? parseFloat(selectedPkg.price) : 0);

      if (editId) {
        // Update — reseller CANNOT change router_id, pppoe_username, pppoe_password
        const payload: any = {
          name: form.name,
          phone: form.phone,
          area: form.area,
          email: form.email || null,
          package_id: form.package_id || null,
          monthly_bill: monthlyBill,
          connection_status: form.connection_status,
          zone_id: form.zone_id || null,
          updated_at: new Date().toISOString(),
        };
        const { error } = await (db as any).from("customers").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        // Create — auto-generate PPPoE credentials
        const walletBalance = parseFloat(walletData?.wallet_balance) || 0;
        if (monthlyBill > 0 && walletBalance < monthlyBill) {
          throw new Error(`Insufficient wallet balance. Required: ৳${monthlyBill}, Available: ৳${walletBalance}`);
        }

        const pppoeUsername = generatePPPoEUsername();
        const pppoePassword = generatePPPoEPassword();

        const customerId = generateCustomerId();
        const { error } = await (db as any).from("customers").insert({
          customer_id: customerId,
          name: form.name,
          phone: form.phone,
          area: form.area,
          email: form.email || null,
          package_id: form.package_id || null,
          monthly_bill: monthlyBill,
          connection_status: form.connection_status,
          reseller_id: reseller!.id,
          tenant_id: reseller!.tenant_id,
          status: "active",
          zone_id: form.zone_id || null,
          pppoe_username: pppoeUsername,
          pppoe_password: pppoePassword,
        });
        if (error) throw error;

        // Store generated PPPoE for display
        setGeneratedPPPoE({ username: pppoeUsername, password: pppoePassword });

        // Deduct wallet balance
        if (monthlyBill > 0) {
          const newBalance = walletBalance - monthlyBill;
          await (db as any).from("reseller_wallet_transactions").insert({
            reseller_id: reseller!.id,
            tenant_id: reseller!.tenant_id,
            type: "debit",
            amount: monthlyBill,
            balance_after: newBalance,
            description: `Customer activation: ${form.name} (${customerId})`,
          });
          await (db as any).from("resellers").update({ wallet_balance: newBalance, updated_at: new Date().toISOString() }).eq("id", reseller!.id);
        }
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Customer updated" : "Customer created & wallet deducted");
      queryClient.invalidateQueries({ queryKey: ["reseller-customers"] });
      queryClient.invalidateQueries({ queryKey: ["reseller-wallet-quick"] });
      queryClient.invalidateQueries({ queryKey: ["reseller-dashboard"] });
      if (editId) {
        setDialogOpen(false);
        setForm(emptyForm);
        setEditId(null);
      }
      // For new customer, keep dialog open to show PPPoE credentials
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openEdit = (c: any) => {
    setEditId(c.id);
    setGeneratedPPPoE(null);
    setForm({
      name: c.name, phone: c.phone || "", area: c.area || "", email: c.email || "",
      address: "", package_id: c.package_id || "", monthly_bill: c.monthly_bill?.toString() || "",
      connection_status: c.connection_status || "offline", zone_id: c.zone_id || "",
    });
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditId(null);
    setGeneratedPPPoE(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setForm(emptyForm);
    setEditId(null);
    setGeneratedPPPoE(null);
  };

  const filtered = customers.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_id?.includes(search) ||
    c.phone?.includes(search)
  );

  const walletBalance = parseFloat(walletData?.wallet_balance) || 0;

  return (
    <ResellerLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> My Customers</h1>
            <p className="text-muted-foreground mt-1">
              {customers.length} customers · Wallet: <span className={walletBalance < 500 ? "text-destructive font-semibold" : "text-primary font-semibold"}>৳{walletBalance.toLocaleString()}</span>
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No customers found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Bill</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.customer_id}</TableCell>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell>{c.area}</TableCell>
                        <TableCell>{c.reseller_zones?.name || "—"}</TableCell>
                        <TableCell>{c.packages?.name || "—"}</TableCell>
                        <TableCell>৳{c.monthly_bill}</TableCell>
                        <TableCell>
                          <Badge variant={c.connection_status === "online" ? "default" : "secondary"}>{c.connection_status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>

          {/* Show generated PPPoE credentials after creation */}
          {generatedPPPoE && !editId && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 rounded-lg space-y-1">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">✅ Customer Created! PPPoE Credentials:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Username:</span>
                  <p className="font-mono font-semibold">{generatedPPPoE.username}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Password:</span>
                  <p className="font-mono font-semibold">{generatedPPPoE.password}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Save these credentials. Tenant admin will assign the MikroTik router.</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={closeDialog}>Close</Button>
            </div>
          )}

          {!generatedPPPoE && (
            <>
              {!editId && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Wallet: ৳{walletBalance.toLocaleString()} — PPPoE credentials will be auto-generated.
                </p>
              )}
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone *</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Area *</Label>
                    <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Package</Label>
                    <Select value={form.package_id} onValueChange={(v) => {
                      const pkg = packages.find((p: any) => p.id === v);
                      setForm({ ...form, package_id: v, monthly_bill: pkg?.price?.toString() || form.monthly_bill });
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                      <SelectContent>
                        {packages.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} — ৳{p.price}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Monthly Bill (৳)</Label>
                    <Input type="number" value={form.monthly_bill} onChange={(e) => setForm({ ...form, monthly_bill: e.target.value })} placeholder="Auto from package" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Zone</Label>
                    <Select value={form.zone_id} onValueChange={(v) => setForm({ ...form, zone_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                      <SelectContent>
                        {zones.map((z: any) => (
                          <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Connection Status</Label>
                    <Select value={form.connection_status} onValueChange={(v) => setForm({ ...form, connection_status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editId ? "Update" : "Create & Deduct Wallet"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ResellerLayout>
  );
}
