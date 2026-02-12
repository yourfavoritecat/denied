import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, ArrowRight, X, Plus, Minus } from "lucide-react";
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
  const match = price.replace(/,/g, "").match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

const SavingsCalculator = ({ procedures, onRequestQuote }: SavingsCalculatorProps) => {
  const [selectedItems, setSelectedItems] = useState<{ name: string; qty: number }[]>([]);
  const [selectValue, setSelectValue] = useState<string>("");

  const validProcedures = procedures.filter((p) => p.usPrice && p.usPrice > 0);
  const selectedNames = selectedItems.map((s) => s.name);
  const availableToAdd = validProcedures.filter((p) => !selectedNames.includes(p.name));

  const handleAdd = (name: string) => {
    if (selectedItems.length >= 10) return;
    if (!selectedNames.includes(name)) {
      setSelectedItems((prev) => [...prev, { name, qty: 1 }]);
    }
    setSelectValue("");
  };

  const handleRemove = (name: string) => {
    setSelectedItems((prev) => prev.filter((s) => s.name !== name));
  };

  const handleQty = (name: string, delta: number) => {
    setSelectedItems((prev) =>
      prev.map((s) => s.name === name ? { ...s, qty: Math.max(1, Math.min(20, s.qty + delta)) } : s)
    );
  };

  const totals = selectedItems.reduce(
    (acc, { name, qty }) => {
      const proc = procedures.find((p) => p.name === name);
      if (!proc) return acc;
      const localPrice = parsePrice(proc.price || proc.priceRange || "0");
      const usPrice = proc.usPrice || 0;
      return {
        usTotal: acc.usTotal + usPrice * qty,
        localTotal: acc.localTotal + localPrice * qty,
      };
    },
    { usTotal: 0, localTotal: 0 }
  );

  const savingsAmount = totals.usTotal - totals.localTotal;
  const savingsPct = totals.usTotal > 0 ? Math.round((savingsAmount / totals.usTotal) * 100) : 0;
  const isActive = selectedItems.length > 0 && totals.usTotal > 0;
  const totalUnits = selectedItems.reduce((sum, s) => sum + s.qty, 0);

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

          <div className="space-y-3">
            {availableToAdd.length > 0 && selectedItems.length < 10 && (
              <Select value={selectValue} onValueChange={handleAdd}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white max-w-sm">
                  <SelectValue placeholder={selectedItems.length === 0 ? "Select a procedure" : "Add another procedure"} />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((p) => (
                    <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedItems.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedItems.map(({ name, qty }) => {
                  const proc = procedures.find((p) => p.name === name);
                  const localPrice = proc ? parsePrice(proc.price || proc.priceRange || "0") : 0;
                  return (
                    <Badge
                      key={name}
                      className="bg-white/10 text-white border-white/20 gap-1 pr-1.5 py-1 text-sm"
                    >
                      <span>{name}</span>
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={() => handleQty(name, -1)}
                          className="hover:text-white/80 transition-colors disabled:opacity-30"
                          disabled={qty <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-[#5EB298] font-bold min-w-[1.25rem] text-center">×{qty}</span>
                        <button
                          onClick={() => handleQty(name, 1)}
                          className="hover:text-white/80 transition-colors disabled:opacity-30"
                          disabled={qty >= 20}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-[#5EB298] font-bold">${(localPrice * qty).toLocaleString()}</span>
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
                {(selectedItems.length > 1 || selectedItems.some(s => s.qty > 1)) && (
                  <div className="mt-4 space-y-1.5">
                    {selectedItems.map(({ name, qty }) => {
                      const proc = procedures.find((p) => p.name === name);
                      if (!proc) return null;
                      const localPrice = parsePrice(proc.price || proc.priceRange || "0");
                      const usPrice = proc.usPrice || 0;
                      return (
                        <div key={name} className="flex items-center justify-between text-sm">
                          <span className="text-white/60 truncate mr-4">{name}{qty > 1 ? ` ×${qty}` : ""}</span>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-white/40 line-through">${(usPrice * qty).toLocaleString()}</span>
                            <span className="text-[#5EB298] font-semibold">${(localPrice * qty).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="border-t border-white/10 pt-2 mt-2" />
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
                      US Average{totalUnits > 1 ? " Total" : ""}
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-white/70 line-through">
                      ${animatedUs.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#5EB298] uppercase tracking-wider mb-1">
                      Price Here{totalUnits > 1 ? " Total" : ""}
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
                    onClick={() => onRequestQuote(selectedItems.map(s => s.qty > 1 ? `${s.name} ×${s.qty}` : s.name).join(", "))}
                  >
                    Get a quote for {totalUnits} procedure{totalUnits !== 1 ? "s" : ""} <ArrowRight className="w-4 h-4" />
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