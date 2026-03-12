import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Loader2, Package } from "lucide-react";

export default function PlansManagement() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", max_customers: "100", max_users: "5", monthly_price: "999", yearly_price: "9990" });

  const { data: plans, isLoading } = useQuery({
    queryKey: ["sa-plans-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscription_plans" as any).select("*").order("monthly_price", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const createPlan = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("subscription_plans" as any).insert({
        name: form.name,
        description: form.description || null,
        max_customers: parseInt(form.max_customers),
        max_users: parseInt(form.max_users),
        monthly_price: parseFloat(form.monthly_price),
        yearly_price: parseFloat(form.yearly_price),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sa-plans-all"] });
      toast.success("Plan created");
      setOpen(false);
      setForm({ name: "", description: "", max_customers: "100", max_users: "5", monthly_price: "999", yearly_price: "9990" });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("subscription_plans" as any).update({ is_active: !is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sa-plans-all"] });
      toast.success("Plan updated");
    },
  });

  return (
    <SuperAdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscription Plans</h1>
          <p className="text-muted-foreground mt-1">Manage platform subscription plans for ISPs</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Create Plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Subscription Plan</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Plan Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Professional" /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Max Customers</Label><Input type="number" value={form.max_customers} onChange={(e) => setForm({ ...form, max_customers: e.target.value })} /></div>
                <div><Label>Max Users</Label><Input type="number" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Monthly Price (৳)</Label><Input type="number" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} /></div>
                <div><Label>Yearly Price (৳)</Label><Input type="number" value={form.yearly_price} onChange={(e) => setForm({ ...form, yearly_price: e.target.value })} /></div>
              </div>
              <Button onClick={() => createPlan.mutate()} disabled={createPlan.isPending} className="w-full">
                {createPlan.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Create Plan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : !plans?.length ? (
            <div className="text-center py-12 text-muted-foreground"><Package className="h-10 w-10 mx-auto mb-3 opacity-50" /><p>No plans yet.</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Max Customers</TableHead>
                  <TableHead>Max Users</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Yearly</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.max_customers}</TableCell>
                    <TableCell>{p.max_users}</TableCell>
                    <TableCell>৳{Number(p.monthly_price).toLocaleString()}</TableCell>
                    <TableCell>৳{Number(p.yearly_price).toLocaleString()}</TableCell>
                    <TableCell>
                      <Switch checked={p.is_active} onCheckedChange={() => toggleActive.mutate({ id: p.id, is_active: p.is_active })} />
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
