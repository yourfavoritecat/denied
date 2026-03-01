import { Button } from "@/components/ui/button";
import { Calendar, FileText } from "lucide-react";

const TripsTab = () => {
  return (
    <div className="space-y-6">
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          padding: 24,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5" style={{ color: '#111111' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111111' }}>trip summary</h3>
        </div>
        <p style={{ fontSize: 13, color: '#888888', marginBottom: 20 }}>quick overview of your medical tourism journey</p>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {[
            { value: "0", label: "completed trips" },
            { value: "$0", label: "total saved" },
            { value: "0", label: "upcoming trips" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center"
              style={{
                background: '#FAFAFA',
                borderRadius: 12,
                padding: 20,
                border: '1px solid rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: '#111111' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#888888' }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <Button
          className="w-full font-semibold border-none"
          style={{ background: '#3BF07A', color: '#111111', borderRadius: 9999 }}
          asChild
        >
          <a href="/my-trips">view all trips</a>
        </Button>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          padding: 24,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5" style={{ color: '#111111' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111111' }}>trip briefs</h3>
        </div>
        <p style={{ fontSize: 13, color: '#888888', marginBottom: 16 }}>
          trip briefs let you save destinations, procedures, budgets, and medical notes — then attach them to quote requests.
        </p>
        <Button
          variant="outline"
          className="w-full font-semibold"
          style={{ border: '2px solid #3BF07A', color: '#111111', borderRadius: 9999, background: 'transparent' }}
          asChild
        >
          <a href="/my-trips?tab=briefs">view & manage trip briefs</a>
        </Button>
      </div>
    </div>
  );
};

export default TripsTab;
