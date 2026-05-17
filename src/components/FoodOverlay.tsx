"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowLeft, Camera, Loader2, Check } from "lucide-react";

interface SearchItem {
  food_id: string;
  food_name: string;
  food_description: string;
  brand_name?: string;
}

interface ServingInfo {
  serving_id: string;
  serving_description: string;
  calories: string;
  protein: string;
  carbohydrate: string;
  fat: string;
}

interface FoodDetail extends SearchItem {
  servings: ServingInfo[];
}

type Step = "search" | "barcode" | "quantity";

interface FoodOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  onSaved: () => void;
  initialStep?: "search" | "barcode";
}

export function FoodOverlay({ isOpen, onClose, date, onSaved, initialStep = "search" }: FoodOverlayProps) {
  const [step, setStep] = useState<Step>(initialStep);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodDetail | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      setQuery("");
      setResults([]);
      setSelectedFood(null);
      setQuantity(1);
      setError("");
    }
  }, [isOpen, initialStep]);

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (step !== "barcode" || !isOpen) {
      stopScanner();
    }
  }, [step, isOpen, stopScanner]);

  const startBarcode = useCallback(async () => {
    setError("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      await stopScanner();

      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText: string) => {
          await scanner.stop().catch(() => {});
          scannerRef.current = null;
          lookupBarcode(decodedText);
        },
        () => {}
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Kamera erisimi basarisiz";
      setError(message);
    }
  }, [stopScanner]);

  const lookupBarcode = async (code: string) => {
    setBarcodeLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/food/barcode?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.food) {
        setSelectedFood(data.food);
        setQuantity(1);
        setStep("quantity");
      } else {
        setError("Bu barkod icin urun bulunamadi");
      }
    } catch {
      setError("Barkod aramasi basarisiz");
    } finally {
      setBarcodeLoading(false);
    }
  };

  useEffect(() => {
    if (step === "barcode" && isOpen && !barcodeLoading) {
      const timer = setTimeout(() => startBarcode(), 200);
      return () => clearTimeout(timer);
    }
  }, [step, isOpen, barcodeLoading, startBarcode]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch("/api/food/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      setResults(data.foods || []);
    } catch {
      setError("Arama basarisiz");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectFood = async (item: SearchItem) => {
    setSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/food/get?food_id=${item.food_id}`);
      const data = await res.json();
      if (data.food) {
        setSelectedFood(data.food);
        setQuantity(1);
        setStep("quantity");
      } else {
        setError("Besin detaylari alinamadi");
      }
    } catch {
      setError("Besin detaylari alinamadi");
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFood || !selectedFood.servings[0]) return;
    const serving = selectedFood.servings[0];
    const qty = Math.max(0.25, quantity);

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/food/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          food_id: selectedFood.food_id,
          food_name: selectedFood.food_name,
          serving_description: serving.serving_description,
          calories: (parseFloat(serving.calories) * qty).toFixed(2),
          protein: (parseFloat(serving.protein) * qty).toFixed(2),
          carbs: (parseFloat(serving.carbohydrate) * qty).toFixed(2),
          fat: (parseFloat(serving.fat) * qty).toFixed(2),
          quantity: qty,
        }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const errData = await res.json().catch(() => null);
        setError(errData?.error || "Kayit basarisiz");
      }
    } catch {
      setError("Kayit basarisiz");
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    setError("");
    if (step === "barcode" || step === "quantity") {
      setSelectedFood(null);
      setStep("search");
    }
  };

  const headerTitle = step === "search" ? "Besin Ara" : step === "barcode" ? "Barkod Okut" : "Miktar Gir";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md hidden sm:block"
            onClick={onClose}
          />
          <div className="absolute inset-0 bg-[#0a0a14] sm:hidden" />

          {/* Modal */}
          <motion.div
            className="relative w-full sm:max-w-md h-full sm:h-auto sm:max-h-[85vh] bg-[#14141f] border-0 sm:border border-white/[0.06] sm:rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                {step !== "search" && (
                  <button
                    onClick={goBack}
                    className="p-1 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <span className="text-sm font-semibold text-white/70">{headerTitle}</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {/* STEP: SEARCH */}
              {step === "search" && (
                <div className="p-4 flex flex-col gap-3">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Besin adi yazin..."
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-white/[0.15] transition-colors"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!query.trim() || searching}
                      className="px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.1] transition-colors disabled:opacity-30"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </form>

                  <button
                    onClick={() => {
                      setError("");
                      setStep("barcode");
                    }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-dashed border-white/[0.08] text-white/35 hover:text-white/60 hover:border-white/[0.15] transition-colors text-xs"
                  >
                    <Camera className="w-4 h-4" />
                    Barkod ile Ara
                  </button>

                  {error && <p className="text-xs text-red-400/80">{error}</p>}

                  {searching ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                    </div>
                  ) : results.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {results.map((item) => (
                        <button
                          key={item.food_id}
                          onClick={() => handleSelectFood(item)}
                          className="text-left p-3 rounded-lg hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                        >
                          <span className="text-sm text-white/80 block">{item.food_name}</span>
                          <span className="text-[11px] text-white/30 block mt-0.5 truncate">
                            {item.food_description}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : query.trim() && !searching ? (
                    <p className="text-xs text-white/20 text-center py-8">Sonuc bulunamadi</p>
                  ) : null}
                </div>
              )}

              {/* STEP: BARCODE */}
              {step === "barcode" && (
                <div className="p-4 flex flex-col gap-3">
                  {barcodeLoading ? (
                    <div className="flex flex-col items-center gap-3 py-12">
                      <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
                      <span className="text-sm text-white/30">Barkod araniyor...</span>
                    </div>
                  ) : (
                    <>
                      <div id="barcode-reader" className="w-full rounded-lg overflow-hidden bg-black min-h-[200px]" />
                      {error && <p className="text-xs text-red-400/80 text-center">{error}</p>}
                      <p className="text-[10px] text-white/15 text-center">
                        Barkodu kamera cercevesine yerlestirin
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* STEP: QUANTITY */}
              {step === "quantity" && selectedFood && (
                <div className="p-4 flex flex-col gap-4">
                  <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-sm font-semibold text-white/80 block">
                      {selectedFood.food_name}
                    </span>
                    {selectedFood.brand_name && (
                      <span className="text-xs text-white/30 block mt-0.5">
                        {selectedFood.brand_name}
                      </span>
                    )}
                    {selectedFood.servings[0] && (
                      <span className="text-[11px] text-white/40 block mt-1">
                        {selectedFood.servings[0].serving_description}
                        {" · "}
                        {selectedFood.servings[0].calories} kcal
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] text-white/30 uppercase tracking-wider mb-1.5 block">
                      Miktar
                    </label>
                    <input
                      type="number"
                      min={0.25}
                      step={0.25}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(0.25, parseFloat(e.target.value) || 0.25))
                      }
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-white/[0.15] transition-colors"
                    />
                  </div>

                  {selectedFood.servings[0] && (
                    <div className="grid grid-cols-2 gap-2 text-center">
                      {(["calories", "protein", "carbohydrate", "fat"] as const).map((key) => (
                        <div
                          key={key}
                          className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                        >
                          <span className="text-[10px] text-white/25 block">
                            {key === "calories" ? "Kalori" : key === "protein" ? "Protein" : key === "carbohydrate" ? "Karbonhidrat" : "Yag"}
                          </span>
                          <span className="text-sm text-white/70 tabular-nums font-semibold">
                            {key === "calories"
                              ? (parseFloat(selectedFood.servings[0].calories) * quantity).toFixed(0)
                              : (parseFloat(selectedFood.servings[0][key]) * quantity).toFixed(1)}
                            {key !== "calories" ? "g" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {error && <p className="text-xs text-red-400/80 text-center">{error}</p>}

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-2.5 rounded-lg bg-white/[0.08] border border-white/[0.1] text-white/80 font-medium text-sm hover:bg-white/[0.12] transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {saving ? "Kaydediliyor..." : "Ekle"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
