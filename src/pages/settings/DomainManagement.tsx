import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Globe, Plus, Trash2, Star, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DomainRecord {
  id: string;
  domain: string;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
}

const DomainManagement = () => {
  const { t } = useLanguage();
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [subdomain, setSubdomain] = useState<string>("");
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchDomains = async () => {
    try {
      const res = await api.get("/domains");
      setDomains(res.data?.data || []);
      setSubdomain(res.data?.subdomain || "");
    } catch {
      toast.error("Failed to load domains");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDomains(); }, []);

  const addDomain = async () => {
    if (!newDomain.trim()) return;
    setAdding(true);
    try {
      await api.post("/domains", { domain: newDomain.trim().toLowerCase() });
      toast.success("Domain added successfully");
      setNewDomain("");
      fetchDomains();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add domain");
    } finally {
      setAdding(false);
    }
  };

  const removeDomain = async (id: string) => {
    try {
      await api.delete(`/domains/${id}`);
      toast.success("Domain removed");
      fetchDomains();
    } catch {
      toast.error("Failed to remove domain");
    }
  };

  const setPrimary = async (id: string) => {
    try {
      await api.post(`/domains/${id}/primary`);
      toast.success("Primary domain updated");
      fetchDomains();
    } catch {
      toast.error("Failed to set primary");
    }
  };

  const verifyDomain = async (id: string) => {
    try {
      const res = await api.post(`/domains/${id}/verify`);
      if (res.data?.verified) {
        toast.success("Domain verified!");
      } else {
        toast.warning(res.data?.message || "DNS not yet pointing to server");
      }
      fetchDomains();
    } catch {
      toast.error("Verification failed");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Management
          </CardTitle>
          <CardDescription>
            Manage custom domains for your ISP billing portal. Clients can access
            your system via a subdomain or their own custom domain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Subdomain */}
          {subdomain && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Default Subdomain</p>
              <p className="text-base font-semibold text-foreground">
                {subdomain}.smartispsolution.com
              </p>
            </div>
          )}

          {/* Add Custom Domain */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add Custom Domain</label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. billing.yourisp.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDomain()}
              />
              <Button onClick={addDomain} disabled={adding || !newDomain.trim()}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </Button>
            </div>
          </div>

          {/* Domain List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : domains.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No custom domains configured yet.
            </p>
          ) : (
            <div className="space-y-3">
              {domains.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{d.domain}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {d.is_primary && (
                          <Badge variant="default" className="text-xs">Primary</Badge>
                        )}
                        {d.is_verified ? (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">
                            <AlertCircle className="h-3 w-3 mr-1" /> Unverified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!d.is_verified && (
                      <Button variant="ghost" size="sm" onClick={() => verifyDomain(d.id)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {!d.is_primary && (
                      <Button variant="ghost" size="sm" onClick={() => setPrimary(d.id)} title="Set as primary">
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove domain?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove <strong>{d.domain}</strong> from your account.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeDomain(d.id)}>Remove</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DNS Instructions */}
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
            <h4 className="text-sm font-semibold">DNS Setup Instructions</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Go to your domain registrar's DNS settings</li>
              <li>Add an <strong>A record</strong> pointing to your server IP</li>
              <li>Or add a <strong>CNAME record</strong> pointing to your subdomain</li>
              <li>Wait for DNS propagation (up to 48 hours)</li>
              <li>Click the verify button to confirm the domain is working</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>SSL:</strong> Use Cloudflare (recommended) for automatic SSL, or configure Let's Encrypt on your server.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DomainManagement;
