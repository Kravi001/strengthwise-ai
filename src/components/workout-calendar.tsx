"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLocalDateString } from "@/lib/date";

interface WorkoutCalendarProps {
  /** Any date inside the month to show. */
  month: Date;
  onMonthChange: (month: Date) => void;
  /** Number of workouts per "YYYY-MM-DD" day. */
  countsByDay: Record<string, number>;
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function WorkoutCalendar({ month, onMonthChange, countsByDay, selectedDay, onSelectDay }: WorkoutCalendarProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const today = getLocalDateString();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const isCurrentMonth = today.startsWith(`${year}-${String(monthIndex + 1).padStart(2, "0")}`);

  const monthTotal = Object.entries(countsByDay)
    .filter(([day]) => day.startsWith(`${year}-${String(monthIndex + 1).padStart(2, "0")}`))
    .reduce((sum, [, n]) => sum + n, 0);
  const activeDays = Object.keys(countsByDay).filter((day) =>
    day.startsWith(`${year}-${String(monthIndex + 1).padStart(2, "0")}`)
  ).length;

  const cells: (string | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      getLocalDateString(new Date(year, monthIndex, i + 1))
    ),
  ];

  const shiftMonth = (delta: number) => onMonthChange(new Date(year, monthIndex + delta, 1));

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white">
            {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <p className="text-xs text-neutral-500">
            {monthTotal} {monthTotal === 1 ? "workout" : "workouts"} on {activeDays} {activeDays === 1 ? "day" : "days"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => {
                onMonthChange(new Date());
                onSelectDay(null);
              }}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors duration-150 ease-out"
            >
              Today
            </button>
          )}
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors duration-150 ease-out"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            aria-label="Next month"
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors duration-150 ease-out"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-mono text-neutral-500" aria-hidden>
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Workout calendar">
        {cells.map((day, i) => {
          if (!day) return <span key={`blank-${i}`} />;
          const count = countsByDay[day] ?? 0;
          const isSelected = day === selectedDay;
          const isToday = day === today;
          const isFuture = day > today;
          const dayNum = Number(day.slice(8));
          return (
            <button
              key={day}
              type="button"
              disabled={isFuture}
              onClick={() => onSelectDay(isSelected ? null : day)}
              aria-pressed={isSelected}
              aria-label={`${new Date(year, monthIndex, dayNum).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}: ${count} ${count === 1 ? "workout" : "workouts"}`}
              className={`relative flex h-11 sm:h-12 flex-col items-center justify-center rounded-lg text-sm font-semibold tabular-nums transition-colors duration-150 ease-out disabled:cursor-default disabled:text-neutral-700 ${
                count > 0
                  ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                  : "text-neutral-300 hover:bg-neutral-800"
              } ${isSelected ? "ring-2 ring-emerald-400" : isToday ? "ring-1 ring-neutral-600" : ""}`}
            >
              {dayNum}
              {count > 0 && (
                <span className="absolute bottom-1 flex gap-0.5" aria-hidden>
                  {Array.from({ length: Math.min(count, 3) }, (_, n) => (
                    <span key={n} className="h-1 w-1 rounded-full bg-emerald-400" />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
