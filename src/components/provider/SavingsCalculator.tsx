import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, ArrowRight, X, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  // Take the first number from price ranges like "$350–$450"
  const match = price.replace(/,/g, "").match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

const SavingsCalculator = ({ procedures, onRequestQuote }: SavingsCalculatorProps) => {
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [selectValue, setSelectValue] = useState<string>("");

  const validProcedures = procedures.filter((p) => p.usPrice && p.usPrice > 0);
  const availableToAdd = validProcedures.filter((p) => !selectedProcedures.includes(p.name));

  const handleAdd = (name: string) => {
    if (selectedProcedures.length >= 10) return;
    if (!selectedProcedures.includes(name)) {
      setSelectedProcedures((prev) => [...prev, name]);
    }
    setSelectValue("");
  };

  const handleRemove = (name: string) => {
    setSelectedProcedures((prev) => prev.filter((n) => n !== name));
  };

  // Calculate totals
  const totals = selectedProcedures.reduce(
    (acc, name) => {
      const proc = procedures.find((p) => p.name === name);
      if (!proc) return acc;
      const localPrice = parsePrice(proc.price || proc.priceRange || "0");
      const usPrice = proc.usPrice || 0;
      return {
        usTotal: acc.usTotal + usPrice,
        localTotal: acc.localTotal + localPrice,
      };
    },
    { usTotal: 0, localTotal: 0 }
  );

  const savingsAmount = totals.usTotal - totals.localTotal;
  const savingsPct = totals.usTotal > 0 ? Math.round((savingsAmount / totals.usTotal) * 100) : 0;
  const isActive = selectedProcedures.length > 0 && totals.usTotal > 0;

  const animatedUs = useCountUp(totals.usTotal, isActive);
  const animatedLocal = useCountUp(totals.localTotal, isActive);
  const animatedSavings = useCountUp(savingsAmount, isActive);

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

          {/* Procedure selector */}
          <div className="space-y-3">
            {availableToAdd.length > 0 && (
              <Select value={selectValue} onValueChange={handleAdd}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white max-w-sm">
                  <SelectValue placeholder={selectedProcedures.length === 0 ? "Select a procedure" : "Add another procedure"} />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((p) => (
                    <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Selected procedures as removable badges */}
            {selectedProcedures.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedProcedures.map((name) => {
                  const proc = procedures.find((p) => p.name === name);
                  const localPrice = proc ? parsePrice(proc.price || proc.priceRange || "0") : 0;
                  return (
                    <Badge
                      key={name}
                      className="bg-white/10 text-white border-white/20 gap-1.5 pr-1.5 py-1.5 text-sm"
                    >
                      <span>{name}</span>
                      <span className="text-[#5EB298] font-bold">${localPrice.toLocaleString()}</span>
                      <button
                        onClick={() => handleRemove(name)}
                        className="ml-1 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Per-procedure breakdown */}
                {selectedProcedures.length > 1 && (
                  <div className="mt-4 space-y-1.5">
                    {selectedProcedures.map((name) => {
                      const proc = procedures.find((p) => p.name === name);
                      if (!proc) return null;
                      const localPrice = parsePrice(proc.price || proc.priceRange || "0");
                      const usPrice = proc.usPrice || 0;
                      return (
                        <div key={name} className="flex items-center justify-between text-sm">
                          <span className="text-white/60 truncate mr-4">{name}</span>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-white/40 line-through">${usPrice.toLocaleString()}</span>
                            <span className="text-[#5EB298] font-semibold">${localPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="border-t border-white/10 pt-2 mt-2" />
                  </div>
                )}

                {/* Totals */}
                <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
                      US Average{selectedProcedures.length > 1 ? " Total" : ""}
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-white/70 line-through">
                      ${animatedUs.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#5EB298] uppercase tracking-wider mb-1">
                      Price Here{selectedProcedures.length > 1 ? " Total" : ""}
                    </p>
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
                    onClick={() => onRequestQuote(selectedProcedures.join(", "))}
                  >
                    Get a quote{selectedProcedures.length > 1 ? ` for ${selectedProcedures.length} procedures` : ""} <ArrowRight className="w-4 h-4" />
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
