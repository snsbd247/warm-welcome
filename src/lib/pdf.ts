import jsPDF from "jspdf";

export function generateCustomerPDF(customer: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Smart ISP", 20, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Internet Service Provider", 20, 26);
  doc.text("Customer Application Form", 20, 33);

  // Customer ID badge
  doc.setFontSize(12);
  doc.text(customer.customer_id || "N/A", pageWidth - 20, 25, { align: "right" });

  // Reset
  doc.setTextColor(30, 30, 30);
  let y = 55;

  const section = (title: string) => {
    doc.setFillColor(240, 244, 248);
    doc.rect(15, y - 5, pageWidth - 30, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(title, 20, y);
    y += 10;
  };

  const field = (label: string, value: string, x: number) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(label, x, y);
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.text(value || "—", x, y + 5);
  };

  // Personal
  section("Personal Information");
  field("Customer Name", customer.name, 20);
  field("Father Name", customer.father_name || "", 110);
  y += 14;
  field("NID", customer.nid || "", 20);
  field("Phone", customer.phone, 80);
  field("Alt Phone", customer.alt_phone || "", 140);
  y += 14;
  field("Email", customer.email || "", 20);
  y += 16;

  // Address
  section("Address");
  field("Area", customer.area, 20);
  field("Road", customer.road || "", 80);
  field("House", customer.house || "", 130);
  field("City", customer.city || "", 170);
  y += 16;

  // Connection
  section("Connection Details");
  field("Monthly Bill", `BDT ${Number(customer.monthly_bill).toLocaleString()}`, 20);
  field("IP Address", customer.ip_address || "", 110);
  y += 14;
  field("PPPoE Username", customer.pppoe_username || "", 20);
  field("PPPoE Password", customer.pppoe_password || "", 110);
  y += 14;
  field("ONU MAC", customer.onu_mac || "", 20);
  field("Router MAC", customer.router_mac || "", 110);
  y += 14;
  field("Installation Date", customer.installation_date || "", 20);
  y += 20;

  // Signature area
  doc.setDrawColor(180, 180, 180);
  doc.line(20, y + 10, 80, y + 10);
  doc.line(pageWidth - 80, y + 10, pageWidth - 20, y + 10);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Customer Signature", 30, y + 16);
  doc.text("Authorized Signature", pageWidth - 70, y + 16);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} — Smart ISP Billing System`,
    pageWidth / 2,
    285,
    { align: "center" }
  );

  doc.save(`${customer.customer_id || "customer"}-application.pdf`);
}
