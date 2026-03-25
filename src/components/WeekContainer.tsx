"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DailyStats } from "@/lib/db";
import { DayCard } from "./DayCard";
import { formatShortDate } from "@/utils/format";

interface WeekContainerProps {
    days: DailyStats[];
    onPreviousWeek?: () => void;
    onNextWeek?: () => void;
    canGoNext?: boolean;
    currentDate?: Date;
}

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0,
    }),
};

import { startOfWeek, endOfWeek, format } from "date-fns";

// ... Inside the file

export function WeekContainer({ days, onPreviousWeek, onNextWeek, canGoNext = false, currentDate = new Date() }: WeekContainerProps) {
    // We use this tuple to track the sliding direction [currentWeekIndex, direction]
    const [[page, direction], setPage] = useState([0, 0]);

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
        if (newDirection > 0 && onNextWeek) onNextWeek();
        if (newDirection < 0 && onPreviousWeek) onPreviousWeek();
    };

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const dateRangeString = `${formatShortDate(weekStart.toISOString())} - ${formatShortDate(weekEnd.toISOString())}`;

    const isCurrentWeek = format(currentDate, "yyyy-ww") === format(new Date(), "yyyy-ww");

    return (
        <div className="w-full relative max-w-md mx-auto">

            {/* Week Header */}
            <div className="flex items-center justify-between mb-4 md:mb-6 z-10 relative">
                <button
                    onClick={() => paginate(-1)}
                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-card-border/40 hover:bg-card-border/80 text-foreground/50 hover:text-foreground transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>

                <div className="flex flex-col items-center justify-center">
                    <h3 className="text-[10px] md:text-xs uppercase tracking-[0.15em] font-semibold text-foreground/50 mb-0.5">
                        {isCurrentWeek ? "BU HAFTA" : "GEÇMİŞ HAFTA"}
                    </h3>
                    <h2 className="text-sm md:text-base font-bold text-foreground tracking-widest uppercase relative">
                        {dateRangeString}
                    </h2>
                </div>

                <button
                    onClick={() => paginate(1)}
                    disabled={!canGoNext}
                    className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl transition-all ${canGoNext
                        ? "bg-card-border/40 hover:bg-card-border/80 text-foreground/50 hover:text-foreground"
                        : "bg-transparent text-transparent cursor-not-allowed" // Hidden but takes space
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>

            {/* Week Content (Animated Days List) */}
            <div className="relative z-20 min-h-[500px] md:min-h-[550px]">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                        }}
                        className="flex flex-col gap-2 md:gap-3 absolute w-full"
                    >
                        {(!days || days.length === 0) ? (
                            <div className="text-center py-10 opacity-50 font-medium">Bu haftaya ait veri bulunamadı.</div>
                        ) : (
                            days.map((day) => (
                                <DayCard key={day.id || day.date} data={day} />
                            ))
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
