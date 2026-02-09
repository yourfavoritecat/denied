import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCityInfo } from "@/data/destinationInfo";
import { MapPin, DollarSign, Phone, Pill, AlertTriangle, Navigation } from "lucide-react";

interface TravelInfoCardProps {
  destination: string;
}

const TravelInfoCard = ({ destination }: TravelInfoCardProps) => {
  const info = getCityInfo(destination);

  if (!info) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No travel info available for "{destination}".</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <MapPin className="w-5 h-5 text-secondary" />
        Travel Info: {info.city}
      </h3>

      {info.borderCrossing && (
        <Card className="border-secondary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Navigation className="w-4 h-4 text-secondary" />
              Border Crossing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{info.borderCrossing}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Currency & Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{info.currency}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="w-4 h-4 text-destructive" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {info.emergencyContacts.map((contact) => (
              <div key={contact.label} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{contact.label}</span>
                <a href={`tel:${contact.value}`} className="font-mono font-medium hover:text-primary">
                  {contact.value}
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" />
            Pharmacy Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{info.pharmacyGuide}</p>
        </CardContent>
      </Card>

      {info.tips.length > 0 && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-secondary" />
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {info.tips.map((tip, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TravelInfoCard;
