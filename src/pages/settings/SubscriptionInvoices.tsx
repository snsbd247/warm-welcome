import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Printer, Receipt, Calendar, CreditCard, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  PDF_COLORS, PDF_FONT, PDF_SPACING,
  drawCompanyHeader, drawFooter, fmtCurrency, getCompanySettings,
} from "@/lib/pdfTheme";

export default function SubscriptionInvoices() {
  // Get current tenant info from admin session
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["my-subscription-invoices"],
    queryFn: async () => {
      const { data } = await (db.from as any)("subscription_invoices")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: currentPlan } = useQuery({
    queryKey: ["my-saas-plan"],
    queryFn: async () => {
      // Get plan from first invoice's plan_id or subscriptions
      const { data: subs } = await (db.from as any)("subscriptions")
        .select("*, plan:saas_plans(*)")
        .limit(1)
        .order("created_at", { ascending: false });
      return subs?.[0] || null;
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["saas-plans-lookup"],
    queryFn: async () => {
      const { data } = await (db.from as any)("saas_plans").select("id, name, price, billing_cycle");
      return data || [];
    },
  });

  const getPlanName = (planId: string) => {
    const plan = plans.find((p: any) => p.id === planId);
    return plan?.name || "N/A";
  };

  const getPlanPrice = (planId: string) => {
    const plan = plans.find((p: any) => p.id === planId);
    return plan?.price || 0;
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      cancelled: "bg-muted text-muted-foreground",
    };
    return <Badge className={variants[status] || "bg-muted text-muted-foreground"}>{status.toUpperCase()}</Badge>;
  };

  const generateInvoicePDF = async (invoice: any) => {
    try {
      const settings = await getCompanySettings();
      const companyName = settings?.site_name || "Smart ISP";
      const companyAddress = settings?.address || "";
      const companyEmail = settings?.email || "";
      const companyPhone = settings?.mobile || "";

      const doc = new jsPDF("p", "mm", "a4");
      const pw = doc.internal.pageSize.getWidth();
      const m = PDF_SPACING.margin;

      // Header
      let y = drawCompanyHeader(doc, {
        companyName,
        subtitle: [companyAddress, companyEmail, companyPhone].filter(Boolean).join(" | "),
        docTitle: "SUBSCRIPTION INVOICE",
        docMeta: [
          `Invoice Date: ${invoice.created_at ? format(new Date(invoice.created_at), "dd MMM yyyy") : "N/A"}`,
          `Due Date: ${invoice.due_date ? format(new Date(invoice.due_date), "dd MMM yyyy") : "N/A"}`,
        ],
        style: "banner",
      });

      y += 4;

      // Status badge
      const statusText = (invoice.status || "pending").toUpperCase();
      doc.setFontSize(PDF_FONT.heading);
      doc.setFont("helvetica", "bold");
      if (invoice.status === "paid") {
        doc.setTextColor(...PDF_COLORS.success);
      } else if (invoice.status === "overdue") {
        doc.setTextColor(...PDF_COLORS.danger);
      } else {
        doc.setTextColor(...PDF_COLORS.text);
      }
      doc.text(`Status: ${statusText}`, pw - m, y, { align: "right" });

      // Plan info
      doc.setTextColor(...PDF_COLORS.text);
      doc.setFontSize(PDF_FONT.body);
      doc.setFont("helvetica", "normal");
      doc.text(`Plan: ${getPlanName(invoice.plan_id)}`, m, y);
      y += 6;
      doc.text(`Billing Cycle: ${(invoice.billing_cycle || "monthly").toUpperCase()}`, m, y);
      y += 10;

      // Invoice table
      const colWidths = [pw - 2 * m - 50, 50];
      const tableX = m;

      // Header row
      doc.setFillColor(...PDF_COLORS.navy);
      doc.rect(tableX, y, pw - 2 * m, 8, "F");
      doc.setTextColor(...PDF_COLORS.white);
      doc.setFontSize(PDF_FONT.small);
      doc.setFont("helvetica", "bold");
      doc.text("Description", tableX + 3, y + 5.5);
      doc.text("Amount", tableX + colWidths[0] + colWidths[1] - 3, y + 5.5, { align: "right" });
      y += 8;

      // Data rows
      const rows = [
        ["Subscription Fee", `Tk ${Number(invoice.amount || 0).toFixed(2)}`],
        ["Tax", `Tk ${Number(invoice.tax_amount || 0).toFixed(2)}`],
      ];

      if (Number(invoice.proration_credit || 0) > 0) {
        rows.push(["Proration Credit", `- Tk ${Number(invoice.proration_credit).toFixed(2)}`]);
      }

      doc.setTextColor(...PDF_COLORS.text);
      doc.setFont("helvetica", "normal");
      rows.forEach((row, i) => {
        if (i % 2 === 0) {
          doc.setFillColor(...PDF_COLORS.bgRow);
          doc.rect(tableX, y, pw - 2 * m, 7, "F");
        }
        doc.setFontSize(PDF_FONT.body);
        doc.text(row[0], tableX + 3, y + 5);
        doc.text(row[1], tableX + colWidths[0] + colWidths[1] - 3, y + 5, { align: "right" });
        y += 7;
      });

      // Total row
      doc.setFillColor(...PDF_COLORS.navy);
      doc.rect(tableX, y, pw - 2 * m, 9, "F");
      doc.setTextColor(...PDF_COLORS.white);
      doc.setFontSize(PDF_FONT.heading);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL", tableX + 3, y + 6.5);
      doc.text(`Tk ${Number(invoice.total_amount || 0).toFixed(2)}`, tableX + colWidths[0] + colWidths[1] - 3, y + 6.5, { align: "right" });
      y += 14;

      // Payment info
      if (invoice.status === "paid") {
        doc.setTextColor(...PDF_COLORS.success);
        doc.setFontSize(PDF_FONT.body);
        doc.setFont("helvetica", "bold");
        doc.text("PAID", m, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...PDF_COLORS.text);
        if (invoice.paid_date) {
          doc.text(`  on ${format(new Date(invoice.paid_date), "dd MMM yyyy, hh:mm a")}`, m + 12, y);
        }
        if (invoice.payment_method) {
          y += 6;
          doc.text(`Payment Method: ${invoice.payment_method}`, m, y);
        }
        if (invoice.transaction_id) {
          y += 6;
          doc.text(`Transaction ID: ${invoice.transaction_id}`, m, y);
        }
      }

      // Notes
      if (invoice.notes) {
        y += 10;
        doc.setFontSize(PDF_FONT.small);
        doc.setTextColor(...PDF_COLORS.textMuted);
        doc.text(`Notes: ${invoice.notes}`, m, y);
      }

      // Footer
      drawFooter(doc, companyName);

      const fileName = `subscription-invoice-${format(new Date(invoice.created_at), "yyyyMMdd")}.pdf`;
      doc.save(fileName);
      toast.success("Invoice downloaded");
    } catch (err: any) {
      toast.error("Failed to generate PDF: " + (err.message || "Unknown error"));
    }
  };

  // Summary stats
  const totalPaid = invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
  const pendingCount = invoices.filter((i: any) => i.status === "pending" || i.status === "overdue").length;
  const pendingAmount = invoices.filter((i: any) => i.status === "pending" || i.status === "overdue").reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Subscription Invoices
          </h1>
          <p className="text-sm text-muted-foreground mt-1">View and download your SaaS subscription invoices</p>
        </div>
        {currentPlan?.plan && (
          <Badge variant="outline" className="text-sm px-3 py-1">
            Current Plan: {currentPlan.plan.name}
          </Badge>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" /> Total Paid
            </div>
            <div className="text-2xl font-bold text-primary mt-1">Tk {totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" /> Pending
            </div>
            <div className="text-2xl font-bold text-destructive mt-1">{pendingCount} invoice(s)</div>
            <div className="text-sm text-muted-foreground">Tk {pendingAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" /> Total Invoices
            </div>
            <div className="text-2xl font-bold mt-1">{invoices.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No subscription invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell className="whitespace-nowrap">
                        {inv.created_at ? format(new Date(inv.created_at), "dd MMM yyyy") : "-"}
                      </TableCell>
                      <TableCell className="font-medium">{getPlanName(inv.plan_id)}</TableCell>
                      <TableCell className="capitalize">{inv.billing_cycle || "monthly"}</TableCell>
                      <TableCell className="text-right">Tk {Number(inv.amount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">Tk {Number(inv.tax_amount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">Tk {Number(inv.total_amount || 0).toFixed(2)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {inv.due_date ? format(new Date(inv.due_date), "dd MMM yyyy") : "-"}
                      </TableCell>
                      <TableCell>{statusBadge(inv.status)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateInvoicePDF(inv)}
                          className="gap-1"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}