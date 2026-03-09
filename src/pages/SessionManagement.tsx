import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Monitor, Loader2, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState } from "react";

const statusColors: Record<string, string> = {
  active: "default",
  pending: "secondary",
  expired: "outline",
  rejected: "destructive",
  cancelled: "outline",
};

export default function SessionManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [forceLogoutId, setForceLogoutId] = useState<string | null>(null);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles-map"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email");
      return data || [];
    },
  });

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  const handleForceLogout = async () => {
    if (!forceLogoutId) return;
    try {
      const session = sessions?.find((s) => s.id === forceLogoutId);
      const { error } = await supabase
        .from("admin_sessions")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", forceLogoutId);
      if (error) throw error;

      if (session) {
        await supabase.from("admin_login_logs").insert({
          admin_id: session.admin_id,
          action: "force_logout",
          device_name: session.device_name,
          browser: session.browser,
          ip_address: session.ip_address,
          session_id: session.id,
        });
      }

      toast.success("Session terminated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to terminate session");
    } finally {
      setForceLogoutId(null);
    }
  };

  const activeSessions = sessions?.filter((s) => s.status === "active") || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Session Management</h1>
            <p className="text-muted-foreground text-sm">
              Manage active admin sessions &bull; {activeSessions.length} active
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" /> Security
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No sessions found
                    </TableCell>
                  </TableRow>
                )}
                {sessions?.map((session) => {
                  const profile = profileMap.get(session.admin_id);
                  const isOwnActive = session.admin_id === user?.id && session.status === "active";
                  return (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        <div>
                          {profile?.full_name || session.admin_id.slice(0, 8)}
                          {isOwnActive && (
                            <Badge variant="outline" className="ml-2 text-[10px]">You</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{profile?.email}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{session.device_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{session.browser}</TableCell>
                      <TableCell className="text-sm font-mono">{session.ip_address}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[session.status] as any || "secondary"}>
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(session.created_at), "MMM dd, HH:mm")}
                      </TableCell>
                      <TableCell>
                        {session.status === "active" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setForceLogoutId(session.id)}
                          >
                            <LogOut className="h-3 w-3 mr-1" /> Force Logout
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!forceLogoutId} onOpenChange={() => setForceLogoutId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force Logout Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately terminate the selected session. The user will be logged out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceLogout}>Terminate Session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
