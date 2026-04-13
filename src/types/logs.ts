export type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG" | "VERBOSE";

export type LogEntry = {
  id: string;
  ts: number;
  level: LogLevel;
  source: string;
  message: string;
};
