import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stethoscope, Syringe, Sparkles } from "lucide-react";
import MedicalHistoryTab from "./MedicalHistoryTab";
import ProceduresTab from "./ProceduresTab";
import SkincareTab from "./SkincareTab";

const PatientHistoryTab = () => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          Patient History
        </h2>
        <p className="text-sm text-muted-foreground">
          Your medical records — shared with providers when you book trips
        </p>
      </div>

      <Tabs defaultValue="medical" className="space-y-4">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="medical" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Stethoscope className="w-4 h-4" />
            Medical & Dental
          </TabsTrigger>
          <TabsTrigger value="procedures" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Syringe className="w-4 h-4" />
            Procedures
          </TabsTrigger>
          <TabsTrigger value="skincare" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Sparkles className="w-4 h-4" />
            Skincare
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medical"><MedicalHistoryTab /></TabsContent>
        <TabsContent value="procedures"><ProceduresTab /></TabsContent>
        <TabsContent value="skincare"><SkincareTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientHistoryTab;
