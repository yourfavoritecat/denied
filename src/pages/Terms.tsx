import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";

const Terms = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navbar />
    <main className="flex-1 pt-24 pb-12 max-w-2xl mx-auto px-6">
      <h1 className="text-2xl font-bold text-white mb-1">terms of service</h1>
      <p className="text-xs text-white/40 mb-6">effective date: february 17, 2026</p>
      <div className="space-y-4 text-sm text-white/70 leading-relaxed">
        <p>by using denied.care you agree to these terms. denied.care is a marketplace that connects users with healthcare providers abroad. we are not a healthcare provider, medical facility, or insurance company. we do not provide medical advice, diagnoses, or treatment.</p>
        <p>we vet providers on our platform but cannot guarantee outcomes of any medical procedure. you are responsible for your own healthcare decisions. all provider information, pricing, and reviews on the platform are provided for informational purposes. prices shown are estimates and may vary based on your specific needs.</p>
        <p>by creating an account you agree to provide accurate information and not misuse the platform. we reserve the right to remove accounts that violate these terms.</p>
        <p>user-generated content (reviews, photos, trip reports) remains yours but you grant us a license to display it on the platform. we are not liable for any damages arising from your use of the platform or from medical procedures obtained through providers found on the platform.</p>
        <p>these terms are governed by the laws of the state of california.</p>
        <p className="text-white/50">contact: cat@denied.care</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Terms;
