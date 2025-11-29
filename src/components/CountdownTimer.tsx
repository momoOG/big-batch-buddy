import { useCountdown } from '@/hooks/useCountdown';

interface CountdownTimerProps {
  targetTime: number;
}

export function CountdownTimer({ targetTime }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetTime);

  if (isExpired) {
    return (
      <div className="text-center">
        <span className="px-4 py-2 rounded-full text-sm font-bold bg-green-500/20 text-green-400 border border-green-500/30">
          🚀 Presale is LIVE!
        </span>
      </div>
    );
  }

  return (
    <div className="text-center space-y-3">
      <p className="text-sm text-muted-foreground">Presale starts in:</p>
      <div className="flex justify-center gap-2 sm:gap-4">
        <TimeUnit value={days} label="Days" />
        <TimeUnit value={hours} label="Hours" />
        <TimeUnit value={minutes} label="Min" />
        <TimeUnit value={seconds} label="Sec" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 rounded-lg px-3 py-2 min-w-[50px] sm:min-w-[60px]">
        <span className="text-xl sm:text-2xl font-bold text-foreground font-mono">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}
