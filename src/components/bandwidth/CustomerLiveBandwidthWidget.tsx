import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, ArrowUp, ArrowDown, Play, Pause, Wifi } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const MAX_HISTORY = 30;

interface SpeedPoint { time: string; upload: number; download: number; }

function formatBps(bps: number): string {
  if (bps >= 1_000_000_000) return `${(bps / 1_000_000_000).toFixed(2)} Gbps`;
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(0)} Kbps`;
  return `${bps} bps`;
}

interface Props {
  tenantId: string;
  customerId: string; // DB UUID of the customer
  resellerId?: string | null;
  compact?: boolean;
}

export default function CustomerLiveBandwidthWidget({ tenantId, customerId, resellerId, compact }: Props) {
  const [isPolling, setIsPolling] = useState(true);
  const [upload, setUpload] = useState(0);
  const [download, setDownload] = useState(0);
  const [status, setStatus] = useState<string>("offline");
  const [uptime, setUptime] = useState("");
  const [history, setHistory] = useState<SpeedPoint[]>([]);
  const [lastUpdate, setLastUpdate] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLive = useCallback(async () => {
    if (!tenantId || !customerId) return;
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      let url = `https://${projectId}.supabase.co/functions/v1/live-bandwidth?tenant_id=${tenantId}&customer_id=${customerId}`;
      if (resellerId) url += `&reseller_id=${resellerId}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${anonKey}` } });
      if (!res.ok) return;
      const data = await res.json();

      const user = data.users?.[0];
      if (user) {
        setUpload(user.upload_bps);
        setDownload(user.download_bps);
        setStatus(user.status);
        setUptime(user.uptime);
        setIpAddress(user.ip_address);
      } else {
        setUpload(0);
        setDownload(0);
        setStatus("offline");
        setUptime("");
        setIpAddress("");
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastUpdate(timeStr);

      setHistory((prev) => {
        const next = [...prev, {
          time: timeStr,
          upload: Math.round((user?.upload_bps || 0) / 1_000_000 * 100) / 100,
          download: Math.round((user?.download_bps || 0) / 1_000_000 * 100) / 100,
        }];
        return next.slice(-MAX_HISTORY);
      });
    } catch (e) {
      console.error("Customer live bandwidth fetch error:", e);
    }
  }, [tenantId, customerId, resellerId]);

  useEffect(() => {
    if (!isPolling) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    fetchLive();
    timerRef.current = setInterval(fetchLive, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPolling, fetchLive]);

  const isOnline = status !== "offline";
  const statusColor = status === "heavy" ? "text-destructive" : status === "idle" ? "text-muted-foreground" : isOnline ? "text-success" : "text-muted-foreground";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? "default" : "secondary"} className="gap-1 text-xs">
            <Wifi className="h-3 w-3" /> {isOnline ? "ONLINE" : "OFFLINE"}
          </Badge>
          {lastUpdate && <span className="text-xs text-muted-foreground">Updated: {lastUpdate}</span>}
        </div>
        <Button variant={isPolling ? "destructive" : "default"} size="sm" onClick={() => setIsPolling(!isPolling)}>
          {isPolling ? <><Pause className="h-4 w-4 mr-1" /> Pause</> : <><Play className="h-4 w-4 mr-1" /> Resume</>}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><ArrowUp className="h-3 w-3" /> Upload</p>
            <p className="text-lg font-bold" style={{ color: "hsl(150, 60%, 45%)" }}>{formatBps(upload)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><ArrowDown className="h-3 w-3" /> Download</p>
            <p className="text-lg font-bold" style={{ color: "hsl(210, 70%, 55%)" }}>{formatBps(download)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className={`text-lg font-bold capitalize ${statusColor}`}>{isOnline ? status : "Offline"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Uptime</p>
            <p className="text-lg font-bold">{uptime || "—"}</p>
            {ipAddress && <p className="text-xs text-muted-foreground font-mono">{ipAddress}</p>}
          </CardContent>
        </Card>
      </div>

      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Speed Over Time (Mbps)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length < 2 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm">Collecting data...</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)} Mbps`} />
                  <Legend />
                  <Line type="monotone" dataKey="upload" stroke="hsl(150, 60%, 45%)" strokeWidth={2} dot={false} name="Upload" />
                  <Line type="monotone" dataKey="download" stroke="hsl(210, 70%, 55%)" strokeWidth={2} dot={false} name="Download" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
