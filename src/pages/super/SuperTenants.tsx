import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { superAdminApi } from "@/lib/superAdminApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Ban, CheckCircle, Trash2, Search, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SuperTenants() {
  const { t } = useLanguage();
  const sa = t.superAdmin;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["super-tenants", search, statusFilter],
    queryFn: () => superAdminApi.getTenants({
      ...(search && { search }),
      ...(statusFilter !== "all" && { status: statusFilter }),
    }),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["super-plans"],
    queryFn: superAdminApi.getPlans,
  });


  const suspendMut = useMutation({
    mutationFn: superAdminApi.suspendTenant,
    onSuccess: () => { toast.success("Tenant suspended"); qc.invalidateQueries({ queryKey: ["super-tenants"] }); },
  });

  const activateMut = useMutation({
    mutationFn: superAdminApi.activateTenant,
    onSuccess: () => { toast.success("Tenant activated"); qc.invalidateQueries({ queryKey: ["super-tenants"] }); },
  });

  const deleteMut = useMutation({
    mutationFn: superAdminApi.deleteTenant,
    onSuccess: () => { toast.success("Tenant deleted"); qc.invalidateQueries({ queryKey: ["super-tenants"] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{sa.tenantManagement}</h1>
        <Button onClick={() => navigate("/super/onboarding")}>
          <Plus className="h-4 w-4 mr-2" /> {sa.createTenant}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={sa.searchTenants} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{sa.allStatus}</SelectItem>
            <SelectItem value="active">{t.common.active}</SelectItem>
            <SelectItem value="suspended">{t.common.status}</SelectItem>
            <SelectItem value="trial">{sa.trial}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{sa.ispName}</TableHead>
                <TableHead>{sa.subdomain}</TableHead>
                <TableHead>{sa.plan}</TableHead>
                <TableHead>{sa.customers}</TableHead>
                <TableHead>{sa.users}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : tenants.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{sa.noTenantsFound}</TableCell></TableRow>
                ) : tenants.map((t: any) => {
                  const hasActiveSubscription = Boolean(t.active_subscription);

                  return <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.subdomain}</TableCell>
                  <TableCell>{t.active_subscription?.plan?.name || "—"}</TableCell>
                  <TableCell>{hasActiveSubscription ? t.customer_count || 0 : "—"}</TableCell>
                  <TableCell>{hasActiveSubscription ? t.user_count || 0 : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === "active" ? "default" : t.status === "trial" ? "secondary" : "destructive"}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/super/tenants/${t.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {t.status === "active" ? (
                      <Button variant="ghost" size="sm" onClick={() => suspendMut.mutate(t.id)}>
                        <Ban className="h-4 w-4 text-destructive" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => activateMut.mutate(t.id)}>
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this tenant?")) deleteMut.mutate(t.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>;
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
