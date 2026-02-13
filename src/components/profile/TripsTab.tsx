import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText } from "lucide-react";

const TripsTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Trip Summary
          </CardTitle>
          <CardDescription>Quick overview of your medical tourism journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Completed Trips</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-primary">$0</div>
              <div className="text-sm text-muted-foreground">Total Saved</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Upcoming Trips</div>
            </div>
          </div>
          <Button className="w-full" asChild>
            <a href="/my-trips">View All Trips</a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Trip Briefs
          </CardTitle>
          <CardDescription>Your saved trip plans and procedure wishlists</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Trip Briefs let you save destinations, procedures, budgets, and medical notes — then attach them to quote requests.
          </p>
          <Button className="w-full" asChild>
            <a href="/my-trips?tab=briefs">View & Manage Trip Briefs</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TripsTab;
