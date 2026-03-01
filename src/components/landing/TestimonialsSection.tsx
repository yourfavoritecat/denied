import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "I saved $18,000 on my All-on-4 implants. The clinic in Tijuana was world-class — better than any dentist I've been to in the States.",
    name: "michael r.",
    location: "phoenix, az",
    procedure: "all-on-4 dental implants",
    initials: "MR",
  },
  {
    quote: "The whole experience was seamless. From airport pickup to my hotel to the clinic — Denied handled everything. I just showed up and got my crowns.",
    name: "sarah k.",
    location: "san diego, ca",
    procedure: "4 zirconia crowns",
    initials: "SK",
  },
  {
    quote: "My insurance wanted $8,000 for a root canal and crown. I paid $700 in Mexico, including a weekend in Cancun. Never going back to US dental care.",
    name: "james t.",
    location: "houston, tx",
    procedure: "root canal + crown",
    initials: "JT",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-16" style={{ background: '#111111' }}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 lowercase" style={{ color: '#FF6B4A', letterSpacing: '-1px', lineHeight: '1.1' }}>
          real people. real savings.
        </h2>
        <p className="text-base text-center max-w-2xl mx-auto mb-14 font-normal" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>
          join thousands who've escaped the insurance trap
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="rounded-2xl p-6 transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                className="rounded-xl w-10 h-10 flex items-center justify-center mb-5"
                style={{ background: 'rgba(255,107,74,0.1)' }}
              >
                <Quote className="w-5 h-5" style={{ color: '#FF6B4A' }} />
              </div>
              <p className="mb-8 leading-relaxed text-[15px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Avatar className="w-11 h-11">
                  <AvatarFallback className="font-bold text-sm" style={{ background: '#FF6B4A', color: '#111111' }}>
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-sm" style={{ color: '#FFFFFF' }}>{testimonial.name}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{testimonial.location}</div>
                  <div className="text-xs font-medium mt-0.5" style={{ color: '#3BF07A' }}>{testimonial.procedure}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
