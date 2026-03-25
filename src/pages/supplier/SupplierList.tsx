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

export default function SupplierList() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const emptyForm = { name: "", phone: "", email: "", company: "", address: "" };
  const [form, setForm] = useState(emptyForm);
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["suppliers"], queryFn: async () => { const { data } = await apiDb.from("suppliers").select("*").order("created_at", { ascending: false }); return data || []; } });
  const save = useMutation({
    mutationFn: async () => { if (editId) await apiDb.from("suppliers").update(form).eq("id", editId); else await apiDb.from("suppliers").insert(form); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Saved"); setOpen(false); setEditId(null); setForm(emptyForm); },
    onError: () => toast.error("Failed"),
  });
  const del = useMutation({ mutationFn: async (id: string) => { await apiDb.from("suppliers").delete().eq("id", id); }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Deleted"); } });

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Supplier List</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Supplier</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Supplier</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending} className="w-full">{save.isPending ? "Saving..." : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>Suppliers ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Company</TableHead><TableHead>Phone</TableHead><TableHead>Total Due</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r: any) => (
                  <TableRow key={r.id}><TableCell className="font-medium">{r.name}</TableCell><TableCell>{r.company || "—"}</TableCell><TableCell>{r.phone || "—"}</TableCell><TableCell className="font-semibold">৳{Number(r.total_due).toLocaleString()}</TableCell><TableCell><Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge></TableCell><TableCell><div className="flex gap-2"><Button size="icon" variant="ghost" onClick={() => { setEditId(r.id); setForm({ name: r.name, phone: r.phone||"", email: r.email||"", company: r.company||"", address: r.address||"" }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>
                ))}
                {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No suppliers</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
