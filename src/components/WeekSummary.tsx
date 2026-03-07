interface WeekSummaryProps {
    isPassed: boolean;
    exerciseCount: number;
    allDaysCompleted: boolean;
}

export function WeekSummary({ isPassed, exerciseCount, allDaysCompleted }: WeekSummaryProps) {
    return (
        <div className={`
      mt-8 p-6 rounded-2xl border-2 flex flex-col md:flex-row items-center justify-between gap-4
      ${isPassed
                ? "bg-success/10 border-success/30"
                : "bg-background border-primary/20"}
    `}>
            <div>
                <h3 className={`text-xl font-black uppercase tracking-wide ${isPassed ? "text-success" : "text-primary"}`}>
                    {isPassed ? "🎉 Hafta Başarıyla Tamamlandı!" : "Devam Ediyor..."}
                </h3>
                <p className="text-sm font-medium opacity-80 mt-1">
                    Haftanın onaylanması için tüm gün hedeflerini tamamla ve en az 3 spor yap.
                </p>
            </div>

            <div className="flex gap-4">
                <div className={`flex flex-col items-center p-3 rounded-xl border-2 min-w-[100px] bg-white ${exerciseCount >= 3 ? "border-success text-success" : "border-gray-200"}`}>
                    <span className="text-xs font-bold uppercase tracking-wider mb-1">Spor (3+)</span>
                    <span className="text-xl font-black">{exerciseCount}/3</span>
                </div>

                <div className={`flex flex-col items-center p-3 rounded-xl border-2 min-w-[100px] bg-white ${allDaysCompleted ? "border-success text-success" : "border-gray-200"}`}>
                    <span className="text-xs font-bold uppercase tracking-wider mb-1">Günler</span>
                    <span className="text-xl font-black">{allDaysCompleted ? "Tamam" : "Eksik"}</span>
                </div>
            </div>
        </div>
    );
}
