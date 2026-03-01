import { GlassCard } from "@/components/ui/glass-card";

const stats = [
  { value: "70%", label: "average savings" },
  { value: "5★", label: "provider ratings" },
  { value: "24/7", label: "patient support" },
];

const SocialProofSection = () => {
  return (
    <section className="py-16" style={{ background: '#FFFFFF' }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {stats.map((stat) => (
            <GlassCard key={stat.label}>
              <div className="text-center">
                <div className="text-3xl font-[800] mb-1" style={{ color: '#111111' }}>{stat.value}</div>
                <div className="text-[13px] font-medium lowercase" style={{ color: '#888888' }}>{stat.label}</div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
