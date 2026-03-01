import { Search, CalendarCheck, Plane } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

const steps = [
  {
    icon: Search,
    title: "search verified providers",
    description: "browse vetted clinics with reviews, certifications, and transparent pricing. filter by procedure, location, and budget.",
  },
  {
    icon: CalendarCheck,
    title: "book your procedure",
    description: "schedule consultations and procedures online. get quotes, compare options, and book with confidence.",
  },
  {
    icon: Plane,
    title: "travel with confidence",
    description: "concierge support for travel logistics, airport pickup, hotel booking, and comprehensive aftercare coordination.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24" style={{ background: '#FFFFFF' }}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 lowercase" style={{ color: '#111111', letterSpacing: '-1px', lineHeight: '1.1' }}>
          how it works
        </h2>
        <p className="text-base text-center max-w-2xl mx-auto mb-14 font-normal" style={{ color: '#555555', lineHeight: '1.6' }}>
          getting quality care abroad is simpler than you think
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step) => (
            <GlassCard key={step.title}>
              <div className="text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(59,240,122,0.1)' }}
                >
                  <step.icon className="w-7 h-7" style={{ color: '#3BF07A' }} />
                </div>
                <h3 className="text-lg font-bold lowercase mb-2" style={{ color: '#333333' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#555555' }}>{step.description}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
