"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DailyStats } from "@/lib/db";
import { DayCard } from "./DayCard";
import { formatShortDate } from "@/utils/format";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

export function WeekContainer({ days, onPreviousWeek, onNextWeek, canGoNext = false, currentDate = new Date() }: WeekContainerProps) {
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
            <div className="flex items-center justify-between px-1 mb-2 z-10 relative">
                <button
                    onClick={() => paginate(-1)}
                    className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70 transition-all"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-center">
                    <span className="text-[11px] tracking-[0.2em] text-white/30 uppercase block mb-0.5">
                        {isCurrentWeek ? "Bu Hafta" : "Geçmiş Hafta"}
                    </span>
                    <span className="text-[13px] tracking-wider text-white/70" style={{ fontWeight: 600 }}>
                        {dateRangeString}
                    </span>
                </div>

                <button
                    onClick={() => paginate(1)}
                    disabled={!canGoNext}
                    className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70 disabled:opacity-0 transition-all"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Days Slider */}
            <div className="relative w-full overflow-hidden min-h-[500px] md:min-h-[550px]">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30, duration: 0.15 },
                            opacity: { duration: 0.15 }
                        }}
                        className="w-full flex-col gap-2 flex absolute"
                    >
                        {(!days || days.length === 0) ? (
                            <div className="text-[12px] text-center w-full py-10 opacity-40 uppercase tracking-widest font-semibold">
                                Bu haftaya ait veri bulunamadı.
                            </div>
                        ) : (
                            days.map((day) => (
                                <DayCard key={day.date} data={day} />
                            ))
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
