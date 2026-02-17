import Link from "next/link";
import { 
  BookOpen,
  Video,
  CreditCard,
  Award,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Users,
  BarChart3,
  Zap,
  Shield,
  Globe
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[var(--foreground)]">Enrol Studio</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-[var(--foreground)]/70 hover:text-[var(--primary)] transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-[var(--foreground)]/70 hover:text-[var(--primary)] transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="text-sm font-medium text-[var(--foreground)]/70 hover:text-[var(--primary)] transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="btn-cta text-sm py-2.5 px-5">
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden hero-gradient">
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 mb-8 animate-fade-in-up">
              <Zap className="h-4 w-4 text-[var(--primary)]" />
              <span className="text-sm font-semibold text-[var(--primary)]">
                Launch your course in minutes, not months
              </span>
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in-up animate-delay-100">
              Create and sell{" "}
              <span className="text-gradient">online courses</span>
            </h1>
            
            {/* Subhead */}
            <p className="text-lg md:text-xl text-[var(--foreground)]/60 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animate-delay-200">
              The all-in-one platform for creators and educators. Beautiful course builder, 
              video hosting, payments, and certificates — everything you need to monetize your knowledge.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up animate-delay-300">
              <Link href="/signup" className="btn-cta text-base">
                Start Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="#features" className="btn-secondary text-base">
                See How It Works
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-8 mt-12 animate-fade-in-up animate-delay-400">
              <div className="flex items-center gap-2 text-sm text-[var(--foreground)]/60">
                <CheckCircle className="h-4 w-4 text-[var(--cta)]" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--foreground)]/60">
                <CheckCircle className="h-4 w-4 text-[var(--cta)]" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--foreground)]/60">
                <CheckCircle className="h-4 w-4 text-[var(--cta)]" />
                <span>Set up in 5 minutes</span>
              </div>
            </div>
          </div>
          
          {/* Hero visual */}
          <div className="mt-16 relative animate-fade-in-up animate-delay-400">
            <div className="aspect-[16/9] max-w-4xl mx-auto bg-white rounded-2xl border-2 border-[var(--border)] shadow-2xl shadow-[var(--primary)]/10 overflow-hidden">
              <div className="h-10 bg-[var(--muted)] border-b border-[var(--border)] flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="p-8 grid grid-cols-4 gap-4 h-full">
                <div className="col-span-1 space-y-3">
                  <div className="h-8 bg-[var(--primary)]/10 rounded-lg" />
                  <div className="h-6 bg-[var(--muted)] rounded-lg w-3/4" />
                  <div className="h-6 bg-[var(--muted)] rounded-lg" />
                  <div className="h-6 bg-[var(--muted)] rounded-lg w-5/6" />
                </div>
                <div className="col-span-3 bg-[var(--background)] rounded-xl p-4">
                  <div className="h-6 bg-[var(--primary)] rounded w-1/3 mb-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-video bg-[var(--secondary)]/20 rounded-lg" />
                    <div className="aspect-video bg-[var(--secondary)]/20 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-[var(--foreground)]/60 max-w-2xl mx-auto text-lg">
              Powerful features designed to help you create, launch, and grow your online education business.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="feature-card">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-5">
                <BookOpen className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Course Builder</h3>
              <p className="text-[var(--foreground)]/60 text-sm leading-relaxed">
                Drag-and-drop editor to create beautiful courses. Add videos, quizzes, downloads, and more.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="w-12 h-12 rounded-xl bg-[var(--secondary)]/10 flex items-center justify-center mb-5">
                <Video className="h-6 w-6 text-[var(--secondary)]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Video Hosting</h3>
              <p className="text-[var(--foreground)]/60 text-sm leading-relaxed">
                Unlimited video hosting with adaptive streaming. Your content plays beautifully everywhere.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="w-12 h-12 rounded-xl bg-[var(--cta)]/10 flex items-center justify-center mb-5">
                <CreditCard className="h-6 w-6 text-[var(--cta)]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Easy Payments</h3>
              <p className="text-[var(--foreground)]/60 text-sm leading-relaxed">
                Accept payments globally with Stripe. One-time purchases, subscriptions, or payment plans.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/30 flex items-center justify-center mb-5">
                <Award className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Certificates</h3>
              <p className="text-[var(--foreground)]/60 text-sm leading-relaxed">
                Auto-generate branded certificates. Students can share and verify their achievements.
              </p>
            </div>
          </div>
          
          {/* Secondary features */}
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div className="feature-card flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Student Management</h4>
                <p className="text-[var(--foreground)]/60 text-sm">Track progress, send messages, and manage enrollments.</p>
              </div>
            </div>
            
            <div className="feature-card flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Analytics Dashboard</h4>
                <p className="text-[var(--foreground)]/60 text-sm">Insights on revenue, engagement, and course performance.</p>
              </div>
            </div>
            
            <div className="feature-card flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                <Globe className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Custom Domain</h4>
                <p className="text-[var(--foreground)]/60 text-sm">Use your own domain for a professional branded experience.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-[var(--background)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-[var(--primary)] mb-2">10,000+</div>
              <p className="text-[var(--foreground)]/60">Course creators</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-[var(--primary)] mb-2">500K+</div>
              <p className="text-[var(--foreground)]/60">Students enrolled</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-[var(--primary)] mb-2">$25M+</div>
              <p className="text-[var(--foreground)]/60">Earned by creators</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-[var(--foreground)]/60 max-w-2xl mx-auto text-lg">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="pricing-card">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Free</h3>
                <p className="text-[var(--foreground)]/60 text-sm">Perfect for getting started</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold">$0</span>
                <span className="text-[var(--foreground)]/60">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>1 course</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>Unlimited students</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>Video hosting (5GB)</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>Basic analytics</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-[var(--foreground)]/40">
                  <CheckCircle className="h-5 w-5" />
                  <span>10% transaction fee</span>
                </li>
              </ul>
              <Link href="/signup" className="btn-secondary w-full justify-center">
                Get Started
              </Link>
            </div>
            
            {/* Pro */}
            <div className="pricing-card featured relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--primary)] text-white text-sm font-semibold rounded-full">
                Most Popular
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <p className="text-[var(--foreground)]/60 text-sm">For serious creators</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold">$49</span>
                <span className="text-[var(--foreground)]/60">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>Unlimited courses</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>Unlimited students</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>Video hosting (100GB)</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>Custom domain</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>Certificates</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-semibold text-[var(--cta)]">
                  <CheckCircle className="h-5 w-5" />
                  <span>0% transaction fee</span>
                </li>
              </ul>
              <Link href="/signup?plan=pro" className="btn-cta w-full justify-center">
                Start Free Trial
              </Link>
            </div>
            
            {/* Enterprise */}
            <div className="pricing-card">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-[var(--foreground)]/60 text-sm">For organizations</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>Unlimited storage</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>White-label branding</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>SSO / SAML</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>API access</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[var(--cta)]" />
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Shield className="h-5 w-5 text-[var(--cta)]" />
                  <span>SLA & compliance</span>
                </li>
              </ul>
              <Link href="/contact" className="btn-secondary w-full justify-center">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[var(--primary)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--secondary)] rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--cta)] rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to share your knowledge?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of creators who are building successful online education businesses with Enrol Studio.
          </p>
          <Link 
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[var(--primary)] font-bold rounded-xl hover:bg-white/90 transition-all text-lg"
          >
            Start Free Today
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-[var(--foreground)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Enrol Studio</span>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-white/60">
              <Link href="#features" className="hover:text-white transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
            
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} Enrol Studio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
