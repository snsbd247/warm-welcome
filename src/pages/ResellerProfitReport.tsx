import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/client";
import { useTenantId } from "@/hooks/useTenantId";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, Users, Wallet, Receipt } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ResellerProfitReport() {
  const tenantId = useTenantId();
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Fetch all resellers
  const { data: resellers = [], isLoading: loadingResellers } = useQuery({
    queryKey: ["tenant-resellers-profit", tenantId],
    queryFn: async () => {
      const { data } = await (db as any).from("resellers")
        .select("id, name, company_name, wallet_balance, commission_rate, default_commission, status")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .order("name");
      return data || [];
    },
    enabled: !!tenantId,
  });

  // Fetch all bills with reseller_id for this tenant
  const { data: bills = [], isLoading: loadingBills } = useQuery({
    queryKey: ["tenant-reseller-bills", tenantId],
    queryFn: async () => {
      const { data } = await (db as any).from("bills")
        .select("id, month, amount, commission_amount, reseller_profit, tenant_amount, reseller_id, status")
        .not("reseller_id", "is", null)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!tenantId,
  });

  // Aggregate by reseller
  const resellerStats = resellers.map((r: any) => {
    const rBills = bills.filter((b: any) => b.reseller_id === r.id);
    const monthBills = rBills.filter((b: any) => b.month === filterMonth);
    const totalSales = rBills.reduce((s: number, b: any) => s + (parseFloat(b.amount) || 0), 0);
    const totalCommission = rBills.reduce((s: number, b: any) => s + (parseFloat(b.commission_amount) || 0), 0);
    const totalTenantAmount = rBills.reduce((s: number, b: any) => s + (parseFloat(b.tenant_amount) || 0), 0);
    const monthSales = monthBills.reduce((s: number, b: any) => s + (parseFloat(b.amount) || 0), 0);
    const monthCommission = monthBills.reduce((s: number, b: any) => s + (parseFloat(b.commission_amount) || 0), 0);
    const monthTenantAmount = monthBills.reduce((s: number, b: any) => s + (parseFloat(b.tenant_amount) || 0), 0);

    return {
      ...r,
      totalSales, totalCommission, totalTenantAmount,
      monthSales, monthCommission, monthTenantAmount,
      totalBills: rBills.length,
    };
  });

  // Totals
  const grandTotalSales = resellerStats.reduce((s, r) => s + r.totalSales, 0);
  const grandTotalCommission = resellerStats.reduce((s, r) => s + r.totalCommission, 0);
  const grandTotalTenantAmount = resellerStats.reduce((s, r) => s + r.totalTenantAmount, 0);
  const grandMonthSales = resellerStats.reduce((s, r) => s + r.monthSales, 0);
  const grandMonthTenantAmount = resellerStats.reduce((s, r) => s + r.monthTenantAmount, 0);

  // Monthly chart — per reseller
  const monthlyMap: Record<string, { sales: number; commission: number; tenantAmount: number }> = {};
  bills.forEach((b: any) => {
    if (!monthlyMap[b.month]) monthlyMap[b.month] = { sales: 0, commission: 0, tenantAmount: 0 };
    monthlyMap[b.month].sales += parseFloat(b.amount) || 0;
    monthlyMap[b.month].commission += parseFloat(b.commission_amount) || 0;
    monthlyMap[b.month].tenantAmount += parseFloat(b.tenant_amount) || 0;
  });
  const monthlyChart = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, val]) => ({ month: month.slice(5), ...val }));

  // Top resellers by tenant amount
  const topResellers = [...resellerStats].sort((a, b) => b.totalTenantAmount - a.totalTenantAmount).slice(0, 10);

  const isLoading = loadingResellers || loadingBills;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" /> Reseller Profit Report</h1>
            <p className="text-muted-foreground mt-1">Revenue breakdown across resellers</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Filter Month</Label>
            <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-44" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">Active Resellers</p>
                  <p className="text-2xl font-bold mt-1">{resellers.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">Total Sales (All Time)</p>
                  <p className="text-2xl font-bold mt-1">৳{grandTotalSales.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/5">
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">Tenant Revenue (All Time)</p>
                  <p className="text-2xl font-bold text-primary mt-1">৳{grandTotalTenantAmount.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">Commission Given (All Time)</p>
                  <p className="text-2xl font-bold text-destructive mt-1">৳{grandTotalCommission.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">This Month Revenue</p>
                  <p className="text-2xl font-bold mt-1">৳{grandMonthTenantAmount.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Revenue Trend */}
            <Card>
              <CardHeader><CardTitle className="text-base">Monthly Revenue Trend (All Resellers)</CardTitle></CardHeader>
              <CardContent>
                {monthlyChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Legend />
                      <Bar dataKey="tenantAmount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Tenant Revenue" />
                      <Bar dataKey="commission" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Commission" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Per-Reseller Breakdown */}
            <Card>
              <CardHeader><CardTitle className="text-base">Reseller Performance ({filterMonth})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reseller</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Commission (৳)</TableHead>
                        <TableHead>Month Sales</TableHead>
                        <TableHead>Month Commission</TableHead>
                        <TableHead>Month Tenant Revenue</TableHead>
                        <TableHead>All-Time Sales</TableHead>
                        <TableHead>All-Time Commission</TableHead>
                        <TableHead>All-Time Revenue</TableHead>
                        <TableHead>Wallet</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resellerStats.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>{r.company_name || "—"}</TableCell>
                          <TableCell>৳{parseFloat(r.default_commission || 0).toLocaleString()}</TableCell>
                          <TableCell>৳{r.monthSales.toLocaleString()}</TableCell>
                          <TableCell className="text-destructive">৳{r.monthCommission.toLocaleString()}</TableCell>
                          <TableCell className="text-primary font-medium">৳{r.monthTenantAmount.toLocaleString()}</TableCell>
                          <TableCell>৳{r.totalSales.toLocaleString()}</TableCell>
                          <TableCell className="text-destructive">৳{r.totalCommission.toLocaleString()}</TableCell>
                          <TableCell className="text-primary font-medium">৳{r.totalTenantAmount.toLocaleString()}</TableCell>
                          <TableCell>৳{parseFloat(r.wallet_balance).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {resellerStats.length > 0 && (
                        <TableRow className="bg-muted/30 font-bold">
                          <TableCell colSpan={3}>Total</TableCell>
                          <TableCell>৳{grandMonthSales.toLocaleString()}</TableCell>
                          <TableCell className="text-destructive">৳{resellerStats.reduce((s, r) => s + r.monthCommission, 0).toLocaleString()}</TableCell>
                          <TableCell className="text-primary">৳{grandMonthTenantAmount.toLocaleString()}</TableCell>
                          <TableCell>৳{grandTotalSales.toLocaleString()}</TableCell>
                          <TableCell className="text-destructive">৳{grandTotalCommission.toLocaleString()}</TableCell>
                          <TableCell className="text-primary">৳{grandTotalTenantAmount.toLocaleString()}</TableCell>
                          <TableCell>—</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
