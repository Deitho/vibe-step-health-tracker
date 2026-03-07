import { DailyStats } from "@/lib/db";
import { DebtTooltip } from "./DebtTooltip";
import { formatDayName, formatShortDate } from "@/utils/format";

interface DayCardProps {
    data: DailyStats;
}

export function DayCard({ data }: DayCardProps) {
    const { date, steps, target_steps, debt_steps, status, has_exercise } = data;

    const dayName = formatDayName(date);
    const shortDate = formatShortDate(date);

    // Status visual mapping based on the Vibe-Step SOP
    let StatusIcon = null;
    let statusClasses = "bg-card border-card-border text-foreground";

    if (status === "COMPLETED") {
        // Green Tick
        statusClasses = "bg-card border-success/40 text-success";
        StatusIcon = (
            <svg className="w-5 h-5 md:w-6 md:h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        );
    } else if (status === "PENDING") {
        // Yellow Exclamation
        statusClasses = "bg-card border-warning/40 text-warning";
        StatusIcon = (
            <svg className="w-5 h-5 md:w-6 md:h-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        );
    } else if (status === "FAILED") {
        // Red Cross
        statusClasses = "bg-card border-error/40 text-error";
        StatusIcon = (
            <svg className="w-5 h-5 md:w-6 md:h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        );
    }

    return (
        <div className={`
      relative rounded-xl border flex items-center justify-between p-2 md:p-3 gap-2
      shadow-sm transition-all duration-300 transform hover:-translate-y-0.5
      ${statusClasses}
    `}>
            {/* Decorative left accent bar based on the vibrant design system */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${status === "COMPLETED" ? "bg-success" :
                status === "PENDING" ? "bg-warning" :
                    "bg-error"
                }`} />

            <div className="flex flex-1 items-center justify-between ml-2">
                {/* Date Information & Exercise Badge */}
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 flex-1">
                    <div className="flex items-baseline gap-2">
                        <span className="font-bold text-sm md:text-base uppercase tracking-wider text-foreground">{dayName}</span>
                        <span className="text-[10px] md:text-xs font-medium text-foreground/60">{shortDate}</span>
                    </div>

                    {/* Has Exercise badge (smaller for mobile) */}
                    {has_exercise && (
                        <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full w-max md:mt-0">
                            <span>🏃</span> Spor
                        </span>
                    )}
                </div>

                {/* Step Data & Status */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <div className="flex flex-col items-end justify-center">
                        <div className="flex items-baseline gap-1">
                            <span className="text-base md:text-xl font-black text-foreground">{steps.toLocaleString("tr-TR")}</span>
                            <span className="text-[10px] font-bold text-foreground/40 hidden md:inline">/ {target_steps.toLocaleString("tr-TR")}</span>
                        </div>
                        <span className="text-[9px] md:text-[9px] font-bold uppercase text-foreground/50 inline md:hidden">
                            / {target_steps.toLocaleString("tr-TR")} ADIM
                        </span>
                        <span className="text-[9px] md:text-[9px] font-bold uppercase text-foreground/50 hidden md:inline">
                            ADIM
                        </span>
                    </div>

                    {/* Big Icon Container wrapped in Tooltip if needed */}
                    {status === "PENDING" && debt_steps > 0 ? (
                        <DebtTooltip debt={debt_steps}>
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-warning/10 transition hover:scale-105">
                                {StatusIcon}
                            </div>
                        </DebtTooltip>
                    ) : (
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${status === "COMPLETED" ? "bg-success/10" :
                            status === "PENDING" ? "bg-warning/10" :
                                "bg-error/10"
                            }`}>
                            {StatusIcon}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
