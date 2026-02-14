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
    <section className="bg-muted py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-black text-center text-foreground mb-4">
          See the Difference
        </h2>
        <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto mb-14 font-light">
          Real prices. Real savings. No insurance games.
        </p>

        <div className="max-w-4xl mx-auto overflow-hidden rounded-2xl border border-border bg-card shadow-floating">
          <Table>
            <TableHeader>
              <TableRow className="bg-denied-black hover:bg-denied-black">
                <TableHead className="text-white font-bold text-base">Procedure</TableHead>
                <TableHead className="text-white font-bold text-base text-right">U.S. Price</TableHead>
                <TableHead className="text-white font-bold text-base text-right">Mexico Price</TableHead>
                <TableHead className="text-white font-bold text-base text-right">You Save</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procedures.map((procedure, index) => (
                <TableRow 
                  key={procedure.name}
                  className="animate-fade-in hover:bg-muted/50 transition-colors"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <TableCell className="font-semibold">{procedure.name}</TableCell>
                  <TableCell className="text-right text-muted-foreground line-through">
                    {formatCurrency(procedure.usPrice)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary text-lg">
                    {formatCurrency(procedure.mxPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-primary/15 text-primary hover:bg-primary/25 font-bold shadow-sm">
                      {procedure.savings}% OFF
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-center text-muted-foreground mt-8 text-sm">
          * Prices are estimates based on average costs. Actual prices may vary by provider.
        </p>
      </div>
    </section>
  );
};

export default PriceComparisonSection;
