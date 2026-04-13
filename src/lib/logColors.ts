import type { LogLevel } from "@/types/logs";

export function logLevelClass(level: LogLevel): string {
  switch (level) {
    case "ERROR":
      return "text-red-400";
    case "WARN":
      return "text-amber-400";
    case "INFO":
      return "text-sky-400";
    case "DEBUG":
      return "text-zinc-400";
    case "VERBOSE":
      return "text-zinc-600";
    default:
      return "text-zinc-400";
  }
}
