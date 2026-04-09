"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";

type Props = {
  startsAtIso: string;
  endsAtIso: string;
};

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function formatRemaining(
  ms: number,
  tmpl: string,
  t: (key: string, p?: Record<string, string | number>) => string,
) {
  if (ms <= 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return t(tmpl, {
    days,
    hours: pad2(hours),
    minutes: pad2(minutes),
    seconds: pad2(seconds),
  });
}

export function CountdownBanner({ startsAtIso, endsAtIso }: Props) {
  const { t } = useI18n();
  const start = new Date(startsAtIso).getTime();
  const end = new Date(endsAtIso).getTime();
  const [phase, setPhase] = useState<"soon" | "live" | "over">("over");
  const [line, setLine] = useState<string | null>(null);
  const [heading, setHeading] = useState<string>("");

  useEffect(() => {
    if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
      setPhase("over");
      setLine(null);
      return;
    }
    const tick = () => {
      const now = Date.now();
      if (now >= end) {
        setPhase("over");
        setLine(null);
        return;
      }
      if (now < start) {
        setPhase("soon");
        setHeading(t("home.countdownOpensHeading"));
        setLine(formatRemaining(start - now, "home.countdownRemaining", t));
        return;
      }
      setPhase("live");
      setHeading(t("home.countdownHeading"));
      setLine(formatRemaining(end - now, "home.countdownRemaining", t));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [start, end, t]);

  if (phase === "over" || !line) return null;

  return (
    <div
      className="rounded-xl border border-lulu-accent/40 bg-lulu-accent/15 px-4 py-3 text-center"
      role="status"
      aria-live="polite"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-lulu-accent">
        {heading}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-white">
        {line}
      </p>
    </div>
  );
}
