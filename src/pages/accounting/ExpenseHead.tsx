import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiDb } from "@/lib/apiDb";

export default function ExpenseHead() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["expense_heads"], queryFn: async () => { const { data } = await apiDb.from("expense_heads").select("*").order("created_at", { ascending: false }); return data || []; } });
  const save = useMutation({
    mutationFn: async () => { if (editId) await apiDb.from("expense_heads").update(form).eq("id", editId); else await apiDb.from("expense_heads").insert(form); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expense_heads"] }); toast.success("Saved"); setOpen(false); setEditId(null); setForm({ name: "", description: "" }); },
    onError: () => toast.error("Failed"),
  });
  const del = useMutation({ mutationFn: async (id: string) => { await apiDb.from("expense_heads").delete().eq("id", id); }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["expense_heads"] }); toast.success("Deleted"); } });

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Expense Head</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm({ name: "", description: "" }); } }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Expense Head</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending} className="w-full">{save.isPending ? "Saving..." : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>Expense Heads ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r: any) => (
                  <TableRow key={r.id}><TableCell className="font-medium">{r.name}</TableCell><TableCell>{r.description || "—"}</TableCell><TableCell><Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge></TableCell><TableCell><div className="flex gap-2"><Button size="icon" variant="ghost" onClick={() => { setEditId(r.id); setForm({ name: r.name, description: r.description || "" }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>
                ))}
                {rows.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No items</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
