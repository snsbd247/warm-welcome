import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const nf = t.notFound;

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center max-w-md animate-fade-in">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Search className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-6xl font-extrabold text-foreground tracking-tight">404</h1>
        <p className="text-xl font-medium text-foreground mt-3">{nf.title}</p>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">{location.pathname}</code> {nf.message}
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {nf.goBack}
          </Button>
          <Button onClick={() => navigate("/dashboard")}>
            <Home className="h-4 w-4 mr-2" />
            {nf.dashboard}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
