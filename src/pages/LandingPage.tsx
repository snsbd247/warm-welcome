import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { superAdminApi } from "@/lib/superAdminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Zap, Shield, BarChart3, MessageSquare, Router, CreditCard,
  Check, ChevronDown, ChevronUp, ArrowRight, Loader2, Globe,
  Users, Clock, Star, Play, Wifi, Server, Receipt
} from "lucide-react";

// ─── Hero ────────────────────────────────────────────────────
function HeroSection({ onCta }: { onCta: () => void }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 pt-20 pb-24 sm:pt-28 sm:pb-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/30 text-primary">
          🚀 #1 ISP Billing Platform in Bangladesh
        </Badge>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight max-w-4xl mx-auto">
          Your ISP Business,{" "}
          <span className="text-primary">Fully Automated</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Billing, MikroTik integration, SMS, accounting, HR — all in one powerful SaaS platform. 
          Get your ISP running in minutes, not months.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="text-base px-8 py-6 rounded-xl shadow-lg shadow-primary/20" onClick={onCta}>
            Start Free Trial <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8 py-6 rounded-xl">
            <Play className="h-5 w-5 mr-2" /> Watch Demo
          </Button>
        </div>
        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> 14-day free trial</span>
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> No credit card</span>
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Setup in 5 min</span>
        </div>
        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { value: "500+", label: "ISPs Active", icon: Wifi },
            { value: "50K+", label: "Customers Managed", icon: Users },
            { value: "99.9%", label: "Uptime", icon: Server },
            { value: "৳2Cr+", label: "Bills Processed", icon: Receipt },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl bg-card/80 backdrop-blur border border-border/50">
              <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────
const FEATURES = [
  {
    icon: CreditCard, title: "Automated Billing",
    desc: "Auto-generate monthly bills, send reminders, mark payments, and print branded invoices — all hands-free.",
    color: "text-primary",
  },
  {
    icon: Router, title: "MikroTik Integration",
    desc: "Sync PPPoE users, auto-suspend on overdue, manage bandwidth profiles directly from the dashboard.",
    color: "text-accent",
  },
  {
    icon: MessageSquare, title: "SMS & Notifications",
    desc: "Send bill reminders, payment confirmations, and custom messages via integrated SMS gateway.",
    color: "text-primary",
  },
  {
    icon: BarChart3, title: "Advanced Analytics",
    desc: "Real-time revenue, collection rates, customer growth, and financial reporting at your fingertips.",
    color: "text-accent",
  },
  {
    icon: Shield, title: "Double-Entry Accounting",
    desc: "Full chart of accounts, journal entries, trial balance, profit & loss — complete ERP accounting.",
    color: "text-primary",
  },
  {
    icon: Users, title: "HR & Payroll",
    desc: "Employee management, attendance tracking, salary sheets, loan management — built right in.",
    color: "text-accent",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-sm">Features</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Everything Your ISP Needs</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">One platform to replace 5+ separate tools. Save time, reduce errors, grow faster.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <Card key={i} className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300 bg-card">
              <CardContent className="p-6 space-y-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────
function PricingSection({ onCta }: { onCta: () => void }) {
  const { data: plans = [] } = useQuery({ queryKey: ["landing-plans"], queryFn: superAdminApi.getPlans });
  const displayPlans = plans.length > 0 ? plans : [
    { id: "1", name: "Starter", price_monthly: 500, price_yearly: 5000, max_customers: 100, max_users: 2 },
    { id: "2", name: "Business", price_monthly: 1500, price_yearly: 15000, max_customers: 500, max_users: 5 },
    { id: "3", name: "Enterprise", price_monthly: 3000, price_yearly: 30000, max_customers: 0, max_users: 0 },
  ];

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-sm">Pricing</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Simple, Transparent Pricing</h2>
          <p className="mt-4 text-muted-foreground">Start free. Upgrade when you grow. No hidden fees.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayPlans.slice(0, 3).map((plan: any, i: number) => {
            const isPopular = i === 1;
            return (
              <Card key={plan.id} className={`relative overflow-hidden transition-all hover:shadow-xl ${
                isPopular ? "border-primary shadow-lg shadow-primary/10 scale-[1.03]" : "bg-card"
              }`}>
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-foreground">৳{plan.price_monthly}</span>
                      <span className="text-muted-foreground text-sm">/month</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">or ৳{plan.price_yearly}/year (save ~17%)</p>
                  </div>
                  <Separator />
                  <ul className="space-y-2.5 text-sm">
                    {[
                      `${plan.max_customers || "Unlimited"} Customers`,
                      `${plan.max_users || "Unlimited"} Admin Users`,
                      "Automated Billing",
                      "SMS Integration",
                      i >= 1 ? "MikroTik Integration" : null,
                      i >= 1 ? "Accounting Module" : null,
                      i >= 2 ? "HR & Payroll" : null,
                      i >= 2 ? "Priority Support" : null,
                    ].filter(Boolean).map((feature, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={isPopular ? "default" : "outline"} onClick={onCta}>
                    Start Free Trial
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────
const TESTIMONIALS = [
  { name: "রাকিব হাসান", company: "SpeedNet BD", text: "Smart ISP আমাদের বিলিং সময় ৮০% কমিয়ে দিয়েছে। এখন সব কিছু অটোমেটেড।", avatar: "R" },
  { name: "তানভীর আহমেদ", company: "FastLink ISP", text: "MikroTik ইন্টিগ্রেশন অসাধারণ! এখন আর ম্যানুয়ালি ইউজার অ্যাড করতে হয় না।", avatar: "T" },
  { name: "সাদিয়া রহমান", company: "NetBridge", text: "অ্যাকাউন্টিং এবং HR একই প্ল্যাটফর্মে পেয়ে অনেক খুশি। সব কিছু এক জায়গায়।", avatar: "S" },
];

function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-sm">Testimonials</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Trusted by ISPs Nationwide</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <Card key={i} className="bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, si) => (
                    <Star key={si} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.company}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────
const FAQS = [
  { q: "ফ্রি ট্রায়ালে কি সব ফিচার পাবো?", a: "হ্যাঁ, ১৪ দিনের ফ্রি ট্রায়ালে সব ফিচার আনলক থাকবে। কোনো ক্রেডিট কার্ড লাগবে না।" },
  { q: "আমি কি নিজের ডোমেইন ব্যবহার করতে পারবো?", a: "অবশ্যই! আপনি আপনার কাস্টম ডোমেইন (যেমন: billing.yourisp.com) কানেক্ট করতে পারবেন।" },
  { q: "MikroTik রাউটার কিভাবে কানেক্ট করবো?", a: "ড্যাশবোর্ড থেকে রাউটারের IP, ইউজারনেম ও পাসওয়ার্ড দিয়ে এক ক্লিকে কানেক্ট করুন।" },
  { q: "ডাটা কি সুরক্ষিত?", a: "আপনার সব ডাটা এনক্রিপ্টেড এবং সিকিউর সার্ভারে সংরক্ষিত। নিয়মিত ব্যাকআপ নেওয়া হয়।" },
  { q: "সাপোর্ট কিভাবে পাবো?", a: "আমাদের ডেডিকেটেড সাপোর্ট টিম ২৪/৭ আপনাকে সাহায্য করতে প্রস্তুত। টিকেট বা ফোনে যোগাযোগ করুন।" },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="py-20 sm:py-28 bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-sm">FAQ</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-xl border bg-card overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-foreground text-sm sm:text-base">{faq.q}</span>
                {open === i ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />}
              </button>
              {open === i && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Signup Modal ────────────────────────────────────────────
function SignupSection() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subdomain: "" });

  const signup = useMutation({
    mutationFn: async () => {
      // Create tenant via superAdminApi
      const tenant = await superAdminApi.createTenant({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subdomain: form.subdomain,
      });
      const tenantId = Array.isArray(tenant) ? tenant[0]?.id : tenant?.id;

      // Assign trial plan (first available)
      try {
        const plans = await superAdminApi.getPlans();
        if (plans.length > 0) {
          await superAdminApi.assignSubscription({
            tenant_id: tenantId,
            plan_id: plans[0].id,
            billing_cycle: "monthly",
          });
        }
      } catch {}

      // Mark as trial
      try {
        await superAdminApi.updateTenant(tenantId, { status: "trial" });
      } catch {}

      return tenantId;
    },
    onSuccess: (tenantId) => {
      toast.success("🎉 Account created! Redirecting to your dashboard...");
      setTimeout(() => navigate(`/super/tenants/${tenantId}`), 1500);
    },
    onError: (e: any) => toast.error(e.message || "Signup failed"),
  });

  const valid = form.name && form.email && form.subdomain && form.subdomain.length >= 3;

  return (
    <section id="signup" className="py-20 sm:py-28 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <Card className="shadow-xl border-primary/10">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Start Your Free Trial</h2>
              <p className="text-sm text-muted-foreground">14 days free. No credit card required.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ISP Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. SpeedNet BD" />
              </div>
              <div className="space-y-2">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@yourisp.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label>Subdomain <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-1">
                  <Input
                    value={form.subdomain}
                    onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    placeholder="yourisp"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">.smartisp.app</span>
                </div>
              </div>
            </div>

            <Button className="w-full py-6 text-base" disabled={!valid || signup.isPending} onClick={() => signup.mutate()}>
              {signup.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ArrowRight className="h-5 w-5 mr-2" />}
              Create My ISP Account
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────
function LandingFooter() {
  return (
    <footer className="py-12 bg-card border-t">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">Smart ISP</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Smart ISP. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Navbar ──────────────────────────────────────────────────
function Navbar({ onCta }: { onCta: () => void }) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Smart ISP</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <a href="/admin/login">Login</a>
          </Button>
          <Button size="sm" onClick={onCta}>Start Free Trial</Button>
        </div>
      </div>
    </nav>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function LandingPage() {
  const scrollToSignup = () => {
    document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCta={scrollToSignup} />
      <HeroSection onCta={scrollToSignup} />
      <FeaturesSection />
      <PricingSection onCta={scrollToSignup} />
      <TestimonialsSection />
      <FaqSection />
      <SignupSection />
      <LandingFooter />
    </div>
  );
}
