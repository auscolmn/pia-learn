import Link from "next/link";
import { 
  GraduationCap, 
  Shield, 
  Users, 
  Play,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Award,
  Clock,
  Globe
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl leading-tight">PIA Learn</span>
                <span className="text-[10px] text-[var(--muted-foreground)] leading-tight">Psychedelic Institute Australia</span>
              </div>
            </Link>
            
            <div className="flex items-center gap-6">
              <Link href="/courses" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                Courses
              </Link>
              <Link href="/about" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                About
              </Link>
              <Link href="/login" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                Sign In
              </Link>
              <Link 
                href="/courses"
                className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden hero-gradient">
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-[var(--border)] mb-8 animate-fade-in-up">
              <Award className="h-4 w-4 text-[var(--gold)]" />
              <span className="text-sm font-medium text-[var(--muted-foreground)]">
                Australia's Leading Psychedelic Medicine Training
              </span>
            </div>
            
            {/* Headline */}
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight mb-6 animate-fade-in-up animate-delay-100">
              Become a{" "}
              <span className="italic text-[var(--primary)]">Certified</span>{" "}
              Psychedelic Practitioner
            </h1>
            
            {/* Subhead */}
            <p className="text-lg md:text-xl text-[var(--muted-foreground)] mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animate-delay-200">
              Professional training courses designed for healthcare practitioners entering 
              the psychedelic-assisted therapy space. Evidence-based curriculum. 
              Recognised credentials.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up animate-delay-300">
              <Link 
                href="/courses"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-xl hover:bg-[var(--primary)]/90 transition-all shadow-lg shadow-[var(--primary)]/20"
              >
                Explore Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[var(--foreground)] font-medium rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition-all"
              >
                <Play className="h-4 w-4" />
                Watch Overview
              </Link>
            </div>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 animate-fade-in-up animate-delay-300">
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <CheckCircle className="h-4 w-4 text-[var(--success)]" />
              <span>AHPRA Recognised</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <CheckCircle className="h-4 w-4 text-[var(--success)]" />
              <span>CPD Points Available</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <CheckCircle className="h-4 w-4 text-[var(--success)]" />
              <span>500+ Graduates</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl mb-4">
              Why Train With PIA
            </h2>
            <p className="text-[var(--muted-foreground)] max-w-2xl mx-auto">
              Comprehensive training designed specifically for Australian healthcare professionals.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-2xl border border-[var(--border)] card-hover group">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="h-7 w-7 text-[var(--primary)]" />
              </div>
              <h3 className="font-display text-xl mb-3">Evidence-Based Curriculum</h3>
              <p className="text-[var(--muted-foreground)] leading-relaxed">
                Courses developed by leading researchers and clinicians, grounded in the latest 
                scientific evidence and clinical best practices.
              </p>
            </div>
            
            <div className="p-8 bg-white rounded-2xl border border-[var(--border)] card-hover group">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-7 w-7 text-[var(--primary)]" />
              </div>
              <h3 className="font-display text-xl mb-3">Recognised Credentials</h3>
              <p className="text-[var(--muted-foreground)] leading-relaxed">
                Earn certificates recognised by AHPRA and the TGA. 
                Graduates receive verification badges on AP Connect.
              </p>
            </div>
            
            <div className="p-8 bg-white rounded-2xl border border-[var(--border)] card-hover group">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-[var(--primary)]" />
              </div>
              <h3 className="font-display text-xl mb-3">Expert Faculty</h3>
              <p className="text-[var(--muted-foreground)] leading-relaxed">
                Learn from psychiatrists, psychologists, and researchers 
                actively working in psychedelic medicine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Course */}
      <section className="py-24 bg-[var(--muted)]/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-3 py-1 bg-[var(--gold)]/10 text-[var(--gold)] text-sm font-medium rounded-full mb-6">
                Featured Course
              </span>
              <h2 className="font-display text-3xl md:text-4xl mb-6">
                Foundations of Psychedelic-Assisted Therapy
              </h2>
              <p className="text-[var(--muted-foreground)] leading-relaxed mb-8">
                Our flagship 12-week program covering the essential knowledge and skills 
                for practitioners entering the psychedelic medicine space. From pharmacology 
                to therapeutic frameworks, preparation to integration.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-[var(--primary)]" />
                  <span className="text-sm">12 Weeks</span>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-[var(--primary)]" />
                  <span className="text-sm">48 Lessons</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-[var(--primary)]" />
                  <span className="text-sm">Certificate</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-[var(--primary)]" />
                  <span className="text-sm">100% Online</span>
                </div>
              </div>
              
              <Link 
                href="/courses/foundations"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-xl hover:bg-[var(--primary)]/90 transition-all"
              >
                Learn More
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 rounded-2xl flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                  <Play className="h-8 w-8 text-white ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[var(--primary)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
            Start Your Journey in<br />Psychedelic Medicine
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Join 500+ healthcare professionals who have trained with PIA. 
            New cohorts starting monthly.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[var(--primary)] font-medium rounded-xl hover:bg-white/90 transition-all"
            >
              View All Courses
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-medium rounded-xl hover:bg-white/10 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-xl">PIA Learn</span>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-[var(--muted-foreground)]">
              <Link href="/courses" className="hover:text-[var(--foreground)] transition-colors">Courses</Link>
              <Link href="/about" className="hover:text-[var(--foreground)] transition-colors">About</Link>
              <Link href="/contact" className="hover:text-[var(--foreground)] transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-[var(--foreground)] transition-colors">Privacy</Link>
            </div>
            
            <p className="text-sm text-[var(--muted-foreground)]">
              © {new Date().getFullYear()} Psychedelic Institute Australia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
