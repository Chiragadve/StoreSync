import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const FEATURES = [
  { icon: '⚡', title: 'Real-time Sync', body: 'Inventory updates across all locations the moment a sale or restock happens. Zero lag, zero discrepancies.', detail: 'Supabase Realtime updates' },
  { icon: '🤖', title: 'AI-Powered Actions', body: 'Natural language commands to query stock, request conversational summaries, and manage items.', detail: 'Grok-powered intelligence' },
  { icon: '📍', title: 'Multi-location', body: 'Manage warehouses, physical stores, and online channels from a single unified dashboard.', detail: 'Unlimited locations' },
  { icon: '📊', title: 'Instant Snapshots', body: 'Quick insights into total stock, active SKUs, and recent orders with clean visual dashboards.', detail: 'Real-time dashboard' },
  { icon: '🔔', title: 'Smart Alerts', body: 'Set custom thresholds and get notified before stockouts happen. Keep critical items always in supply.', detail: 'Threshold-based alerts' },
  { icon: '📥', title: 'Easy Management', body: 'Quickly populate your catalog or export your data effortlessly. No complex migrations required.', detail: 'Simple CSV operations' },
];

const PRICING = [
  {
    name: 'Starter',
    price: '₹0',
    period: '/month',
    description: 'Perfect for small stores getting started',
    features: ['Up to 100 SKUs', '1 location', 'Basic analytics', 'Email support', 'Manual stock updates'],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '₹2,999',
    period: '/month',
    description: 'For growing retail businesses',
    features: ['Up to 5,000 SKUs', '10 locations', 'Advanced analytics', 'AI-powered actions', 'Priority support', 'Custom alerts', 'API access'],
    cta: 'Start Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large-scale retail operations',
    features: ['Unlimited SKUs', 'Unlimited locations', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee', 'On-premise option', 'SSO & RBAC'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Operations Head, UrbanThread', quote: 'StoreSync reduced our stockout incidents by 73% in the first quarter. The AI predictions are remarkably accurate.', avatar: 'PS' },
  { name: 'Rahul Kapoor', role: 'Founder, KickStreet', quote: 'Managing inventory across 12 stores used to be a nightmare. Now it takes 10 minutes of my morning.', avatar: 'RK' },
  { name: 'Anita Desai', role: 'Supply Chain Manager, LuxeRetail', quote: 'The real-time sync alone paid for itself. We haven\'t had a single oversell since switching to StoreSync.', avatar: 'AD' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Connect Your Stores', description: 'Link your physical stores, warehouses, and online channels in under 5 minutes.' },
  { step: '02', title: 'Import Your Catalog', description: 'Bulk import products via CSV or manually create items through our streamlined interface.' },
  { step: '03', title: 'Go Live', description: 'Start tracking inventory in real-time. Get instant alerts and AI-powered insights.' },
];

const FAQ_ITEMS = [
  { q: 'How long does setup take?', a: 'Most stores are fully set up within 15 minutes. Our onboarding wizard guides you through connecting locations and importing products.' },
  { q: 'Can I use StoreSync with my existing POS?', a: 'Yes! We integrate with all major POS systems including Shopify POS, Square, Lightspeed, and more.' },
  { q: 'Is my data secure?', a: 'Absolutely. All data is encrypted at rest and in transit. We\'re SOC 2 Type II certified and GDPR compliant.' },
  { q: 'What happens if I exceed my SKU limit?', a: 'We\'ll notify you when you\'re approaching your limit and offer a seamless upgrade path. No disruption to your operations.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 md:px-12 py-5 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-0.5">
          <span className="font-mono font-bold text-xl text-primary">STORE</span>
          <span className="font-mono font-bold text-xl text-foreground">SYNC</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </div>
        <button onClick={() => navigate('/login')} className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted transition-colors text-sm">
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 grid-pattern pt-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-8">
            <span className="text-primary text-sm font-mono">◈ RETAIL INTELLIGENCE PLATFORM</span>
          </div>
          <h1 className="font-mono font-bold text-4xl md:text-6xl lg:text-7xl leading-tight mb-6">
            Every SKU.<br />Every Store.<br />
            <span className="text-primary">One View.</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            StoreSync gives retail operations teams real-time visibility across every warehouse, store, and online channel — in one unified dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/login')} className="px-8 py-3.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity text-base">
              Get Started →
            </button>
            <button onClick={() => navigate('/dashboard')} className="px-8 py-3.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted transition-colors text-base">
              View Demo
            </button>
          </div>
        </div>

        {/* Mock Dashboard Preview */}
        <div className="mt-16 w-full max-w-4xl mx-auto animate-fade-up">
          <div className="bg-card border border-border rounded-xl p-6 shadow-2xl">
            <div className="relative flex items-center justify-center mb-4">
              <div className="absolute left-0 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-primary/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <span className="text-xs text-muted-foreground font-mono">storesync.app/dashboard</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total SKUs', value: '8', color: 'text-primary' },
                { label: 'Total Stock', value: '1,247', color: 'text-foreground' },
                { label: 'Low Stock', value: '7', color: 'text-destructive' },
                { label: 'Orders Today', value: '15', color: 'text-success' },
              ].map((s) => (
                <div key={s.label} className="bg-secondary rounded-lg p-3">
                  <div className={`font-mono font-bold text-xl ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              {[75, 45, 90, 30, 60, 85].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-secondary rounded-sm overflow-hidden h-16">
                    <div className="w-full bg-primary/60 rounded-sm" style={{ height: `${h}%`, marginTop: `${100 - h}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">P{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By / Logos */}
      <section className="py-12 px-6 border-t border-border">
        <p className="text-center text-xs text-muted-foreground font-mono tracking-widest uppercase mb-8">Trusted by 500+ retail brands across India</p>
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {['UrbanThread', 'KickStreet', 'LuxeRetail', 'ThreadBarn', 'StyleVault', 'ModaHouse'].map((brand) => (
            <span key={brand} className="font-mono text-sm text-muted-foreground/40 tracking-wider">{brand}</span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-center">
          {[
            { value: '15,000+', label: 'SKUs managed daily' },
            { value: '3 min', label: 'Avg restock response' },
            { value: '99.9%', label: 'Inventory accuracy' },
            { value: '500+', label: 'Retail brands' },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-mono font-bold text-4xl md:text-5xl text-primary mb-2">{s.value}</div>
              <div className="text-muted-foreground text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-4">
              <span className="text-primary text-xs font-mono">CAPABILITIES</span>
            </div>
            <h2 className="font-mono font-bold text-3xl md:text-4xl mb-4">Built for modern retail</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to manage inventory at scale — from a single store to a nationwide chain.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="group bg-card border border-border rounded-xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 card-hover">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl mb-4">{f.icon}</div>
                <h3 className="font-mono font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{f.body}</p>
                <span className="text-xs text-primary font-mono">{f.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-4">
              <span className="text-primary text-xs font-mono">HOW IT WORKS</span>
            </div>
            <h2 className="font-mono font-bold text-3xl md:text-4xl mb-4">Up and running in minutes</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">No complex setup. No migration headaches. Three simple steps to inventory clarity.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px border-t border-dashed border-border -translate-x-1/2 z-0" />
                )}
                <div className="relative z-10">
                  <div className="font-mono text-5xl font-bold text-primary/20 mb-3">{item.step}</div>
                  <h3 className="font-mono font-bold text-foreground text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase / Bento */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-mono font-bold text-3xl md:text-4xl mb-4">Powerful at every level</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Large card */}
            <div className="md:row-span-2 bg-card border border-border rounded-xl p-8 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl mb-6">🤖</div>
                <h3 className="font-mono font-bold text-xl text-foreground mb-3">Conversational AI</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">Our Grok-powered chat assistant understands your entire catalog, live inventory, and order history, answering complex queries instantly without rigid menus.</p>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <div className="flex items-end gap-2 h-24">
                  {[40, 55, 35, 65, 50, 80, 70, 90, 75, 95].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm overflow-hidden">
                      <div className={`w-full rounded-sm ${i >= 7 ? 'bg-primary/40 border border-dashed border-primary/60' : 'bg-primary/60'}`} style={{ height: `${h}%`, marginTop: `${100 - h}%` }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground font-mono">Historical</span>
                  <span className="text-[10px] text-primary font-mono">Analyzed →</span>
                </div>
              </div>
            </div>
            {/* Small cards */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-lg shrink-0">✓</div>
                <div>
                  <h3 className="font-mono font-bold text-foreground mb-1">Intelligent Chat</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Ask the assistant natural questions. Get instant summaries of low stock, product locations, and recent orders without writing complex queries.</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center text-lg shrink-0">🔄</div>
                <div>
                  <h3 className="font-mono font-bold text-foreground mb-1">Centralized Control</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Move stock between locations with simple transfer orders. The system updates all balances across warehouses and stores instantly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-4">
              <span className="text-primary text-xs font-mono">TESTIMONIALS</span>
            </div>
            <h2 className="font-mono font-bold text-3xl md:text-4xl mb-4">Loved by retail teams</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-card border border-border rounded-xl p-6">
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-mono font-bold text-primary text-sm">{t.avatar}</div>
                  <div>
                    <div className="font-mono font-bold text-foreground text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-4">
              <span className="text-primary text-xs font-mono">PRICING</span>
            </div>
            <h2 className="font-mono font-bold text-3xl md:text-4xl mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">Start free and scale as you grow. No hidden fees, no surprises.</p>
            <div className="inline-flex items-center bg-secondary rounded-lg p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-mono transition-colors ${billingCycle === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-md text-sm font-mono transition-colors ${billingCycle === 'annual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Annual <span className="text-xs opacity-70">(-20%)</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((plan) => (
              <div key={plan.name} className={`relative bg-card border rounded-xl p-6 flex flex-col ${plan.highlighted ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-mono rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="font-mono font-bold text-foreground text-lg mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="font-mono font-bold text-4xl text-foreground">
                    {plan.price === 'Custom' ? 'Custom' : billingCycle === 'annual' && plan.price !== '₹0'
                      ? `₹${Math.round(parseInt(plan.price.replace(/[₹,]/g, '')) * 0.8).toLocaleString('en-IN')}`
                      : plan.price}
                  </span>
                  {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                </div>
                <ul className="flex-1 space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-primary text-xs">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/login')}
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${plan.highlighted ? 'bg-primary text-primary-foreground hover:opacity-90' : 'border border-border text-muted-foreground hover:text-foreground hover:border-muted'}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-mono font-bold text-3xl md:text-4xl mb-4">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-mono font-bold text-foreground text-sm">{item.q}</span>
                  <span className={`text-muted-foreground transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed animate-fade-up">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary/5 border-t border-primary/20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-mono font-bold text-2xl md:text-4xl text-foreground mb-3">Ready to unify your inventory?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Join 500+ retail brands already using StoreSync. Start free — no credit card required.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/login')} className="px-8 py-3.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity">
              Launch Dashboard →
            </button>
            <button onClick={() => navigate('/dashboard')} className="px-8 py-3.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted transition-colors">
              Explore Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-0.5 mb-4">
                <span className="font-mono font-bold text-lg text-primary">STORE</span>
                <span className="font-mono font-bold text-lg text-foreground">SYNC</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">Real-time retail inventory intelligence for modern commerce.</p>
              <div className="flex gap-3">
                {['𝕏', 'in', '▶'].map((icon) => (
                  <div key={icon} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors">
                    {icon}
                  </div>
                ))}
              </div>
            </div>
            {/* Product */}
            <div>
              <h4 className="font-mono font-bold text-foreground text-sm mb-4">Product</h4>
              <ul className="space-y-2.5">
                {['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'].map((link) => (
                  <li key={link}><span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{link}</span></li>
                ))}
              </ul>
            </div>
            {/* Company */}
            <div>
              <h4 className="font-mono font-bold text-foreground text-sm mb-4">Company</h4>
              <ul className="space-y-2.5">
                {['About', 'Blog', 'Careers', 'Press', 'Contact'].map((link) => (
                  <li key={link}><span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{link}</span></li>
                ))}
              </ul>
            </div>
            {/* Resources */}
            <div>
              <h4 className="font-mono font-bold text-foreground text-sm mb-4">Resources</h4>
              <ul className="space-y-2.5">
                {['Documentation', 'API Reference', 'Help Center', 'Status', 'Privacy Policy', 'Terms of Service'].map((link) => (
                  <li key={link}><span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{link}</span></li>
                ))}
              </ul>
            </div>
          </div>
          {/* Bottom bar */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">© 2026 StoreSync Technologies Pvt. Ltd. All rights reserved.</div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Cookies</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
