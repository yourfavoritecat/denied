import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Star, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const initialSavedProviders = [
  { id: 1, name: "Dental Excellence Tijuana", location: "Tijuana, Mexico", rating: 4.9 },
  { id: 2, name: "Cancun Smile Center", location: "Cancun, Mexico", rating: 4.8 },
];

const SavedProvidersTab = () => {
  const [savedProviders, setSavedProviders] = useState(initialSavedProviders);

  const handleRemove = (id: number, name: string) => {
    setSavedProviders((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Provider removed", description: `${name} has been removed from your saved list.` });
  };

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
        {savedProviders.length > 0 ? (
          <div className="space-y-4">
            {savedProviders.map((provider) => (
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
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-secondary text-secondary" />
                    <span className="font-medium">{provider.rating}</span>
                  </div>
                  <Button size="sm">View</Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(provider.id, provider.name)}
                    aria-label={`Remove ${provider.name}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
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
