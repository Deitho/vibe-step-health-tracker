import { DailyStats } from "@/lib/db";
import { formatDayName, formatShortDate } from "@/utils/format";
import { motion } from "framer-motion";

interface DayCardProps {
    data: DailyStats;
}

export function DayCard({ data }: DayCardProps) {
    const { date, steps, target_steps, debt_steps, status, has_exercise } = data;

    const dayName = formatDayName(date);
    const shortDate = formatShortDate(date);
    const isToday = dayName.toLowerCase() === "bugün";

    const originalMissing = Math.max(0, target_steps - steps);
    const paidOff = Math.max(0, originalMissing - debt_steps);
    const shouldShowDebtTracker = status === "PENDING" && debt_steps > 0 && !isToday;

    // Theme logic matches Figma specifically
    let primaryColor = "text-foreground/20"; // Grey out for future days (e.g., Saturday showing 0)
    let trackColor = "bg-foreground/10";
    let iconBorder = "border-foreground/10";
    
    // Default Empty/Future icon (grey dash)
    let StatusIcon = (
        <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
    );

    if (isToday) {
        // Cyan theme for Today
        primaryColor = "text-foreground";
        trackColor = "bg-primary";
        iconBorder = "border-primary/40";
        StatusIcon = (
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-primary rounded-full shadow-[0_0_8px_rgba(0,209,255,0.8)] animate-pulse" />
        );
    } else if (status === "COMPLETED") {
        if (has_exercise) {
            primaryColor = "text-primary";
            trackColor = "bg-primary";
        } else {
            primaryColor = "text-success";
            trackColor = "bg-success";
        }
        iconBorder = "border-success/30 bg-success/10";
        StatusIcon = (
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
        );
    } else if (status === "PENDING") {
        primaryColor = "text-warning";
        trackColor = "bg-warning";
        iconBorder = "border-warning/30 bg-warning/10";
        StatusIcon = (
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        );
    } else if (status === "FAILED") {
        primaryColor = "text-error";
        trackColor = "bg-error/80"; // Slightly dimmed red explicitly for FAILED
        iconBorder = "border-error/20 bg-error/5";
        StatusIcon = (
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        );
    }
    
    const progressWidth = Math.min(100, (steps / target_steps) * 100);

    return (
        <div className={`
            relative rounded-2xl md:rounded-3xl border border-card-border/40 bg-card flex flex-col pt-3 pb-3 px-4 md:px-5 gap-1.5
            shadow-sm w-full
        `}>
            {/* Top row: Name & Date */}
            <div className="flex items-center gap-2">
                <span className={`font-bold text-[11px] md:text-sm tracking-wider uppercase ${isToday ? "text-primary" : (status === "FAILED" ? "text-foreground/40" : "text-foreground/70")}`}>
                    {dayName}
                </span>
                <span className="text-[10px] md:text-xs font-medium text-foreground/30">{shortDate}</span>
            </div>

            {/* Main row: Numbers and Icons */}
            <div className={`flex items-end justify-between mb-1.5 ${status === "FAILED" ? "opacity-60" : ""}`}>
                <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl md:text-3xl font-black ${primaryColor} tracking-tight`}>
                        {steps > 0 || isToday || status !== "PENDING" ? steps.toLocaleString("tr-TR") : "0"}
                    </span>
                    <span className="text-[9px] md:text-xs font-bold text-foreground/20 uppercase tracking-widest pl-1">
                        / {target_steps.toLocaleString("tr-TR")} ADIM
                    </span>
                </div>
                
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    {/* Middle Info (Debt Paid / Sport) */}
                    {status === "COMPLETED" && paidOff > 0 && debt_steps === 0 && (
                        <span className="text-[10px] md:text-xs text-success/80 flex items-center gap-1 font-medium mr-2">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            borç kapandı
                            <svg className="w-3 h-3 text-success/50 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    )}
                    {has_exercise && status === "COMPLETED" && (
                        <span className="text-[10px] md:text-xs text-sport flex items-center gap-1 font-semibold tracking-wide mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 mb-0.5">
                                <path d="M11.96 4.318a2.5 2.5 0 00-3.92-2.636l-2.003 1.502a.75.75 0 00.902 1.202l2.003-1.502a1 1 0 011.568 1.054l-1.076 3.23a.75.75 0 001.424.475l1.076-3.23a.75.75 0 00.026-.095z" />
                                <path fillRule="evenodd" d="M7.75 6.5a.75.75 0 00-.75.75v3.69l-.654-.327a1.5 1.5 0 00-1.879.444l-2 2.667a.75.75 0 001.2 1.052l2-2.667.585.292v2.842a2.028 2.028 0 000 4.053H8.5a.75.75 0 000-1.5H6.252a.528.528 0 010-1.053h2.498a.75.75 0 00.75-.75v-2.121l1.503 1.503a.75.75 0 001.06-1.061l-2.02-2.02A.748.748 0 009.5 12h-1V7.25a.75.75 0 00-.75-.75z" clipRule="evenodd" />
                            </svg>
                            Spor
                        </span>
                    )}
                    {status === "PENDING" && debt_steps > 0 && !isToday && (
                        <span className="text-[10px] md:text-[11px] text-warning flex items-center gap-0.5 font-bold tracking-wider mr-2">
                            -{debt_steps.toLocaleString("tr-TR")}
                            <svg className="w-3 h-3 text-warning/60 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    )}

                    {/* Status Circle Icon */}
                    <div className={`w-7 h-7 md:w-9 md:h-9 rounded-full border-[1.5px] flex items-center justify-center ${iconBorder}`}>
                       {StatusIcon}
                    </div>
                </div>
            </div>

            {/* Bottom Inner Progress Bar */}
            <div className={`w-full h-1 md:h-1.5 bg-foreground/5 rounded-full overflow-hidden mt-1 opacity-90 ${status === "FAILED" ? "opacity-40" : ""}`}>
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressWidth}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${trackColor}`}
                />
            </div>

            {/* EXPANDED DEBT TRACKER ROW */}
            {shouldShowDebtTracker && (
                <div className="w-full mt-2 pt-3 border-t border-card-border/50">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[9px] md:text-[10px] uppercase font-bold tracking-widest pl-1">
                            <span className="text-foreground/40">Borç: <strong className="text-error ml-1">{originalMissing.toLocaleString("tr-TR")}</strong></span>
                            {paidOff > 0 && <span className="text-foreground/40">Ödenen: <strong className="text-success ml-1">{paidOff.toLocaleString("tr-TR")}</strong></span>}
                            {debt_steps > 0 && <span className="text-foreground/40">Kalan: <strong className="text-warning ml-1">{debt_steps.toLocaleString("tr-TR")}</strong></span>}
                        </div>
                        <div className="w-full h-1 md:h-1.5 bg-foreground/10 rounded-full overflow-hidden flex relative opacity-80">
                            {/* Paid portion (green) */}
                            <div className="h-full bg-success transition-all duration-700 ease-out" style={{ width: `${(paidOff / originalMissing) * 100}%` }} />
                            {/* Remaining portion (yellow) */}
                            <div className="h-full bg-warning transition-all duration-700 ease-out" style={{ width: `${(debt_steps / originalMissing) * 100}%` }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
