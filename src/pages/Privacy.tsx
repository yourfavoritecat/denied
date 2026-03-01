import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";

const Privacy = () => (
  <div className="min-h-screen theme-public flex flex-col">
    <Navbar light />
    <main className="flex-1 max-w-[960px] mx-auto px-4 pt-24 pb-16">
      <h1 className="text-2xl font-bold mb-1" style={{ color: '#111111' }}>privacy policy</h1>
      <p className="text-xs mb-6" style={{ color: '#888888' }}>effective date: february 17, 2026</p>
      <div className="space-y-4 text-sm leading-relaxed" style={{ color: '#555555' }}>
        <p>denied.care ("we", "us") is committed to protecting your privacy. we collect: email address (for waitlist and account creation), name (for your profile), usage data (pages visited, features used), and information you voluntarily share (reviews, trip details, profile information).</p>
        <p>we use this information to: operate and improve the platform, communicate with you about your account and bookings, connect you with healthcare providers you request, and send updates about new providers and features (you can opt out anytime).</p>
        <p>we do not sell your personal data to third parties. we may share limited information with healthcare providers solely to facilitate bookings you initiate. we use industry-standard security measures to protect your data.</p>
        <p>we use cookies for authentication and basic analytics. you can request deletion of your account and data at any time by emailing cat@denied.care.</p>
        <p>we may update this policy and will notify you of material changes.</p>
        <p style={{ color: '#888888' }}>contact: cat@denied.care</p>
      </div>
    </main>
    <Footer light />
  </div>
);

export default Privacy;
