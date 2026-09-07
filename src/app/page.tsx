import { AgentShowcase, Comparison, Faq, FooterCta, Hero, HowItWorks, MarketingFooter, MarketingNav, PricingSection, RoiCalculator } from "@/components/landing";
import { RefCapture } from "@/components/ref-capture";

export default function Home() {
  return (
    <>
      <RefCapture />
      <MarketingNav />
      <main>
        <Hero />
        <AgentShowcase />
        <HowItWorks />
        <RoiCalculator />
        <Comparison />
        <PricingSection />
        <Faq />
        <FooterCta />
      </main>
      <MarketingFooter />
    </>
  );
}
