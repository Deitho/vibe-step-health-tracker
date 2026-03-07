import { format, isToday } from "date-fns";
import { tr } from "date-fns/locale";

export function formatDayName(dateStr: string): string {
    const date = new Date(dateStr);
    if (isToday(date)) return "Bugün";
    return format(date, "EEEE", { locale: tr });
}

export function formatShortDate(dateStr: string): string {
    return format(new Date(dateStr), "d MMM", { locale: tr });
}
