import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Building2, Plus, Loader2, Pause, Play, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function TenantsManagement() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ company_name: "", subdomain: "", contact_email: "", max_customers: "500" });

  const { data: tenants, isLoading } = useQuery({
    queryKey: ["sa-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: plans } = useQuery({
    queryKey: ["sa-plans-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscription_plans" as any).select("id, name").eq("is_active", true);
      if (error) throw error;
      return data as any[];
    },
  });

  const createTenant = useMutation({
    mutationFn: async () => {
      const subdomain = form.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (!subdomain || !form.company_name) throw new Error("Company name and subdomain are required");

      const { data, error } = await supabase.from("tenants" as any).insert({
        company_name: form.company_name,
        subdomain,
        contact_email: form.contact_email || null,
        max_customers: parseInt(form.max_customers) || 500,
      }).select().single();
      if (error) throw error;

      // Create default general_settings for tenant
      await supabase.from("general_settings" as any).insert({
        site_name: form.company_name,
        email: form.contact_email || null,
        tenant_id: (data as any).id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sa-tenants"] });
      toast.success("Tenant created successfully");
      setOpen(false);
      setForm({ company_name: "", subdomain: "", contact_email: "", max_customers: "500" });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "active" ? "suspended" : "active";
      const { error } = await supabase.from("tenants" as any).update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sa-tenants"] });
      toast.success("Tenant status updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <SuperAdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tenants</h1>
          <p className="text-muted-foreground mt-1">Manage ISP tenants on the platform</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Create Tenant</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New ISP Tenant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Company Name *</Label>
                <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="ABC Networks" />
              </div>
              <div>
                <Label>Subdomain *</Label>
                <div className="flex items-center gap-2">
                  <Input value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="abc" />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">.yourdomain.com</span>
                </div>
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="admin@abc.com" />
              </div>
              <div>
                <Label>Max Customers</Label>
                <Input type="number" value={form.max_customers} onChange={(e) => setForm({ ...form, max_customers: e.target.value })} />
              </div>
              <Button onClick={() => createTenant.mutate()} disabled={createTenant.isPending} className="w-full">
                {createTenant.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Tenant
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !tenants?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No tenants yet. Create your first ISP tenant.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Max Customers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.company_name}</TableCell>
                    <TableCell>{t.subdomain}</TableCell>
                    <TableCell>{t.contact_email || "—"}</TableCell>
                    <TableCell>{t.max_customers}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === "active" ? "default" : "destructive"}>{t.status}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(t.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStatus.mutate({ id: t.id, status: t.status })}
                        title={t.status === "active" ? "Suspend" : "Activate"}
                      >
                        {t.status === "active" ? <Pause className="h-4 w-4 text-warning" /> : <Play className="h-4 w-4 text-success" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </SuperAdminLayout>
  );
}
