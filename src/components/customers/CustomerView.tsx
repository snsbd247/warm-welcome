import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CustomerViewProps {
  customer: any;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function CustomerView({ customer }: CustomerViewProps) {
  const statusColor =
    customer.status === "active"
      ? "bg-success/10 text-success border-success/20"
      : customer.status === "suspended"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-bold text-foreground">{customer.name}</p>
          <p className="text-sm font-mono text-muted-foreground">{customer.customer_id}</p>
        </div>
        <Badge variant="outline" className={statusColor}>{customer.status}</Badge>
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Personal</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Father Name" value={customer.father_name} />
          <Field label="NID" value={customer.nid} />
          <Field label="Phone" value={customer.phone} />
          <Field label="Alt Phone" value={customer.alt_phone} />
          <Field label="Email" value={customer.email} />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Address</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Area" value={customer.area} />
          <Field label="Road" value={customer.road} />
          <Field label="House" value={customer.house} />
          <Field label="City" value={customer.city} />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Connection</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Package" value={customer.packages?.name} />
          <Field label="Monthly Bill" value={`৳${Number(customer.monthly_bill).toLocaleString()}`} />
          <Field label="IP Address" value={customer.ip_address} />
          <Field label="PPPoE Username" value={customer.pppoe_username} />
          <Field label="ONU MAC" value={customer.onu_mac} />
          <Field label="Router MAC" value={customer.router_mac} />
          <Field label="Installation Date" value={customer.installation_date} />
        </div>
      </div>
    </div>
  );
}
