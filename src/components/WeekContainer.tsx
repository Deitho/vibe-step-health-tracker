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

export function WeekContainer({ days, onPreviousWeek, onNextWeek, canGoNext = false }: WeekContainerProps) {
    // We use this tuple to track the sliding direction [currentWeekIndex, direction]
    const [[page, direction], setPage] = useState([0, 0]);

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
        if (newDirection > 0 && onNextWeek) onNextWeek();
        if (newDirection < 0 && onPreviousWeek) onPreviousWeek();
    };

    // Safe checks if empty data
    if (!days || days.length === 0) {
        return <div className="text-center py-10 opacity-50 font-medium">Bu haftaya ait veri bulunamadı.</div>;
    }

    const startDate = days[0].date;
    const endDate = days[days.length - 1].date;
    const dateRangeString = `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;

    return (
        <div className="w-full relative overflow-hidden bg-white/50 backdrop-blur-md border md:border-2 border-primary/10 rounded-3xl p-4 md:p-8 shadow-sm">

            {/* Week Header */}
            <div className="flex items-center justify-between mb-8 z-10 relative">
                <button
                    onClick={() => paginate(-1)}
                    className="p-3 md:p-4 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors hover:scale-105"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>

                <h2 className="text-xl md:text-3xl font-black text-foreground tracking-tight uppercase">
                    {dateRangeString}
                </h2>

                <button
                    onClick={() => paginate(1)}
                    disabled={!canGoNext}
                    className={`p-3 md:p-4 rounded-full transition-colors ${canGoNext
                            ? "bg-primary/10 hover:bg-primary/20 text-primary hover:scale-105"
                            : "bg-gray-100 text-gray-300 cursor-not-allowed"
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>

            {/* Week Content (Animated Days List) */}
            <div className="relative min-h-[600px]">
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
                        className="flex flex-col gap-4 absolute w-full"
                    >
                        {days.map((day) => (
                            <DayCard key={day.id || day.date} data={day} />
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
