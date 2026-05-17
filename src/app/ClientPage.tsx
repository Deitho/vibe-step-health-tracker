"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subWeeks, addWeeks } from "date-fns";
import { UtensilsCrossed, Camera } from "lucide-react";
import { DailyStats } from "@/lib/db";
import { WeekContainer } from "@/components/WeekContainer";
import { SportProgressBar } from "@/components/SportProgressBar";
import { FoodOverlay } from "@/components/FoodOverlay";

export default function ClientPage() {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [weekData, setWeekData] = useState<DailyStats[]>([]);
    const [metrics, setMetrics] = useState({
        exerciseCount: 0,
        allDaysCompleted: false,
        isPassed: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [quote, setQuote] = useState("");
    const [quoteLoading, setQuoteLoading] = useState(true);
    const [showFoodOverlay, setShowFoodOverlay] = useState(false);
    const [foodOverlayStep, setFoodOverlayStep] = useState<"search" | "barcode">("search");

    const fetchWeekData = async (date: Date) => {
        setIsLoading(true);
        try {
            const dateStr = format(date, "yyyy-MM-dd");
            const res = await fetch(`/api/weeks?date=${dateStr}`);
            if (!res.ok) throw new Error("Failed to fetch");

            const json = await res.json();
            setWeekData(json.data || []);
            setMetrics({
                exerciseCount: json.metrics?.exerciseCount || 0,
                allDaysCompleted: json.metrics?.allDaysCompleted || false,
                isPassed: json.metrics?.isWeekPassed || false,
            });
        } catch (error) {
            console.error("Error fetching data:", error);
            // In a real app we'd show an error state, but let's keep empty data for now
            setWeekData([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWeekData(currentDate);
    }, [currentDate]);

    useEffect(() => {
        fetch('/api/quote')
            .then(res => res.json())
            .then(data => setQuote(data.quote))
            .catch(() => setQuote("Sağlıklı adımlar, mutlu yarınlar!"))
            .finally(() => setQuoteLoading(false));
    }, []);

    const handlePreviousWeek = () => {
        setCurrentDate((prev) => subWeeks(prev, 1));
    };

    const handleNextWeek = () => {
        setCurrentDate((prev) => addWeeks(prev, 1));
    };

    // Determine if we can go to Next Week (no next week if current is today's week)
    const isCurrentWeek = format(currentDate, "yyyy-ww") === format(new Date(), "yyyy-ww");

    const handleFoodSaved = useCallback(() => {
        fetchWeekData(currentDate);
    }, [currentDate]);

    return (
        <main className="min-h-screen bg-background py-10 px-4 sm:px-6 md:px-8">
            <div className="max-w-5xl mx-auto flex flex-col items-center">

                {/* Header Title */}
                <div className="text-center mb-6">
                    <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tighter uppercase italic drop-shadow-sm">
                        VIBE
                        <span className="text-cta"> STEP</span>
                    </h1>
                    <p className="text-foreground/60 font-medium mt-3 tracking-wide text-sm min-h-[1.5em]">
                        {quoteLoading ? (
                            <span className="animate-pulse text-white/30 italic">...</span>
                        ) : (
                            <span className="italic">&ldquo;{quote}&rdquo;</span>
                        )}
                    </p>
                </div>

                {/* Weekly Exercise Progress Bar + Food Buttons */}
                <SportProgressBar
                    current={metrics.exerciseCount}
                    total={3}
                    actions={
                        <>
                            <button
                                onClick={() => { setFoodOverlayStep("search"); setShowFoodOverlay(true); }}
                                className="w-11 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
                                title="Besin ekle"
                            >
                                <UtensilsCrossed className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => { setFoodOverlayStep("barcode"); setShowFoodOverlay(true); }}
                                className="w-11 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors md:hidden"
                                title="Barkod okut"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        </>
                    }
                />

                {/* Main Content Area */}
                {isLoading ? (
                    <div className="w-full flex justify-center py-32">
                        <div className="animate-pulse flex space-x-2 items-center">
                            <div className="h-4 w-4 bg-primary rounded-full animate-bounce"></div>
                            <div className="h-4 w-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="h-4 w-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex flex-col gap-6">
                        <WeekContainer
                            days={weekData}
                            onPreviousWeek={handlePreviousWeek}
                            onNextWeek={handleNextWeek}
                            canGoNext={!isCurrentWeek}
                            currentDate={currentDate}
                        />
                    </div>
                )}

            </div>

            <FoodOverlay
                isOpen={showFoodOverlay}
                onClose={() => setShowFoodOverlay(false)}
                date={format(new Date(), "yyyy-MM-dd")}
                onSaved={handleFoodSaved}
                initialStep={foodOverlayStep}
            />
        </main>
    );
}
