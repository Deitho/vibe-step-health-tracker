"use client";

import { useState, useEffect } from "react";
import { format, subWeeks, addWeeks } from "date-fns";
import { DailyStats } from "@/lib/db";
import { WeekContainer } from "@/components/WeekContainer";
import { SportProgressBar } from "@/components/SportProgressBar";
import { WeekSummary } from "@/components/WeekSummary";

export default function ClientPage() {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [weekData, setWeekData] = useState<DailyStats[]>([]);
    const [metrics, setMetrics] = useState({
        exerciseCount: 0,
        allDaysCompleted: false,
        isPassed: false,
    });
    const [isLoading, setIsLoading] = useState(true);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate]);

    const handlePreviousWeek = () => {
        setCurrentDate((prev) => subWeeks(prev, 1));
    };

    const handleNextWeek = () => {
        setCurrentDate((prev) => addWeeks(prev, 1));
    };

    // Determine if we can go to Next Week (no next week if current is today's week)
    const isCurrentWeek = format(currentDate, "yyyy-ww") === format(new Date(), "yyyy-ww");

    return (
        <main className="min-h-screen bg-background py-10 px-4 sm:px-6 md:px-8">
            <div className="max-w-5xl mx-auto flex flex-col items-center">

                {/* Header Title */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tighter uppercase italic drop-shadow-sm">
                        Vibe<span className="text-cta">-Step</span>
                    </h1>
                    <p className="text-foreground/70 font-medium mt-2 tracking-wide uppercase text-sm">
                        Adım & Antrenman Takibi
                    </p>
                </div>

                {/* Weekly Exercise Progress Bar */}
                <SportProgressBar
                    current={metrics.exerciseCount}
                    total={3}
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
                        />

                        {weekData.length > 0 && (
                            <WeekSummary
                                isPassed={metrics.isPassed}
                                exerciseCount={metrics.exerciseCount}
                                allDaysCompleted={metrics.allDaysCompleted}
                            />
                        )}
                    </div>
                )}

            </div>
        </main>
    );
}
