"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearSimulatedToday, setSimulatedToday } from "@/lib/actions/clock";
import { Button, Input, Label, cn } from "@/components/ui";
import {
  addUtcDays,
  formatLongDateUtc,
  formatYmd,
  mondayUtcForDateString,
  weekdayShortUtc,
} from "@/lib/timezone";
import type { BusinessClock } from "@/lib/clock";

type Props = {
  clock: BusinessClock;
};

export function TestClockPanel({ clock }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState(clock.today);
  const [viewMonday, setViewMonday] = useState(() => mondayUtcForDateString(clock.today));

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => formatYmd(addUtcDays(viewMonday, i))),
    [viewMonday],
  );

  const apply = (date: string | null) => {
    setStatus(null);
    startTransition(async () => {
      const result = date == null ? await clearSimulatedToday() : await setSimulatedToday({ date });
      if (!result.ok) {
        setStatus(result.error);
        return;
      }
      setCustomDate(result.today);
      setViewMonday(mondayUtcForDateString(result.today));
      setStatus(date == null || date === clock.realToday ? "Back on the real calendar." : `Floor today is ${result.today}`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Real today
          </p>
          <p className="mt-1 font-display text-xl font-medium tracking-tight">
            {formatLongDateUtc(clock.realToday)}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {clock.realToday} · {clock.timezone}
          </p>
        </div>
        <div
          className={cn(
            "rounded-xl border p-4 shadow-card",
            clock.simulated ? "border-warn/40 bg-warn/10" : "border-border bg-card",
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Floor today
          </p>
          <p className="mt-1 font-display text-xl font-medium tracking-tight">
            {formatLongDateUtc(clock.today)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {clock.simulated ? "Test clock is on — grid locks follow this date." : "Live — no override."}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Jump to a day
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => setViewMonday(addUtcDays(viewMonday, -7))}
            >
              Prev week
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => setViewMonday(addUtcDays(viewMonday, 7))}
            >
              Next week
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((date) => {
            const active = date === clock.today;
            const isReal = date === clock.realToday;
            return (
              <button
                key={date}
                type="button"
                disabled={pending}
                onClick={() => apply(date)}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center rounded-lg border px-1 py-2 text-center transition-colors duration-150 ease-smooth disabled:opacity-50",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                <span className="text-[11px] font-medium uppercase tracking-wide">
                  {weekdayShortUtc(date)}
                </span>
                <span className="font-mono text-sm tabular-nums">{date.slice(5)}</span>
                {isReal ? (
                  <span className={cn("mt-0.5 text-[10px]", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    real
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          apply(customDate);
        }}
      >
        <Label className="sm:flex-1">
          <span className="text-xs font-medium text-muted-foreground">Any date</span>
          <Input
            type="date"
            name="date"
            value={customDate}
            disabled={pending}
            onChange={(e) => setCustomDate(e.target.value)}
            required
          />
        </Label>
        <Button type="submit" disabled={pending}>
          {pending ? "Setting…" : "Set floor today"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending || !clock.simulated}
          onClick={() => apply(null)}
        >
          Reset to real today
        </Button>
      </form>

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
