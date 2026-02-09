import { Search, CalendarCheck, Plane } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    icon: Search,
    title: "Search Verified Providers",
    description: "Browse vetted clinics with reviews, certifications, and transparent pricing. Filter by procedure, location, and budget.",
  },
  {
    icon: CalendarCheck,
    title: "Book Your Procedure",
    description: "Schedule consultations and procedures online. Get quotes, compare options, and book with confidence.",
  },
  {
    icon: Plane,
    title: "Travel With Confidence",
    description: "Concierge support for travel logistics, airport pickup, hotel booking, and comprehensive aftercare coordination.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="bg-denied-cream py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-4">
          How It Works
        </h2>
        <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          Getting quality care abroad is simpler than you think
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <Card 
              key={step.title} 
              className="bg-card border border-border/50 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
