import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Play,
  Video,
  ClipboardCheck,
  Award,
  Calculator,
  Zap,
  Users,
  CheckCircle2,
  Sparkles,
  Building2,
} from "lucide-react";

const features = [
  {
    icon: Video,
    color: "#22C55E",
    title: "Video Hosting",
    description: "Upload and stream with adaptive quality. Pay only for storage and bandwidth you use.",
  },
  {
    icon: ClipboardCheck,
    color: "#F59E0B",
    title: "Quizzes & Assessments",
    description: "Build interactive quizzes with auto-grading. Track student progress in real-time.",
  },
  {
    icon: Award,
    color: "#6366F1",
    title: "Certificates",
    description: "Issue beautiful, verifiable certificates. PDF generation with QR verification.",
  },
];

const pricingItems = [
  { label: "Active Students", price: "$2", unit: "per student/month" },
  { label: "Video Storage", price: "$0.10", unit: "per GB/month" },
  { label: "Streaming", price: "$0.05", unit: "per GB" },
  { label: "Certificates", price: "$0.50", unit: "each" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-[#22C55E]/[0.04] to-transparent blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-[#6366F1]/[0.03] to-transparent blur-3xl" />
      </div>

      {/* Navigation */}
      <header className="relative z-50">
        <nav className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1">
              <span className="text-2xl font-semibold tracking-tight text-[#22C55E]">
                Learn
              </span>
              <span className="text-2xl font-semibold tracking-tight text-[#1a1a1a]">
                Studio
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-[15px] text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-[15px] text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="text-[15px] text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors">
                Sign in
              </Link>
            </div>

            <Link href="/register" className="hidden md:block">
              <Button className="bg-[#1a1a1a] hover:bg-[#333] text-white text-[15px] px-5 h-11 rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-black/10">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <Link href="/register" className="md:hidden">
              <Button size="sm" className="bg-[#1a1a1a] text-white rounded-full">
                Start Free
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 md:pt-24 pb-32">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
            {/* Left content */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#22C55E]/[0.08] mb-8">
                <span className="flex h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
                <span className="text-[13px] font-medium text-[#22C55E]">
                  Usage-based pricing — pay only for what you use
                </span>
              </div>

              <h1 className="font-serif text-[3.25rem] md:text-[4rem] lg:text-[4.5rem] leading-[1.05] tracking-tight text-[#1a1a1a] mb-6">
                Your courses,{" "}
                <span className="relative">
                  your platform
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 280 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 8.5C66.3333 3.16667 206.6 -3.4 278 8.5" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
                .
              </h1>

              <p className="text-lg md:text-xl text-[#1a1a1a]/60 leading-relaxed mb-10 max-w-md">
                The modern LMS for training providers. Multi-tenant, white-label, with transparent pricing that scales with your success.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href="/register">
                  <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white text-base px-8 h-14 rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-[#22C55E]/20 hover:-translate-y-0.5">
                    Start for free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/demo" className="group flex items-center gap-2 text-[15px] font-medium text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition-colors">
                  <Play className="h-4 w-4" />
                  Watch demo
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>

              {/* Social proof */}
              <div className="mt-12 pt-8 border-t border-[#1a1a1a]/[0.06]">
                <div className="flex items-center gap-6">
                  <div className="flex -space-x-3">
                    {[
                      "bg-gradient-to-br from-[#22C55E] to-[#16A34A]",
                      "bg-gradient-to-br from-[#6366F1] to-[#4F46E5]",
                      "bg-gradient-to-br from-[#F59E0B] to-[#D97706]",
                      "bg-gradient-to-br from-[#EC4899] to-[#DB2777]",
                    ].map((bg, i) => (
                      <div key={i} className={`w-10 h-10 rounded-full ${bg} border-2 border-[#FAF9F7] flex items-center justify-center text-white text-xs font-medium`}>
                        {["TA", "LI", "TS", "EC"][i]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">Trusted by 200+ organizations</p>
                    <p className="text-sm text-[#1a1a1a]/50">10,000+ students enrolled</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right visual - Course platform preview */}
            <div className="relative lg:pl-8">
              <div className="relative">
                {/* Main card */}
                <div className="relative bg-white rounded-3xl shadow-2xl shadow-black/[0.08] border border-black/[0.04] overflow-hidden">
                  {/* Browser bar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-black/[0.04] bg-[#FAFAFA]">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                      <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                      <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="w-48 h-6 bg-black/[0.04] rounded-lg" />
                    </div>
                  </div>

                  {/* Course dashboard preview */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-lg font-semibold text-[#1a1a1a]">Your Courses</div>
                      <Button size="sm" className="bg-[#22C55E] text-white text-xs h-8 rounded-lg">
                        + New Course
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {[
                        { title: "Practitioner Certification", students: 48, progress: 85 },
                        { title: "Advanced Techniques", students: 24, progress: 62 },
                        { title: "Foundations Course", students: 156, progress: 94 },
                      ].map((course, i) => (
                        <div key={i} className="p-4 bg-[#FAFAFA] rounded-xl border border-black/[0.03]">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-[#1a1a1a]">{course.title}</span>
                            <span className="text-xs text-[#1a1a1a]/50">{course.students} students</span>
                          </div>
                          <div className="h-2 bg-black/[0.04] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#22C55E] rounded-full"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl shadow-black/[0.08] p-4 border border-black/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                      <Award className="h-5 w-5 text-[#22C55E]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">Certificate issued</p>
                      <p className="text-xs text-[#1a1a1a]/50">Sarah completed course</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl shadow-black/[0.08] p-4 border border-black/[0.04]">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-semibold text-[#22C55E]">$225</div>
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">This month</p>
                      <p className="text-xs text-[#1a1a1a]/50">100 students</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-[#22C55E] mb-4">Features</p>
              <h2 className="font-serif text-4xl md:text-5xl text-[#1a1a1a] mb-4">
                Everything you need to teach online.
              </h2>
              <p className="text-lg text-[#1a1a1a]/60 max-w-2xl mx-auto">
                A complete platform for creating, hosting, and selling courses. Built for organizations that want flexibility.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="group relative p-8 rounded-3xl bg-[#FAFAFA] hover:bg-white border border-transparent hover:border-black/[0.04] hover:shadow-xl hover:shadow-black/[0.03] transition-all duration-300"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${feature.color}10` }}
                  >
                    <feature.icon className="h-6 w-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">{feature.title}</h3>
                  <p className="text-[#1a1a1a]/60 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Additional features row */}
            <div className="mt-12 grid md:grid-cols-3 gap-8">
              {[
                { icon: Building2, title: "Multi-Tenant", desc: "Each org gets isolated data and custom branding" },
                { icon: Calculator, title: "Usage-Based", desc: "No fixed tiers — pay only for what you use" },
                { icon: Zap, title: "Instant Setup", desc: "Launch your platform in minutes, not weeks" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-6">
                  <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-5 w-5 text-[#22C55E]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1a1a1a] mb-1">{item.title}</h4>
                    <p className="text-sm text-[#1a1a1a]/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-[#FAF9F7]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-[#22C55E] mb-4">Simple Pricing</p>
              <h2 className="font-serif text-4xl md:text-5xl text-[#1a1a1a] mb-4">
                Pay for what you use. Nothing more.
              </h2>
              <p className="text-lg text-[#1a1a1a]/60 max-w-2xl mx-auto">
                No fixed monthly tiers. Start free, scale as you grow.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
              {pricingItems.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 text-center border border-black/[0.04]">
                  <p className="text-3xl font-semibold text-[#22C55E]">{item.price}</p>
                  <p className="text-xs text-[#1a1a1a]/50 mt-1">{item.unit}</p>
                  <p className="text-sm font-medium text-[#1a1a1a] mt-2">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Example */}
            <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-black/[0.04] shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="h-5 w-5 text-[#22C55E]" />
                <span className="font-semibold text-[#1a1a1a]">Example: 100 active students</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#1a1a1a]/60">100 students × $2</span>
                  <span className="font-medium">$200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1a1a1a]/60">50 GB storage × $0.10</span>
                  <span className="font-medium">$5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1a1a1a]/60">200 GB streaming × $0.05</span>
                  <span className="font-medium">$10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1a1a1a]/60">Custom domain</span>
                  <span className="font-medium">$10</span>
                </div>
                <div className="border-t border-black/[0.06] pt-3 mt-3 flex justify-between text-lg">
                  <span className="font-semibold">Monthly total</span>
                  <span className="font-bold text-[#22C55E]">$225/mo</span>
                </div>
              </div>
              <p className="text-xs text-center text-[#1a1a1a]/50 mt-4">
                Compare to Teachable Pro at $119/mo + 5% transaction fees
              </p>
            </div>
          </div>
        </section>

        {/* Integration callout */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-12 md:p-16">
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />

              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 mb-6">
                    <Sparkles className="h-4 w-4 text-[#22C55E]" />
                    <span className="text-sm font-medium text-white/80">Seamless integration</span>
                  </div>
                  <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
                    Works with Enrol Studio
                  </h2>
                  <p className="text-lg text-white/60 mb-8">
                    When students are enrolled through Enrol Studio, they automatically get course access. Zero manual work.
                  </p>
                  <Link href="/integrations">
                    <Button className="bg-white text-[#1a1a1a] hover:bg-white/90 text-base px-6 h-12 rounded-xl">
                      Learn more
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-[#6366F1]/20 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-[#6366F1]">ES</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ArrowRight className="h-6 w-6 text-white/40" />
                    <span className="text-xs text-white/40">auto-sync</span>
                  </div>
                  <div className="w-20 h-20 rounded-2xl bg-[#22C55E]/20 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-[#22C55E]">LS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-[#FAF9F7]">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="font-serif text-4xl md:text-5xl text-[#1a1a1a] mb-6">
              Ready to launch your courses?
            </h2>
            <p className="text-lg text-[#1a1a1a]/60 mb-10">
              Join hundreds of organizations using LearnStudio. Start free, scale as you grow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white text-base px-8 h-14 rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-[#22C55E]/20">
                  Start for free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-sm text-[#1a1a1a]/50">
                No credit card required • Free tier forever
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-black/[0.04] bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1 text-[#1a1a1a]/50 text-sm">
                <span>Built with</span>
                <span className="text-red-500">♥</span>
                <span>in Melbourne</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-[#1a1a1a]/50">
                <Link href="/privacy" className="hover:text-[#1a1a1a] transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-[#1a1a1a] transition-colors">Terms</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
