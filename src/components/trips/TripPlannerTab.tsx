import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChecklistSection from "./ChecklistSection";
import PackingListSection from "./PackingListSection";
import TravelInfoCard from "./TravelInfoCard";
import DayByDayItinerary from "./DayByDayItinerary";
import {
  getPreTripChecklist,
  getPackingList,
  getPostProcedureChecklist,
  getProcedureCategory,
} from "@/data/checklistData";
import { ClipboardCheck, ShoppingBag, MapPin, HeartPulse, CalendarDays } from "lucide-react";

interface TripPlannerTabProps {
  bookingId: string;
  procedures: { name: string; quantity?: number }[];
  destination: string;
  travelStart: string | null;
  travelEnd: string | null;
  providerEstimatedDates: string | null;
}

const TripPlannerTab = ({
  bookingId,
  procedures,
  destination,
  travelStart,
  travelEnd,
  providerEstimatedDates,
}: TripPlannerTabProps) => {
  const category = getProcedureCategory(procedures);

  return (
    <Tabs defaultValue="checklist" className="w-full">
      <TabsList className="w-full grid grid-cols-5 mb-6">
        <TabsTrigger value="checklist" className="text-xs sm:text-sm flex items-center gap-1">
          <ClipboardCheck className="w-3.5 h-3.5 hidden sm:block" />
          Pre-Trip
        </TabsTrigger>
        <TabsTrigger value="packing" className="text-xs sm:text-sm flex items-center gap-1">
          <ShoppingBag className="w-3.5 h-3.5 hidden sm:block" />
          Packing
        </TabsTrigger>
        <TabsTrigger value="travel" className="text-xs sm:text-sm flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 hidden sm:block" />
          Travel Info
        </TabsTrigger>
        <TabsTrigger value="post" className="text-xs sm:text-sm flex items-center gap-1">
          <HeartPulse className="w-3.5 h-3.5 hidden sm:block" />
          Post-Care
        </TabsTrigger>
        <TabsTrigger value="itinerary" className="text-xs sm:text-sm flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5 hidden sm:block" />
          Itinerary
        </TabsTrigger>
      </TabsList>

      <TabsContent value="checklist">
        <ChecklistSection
          title="Pre-Trip Checklist"
          items={getPreTripChecklist()}
          storageKey={`checklist-pre`}
          bookingId={bookingId}
        />
      </TabsContent>

      <TabsContent value="packing">
        <PackingListSection
          items={getPackingList(category)}
          storageKey="packing"
          bookingId={bookingId}
        />
      </TabsContent>

      <TabsContent value="travel">
        <TravelInfoCard destination={destination} />
      </TabsContent>

      <TabsContent value="post">
        <ChecklistSection
          title="Post-Procedure Checklist"
          items={getPostProcedureChecklist(category)}
          storageKey={`checklist-post`}
          bookingId={bookingId}
        />
      </TabsContent>

      <TabsContent value="itinerary">
        <DayByDayItinerary
          travelStart={travelStart}
          travelEnd={travelEnd}
          providerEstimatedDates={providerEstimatedDates}
          destination={destination}
          storageKey="itinerary"
          bookingId={bookingId}
        />
      </TabsContent>
    </Tabs>
  );
};

export default TripPlannerTab;
