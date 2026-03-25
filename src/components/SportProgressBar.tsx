"use client";

import { motion } from "framer-motion";

interface SportProgressBarProps {
    current: number;
    total: number;
}

export function SportProgressBar({ current, total }: SportProgressBarProps) {
    const isComplete = current >= total;

    return (
        <div className="w-full max-w-sm mx-auto mb-6 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md px-4 py-3">
            <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] tracking-[0.15em] text-white/35 uppercase">Bu Haftaki Spor Sayısı</span>
                <span className={`text-[13px] tabular-nums tracking-wide ${isComplete ? "text-emerald-400" : "text-cyan-400"}`} style={{ fontWeight: 600 }}>
                    {current} / {total}
                </span>
            </div>
            <div className="flex gap-1.5 h-2">
                {Array.from({ length: total }).map((_, i) => (
                    <div key={i} className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        {i < current ? (
                            <motion.div
                                className={`h-full rounded-full ${isComplete ? "bg-emerald-500" : "bg-cyan-500"} w-full`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: i * 0.15 }}
                            />
                        ) : null}
                    </div>
                ))}
            </div>
            {isComplete && (
                <motion.p
                    className="flex justify-center items-center gap-1.5 text-[10px] text-emerald-400/80 mt-3 tracking-wide font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <span>🎉</span> Haftalık spor hedefine ulaştın!
                </motion.p>
            )}
        </div>
    );
}
