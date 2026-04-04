import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/client";
import { superAdminApi } from "@/lib/superAdminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Clock, CheckCircle, XCircle, Eye, Building2, Mail, Phone,
  Loader2, Search, Filter, RefreshCw, Package,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  expired: { label: "Expired", variant: "outline" },
};

export default function SuperDemoRequests() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approveDialog, setApproveDialog] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Fetch demo requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["demo-requests"],
    queryFn: async () => {
      const { data, error } = await (db as any)
        .from("demo_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch modules for selection
  const { data: modules = [] } = useQuery({
    queryKey: ["all-modules"],
    queryFn: async () => {
      const { data, error } = await (db as any)
        .from("modules")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  // Approve mutation
  const approveMut = useMutation({
    mutationFn: async () => {
      if (!selectedRequest) return;

      // 1. Create tenant
      const tenant = await superAdminApi.createTenant({
        name: selectedRequest.company_name,
        email: selectedRequest.email,
        phone: selectedRequest.phone || "",
        subdomain: selectedRequest.subdomain || selectedRequest.company_name.toLowerCase().replace(/[^a-z0-9]/g, ""),
        admin_name: selectedRequest.contact_name,
        admin_email: selectedRequest.email,
        admin_password: "demo123456",
      });
      const tenantId = Array.isArray(tenant) ? tenant[0]?.id : tenant?.id;

      // 2. Set trial status
      try { await superAdminApi.updateTenant(tenantId, { status: "trial" }); } catch {}

      // 3. Update demo request
      const { error } = await (db as any)
        .from("demo_requests")
        .update({
          status: "approved",
          approved_modules: selectedModules,
          approved_at: new Date().toISOString(),
          tenant_id: tenantId,
          notes,
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", selectedRequest.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("✅ Demo approved & tenant created!");
      setApproveDialog(false);
      setSelectedRequest(null);
      setSelectedModules([]);
      setNotes("");
      qc.invalidateQueries({ queryKey: ["demo-requests"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to approve"),
  });

  // Reject mutation
  const rejectMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (db as any)
        .from("demo_requests")
        .update({ status: "rejected", notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Demo request rejected");
      qc.invalidateQueries({ queryKey: ["demo-requests"] });
    },
  });

  const filtered = requests.filter((r: any) => {
    const matchSearch = !search || 
      r.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.contact_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openApprove = (req: any) => {
    setSelectedRequest(req);
    // Pre-select core modules
    setSelectedModules(modules.filter((m: any) => m.is_core).map((m: any) => m.slug));
    setNotes("");
    setApproveDialog(true);
  };

  const toggleModule = (slug: string) => {
    setSelectedModules(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r: any) => r.status === "pending").length,
    approved: requests.filter((r: any) => r.status === "approved").length,
    rejected: requests.filter((r: any) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Demo Requests</h1>
        <p className="text-muted-foreground">ল্যান্ডিং পেজ থেকে আসা ডেমো রিকুয়েস্টগুলো ম্যানেজ করুন</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Building2, color: "text-foreground" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-600" },
          { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-green-600" },
          { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-600" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
              {s === "all" ? "All" : STATUS_MAP[s]?.label || s}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["demo-requests"] })}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Request List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No demo requests found</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req: any) => {
            const st = STATUS_MAP[req.status] || STATUS_MAP.pending;
            return (
              <Card key={req.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">{req.company_name}</span>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{req.email}</span>
                        {req.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{req.phone}</span>}
                        <span>{req.contact_name}</span>
                      </div>
                      {req.message && <p className="text-xs text-muted-foreground mt-1">"{req.message}"</p>}
                      <p className="text-xs text-muted-foreground">
                        Submitted: {format(new Date(req.created_at), "dd MMM yyyy, hh:mm a")}
                        {req.approved_at && ` • Approved: ${format(new Date(req.approved_at), "dd MMM yyyy")}`}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {req.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => openApprove(req)}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => rejectMut.mutate(req.id)}>
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {req.status === "approved" && req.approved_modules?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Package className="h-3 w-3 mr-1" /> {req.approved_modules.length} modules
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve Dialog with Module Selection */}
      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve Demo — {selectedRequest?.company_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Request Info */}
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <p><strong>Contact:</strong> {selectedRequest?.contact_name}</p>
              <p><strong>Email:</strong> {selectedRequest?.email}</p>
              {selectedRequest?.phone && <p><strong>Phone:</strong> {selectedRequest?.phone}</p>}
              {selectedRequest?.message && <p><strong>Message:</strong> {selectedRequest?.message}</p>}
            </div>

            {/* Module Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Modules for Demo</Label>
              <p className="text-xs text-muted-foreground">কোন কোন মডিউল এই ডেমো টেন্যান্ট দেখতে পারবে সিলেক্ট করুন</p>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                {modules.map((mod: any) => (
                  <label
                    key={mod.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedModules.includes(mod.slug) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    } ${mod.is_core ? "opacity-70" : ""}`}
                  >
                    <Checkbox
                      checked={selectedModules.includes(mod.slug)}
                      onCheckedChange={() => toggleModule(mod.slug)}
                      disabled={mod.is_core}
                    />
                    <div>
                      <p className="text-sm font-medium">{mod.name}</p>
                      {mod.is_core && <p className="text-[10px] text-muted-foreground">Core (always enabled)</p>}
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{selectedModules.length} modules selected</p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes..." rows={2} />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setApproveDialog(false)}>Cancel</Button>
              <Button onClick={() => approveMut.mutate()} disabled={approveMut.isPending}>
                {approveMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...</> : <>Approve & Create Tenant</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
