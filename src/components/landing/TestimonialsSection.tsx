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
    <section className="bg-denied-black py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-secondary mb-4">
          Real People. Real Savings.
        </h2>
        <p className="text-xl text-white/70 text-center max-w-2xl mx-auto mb-12">
          Join thousands who've escaped the insurance trap
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.name}
              className="bg-white/5 border border-white/10 backdrop-blur shadow-lg shadow-black/20 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="pt-6">
                <Quote className="w-8 h-8 text-secondary/50 mb-4" />
                <p className="text-white/90 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="bg-secondary text-secondary-foreground">
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-white/60">{testimonial.location}</div>
                    <div className="text-sm text-primary">{testimonial.procedure}</div>
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
