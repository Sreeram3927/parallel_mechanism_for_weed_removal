"use client";

import { BridgeStatus } from "@/types/bridge";

type Props = {
  wsStatus: BridgeStatus;
  onForward: () => void;
  onBackward: () => void;
  onLeft: () => void;
  onRight: () => void;
  onMobileRobotStop: () => void;
};

export function MobileRobotControlPanel({
  wsStatus,
  onForward,
  onBackward,
  onLeft,
  onRight,
  onMobileRobotStop,
}: Props) {
  return (
    <div className="flex min-h-[180px] flex-col rounded-lg border border-zinc-700/80 bg-zinc-900/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-4 border-b border-zinc-800 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-200">
          Mobile robot control
        </h2>
        <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
          Base motion controls
        </p>
      </div>

      {/* select-none prevents text highlighting while holding/tapping */}
      <div className="grid flex-1 grid-cols-1 gap-3 select-none">
        <button
          type="button"
          onMouseDown={onForward}
          onMouseUp={onMobileRobotStop}
          // onMouseLeave={onMobileRobotStop}
          onTouchStart={(e) => { 
            e.preventDefault(); 
            onForward(); 
          }}
          onTouchEnd={(e) => { 
            e.preventDefault(); 
            onMobileRobotStop(); 
          }}
          className="flex h-12 items-center justify-center rounded border border-zinc-600 bg-gradient-to-b from-zinc-700 to-zinc-900 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-100 shadow-md transition hover:from-zinc-600 hover:to-zinc-800 active:scale-[0.98] active:from-zinc-800 active:to-zinc-950"
        >
          Forward
        </button>
        
        <button
          type="button"
          onMouseDown={onBackward}
          onMouseUp={onMobileRobotStop}
          // onMouseLeave={onMobileRobotStop}
          onTouchStart={(e) => { 
            e.preventDefault(); 
            onBackward(); 
          }}
          onTouchEnd={(e) => { 
            e.preventDefault(); 
            onMobileRobotStop(); 
          }}
          className="flex h-12 items-center justify-center rounded border border-zinc-600 bg-gradient-to-b from-zinc-700 to-zinc-900 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-100 shadow-md transition hover:from-zinc-600 hover:to-zinc-800 active:scale-[0.98] active:from-zinc-800 active:to-zinc-950"
        >
          Backward
        </button>

        <button
          type="button"
          onMouseDown={onLeft}
          onMouseUp={onMobileRobotStop}
          // onMouseLeave={onMobileRobotStop}
          onTouchStart={(e) => { 
            e.preventDefault(); 
            onLeft(); 
          }}
          onTouchEnd={(e) => { 
            e.preventDefault(); 
            onMobileRobotStop(); 
          }}
          className="flex h-12 items-center justify-center rounded border border-zinc-600 bg-gradient-to-b from-zinc-700 to-zinc-900 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-100 shadow-md transition hover:from-zinc-600 hover:to-zinc-800 active:scale-[0.98] active:from-zinc-800 active:to-zinc-950"
        >
          Left
        </button>

        <button
          type="button"
          onMouseDown={onRight}
          onMouseUp={onMobileRobotStop}
          // onMouseLeave={onMobileRobotStop}
          onTouchStart={(e) => { 
            e.preventDefault(); 
            onRight(); 
          }}
          onTouchEnd={(e) => { 
            e.preventDefault(); 
            onMobileRobotStop(); 
          }}
          className="flex h-12 items-center justify-center rounded border border-zinc-600 bg-gradient-to-b from-zinc-700 to-zinc-900 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-100 shadow-md transition hover:from-zinc-600 hover:to-zinc-800 active:scale-[0.98] active:from-zinc-800 active:to-zinc-950"
        >
          Right
        </button>

        {/* Manual stop override button */}
        <button
          type="button"
          onClick={onMobileRobotStop}
          className="flex h-12 items-center justify-center rounded border border-red-900/50 bg-gradient-to-b from-red-800 to-red-950 font-mono text-xs font-semibold uppercase tracking-wider text-red-100 shadow-md transition hover:from-red-700 hover:to-red-900 active:scale-[0.98]"
        >
          Stop Base
        </button>
      </div>
    </div>
  );
}