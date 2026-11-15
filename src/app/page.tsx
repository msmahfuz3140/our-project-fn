import { Navbar } from '../components/Navbar';
import { LiveTicker } from '../components/LiveTicker';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { Hero } from '../components/Hero';
import { StatsBar } from '../components/StatsBar';
import { FeatureBento } from '../components/FeatureBento';
import { LiveLobbyPreview } from '../components/LiveLobbyPreview';
import { PlansSection } from '../components/PlansSection';
import { HowItWorks } from '../components/HowItWorks';
import { FaqSection } from '../components/FaqSection';
import { Footer } from '../components/Footer';

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-x-clip bg-[#05070c] text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Fixed atmospheric texture */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cyber-grid opacity-70"
        style={{
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, #000 20%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, #000 20%, transparent 78%)'
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-noise" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-aurora opacity-70" />

      <div className="relative z-10 flex flex-col">
        {/* Sticky Navigation Header */}
        <Navbar />

        {/* Admin-managed announcement banner */}
        <AnnouncementBanner />

        {/* Real-time Streaming Ticker */}
        <LiveTicker />

        {/* Hero Showcase with Animated Precision Wheel */}
        <Hero />

        {/* Telemetry Statistics Bar */}
        <StatsBar />

        {/* Advanced Capability Bento Grid */}
        <FeatureBento />

        {/* Multi-Table Live Surveillance Lobby */}
        <LiveLobbyPreview />

        {/* The 5 Subscription Plans (NOWPayments Crypto) */}
        <PlansSection />

        {/* Systematic 4-Step How It Works Walkthrough */}
        <HowItWorks />

        {/* Comprehensive Frequently Asked Questions */}
        <FaqSection />

        {/* Platform Footer */}
        <Footer />
      </div>
    </main>
  );
}
