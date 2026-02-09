import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Star } from "lucide-react";

const mockSavedProviders = [
  { id: 1, name: "Dental Excellence Tijuana", location: "Tijuana, Mexico", rating: 4.9 },
  { id: 2, name: "Cancun Smile Center", location: "Cancun, Mexico", rating: 4.8 },
];

const SavedProvidersTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Saved Providers
        </CardTitle>
        <CardDescription>Providers you've bookmarked for later</CardDescription>
      </CardHeader>
      <CardContent>
        {mockSavedProviders.length > 0 ? (
          <div className="space-y-4">
            {mockSavedProviders.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <h4 className="font-semibold">{provider.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {provider.location}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-secondary text-secondary" />
                    <span className="font-medium">{provider.rating}</span>
                  </div>
                  <Button size="sm">View</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No saved providers yet. Start browsing to save your favorites!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedProvidersTab;
