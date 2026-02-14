import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "I saved $18,000 on my All-on-4 implants. The clinic in Tijuana was world-class — better than any dentist I've been to in the States.",
    name: "Michael R.",
    location: "Phoenix, AZ",
    procedure: "All-on-4 Dental Implants",
    initials: "MR",
  },
  {
    quote: "The whole experience was seamless. From airport pickup to my hotel to the clinic — Denied handled everything. I just showed up and got my crowns.",
    name: "Sarah K.",
    location: "San Diego, CA",
    procedure: "4 Zirconia Crowns",
    initials: "SK",
  },
  {
    quote: "My insurance wanted $8,000 for a root canal and crown. I paid $700 in Mexico, including a weekend in Cancun. Never going back to US dental care.",
    name: "James T.",
    location: "Houston, TX",
    procedure: "Root Canal + Crown",
    initials: "JT",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="bg-denied-black py-24 relative overflow-hidden">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(15_100%_71%/0.04)_0%,_transparent_50%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-4xl md:text-5xl font-black text-center text-secondary mb-4">
          Real People. Real Savings.
        </h2>
        <p className="text-xl text-white/60 text-center max-w-2xl mx-auto mb-14 font-light">
          Join thousands who've escaped the insurance trap
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.name}
              className="bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm shadow-floating hover:bg-white/[0.1] tactile-lift animate-fade-in-up rounded-2xl"
              style={{ animationDelay: `${index * 0.12}s` }}
            >
              <CardContent className="pt-8 pb-8">
                <div className="bg-secondary/10 rounded-xl w-10 h-10 flex items-center justify-center mb-5">
                  <Quote className="w-5 h-5 text-secondary" />
                </div>
                <p className="text-white/85 mb-8 leading-relaxed text-[15px]">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                  <Avatar className="bg-secondary text-secondary-foreground shadow-elevated w-11 h-11">
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-bold text-sm">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-white text-sm">{testimonial.name}</div>
                    <div className="text-xs text-white/50">{testimonial.location}</div>
                    <div className="text-xs text-primary font-medium mt-0.5">{testimonial.procedure}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
