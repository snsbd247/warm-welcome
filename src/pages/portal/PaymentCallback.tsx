import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [trxID, setTrxID] = useState("");

  useEffect(() => {
    const paymentID = searchParams.get("paymentID") || localStorage.getItem("bkash_payment_id");
    const bkashStatus = searchParams.get("status");

    if (!paymentID) {
      setStatus("failed");
      return;
    }

    if (bkashStatus === "cancel" || bkashStatus === "failure") {
      setStatus("failed");
      localStorage.removeItem("bkash_payment_id");
      return;
    }

    // Execute payment
    const executePayment = async () => {
      try {
        const res = await fetch(
          `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/bkash-payment/execute`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentID }),
          }
        );

        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setTrxID(data.trxID || "");
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      } finally {
        localStorage.removeItem("bkash_payment_id");
      }
    };

    executePayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="glass-card w-full max-w-md animate-fade-in">
        <CardContent className="p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground">Processing Payment</h2>
              <p className="text-muted-foreground mt-2">Please wait while we verify your payment...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Payment Successful!</h2>
              <p className="text-muted-foreground mt-2">Your payment has been processed successfully.</p>
              {trxID && (
                <p className="text-sm font-mono mt-3 text-muted-foreground">
                  Transaction ID: <span className="font-semibold text-foreground">{trxID}</span>
                </p>
              )}
              <Button className="mt-6" onClick={() => navigate("/portal/bills")}>
                Back to Bills
              </Button>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Payment Failed</h2>
              <p className="text-muted-foreground mt-2">
                Your payment could not be processed. Please try again.
              </p>
              <Button className="mt-6" onClick={() => navigate("/portal/bills")}>
                Back to Bills
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
