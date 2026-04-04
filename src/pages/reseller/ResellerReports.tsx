import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/client";
import { useResellerAuth } from "@/contexts/ResellerAuthContext";
import ResellerLayout from "@/components/reseller/ResellerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, TrendingUp, Users, Wallet } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ResellerReports() {
  const { reseller } = useResellerAuth();

  const { data: customers = [], isLoading: loadingCust } = useQuery({
    queryKey: ["reseller-report-customers", reseller?.id],
    queryFn: async () => {
      const { data } = await (db as any)
        .from("customers")
        .select("id, customer_id, name, phone, area, monthly_bill, connection_status, created_at, packages(name, monthly_price)")
        .eq("reseller_id", reseller!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!reseller?.id,
  });

  // Fetch bills with commission data
  const { data: bills = [], isLoading: loadingBills } = useQuery({
    queryKey: ["reseller-report-bills", reseller?.id],
    queryFn: async () => {
      const { data } = await (db as any)
        .from("bills")
        .select("id, month, amount, commission_amount, reseller_profit, tenant_amount, status, customer_id, customers(name, customer_id)")
        .eq("reseller_id", reseller!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!reseller?.id,
  });

  const { data: transactions = [], isLoading: loadingTxn } = useQuery({
    queryKey: ["reseller-report-txns", reseller?.id],
    queryFn: async () => {
      const { data } = await (db as any)
        .from("reseller_wallet_transactions")
        .select("*")
        .eq("reseller_id", reseller!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!reseller?.id,
  });

  // Commission-based profit calculations
  const totalSales = bills.reduce((s: number, b: any) => s + (parseFloat(b.amount) || 0), 0);
  const totalCommission = bills.reduce((s: number, b: any) => s + (parseFloat(b.commission_amount) || 0), 0);
  const totalProfit = bills.reduce((s: number, b: any) => s + (parseFloat(b.reseller_profit) || 0), 0);
  const totalTenantAmount = bills.reduce((s: number, b: any) => s + (parseFloat(b.tenant_amount) || 0), 0);

  // Monthly profit chart
  const monthlyMap: Record<string, { sales: number; profit: number; tenantAmount: number }> = {};
  bills.forEach((b: any) => {
    const m = b.month;
    if (!monthlyMap[m]) monthlyMap[m] = { sales: 0, profit: 0, tenantAmount: 0 };
    monthlyMap[m].sales += parseFloat(b.amount) || 0;
    monthlyMap[m].profit += parseFloat(b.reseller_profit) || 0;
    monthlyMap[m].tenantAmount += parseFloat(b.tenant_amount) || 0;
  });
  const monthlyChart = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, val]) => ({ month: month.slice(5), ...val }));

  // Per-customer profit from bills
  const customerProfitMap: Record<string, { name: string; custId: string; sales: number; profit: number; tenantAmount: number; count: number }> = {};
  bills.forEach((b: any) => {
    const cid = b.customer_id;
    if (!customerProfitMap[cid]) {
      customerProfitMap[cid] = {
        name: b.customers?.name || "Unknown",
        custId: b.customers?.customer_id || "",
        sales: 0, profit: 0, tenantAmount: 0, count: 0,
      };
    }
    customerProfitMap[cid].sales += parseFloat(b.amount) || 0;
    customerProfitMap[cid].profit += parseFloat(b.reseller_profit) || 0;
    customerProfitMap[cid].tenantAmount += parseFloat(b.tenant_amount) || 0;
    customerProfitMap[cid].count++;
  });
  const customerProfits = Object.values(customerProfitMap).sort((a, b) => b.profit - a.profit);

  // Wallet summary
  const totalCredit = transactions.filter((t: any) => t.type === "credit").reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);
  const totalDebit = transactions.filter((t: any) => t.type === "debit").reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);

  const isLoading = loadingCust || loadingTxn || loadingBills;

  return (
    <ResellerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Reports</h1>
          <p className="text-muted-foreground mt-1">Sales, profit, and wallet reports</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Tabs defaultValue="profit">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profit"><TrendingUp className="h-4 w-4 mr-1.5" />Profit</TabsTrigger>
              <TabsTrigger value="sales"><FileText className="h-4 w-4 mr-1.5" />Sales</TabsTrigger>
              <TabsTrigger value="customers"><Users className="h-4 w-4 mr-1.5" />Customers</TabsTrigger>
              <TabsTrigger value="wallet"><Wallet className="h-4 w-4 mr-1.5" />Wallet</TabsTrigger>
            </TabsList>

            {/* Profit Report */}
            <TabsContent value="profit" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold mt-1">৳{totalSales.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Profit</p>
                    <p className="text-2xl font-bold text-primary mt-1">৳{totalProfit.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Tenant Amount</p>
                    <p className="text-2xl font-bold mt-1">৳{totalTenantAmount.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Bills</p>
                    <p className="text-2xl font-bold mt-1">{bills.length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly profit chart */}
              <Card>
                <CardHeader><CardTitle className="text-base">Monthly Profit Trend</CardTitle></CardHeader>
                <CardContent>
                  {monthlyChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={monthlyChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                        <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                        <Legend />
                        <Bar dataKey="sales" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Total Sales" />
                        <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Profit" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No data</p>
                  )}
                </CardContent>
              </Card>

              {/* Per customer profit */}
              <Card>
                <CardHeader><CardTitle className="text-base">Profit per Customer</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Total Sales</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Tenant Amount</TableHead>
                          <TableHead>Bills</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerProfits.slice(0, 50).map((cp, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{cp.name} <span className="text-xs text-muted-foreground">({cp.custId})</span></TableCell>
                            <TableCell>৳{cp.sales.toLocaleString()}</TableCell>
                            <TableCell className="text-primary font-medium">৳{cp.profit.toLocaleString()}</TableCell>
                            <TableCell>৳{cp.tenantAmount.toLocaleString()}</TableCell>
                            <TableCell>{cp.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sales Report */}
            <TabsContent value="sales" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-primary mt-1">৳{totalSales.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Commission Earned</p>
                    <p className="text-2xl font-bold mt-1">৳{totalCommission.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Active Customers</p>
                    <p className="text-2xl font-bold mt-1">{customers.filter((c: any) => c.connection_status === "online").length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Bill details table */}
              <Card>
                <CardHeader><CardTitle className="text-base">All Bills</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Month</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Tenant Gets</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bills.slice(0, 100).map((b: any) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{b.customers?.name || "—"}</TableCell>
                            <TableCell>{b.month}</TableCell>
                            <TableCell>৳{parseFloat(b.amount).toLocaleString()}</TableCell>
                            <TableCell className="text-primary">৳{parseFloat(b.commission_amount || 0).toLocaleString()}</TableCell>
                            <TableCell>৳{parseFloat(b.tenant_amount || 0).toLocaleString()}</TableCell>
                            <TableCell><Badge variant={b.status === "paid" ? "default" : "destructive"}>{b.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customer List Report */}
            <TabsContent value="customers" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{customers.length}</p></CardContent></Card>
                <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Online</p><p className="text-xl font-bold text-primary">{customers.filter((c: any) => c.connection_status === "online").length}</p></CardContent></Card>
                <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Offline</p><p className="text-xl font-bold text-destructive">{customers.filter((c: any) => c.connection_status === "offline").length}</p></CardContent></Card>
                <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Monthly Rev.</p><p className="text-xl font-bold">৳{customers.reduce((s: number, c: any) => s + (parseFloat(c.monthly_bill) || 0), 0).toLocaleString()}</p></CardContent></Card>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Area</TableHead>
                          <TableHead>Package</TableHead>
                          <TableHead>Bill</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.map((c: any) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-mono text-xs">{c.customer_id}</TableCell>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>{c.phone}</TableCell>
                            <TableCell>{c.area}</TableCell>
                            <TableCell>{c.packages?.name || "—"}</TableCell>
                            <TableCell>৳{c.monthly_bill}</TableCell>
                            <TableCell><Badge variant={c.connection_status === "online" ? "default" : "secondary"}>{c.connection_status}</Badge></TableCell>
                            <TableCell className="text-xs">{format(new Date(c.created_at), "dd MMM yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wallet Report */}
            <TabsContent value="wallet" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Credit</p>
                    <p className="text-2xl font-bold text-primary mt-1">৳{totalCredit.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Debit</p>
                    <p className="text-2xl font-bold text-destructive mt-1">৳{totalDebit.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Net Flow</p>
                    <p className={`text-2xl font-bold mt-1 ${totalCredit - totalDebit >= 0 ? "text-primary" : "text-destructive"}`}>
                      ৳{(totalCredit - totalDebit).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">All Transactions</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Balance After</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((t: any) => (
                          <TableRow key={t.id}>
                            <TableCell>
                              <Badge variant={t.type === "credit" ? "default" : "destructive"}>{t.type}</Badge>
                            </TableCell>
                            <TableCell className={t.type === "credit" ? "text-primary font-medium" : "text-destructive font-medium"}>
                              {t.type === "credit" ? "+" : "-"}৳{parseFloat(t.amount).toLocaleString()}
                            </TableCell>
                            <TableCell>৳{parseFloat(t.balance_after).toLocaleString()}</TableCell>
                            <TableCell>{t.description || "—"}</TableCell>
                            <TableCell className="text-xs">{format(new Date(t.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ResellerLayout>
  );
}
