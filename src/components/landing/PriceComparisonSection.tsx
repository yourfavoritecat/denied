import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const procedures = [
  { name: "Zirconia Crown", usPrice: 1500, mxPrice: 350, savings: 77 },
  { name: "Dental Implant", usPrice: 4500, mxPrice: 1200, savings: 73 },
  { name: "All-on-4", usPrice: 25000, mxPrice: 8500, savings: 66 },
  { name: "Root Canal", usPrice: 1800, mxPrice: 350, savings: 81 },
  { name: "Veneers (per tooth)", usPrice: 2000, mxPrice: 450, savings: 78 },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const PriceComparisonSection = () => {
  return (
    <section className="py-16" style={{ background: '#F9F9F9' }}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 lowercase" style={{ color: '#111111', letterSpacing: '-1px', lineHeight: '1.1' }}>
          see the difference
        </h2>
        <p className="text-base text-center max-w-2xl mx-auto mb-14 font-normal" style={{ color: '#555555', lineHeight: '1.6' }}>
          real prices. real savings. no insurance games.
        </p>

        <div className="max-w-4xl mx-auto overflow-hidden rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <Table>
            <TableHeader>
              <TableRow style={{ background: '#111111' }} className="hover:bg-[#111111]">
                <TableHead className="text-white font-bold text-base">procedure</TableHead>
                <TableHead className="text-white font-bold text-base text-right">u.s. price</TableHead>
                <TableHead className="text-white font-bold text-base text-right">mexico price</TableHead>
                <TableHead className="text-white font-bold text-base text-right">you save</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procedures.map((procedure, index) => (
                <TableRow 
                  key={procedure.name}
                  className="animate-fade-in transition-colors duration-200"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <TableCell className="font-semibold" style={{ color: '#111111' }}>{procedure.name}</TableCell>
                  <TableCell className="text-right line-through" style={{ color: '#888888' }}>
                    {formatCurrency(procedure.usPrice)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg" style={{ color: '#3BF07A' }}>
                    {formatCurrency(procedure.mxPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      className="font-bold shadow-sm"
                      style={{ background: 'rgba(59,240,122,0.1)', color: '#3BF07A', border: '1px solid rgba(59,240,122,0.2)' }}
                    >
                      {procedure.savings}% off
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-center mt-8 text-sm" style={{ color: '#888888' }}>
          * prices are estimates based on average costs. actual prices may vary by provider.
        </p>
      </div>
    </section>
  );
};

export default PriceComparisonSection;
