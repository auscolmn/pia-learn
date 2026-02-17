import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Video,
  ClipboardCheck,
  Award,
  Calculator,
  Zap,
  Shield,
  Users,
  ArrowRight,
  CheckCircle2,
  Play,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Multi-Tenant Platform",
    description:
      "Each organization gets isolated data, custom branding, and their own domain. Perfect for white-label solutions.",
  },
  {
    icon: Video,
    title: "Video Hosting",
    description:
      "Upload and stream videos with adaptive quality. Pay only for storage and bandwidth you use.",
  },
  {
    icon: ClipboardCheck,
    title: "Quizzes & Assessments",
    description:
      "Build interactive quizzes with multiple question types. Auto-grading and detailed analytics included.",
  },
  {
    icon: Award,
    title: "Certificates",
    description:
      "Issue beautiful, verifiable certificates. PDF generation and public verification pages.",
  },
  {
    icon: Calculator,
    title: "Usage-Based Pricing",
    description:
      "No fixed tiers. Pay $2/active student, $0.10/GB storage. Only pay for what you actually use.",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description:
      "Launch your course platform in minutes. No technical skills required. We handle the infrastructure.",
  },
];

const pricingItems = [
  { label: "Active Students", price: "$2", unit: "per student/month" },
  { label: "Video Storage", price: "$0.10", unit: "per GB/month" },
  { label: "Video Streaming", price: "$0.05", unit: "per GB streamed" },
  { label: "Certificates", price: "$0.50", unit: "per certificate" },
  { label: "Custom Domain", price: "$10", unit: "per month" },
  { label: "Unlimited Courses", price: "Free", unit: "included" },
];

const testimonials = [
  {
    quote:
      "LearnStudio's usage-based pricing saved us thousands. We only pay for active students, not empty seats.",
    author: "Sarah Chen",
    role: "Director of Learning",
    company: "TechEd Academy",
    avatar: "/avatars/sarah.jpg",
  },
  {
    quote:
      "Setup took 15 minutes. Our students love the clean interface, and the analytics help us improve courses.",
    author: "Marcus Johnson",
    role: "Founder",
    company: "Leadership Institute",
    avatar: "/avatars/marcus.jpg",
  },
  {
    quote:
      "White-labeling was perfect for our brand. Clients think it's our own platform. The video hosting is seamless.",
    author: "Emma Williams",
    role: "CEO",
    company: "Training Solutions Co",
    avatar: "/avatars/emma.jpg",
  },
];

export default function HomePage() {
  return (
    <>
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 hero-gradient overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
                🎉 Now with usage-based pricing
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight animate-fade-in-up">
                Launch Your Course Platform
                <span className="block text-gradient mt-2">Pay Only For What You Use</span>
              </h1>
              
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animate-delay-100">
                The modern LMS for organizations. Multi-tenant, white-label, with transparent 
                usage-based pricing. No fixed tiers, no surprises.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animate-delay-200">
                <Button asChild size="lg" className="bg-cta hover:bg-cta/90 text-cta-foreground text-lg px-8 py-6">
                  <Link href="/register">
                    Start Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                  <Link href="/demo">
                    <Play className="mr-2 h-5 w-5" /> Watch Demo
                  </Link>
                </Button>
              </div>
              
              <p className="mt-4 text-sm text-muted-foreground animate-fade-in-up animate-delay-300">
                No credit card required • Free tier available • Setup in minutes
              </p>
            </div>
            
            {/* Hero Image/Dashboard Preview */}
            <div className="mt-16 relative animate-fade-in-up animate-delay-400">
              <div className="relative mx-auto max-w-5xl">
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-border shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                        <Play className="h-10 w-10 text-primary" />
                      </div>
                      <p className="text-muted-foreground">Dashboard Preview</p>
                    </div>
                  </div>
                </div>
                {/* Floating cards */}
                <div className="absolute -left-4 top-1/4 hidden lg:block animate-float">
                  <Card className="shadow-xl">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-cta/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-cta" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">2,847</p>
                        <p className="text-sm text-muted-foreground">Active Students</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="absolute -right-4 top-1/2 hidden lg:block animate-float animate-delay-200">
                  <Card className="shadow-xl">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">98%</p>
                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 lg:py-28 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold">
                Everything You Need to{" "}
                <span className="text-gradient">Teach Online</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                A complete platform for creating, hosting, and selling online courses.
                Built for organizations that want flexibility and control.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card
                  key={feature.title}
                  className="group hover:border-primary transition-all duration-300 hover:shadow-lg"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Preview Section */}
        <section id="pricing" className="py-20 lg:py-28 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">
                Usage-Based Pricing
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Pay For What You Use.{" "}
                <span className="text-gradient">Nothing More.</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                No fixed monthly tiers. No per-seat licenses. Just transparent, 
                predictable pricing that scales with your success.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
              {pricingItems.map((item) => (
                <Card key={item.label} className="text-center">
                  <CardContent className="p-6">
                    <p className="text-3xl font-bold text-primary">{item.price}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.unit}</p>
                    <p className="font-medium mt-2">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Example calculation */}
            <Card className="max-w-2xl mx-auto border-primary">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Example: 100 Students</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">100 active students × $2</span>
                    <span className="font-medium">$200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">50 GB video storage × $0.10</span>
                    <span className="font-medium">$5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">200 GB streaming × $0.05</span>
                    <span className="font-medium">$10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custom domain</span>
                    <span className="font-medium">$10</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg">
                    <span className="font-semibold">Monthly Total</span>
                    <span className="font-bold text-primary">$225/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Compare to Teachable Pro at $119/mo with limited features + 5% transaction fees
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center mt-10">
              <Button asChild size="lg" className="bg-cta hover:bg-cta/90 text-cta-foreground">
                <Link href="/pricing">
                  See Full Pricing <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 bg-white border-y border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cta" />
                <span className="text-sm font-medium">SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-cta" />
                <span className="text-sm font-medium">99.9% Uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-cta" />
                <span className="text-sm font-medium">Global CDN</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cta" />
                <span className="text-sm font-medium">10,000+ Students</span>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 lg:py-28 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold">
                Loved by <span className="text-gradient">Educators Worldwide</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                See what our customers have to say about LearnStudio.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="relative">
                  <CardContent className="p-6 pt-8">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <blockquote className="text-foreground mb-6">
                      &ldquo;{testimonial.quote}&rdquo;
                    </blockquote>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {testimonial.author.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{testimonial.author}</p>
                        <p className="text-xs text-muted-foreground">
                          {testimonial.role}, {testimonial.company}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 lg:py-28 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Ready to Launch Your
              <br />
              Course Platform?
            </h2>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              Join thousands of educators using LearnStudio. Start free, scale as you grow, 
              and only pay for what you use.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6"
              >
                <Link href="/register">
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6"
              >
                <Link href="/contact">Talk to Sales</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-white/60">
              No credit card required • Free tier forever • Cancel anytime
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
