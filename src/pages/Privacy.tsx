import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navbar />
    <main className="flex-1 pt-24 pb-12 max-w-2xl mx-auto px-6">
      <h1 className="text-2xl font-bold text-white mb-1">privacy policy</h1>
      <p className="text-xs text-white/40 mb-6">effective date: february 17, 2026</p>
      <div className="space-y-4 text-sm text-white/70 leading-relaxed">
        <p>denied.care ("we", "us") is committed to protecting your privacy. we collect: email address (for waitlist and account creation), name (for your profile), usage data (pages visited, features used), and information you voluntarily share (reviews, trip details, profile information).</p>
        <p>we use this information to: operate and improve the platform, communicate with you about your account and bookings, connect you with healthcare providers you request, and send updates about new providers and features (you can opt out anytime).</p>
        <p>we do not sell your personal data to third parties. we may share limited information with healthcare providers solely to facilitate bookings you initiate. we use industry-standard security measures to protect your data.</p>
        <p>we use cookies for authentication and basic analytics. you can request deletion of your account and data at any time by emailing cat@denied.care.</p>
        <p>we may update this policy and will notify you of material changes.</p>
        <p className="text-white/50">contact: cat@denied.care</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;
