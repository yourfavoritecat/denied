import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowRight } from "lucide-react";

interface Procedure {
  name: string;
  price?: string;
  priceRange?: string;
  usPrice?: number | null;
  savings?: number | null;
}

interface SavingsCalculatorProps {
  procedures: Procedure[];
  onRequestQuote: (procedureName: string) => void;
}

const useCountUp = (target: number, active: boolean, duration = 800) => {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!active) { setValue(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, active, duration]);

  return value;
};

const parsePrice = (price: string): number => {
  const match = price.replace(/,/g, "").match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

const SavingsCalculator = ({ procedures, onRequestQuote }: SavingsCalculatorProps) => {
  const [selected, setSelected] = useState<string>("");

  const proc = procedures.find((p) => p.name === selected);
  const localPrice = proc ? parsePrice(proc.price || proc.priceRange || "0") : 0;
  const usPrice = proc?.usPrice || 0;
  const savingsAmount = usPrice - localPrice;
  const savingsPct = usPrice > 0 ? Math.round((savingsAmount / usPrice) * 100) : 0;

  const isActive = !!proc && usPrice > 0;

  const animatedUs = useCountUp(usPrice, isActive);
  const animatedLocal = useCountUp(localPrice, isActive);
  const animatedSavings = useCountUp(savingsAmount, isActive);

  const validProcedures = procedures.filter((p) => p.usPrice && p.usPrice > 0);
  if (validProcedures.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border border-border/50 bg-[#1A1A1A] shadow-xl overflow-hidden">
        <CardContent className="py-6 px-4 sm:px-8">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-[#5EB298]" />
            <h3 className="text-lg font-bold text-white">Savings Calculator</h3>
          </div>

          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white max-w-sm">
              <SelectValue placeholder="Select your procedure" />
            </SelectTrigger>
            <SelectContent>
              {validProcedures.map((p) => (
                <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-1">US Average</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white/70 line-through">
                      ${animatedUs.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#5EB298] uppercase tracking-wider mb-1">Price Here</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#5EB298]">
                      ${animatedLocal.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#F8B4A0] uppercase tracking-wider mb-1">You Save</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#F8B4A0]">
                      ${animatedSavings.toLocaleString()}
                    </p>
                    <p className="text-sm font-semibold text-[#F8B4A0]">{savingsPct}% off</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button
                    className="bg-[#5EB298] hover:bg-[#5EB298]/90 text-white font-bold gap-2 px-6"
                    onClick={() => onRequestQuote(selected)}
                  >
                    Get a quote for this procedure <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SavingsCalculator;
