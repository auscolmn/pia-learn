"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  X,
  Zap,
  HelpCircle,
} from "lucide-react";

const pricingRates = {
  studentRate: 2,
  storageRate: 0.1,
  bandwidthRate: 0.05,
  certificateRate: 0.5,
  customDomain: 10,
};

const comparisonFeatures = [
  { name: "Unlimited courses", learnstudio: true, teachable: "Pro+", thinkific: "Start+" },
  { name: "Usage-based pricing", learnstudio: true, teachable: false, thinkific: false },
  { name: "Multi-tenant support", learnstudio: true, teachable: false, thinkific: false },
  { name: "White-label branding", learnstudio: true, teachable: "Pro+", thinkific: "Grow+" },
  { name: "Custom domain", learnstudio: "$10/mo", teachable: "Pro+", thinkific: "Start+" },
  { name: "Video hosting", learnstudio: "Pay per use", teachable: "Limited", thinkific: "Limited" },
  { name: "Transaction fees", learnstudio: "0%", teachable: "0-5%", thinkific: "0%" },
  { name: "API access", learnstudio: true, teachable: "Pro+", thinkific: "Grow+" },
  { name: "Certificates", learnstudio: "$0.50/ea", teachable: "Pro+", thinkific: "Grow+" },
  { name: "Analytics", learnstudio: true, teachable: true, thinkific: true },
  { name: "Starting price", learnstudio: "$0/mo", teachable: "$59/mo", thinkific: "$49/mo" },
];

const faqs = [
  {
    question: "What counts as an 'active student'?",
    answer:
      "An active student is any enrolled student who logged into your platform at least once during the billing month. Inactive students (those who haven't logged in) don't count toward your bill. This means you only pay for students who are actually using your platform.",
  },
  {
    question: "How is video storage calculated?",
    answer:
      "Video storage is calculated based on the total size of all videos uploaded to your platform. We measure storage at the end of each day and bill you for the average storage used during the month. Deleted videos stop counting toward your storage immediately.",
  },
  {
    question: "Is there a free tier?",
    answer:
      "Yes! You can get started completely free. The free tier includes up to 10 active students, 1GB of video storage, and unlimited courses. Perfect for testing the platform or running a small pilot program.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express) and offer invoice billing for enterprise customers. Payments are processed securely through Stripe.",
  },
  {
    question: "Can I switch to usage-based billing from another LMS?",
    answer:
      "Absolutely! We offer free migration assistance for teams moving from Teachable, Thinkific, Kajabi, or other LMS platforms. Our team will help you transfer your courses, students, and data.",
  },
  {
    question: "Are there any hidden fees?",
    answer:
      "None whatsoever. We believe in transparent pricing. You only pay for what you use: active students, storage, bandwidth, and optional add-ons. There are no setup fees, no transaction fees, and no feature gates.",
  },
  {
    question: "What's included in the custom domain add-on?",
    answer:
      "The custom domain add-on ($10/mo) includes SSL certificate management, DNS configuration support, and the ability to use your own domain (e.g., learn.yourcompany.com) instead of the default subdomain.",
  },
  {
    question: "How do I estimate my monthly costs?",
    answer:
      "Use our pricing calculator above! Enter your estimated number of students, video storage needs, and expected bandwidth usage to get an instant estimate. Remember, you'll only be billed for actual usage, so your real costs may be lower.",
  },
];

