import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertTriangle, ChevronDown, Dumbbell, Timer } from "lucide-react";
import { DailyStats } from "@/lib/db";
import { formatDayName, formatShortDate } from "@/utils/format";

interface DayCardProps {
    data: DailyStats;
}

export function DayCard({ data }: DayCardProps) {
    const { date, steps, target_steps, debt_steps, status, has_exercise } = data;

    const dayName = formatDayName(date);
    const shortDate = formatShortDate(date);
    const isToday = dayName.toLowerCase() === "bugün";

    const [debtExpanded, setDebtExpanded] = useState(false);
    
    const originalMissing = Math.max(0, target_steps - steps);
    const paidOff = Math.max(0, originalMissing - debt_steps);
    const hasDebt = debt_steps > 0 || paidOff > 0;
    const hasPendingDebt = debt_steps > 0;
    const debtFullyPaid = hasDebt && debt_steps === 0;
    
    const isFuture = status === "PENDING" && steps === 0 && !hasDebt && !isToday;
    const canExpand = (status === "PENDING" || status === "COMPLETED") && hasDebt && !isToday;

    let visualStatus: string = status;
    if (isToday) visualStatus = "TODAY";

    const statusConfig: Record<string, any> = {
        COMPLETED: { icon: <Check className="w-3.5 h-3.5" />, bg: "bg-emerald-500/20", border: "border-emerald-500/40", color: "text-emerald-400" },
        PENDING: { icon: <AlertTriangle className="w-3.5 h-3.5" />, bg: "bg-amber-500/20", border: "border-amber-500/40", color: "text-amber-400" },
        FAILED: { icon: <X className="w-3.5 h-3.5" />, bg: "bg-red-500/20", border: "border-red-500/40", color: "text-red-400" },
        TODAY: { icon: null, bg: "bg-cyan-500/10", border: "border-cyan-400/50", color: "text-cyan-400" },
    };

    const config = statusConfig[visualStatus];

    const stepsPercent = Math.min((steps / target_steps) * 100, 100);
    const clearedPercent = hasDebt
        ? Math.min(((steps + paidOff) / target_steps) * 100, 100)
        : stepsPercent;

    return (
        <div className={`relative rounded-xl border backdrop-blur-md transition-all overflow-hidden ${
            isToday ? "border-cyan-400/30 bg-white/[0.04] shadow-[0_0_24px_rgba(34,211,238,0.06)]" :
            isFuture ? "border-white/[0.04] bg-white/[0.015] opacity-35" :
            status === "FAILED" ? "border-red-900/30 bg-white/[0.02] opacity-60" :
            "border-white/[0.06] bg-white/[0.03]"
        }`}>
            {isToday && (
                <motion.div
                    className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-cyan-400"
                    animate={{ opacity: [0.4, 1, 0.4], boxShadow: ["0 0 6px rgba(34,211,238,0.3)", "0 0 14px rgba(34,211,238,0.6)", "0 0 6px rgba(34,211,238,0.3)"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            )}

            <div
                className={`relative px-3.5 py-3 flex items-center gap-3 ${canExpand ? "cursor-pointer" : ""}`}
                onClick={() => canExpand && setDebtExpanded(!debtExpanded)}
            >
                {/* Left: Day info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`font-bold text-[11px] tracking-wider uppercase ${
                            isToday ? "text-cyan-400" : status === "FAILED" ? "text-red-400/60" : "text-white/50"
                        }`}>
                            {dayName}
                        </span>
                        <span className="text-[10px] text-white/25">{shortDate}</span>

                        {has_exercise && (
                            <span className="inline-flex items-center gap-1 ml-auto">
                                <Dumbbell className="w-3 h-3 text-violet-400" />
                                <span className="flex items-center gap-0.5">
                                    <span className="text-[10px] tabular-nums text-violet-300/80">Spor</span>
                                </span>
                            </span>
                        )}
                    </div>

                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-[17px] tabular-nums tracking-tight ${
                            status === "COMPLETED" ? "text-emerald-400" :
                            status === "FAILED" ? "text-red-400/50" :
                            isToday ? "text-white" :
                            isFuture ? "text-white/20" : "text-amber-300"
                        }`} style={{ fontWeight: 600 }}>
                            {steps > 0 || !isFuture ? steps.toLocaleString("tr-TR") : "0"}
                        </span>
                        <span className="text-[11px] text-white/25">/ {target_steps.toLocaleString("tr-TR")}</span>
                        <span className="text-[9px] text-white/15 uppercase tracking-wider">adım</span>

                        {hasPendingDebt && !isToday && (
                            <span className="ml-auto flex items-center gap-1">
                                <span className="text-[9px] tabular-nums text-amber-400/60" style={{ fontWeight: 500 }}>
                                    –{debt_steps.toLocaleString("tr-TR")}
                                </span>
                                <motion.div animate={{ rotate: debtExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                    <ChevronDown className="w-3 h-3 text-white/15" />
                                </motion.div>
                            </span>
                        )}
                        {debtFullyPaid && !isToday && (
                            <span className="ml-auto flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-500/60" />
                                <span className="text-[9px] text-emerald-400/50" style={{ fontWeight: 500 }}>borç kapandı</span>
                                <motion.div animate={{ rotate: debtExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                    <ChevronDown className="w-3 h-3 text-white/15" />
                                </motion.div>
                            </span>
                        )}
                    </div>

                    <div className="mt-1.5 h-[4px] w-full rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full ${
                                debtFullyPaid ? "bg-emerald-500" :
                                status === "COMPLETED" ? "bg-emerald-500" :
                                status === "FAILED" ? "bg-red-500/40" :
                                isToday ? "bg-cyan-400" :
                                hasPendingDebt ? "bg-amber-400" : "bg-amber-400"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${clearedPercent}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                    </div>
                </div>

                <div className="flex items-center shrink-0">
                    {isToday ? (
                        <div className="relative w-7 h-7 flex items-center justify-center">
                            <motion.div
                                className="absolute inset-0 rounded-full border-2 border-cyan-400/40"
                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <motion.div
                                className="w-2.5 h-2.5 rounded-full bg-cyan-400"
                                animate={{ scale: [0.9, 1.1, 0.9] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>
                    ) : isFuture ? (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/[0.06]">
                            <span className="text-[10px] text-white/20">&mdash;</span>
                        </div>
                    ) : (
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${config.bg} border ${config.border} ${config.color}`}>
                            {config.icon}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {debtExpanded && canExpand && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="px-3.5 pb-3 pt-1">
                            <div className="flex items-center rounded-lg bg-white/[0.025] border border-white/[0.04] px-3 py-2 gap-3">
                                <div className="flex-1 text-center border-r border-white/[0.06]">
                                    <span className="text-[8px] text-red-400/50 uppercase tracking-widest block mb-0.5">Borç</span>
                                    <span className="text-[14px] text-red-400 tabular-nums" style={{ fontWeight: 600 }}>{originalMissing.toLocaleString("tr-TR")}</span>
                                </div>
                                <div className="flex-1 text-center border-r border-white/[0.06]">
                                    <span className="text-[8px] text-emerald-400/50 uppercase tracking-widest block mb-0.5">Ödenen</span>
                                    <span className="text-[14px] text-emerald-400 tabular-nums" style={{ fontWeight: 600 }}>{paidOff.toLocaleString("tr-TR")}</span>
                                </div>
                                <div className="flex-1 text-center">
                                    <span className={`text-[8px] uppercase tracking-widest block mb-0.5 ${debtFullyPaid ? "text-emerald-400/50" : "text-amber-400/50"}`}>Kalan</span>
                                    <span className={`text-[14px] tabular-nums ${debtFullyPaid ? "text-emerald-400" : "text-amber-400"}`} style={{ fontWeight: 600 }}>
                                        {debtFullyPaid ? "✓" : debt_steps.toLocaleString("tr-TR")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
