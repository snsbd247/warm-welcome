import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, UserX, DollarSign, AlertCircle, Loader2, Wifi, WifiOff, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "sonner";
import { useState } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <Card className="glass-card animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1 text-card-foreground">{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${bgColor}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [runningBillControl, setRunningBillControl] = useState(false);

  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id, status, monthly_bill, connection_status");
      if (error) throw error;
      return data;
    },
  });

  const { data: bills, isLoading: loadingBills } = useQuery({
    queryKey: ["bills-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bills").select("id, amount, status");
      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingCustomers || loadingBills;

  const total = customers?.length ?? 0;
  const active = customers?.filter((c) => c.status === "active").length ?? 0;
  const suspended = customers?.filter((c) => c.status === "suspended").length ?? 0;
  const onlineUsers = customers?.filter((c) => c.connection_status === "active").length ?? 0;
  const suspendedConn = customers?.filter((c) => c.connection_status === "suspended").length ?? 0;
  const monthlyRevenue = bills?.filter((b) => b.status === "paid").reduce((sum, b) => sum + Number(b.amount), 0) ?? 0;
  const totalDue = bills?.filter((b) => b.status === "unpaid").reduce((sum, b) => sum + Number(b.amount), 0) ?? 0;

  const runBillControl = async () => {
    setRunningBillControl(true);
    try {
      const { data, error } = await supabase.functions.invoke("mikrotik-sync/bill-control", {
        body: {},
      });
      if (error) throw error;
      const r = data?.results;
      toast.success(`Bill control completed: ${r?.suspended || 0} suspended, ${r?.reactivated || 0} reactivated`);
    } catch (e: any) {
      toast.error("Bill control failed: " + (e.message || "Unknown error"));
    } finally {
      setRunningBillControl(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to Smart ISP Admin Panel</p>
        </div>
        <Button variant="outline" onClick={runBillControl} disabled={runningBillControl}>
          {runningBillControl ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Run Bill Control
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Customers" value={total} icon={Users} color="text-primary" bgColor="bg-primary/10" />
        <StatCard title="Active Customers" value={active} icon={UserCheck} color="text-success" bgColor="bg-success/10" />
        <StatCard title="Suspended" value={suspended} icon={UserX} color="text-destructive" bgColor="bg-destructive/10" />
        <StatCard title="Monthly Revenue" value={`৳${monthlyRevenue.toLocaleString()}`} icon={DollarSign} color="text-accent" bgColor="bg-accent/10" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Online Users" value={onlineUsers} icon={Wifi} color="text-success" bgColor="bg-success/10" />
        <StatCard title="Suspended Connections" value={suspendedConn} icon={WifiOff} color="text-destructive" bgColor="bg-destructive/10" />
        <StatCard title="Total Due" value={`৳${totalDue.toLocaleString()}`} icon={AlertCircle} color="text-warning" bgColor="bg-warning/10" />
      </div>
    </DashboardLayout>
  );
}