export default function PricingPage() {
  const [students, setStudents] = useState(100);
  const [storage, setStorage] = useState(50);
  const [bandwidth, setBandwidth] = useState(200);
  const [certificates, setCertificates] = useState(20);
  const [hasCustomDomain, setHasCustomDomain] = useState(true);

  const calculateTotal = () => {
    const studentCost = students * pricingRates.studentRate;
    const storageCost = storage * pricingRates.storageRate;
    const bandwidthCost = bandwidth * pricingRates.bandwidthRate;
    const certCost = certificates * pricingRates.certificateRate;
    const domainCost = hasCustomDomain ? pricingRates.customDomain : 0;
    return studentCost + storageCost + bandwidthCost + certCost + domainCost;
  };

  const total = calculateTotal();

  return (
    <>
      <Header />

      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <Badge variant="secondary" className="mb-4">
                Simple, Transparent Pricing
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                Pay For What You Use.
                <span className="block text-gradient mt-2">Not What You Might.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                No fixed tiers. No per-seat licenses. No surprises. Our usage-based model 
                means you only pay for active students and the resources you actually consume.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Rates */}
        <section className="py-16 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="text-center">
                <CardContent className="p-6">
                  <p className="text-3xl font-bold text-primary">$2</p>
                  <p className="text-sm text-muted-foreground">per student/mo</p>
                  <p className="font-medium mt-2 text-sm">Active Students</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <p className="text-3xl font-bold text-primary">$0.10</p>
                  <p className="text-sm text-muted-foreground">per GB/mo</p>
                  <p className="font-medium mt-2 text-sm">Video Storage</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <p className="text-3xl font-bold text-primary">$0.05</p>
                  <p className="text-sm text-muted-foreground">per GB</p>
                  <p className="font-medium mt-2 text-sm">Video Streaming</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <p className="text-3xl font-bold text-primary">$0.50</p>
                  <p className="text-sm text-muted-foreground">per certificate</p>
                  <p className="font-medium mt-2 text-sm">Certificates</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <p className="text-3xl font-bold text-primary">$10</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                  <p className="font-medium mt-2 text-sm">Custom Domain</p>
                </CardContent>
              </Card>
              <Card className="text-center bg-cta/10 border-cta">
                <CardContent className="p-6">
                  <p className="text-3xl font-bold text-cta">Free</p>
                  <p className="text-sm text-muted-foreground">forever</p>
                  <p className="font-medium mt-2 text-sm">Unlimited Courses</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Interactive Calculator */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 text-primary mb-4">
                <Calculator className="h-6 w-6" />
                <span className="font-semibold">Pricing Calculator</span>
              </div>
              <h2 className="text-3xl font-bold">Estimate Your Monthly Cost</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Adjust the sliders to see how our usage-based pricing scales with your needs.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Inputs */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Students */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="students" className="text-base">Active Students</Label>
                      <span className="text-sm font-medium text-primary">{students} students</span>
                    </div>
                    <Input
                      id="students"
                      type="range"
                      min="0"
                      max="1000"
                      step="10"
                      value={students}
                      onChange={(e) => setStudents(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0</span>
                      <span>500</span>
                      <span>1000+</span>
                    </div>
                  </div>

                  {/* Storage */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="storage" className="text-base">Video Storage (GB)</Label>
                      <span className="text-sm font-medium text-primary">{storage} GB</span>
                    </div>
                    <Input
                      id="storage"
                      type="range"
                      min="0"
                      max="500"
                      step="10"
                      value={storage}
                      onChange={(e) => setStorage(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0 GB</span>
                      <span>250 GB</span>
                      <span>500+ GB</span>
                    </div>
                  </div>

                  {/* Bandwidth */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="bandwidth" className="text-base">Monthly Streaming (GB)</Label>
                      <span className="text-sm font-medium text-primary">{bandwidth} GB</span>
                    </div>
                    <Input
                      id="bandwidth"
                      type="range"
                      min="0"
                      max="1000"
                      step="20"
                      value={bandwidth}
                      onChange={(e) => setBandwidth(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0 GB</span>
                      <span>500 GB</span>
                      <span>1000+ GB</span>
                    </div>
                  </div>

                  {/* Certificates */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="certificates" className="text-base">Certificates/Month</Label>
                      <span className="text-sm font-medium text-primary">{certificates} certs</span>
                    </div>
                    <Input
                      id="certificates"
                      type="range"
                      min="0"
                      max="200"
                      step="5"
                      value={certificates}
                      onChange={(e) => setCertificates(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0</span>
                      <span>100</span>
                      <span>200+</span>
                    </div>
                  </div>

                  {/* Custom Domain */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <Label htmlFor="domain" className="text-base">Custom Domain</Label>
                      <p className="text-sm text-muted-foreground">Use your own domain</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="domain"
                        checked={hasCustomDomain}
                        onChange={(e) => setHasCustomDomain(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Result */}
              <Card className="border-primary">
                <CardHeader className="bg-primary text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Your Estimated Monthly Cost
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center mb-8">
                    <p className="text-6xl font-bold text-primary">
                      ${total.toFixed(2)}
                    </p>
                    <p className="text-muted-foreground mt-2">per month</p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">
                        {students} active students × $2
                      </span>
                      <span className="font-medium">${(students * 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">
                        {storage} GB storage × $0.10
                      </span>
                      <span className="font-medium">${(storage * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">
                        {bandwidth} GB streaming × $0.05
                      </span>
                      <span className="font-medium">${(bandwidth * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">
                        {certificates} certificates × $0.50
                      </span>
                      <span className="font-medium">${(certificates * 0.5).toFixed(2)}</span>
                    </div>
                    {hasCustomDomain && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Custom domain</span>
                        <span className="font-medium">$10.00</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 p-4 bg-cta/10 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      At ${(students > 0 ? (total / students).toFixed(2) : "0.00")} per student, 
                      you're saving compared to traditional LMS pricing.
                    </p>
                  </div>

                  <Button asChild className="w-full mt-6 bg-cta hover:bg-cta/90 text-cta-foreground">
                    <Link href="/register">
                      Start Free <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Free tier: 10 students, 1GB storage included
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Compare With Competitors</h2>
              <p className="mt-4 text-muted-foreground">
                See how LearnStudio stacks up against traditional LMS platforms.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full max-w-4xl mx-auto bg-white rounded-xl border border-border">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="p-4 font-semibold text-center bg-primary/5 border-x border-primary/20">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-primary">LearnStudio</span>
                        <Badge className="bg-cta text-xs">Best Value</Badge>
                      </div>
                    </th>
                    <th className="p-4 font-semibold text-center">Teachable</th>
                    <th className="p-4 font-semibold text-center">Thinkific</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <tr key={feature.name} className={index % 2 === 0 ? "bg-muted/30" : ""}>
                      <td className="p-4 text-sm">{feature.name}</td>
                      <td className="p-4 text-center bg-primary/5 border-x border-primary/20">
                        {typeof feature.learnstudio === "boolean" ? (
                          feature.learnstudio ? (
                            <CheckCircle2 className="h-5 w-5 text-cta mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium text-primary">{feature.learnstudio}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof feature.teachable === "boolean" ? (
                          feature.teachable ? (
                            <CheckCircle2 className="h-5 w-5 text-cta mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">{feature.teachable}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof feature.thinkific === "boolean" ? (
                          feature.thinkific ? (
                            <CheckCircle2 className="h-5 w-5 text-cta mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">{feature.thinkific}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 text-primary mb-4">
                <HelpCircle className="h-6 w-6" />
                <span className="font-semibold">FAQ</span>
              </div>
              <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Start free and scale as you grow. No credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
              >
                <Link href="/register">
                  Start Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Link href="/contact">Talk to Sales</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
