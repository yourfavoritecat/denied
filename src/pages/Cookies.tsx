import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";

const Cookies = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navbar />
    <main className="flex-1 pt-24 pb-12 max-w-2xl mx-auto px-6">
      <h1 className="text-2xl font-bold text-white mb-1">cookie policy</h1>
      <p className="text-xs text-white/40 mb-6">effective date: february 17, 2026</p>
      <div className="space-y-4 text-sm text-white/70 leading-relaxed">
        <p>denied.care uses cookies to keep you logged in (authentication cookies) and to understand how people use the site (analytics cookies via basic usage tracking).</p>
        <p>we do not use advertising cookies or sell cookie data to third parties. you can disable cookies in your browser settings, but this may affect your ability to log in and use the platform.</p>
        <p className="text-white/50">contact: cat@denied.care</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Cookies;
