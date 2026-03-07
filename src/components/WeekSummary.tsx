interface WeekSummaryProps {
    isPassed: boolean;
    exerciseCount: number;
    allDaysCompleted: boolean;
}

export function WeekSummary({ isPassed, exerciseCount, allDaysCompleted }: WeekSummaryProps) {
    return (
        <div className={`
      p-4 md:p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm
      ${isPassed
                ? "bg-success/10 border-success/30"
                : "bg-card border-card-border"}
    `}>
            <div>
                <h3 className={`text-xl font-black uppercase tracking-wide ${isPassed ? "text-success" : "text-primary"}`}>
                    {isPassed ? "🎉 Hafta Başarıyla Tamamlandı!" : "Devam Ediyor..."}
                </h3>
                <p className="text-sm font-medium opacity-80 mt-1">
                    Haftanın onaylanması için tüm gün hedeflerini tamamla ve en az 3 spor yap.
                </p>
            </div>

            <div className="flex gap-3 md:gap-4 w-full md:w-auto justify-center">
                <div className={`flex flex-col items-center p-3 rounded-xl border min-w-[100px] flex-1 md:flex-none bg-background/50 ${exerciseCount >= 3 ? "border-success text-success" : "border-card-border text-foreground/80"}`}>
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Spor (3+)</span>
                    <span className="text-lg md:text-xl font-black">{exerciseCount}/3</span>
                </div>

                <div className={`flex flex-col items-center p-3 rounded-xl border min-w-[100px] flex-1 md:flex-none bg-background/50 ${allDaysCompleted ? "border-success text-success" : "border-card-border text-foreground/80"}`}>
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Günler</span>
                    <span className="text-lg md:text-xl font-black">{allDaysCompleted ? "Tamam" : "Eksik"}</span>
                </div>
            </div>
        </div>
    );
}
