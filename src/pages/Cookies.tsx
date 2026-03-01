import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";

const Cookies = () => (
  <div className="min-h-screen theme-public flex flex-col">
    <Navbar light />
    <main className="flex-1 max-w-[960px] mx-auto px-4 pt-24 pb-16">
      <h1 className="text-2xl font-bold mb-1" style={{ color: '#111111' }}>cookie policy</h1>
      <p className="text-xs mb-6" style={{ color: '#888888' }}>effective date: february 17, 2026</p>
      <div className="space-y-4 text-sm leading-relaxed" style={{ color: '#555555' }}>
        <p>denied.care uses cookies to keep you logged in (authentication cookies) and to understand how people use the site (analytics cookies via basic usage tracking).</p>
        <p>we do not use advertising cookies or sell cookie data to third parties. you can disable cookies in your browser settings, but this may affect your ability to log in and use the platform.</p>
        <p style={{ color: '#888888' }}>contact: cat@denied.care</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Cookies;
