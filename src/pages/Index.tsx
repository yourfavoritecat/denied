import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PriceComparisonSection from "@/components/landing/PriceComparisonSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen theme-public" style={{ background: '#FFFFFF' }}>
      <Navbar light />
      <main>
        <HeroSection />
        <SocialProofSection />
        <HowItWorksSection />
        <PriceComparisonSection />
        <TestimonialsSection />
      </main>
      <Footer light />
    </div>
  );
};

export default Index;
