import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PriceComparisonSection from "@/components/landing/PriceComparisonSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <PriceComparisonSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
