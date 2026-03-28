import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop(); // "inquiry" or "payment"

  try {
    const body = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (path === "inquiry") {
      return await handleInquiry(supabase, body);
    } else if (path === "payment") {
      return await handlePayment(supabase, body);
    } else {
      return jsonResponse({
        statusCode: "0001",
        statusMessage: "Invalid endpoint. Use /inquiry or /payment",
      });
    }
  } catch (err) {
    console.error("bKash Pay Bill Error:", err);
    return jsonResponse({
      statusCode: "9999",
      statusMessage: `System error: ${err.message}`,
    });
  }
});

async function handleInquiry(supabase: any, body: any) {
  const customerNo =
    body.customerNo || body.customer_id || body.billAccountNo;

  if (!customerNo) {
    return jsonResponse({
      statusCode: "0001",
      statusMessage: "Customer number is required",
    });
  }

  // Find active customer by customer_id
  const { data: customer } = await supabase
    .from("customers")
    .select("id, customer_id, name, phone")
    .eq("customer_id", customerNo)
    .eq("status", "active")
    .single();

  if (!customer) {
    return jsonResponse({
      statusCode: "0001",
      statusMessage: "Customer not found or inactive",
    });
  }

  // Get unpaid bills
  const { data: bills } = await supabase
    .from("bills")
    .select("id, month, amount, due_date, status")
    .eq("customer_id", customer.id)
    .eq("status", "unpaid")
    .order("due_date", { ascending: true });

  if (!bills || bills.length === 0) {
    return jsonResponse({
      statusCode: "0002",
      statusMessage: "No pending bills found",
      customerName: customer.name,
    });
  }

  const totalDue = bills.reduce(
    (sum: number, b: any) => sum + Number(b.amount),
    0
  );

  return jsonResponse({
    statusCode: "0000",
    statusMessage: "Success",
    customerName: customer.name,
    customerNo: customer.customer_id,
    customerId: customer.id,
    phone: customer.phone,
    totalBillCount: bills.length,
    totalDueAmount: totalDue.toFixed(2),
    billAmount: Number(bills[0].amount).toFixed(2),
    billNo: bills[0].id,
    billMonth: bills[0].month,
    dueDate: bills[0].due_date,
    bills: bills.map((b: any) => ({
      billNo: b.id,
      month: b.month,
      amount: Number(b.amount).toFixed(2),
      dueDate: b.due_date,
    })),
  });
}

async function handlePayment(supabase: any, body: any) {
  const customerNo = body.customerNo;
  const trxID = body.trxID;
  const amount = Number(body.amount || 0);
  const billNo = body.billNo;
  const paymentID = body.paymentID;

  if (!customerNo || !trxID || amount <= 0) {
    return jsonResponse({
      statusCode: "0001",
      statusMessage: "Invalid payment data",
    });
  }

  // Check duplicate
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("bkash_trx_id", trxID)
    .maybeSingle();

  if (existingPayment) {
    return jsonResponse({
      statusCode: "0000",
      statusMessage: "Payment already processed",
      trxID,
    });
  }

  // Find customer
  const { data: customer } = await supabase
    .from("customers")
    .select("id, customer_id, name")
    .eq("customer_id", customerNo)
    .single();

  if (!customer) {
    return jsonResponse({
      statusCode: "0002",
      statusMessage: "Customer not found",
    });
  }

  // If specific bill referenced
  if (billNo) {
    const { data: bill } = await supabase
      .from("bills")
      .select("*")
      .eq("id", billNo)
      .eq("customer_id", customer.id)
      .eq("status", "unpaid")
      .single();

    if (bill) {
      await processPayment(supabase, customer, bill, amount, trxID, paymentID);
      return jsonResponse({
        statusCode: "0000",
        statusMessage: "Payment successful",
        trxID,
        paidAmount: amount.toFixed(2),
        paidBills: [bill.month],
        customerName: customer.name,
      });
    }
  }

  // Auto-pay oldest unpaid bills
  const { data: unpaidBills } = await supabase
    .from("bills")
    .select("*")
    .eq("customer_id", customer.id)
    .eq("status", "unpaid")
    .order("due_date", { ascending: true });

  if (!unpaidBills || unpaidBills.length === 0) {
    // Advance payment
    await supabase.from("payments").insert({
      customer_id: customer.id,
      amount,
      payment_method: "bkash_paybill",
      bkash_trx_id: trxID,
      bkash_payment_id: paymentID,
      status: "completed",
      paid_at: new Date().toISOString(),
    });

    // Ledger credit
    const { data: lastLedger } = await supabase
      .from("customer_ledger")
      .select("balance")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentBalance = lastLedger ? Number(lastLedger.balance) : 0;

    await supabase.from("customer_ledger").insert({
      customer_id: customer.id,
      date: new Date().toISOString(),
      type: "payment",
      description: `bKash Pay Bill Advance - TrxID: ${trxID}`,
      debit: 0,
      credit: amount,
      balance: currentBalance - amount,
    });

    return jsonResponse({
      statusCode: "0000",
      statusMessage: "Advance payment recorded",
      trxID,
      paidAmount: amount.toFixed(2),
    });
  }

  let remainingAmount = amount;
  const paidBills: string[] = [];

  for (const bill of unpaidBills) {
    if (remainingAmount <= 0) break;
    const billAmount = Number(bill.amount);

    if (remainingAmount >= billAmount) {
      await processPayment(
        supabase,
        customer,
        bill,
        billAmount,
        trxID,
        paymentID
      );
      remainingAmount -= billAmount;
      paidBills.push(bill.month);
    }
  }

  return jsonResponse({
    statusCode: "0000",
    statusMessage: "Payment successful",
    trxID,
    paidAmount: amount.toFixed(2),
    paidBills,
    customerName: customer.name,
  });
}

async function processPayment(
  supabase: any,
  customer: any,
  bill: any,
  amount: number,
  trxID: string,
  paymentID?: string
) {
  // Create payment
  await supabase.from("payments").insert({
    customer_id: customer.id,
    bill_id: bill.id,
    amount,
    payment_method: "bkash_paybill",
    bkash_trx_id: trxID,
    bkash_payment_id: paymentID || null,
    month: bill.month,
    status: "completed",
    paid_at: new Date().toISOString(),
  });

  // Mark bill paid
  await supabase
    .from("bills")
    .update({ status: "paid", paid_date: new Date().toISOString() })
    .eq("id", bill.id);

  // Ledger credit
  const { data: lastLedger } = await supabase
    .from("customer_ledger")
    .select("balance")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentBalance = lastLedger ? Number(lastLedger.balance) : 0;

  await supabase.from("customer_ledger").insert({
    customer_id: customer.id,
    date: new Date().toISOString(),
    type: "payment",
    description: `bKash Pay Bill - ${bill.month} - TrxID: ${trxID}`,
    debit: 0,
    credit: amount,
    balance: currentBalance - amount,
  });
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
