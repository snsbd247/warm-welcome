import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Loader2, Link2, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function MerchantPayments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Form state
  const [form, setForm] = useState({
    transaction_id: "",
    sender_phone: "",
    amount: "",
    reference: "",
    payment_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  // Manual match state
  const [matchCustomerId, setMatchCustomerId] = useState("");
  const [matchBillId, setMatchBillId] = useState("");

  const { data: payments, isLoading } = useQuery({
    queryKey: ["merchant-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merchant_payments")
        .select("*, customers:matched_customer_id(customer_id, name), bills:matched_bill_id(month, amount)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: unpaidBills } = useQuery({
    queryKey: ["unpaid-bills-for-match", matchCustomerId],
    enabled: !!matchCustomerId,
    queryFn: async () => {
      // Find customer by customer_id text
      const { data: cust } = await supabase
        .from("customers")
        .select("id, name, customer_id")
        .eq("customer_id", matchCustomerId.toUpperCase().trim())
        .single();
      if (!cust) return [];
      const { data } = await supabase
        .from("bills")
        .select("id, month, amount, status")
        .eq("customer_id", cust.id)
        .eq("status", "unpaid")
        .order("created_at", { ascending: true });
      return data?.map((b) => ({ ...b, cust_uuid: cust.id })) || [];
    },
  });

  const filtered = payments?.filter((p) => {
    const matchesSearch =
      p.transaction_id?.toLowerCase().includes(search.toLowerCase()) ||
      p.sender_phone?.includes(search) ||
      p.reference?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = async () => {
    if (!form.transaction_id || !form.sender_phone || !form.amount) {
      toast.error("Transaction ID, Phone, and Amount are required");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("merchant_payments").insert({
        transaction_id: form.transaction_id.trim(),
        sender_phone: form.sender_phone.trim(),
        amount: parseFloat(form.amount),
        reference: form.reference.trim() || null,
        payment_date: new Date(form.payment_date).toISOString(),
      });
      if (error) {
        if (error.message.includes("duplicate") || error.message.includes("unique")) {
          toast.error("Duplicate Transaction ID — this payment already exists");
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success("Merchant payment recorded — auto-matching applied");
      setAddOpen(false);
      setForm({ transaction_id: "", sender_phone: "", amount: "", reference: "", payment_date: format(new Date(), "yyyy-MM-dd'T'HH:mm") });
      queryClient.invalidateQueries({ queryKey: ["merchant-payments"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualMatch = async () => {
    if (!selectedPayment || !matchBillId) {
      toast.error("Please select a bill to match");
      return;
    }
    setLoading(true);
    try {
      const bill = unpaidBills?.find((b) => b.id === matchBillId);
      if (!bill) throw new Error("Bill not found");

      // Mark bill as paid
      await supabase.from("bills").update({ status: "paid", paid_date: new Date().toISOString() }).eq("id", bill.id);

      // Create payment record
      await supabase.from("payments").insert({
        customer_id: bill.cust_uuid,
        bill_id: bill.id,
        amount: selectedPayment.amount,
        payment_method: "bkash_merchant",
        transaction_id: selectedPayment.transaction_id,
        status: "completed",
        paid_at: selectedPayment.payment_date,
        month: bill.month,
      });

      // Update merchant payment
      await supabase.from("merchant_payments").update({
        status: "matched",
        matched_customer_id: bill.cust_uuid,
        matched_bill_id: bill.id,
        notes: "Manually matched by admin",
      }).eq("id", selectedPayment.id);

      toast.success("Payment manually matched successfully");
      setMatchOpen(false);
      setSelectedPayment(null);
      setMatchCustomerId("");
      setMatchBillId("");
      queryClient.invalidateQueries({ queryKey: ["merchant-payments"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "matched":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3 mr-1" />Matched</Badge>;
      case "manual_review":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20"><AlertCircle className="h-3 w-3 mr-1" />Review</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground"><HelpCircle className="h-3 w-3 mr-1" />Unmatched</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Merchant Payments</h1>
          <p className="text-muted-foreground mt-1">Reconcile bKash merchant payments with customer bills</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Record Payment
        </Button>
      </div>

      <div className="glass-card rounded-xl">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by TrxID, phone, reference..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
              <SelectItem value="unmatched">Unmatched</SelectItem>
              <SelectItem value="manual_review">Manual Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Sender Phone</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Matched Customer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!filtered?.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">No merchant payments found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.transaction_id}</TableCell>
                      <TableCell>{p.sender_phone}</TableCell>
                      <TableCell>৳{Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-sm">{p.reference || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(p.payment_date), "dd MMM yyyy HH:mm")}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell>{(p.customers as any)?.name ? `${(p.customers as any).name} (${(p.customers as any).customer_id})` : "—"}</TableCell>
                      <TableCell className="text-right">
                        {p.status !== "matched" && (
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedPayment(p); setMatchCustomerId(p.reference || ""); setMatchOpen(true); }}>
                            <Link2 className="h-4 w-4 mr-1" /> Match
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Payment Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Merchant Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Transaction ID *</Label>
              <Input value={form.transaction_id} onChange={(e) => setForm({ ...form, transaction_id: e.target.value })} placeholder="e.g. TRX123456789" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sender Phone *</Label>
                <Input value={form.sender_phone} onChange={(e) => setForm({ ...form, sender_phone: e.target.value })} placeholder="01XXXXXXXXX" />
              </div>
              <div className="space-y-1.5">
                <Label>Amount *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reference (Customer ID)</Label>
              <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. ISP-00001" />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Date</Label>
              <Input type="datetime-local" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">System will auto-match if the reference matches a customer ID and amount matches an unpaid bill.</p>
            <div className="flex justify-end">
              <Button onClick={handleAdd} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Record & Match
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Match Dialog */}
      <Dialog open={matchOpen} onOpenChange={setMatchOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manual Match Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedPayment && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">TrxID:</span> {selectedPayment.transaction_id}</p>
                <p><span className="text-muted-foreground">Amount:</span> ৳{Number(selectedPayment.amount).toLocaleString()}</p>
                <p><span className="text-muted-foreground">Phone:</span> {selectedPayment.sender_phone}</p>
                {selectedPayment.notes && <p className="text-xs text-warning">{selectedPayment.notes}</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Customer ID</Label>
              <Input value={matchCustomerId} onChange={(e) => { setMatchCustomerId(e.target.value); setMatchBillId(""); }} placeholder="ISP-00001" />
            </div>
            {unpaidBills && unpaidBills.length > 0 && (
              <div className="space-y-1.5">
                <Label>Select Unpaid Bill</Label>
                <Select value={matchBillId} onValueChange={setMatchBillId}>
                  <SelectTrigger><SelectValue placeholder="Select a bill..." /></SelectTrigger>
                  <SelectContent>
                    {unpaidBills.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.month} — ৳{Number(b.amount).toLocaleString()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {unpaidBills && unpaidBills.length === 0 && matchCustomerId && (
              <p className="text-sm text-destructive">No unpaid bills found for this customer</p>
            )}
            <div className="flex justify-end">
              <Button onClick={handleManualMatch} disabled={loading || !matchBillId}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Confirm Match
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
