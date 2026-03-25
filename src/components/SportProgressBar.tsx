"use client";

import { motion } from "framer-motion";

interface SportProgressBarProps {
    current: number;
    total: number;
}

export function SportProgressBar({ current, total }: SportProgressBarProps) {
    const isPassed = current >= total;
    const colorClass = isPassed ? "bg-success" : "bg-primary";
    const textClass = isPassed ? "text-success" : "text-primary";

    return (
        <div className="w-full flex-col flex items-center mb-6 max-w-md mx-auto">
            <div className="w-full bg-card/20 border border-card-border/40 rounded-2xl p-4 shadow-xl">
                <div className="flex justify-between w-full mb-3 items-center">
                    <span className="text-foreground/50 font-bold text-[10px] md:text-xs tracking-widest uppercase">
                        BU HAFTAKİ SPOR SAYISI
                    </span>
                    <span className={`font-black text-sm md:text-base ${textClass}`}>
                        {Math.min(current, total)} / {total}
                    </span>
                </div>

                <div className="flex gap-2 w-full h-1.5 md:h-2">
                    {Array.from({ length: total }).map((_, i) => (
                        <div key={i} className="flex-1 bg-foreground/10 rounded-full overflow-hidden relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: i < current ? "100%" : "0%" }}
                                transition={{ duration: 0.5, delay: i * 0.15, ease: "easeOut" }}
                                className={`h-full absolute left-0 top-0 rounded-full ${colorClass}`}
                            />
                        </div>
                    ))}
                </div>

                {isPassed && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 text-success font-medium flex items-center justify-center gap-1.5 text-[11px] md:text-xs tracking-wide"
                    >
                        <span>🎉</span> Haftalık spor hedefine ulaştın!
                    </motion.p>
                )}
            </div>
        </div>
    );
}
