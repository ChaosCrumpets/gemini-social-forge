import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Video, Sparkles, Target, Clock, ArrowRight, MessageSquare, Palette } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/app");
  };

  return (
    <div className="relative min-h-screen bg-background" data-testid="landing-page">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg" data-testid="text-logo">C.A.L.</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild data-testid="link-login">
              <Link href="/app">Sign In</Link>
            </Button>
            <Button className="gradient-primary" onClick={handleGetStarted} data-testid="button-get-started-header">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI-Powered Video Content Creation</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl" data-testid="text-hero-title">
              Content Assembly Line
              <span className="block gradient-text">From Idea to Script in Minutes</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl" data-testid="text-hero-description">
              C.A.L. helps content creators plan, script, and produce video content 
              with AI-powered hooks, storyboards, and production guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <Button size="lg" className="gradient-primary text-lg h-12 px-8" onClick={handleGetStarted} data-testid="button-start-creating">
                Start Creating
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg h-12 px-8" asChild data-testid="button-view-projects">
                <Link href="/projects">View My Projects</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-features-title">The 7-Stage Assembly Line</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our proven workflow takes you from initial idea to production-ready content.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Target className="h-6 w-6" />}
              title="Input Collection"
              description="Tell us about your video idea, audience, and goals through natural conversation."
              testId="feature-input"
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Hook Generation"
              description="Get AI-generated text, verbal, and visual hooks designed to capture attention."
              testId="feature-hooks"
            />
            <FeatureCard
              icon={<Video className="h-6 w-6" />}
              title="Content Creation"
              description="Receive complete scripts, storyboards, and B-roll prompts."
              testId="feature-content"
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="Edit & Refine"
              description="Chat with AI to refine your content until it's perfect."
              testId="feature-edit"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-how-title">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to create engaging video content.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              icon={<MessageSquare className="h-6 w-6" />}
              title="Describe Your Idea"
              description="Chat naturally about your content topic, target audience, and goals. Our AI asks the right questions to understand your vision."
              testId="step-1"
            />
            <StepCard
              number="2"
              icon={<Sparkles className="h-6 w-6" />}
              title="Choose Your Hooks"
              description="Select from AI-generated text, verbal, and visual hooks ranked for maximum engagement on your target platform."
              testId="step-2"
            />
            <StepCard
              number="3"
              icon={<Palette className="h-6 w-6" />}
              title="Get Your Content Package"
              description="Receive a complete script, storyboard, tech specs, B-roll prompts, and captions ready for production."
              testId="step-3"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="gradient-primary border-0 overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <Zap className="h-12 w-12 text-primary-foreground mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4" data-testid="text-cta-title">
                Ready to Streamline Your Content Creation?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Join creators who are producing better content faster with C.A.L.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="text-lg h-12 px-8"
                onClick={handleGetStarted}
                data-testid="button-get-started-cta"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md gradient-primary flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">C.A.L.</span>
              <span className="text-muted-foreground text-sm">Content Assembly Line</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for content creators who want to work smarter.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, testId }: { icon: React.ReactNode; title: string; description: string; testId: string }) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50" data-testid={`card-${testId}`}>
      <CardContent className="p-6">
        <div className="mb-4 h-12 w-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground group-hover:animate-pulse-glow">
          {icon}
        </div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({ number, icon, title, description, testId }: { number: string; icon: React.ReactNode; title: string; description: string; testId: string }) {
  return (
    <div className="text-center" data-testid={`card-${testId}`}>
      <div className="relative inline-flex mb-6">
        <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center">
          {number}
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
