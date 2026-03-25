import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { apiDb } from "@/lib/apiDb";
import { format } from "date-fns";

export default function SalarySheet() {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(format(now, "yyyy-MM"));
  const { data: sheets = [], isLoading } = useQuery({ queryKey: ["salary-sheets", month], queryFn: async () => { const { data } = await apiDb.from("salary_sheets").select("*").eq("month", month); return data || []; } });
  const { data: employees = [] } = useQuery({ queryKey: ["employees-active"], queryFn: async () => { const { data } = await apiDb.from("employees").select("*").eq("status", "active"); return data || []; } });

  const generate = useMutation({
    mutationFn: async () => {
      const { data: loans } = await apiDb.from("loans").select("*").eq("status", "active");
      for (const emp of employees) {
        const ld = (loans || []).filter((l: any) => l.employee_id === emp.id).reduce((s: number, l: any) => s + Number(l.monthly_deduction), 0);
        await apiDb.from("salary_sheets").upsert({ employee_id: emp.id, month, basic_salary: emp.salary, bonus: 0, deduction: 0, loan_deduction: ld, net_salary: Number(emp.salary) - ld, status: "pending" });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["salary-sheets"] }); toast.success("Generated"); },
    onError: () => toast.error("Failed"),
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => { await apiDb.from("salary_sheets").update({ status: "paid", paid_date: new Date().toISOString() }).eq("id", id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["salary-sheets"] }); toast.success("Paid"); },
  });

  const getEmpName = (id: string) => employees.find((e: any) => e.id === id)?.name || "—";
  const total = sheets.reduce((s: number, r: any) => s + Number(r.net_salary), 0);
  const months = Array.from({ length: 12 }, (_, i) => { const d = new Date(now.getFullYear(), i, 1); return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") }; });

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Salary Sheet</h1>
        <div className="flex gap-3">
          <Select value={month} onValueChange={setMonth}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent>{months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select>
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}><FileText className="h-4 w-4 mr-2" />{generate.isPending ? "Generating..." : "Generate"}</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Salary — {month} (Total: ৳{total.toLocaleString()})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead className="text-right">Basic</TableHead><TableHead className="text-right">Bonus</TableHead><TableHead className="text-right">Deduction</TableHead><TableHead className="text-right">Loan</TableHead><TableHead className="text-right">Net</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {sheets.map((s: any) => (
                  <TableRow key={s.id}><TableCell className="font-medium">{getEmpName(s.employee_id)}</TableCell><TableCell className="text-right">৳{Number(s.basic_salary).toLocaleString()}</TableCell><TableCell className="text-right">৳{Number(s.bonus).toLocaleString()}</TableCell><TableCell className="text-right">৳{Number(s.deduction).toLocaleString()}</TableCell><TableCell className="text-right">৳{Number(s.loan_deduction).toLocaleString()}</TableCell><TableCell className="text-right font-semibold">৳{Number(s.net_salary).toLocaleString()}</TableCell><TableCell><Badge variant={s.status === "paid" ? "default" : "outline"}>{s.status}</Badge></TableCell><TableCell>{s.status === "pending" && <Button size="sm" variant="outline" onClick={() => markPaid.mutate(s.id)}><CheckCircle className="h-3 w-3 mr-1" />Pay</Button>}</TableCell></TableRow>
                ))}
                {sheets.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No records. Click Generate.</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
