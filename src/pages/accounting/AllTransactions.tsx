import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiDb } from "@/lib/apiDb";
import { format } from "date-fns";

export default function AllTransactions() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => { const { data } = await apiDb.from("transactions").select("*").order("date", { ascending: false }); return data || []; },
  });
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: async () => { const { data } = await apiDb.from("accounts").select("*"); return data || []; } });

  const getAccName = (id: string) => { const a = accounts.find((x: any) => x.id === id); return a ? `${a.code} - ${a.name}` : "—"; };
  const totalDebit = transactions.reduce((s: number, t: any) => s + Number(t.debit), 0);
  const totalCredit = transactions.reduce((s: number, t: any) => s + Number(t.credit), 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All Transactions</h1>
        <div className="flex gap-4 text-sm">
          <span className="font-medium">Total Debit: <span className="text-destructive">৳{totalDebit.toLocaleString()}</span></span>
          <span className="font-medium">Total Credit: <span className="text-green-600">৳{totalCredit.toLocaleString()}</span></span>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Transaction Ledger ({transactions.length} entries)</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Account</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead><TableHead>Type</TableHead></TableRow></TableHeader>
              <TableBody>
                {transactions.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>{format(new Date(t.date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell className="text-sm">{getAccName(t.account_id)}</TableCell>
                    <TableCell><Badge variant="outline">{t.reference || "—"}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{Number(t.debit) > 0 ? `৳${Number(t.debit).toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="text-right font-mono">{Number(t.credit) > 0 ? `৳${Number(t.credit).toLocaleString()}` : "—"}</TableCell>
                    <TableCell><Badge variant={t.type === "income" ? "default" : "secondary"}>{t.type}</Badge></TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No transactions</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
