import { HourglassMark } from "@/components/hourglass-mark";

type Props = {
  visible: boolean;
};

const BOOT_LINES = [
  "Temple clock engaged",
  "Astral vault aligning",
  "Flip the hourglass",
];

export function ChronosBootSequence({ visible }: Props) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(7,4,12,0.92)] px-6 backdrop-blur-md">
      <div className="chronos-panel mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-6 py-8 text-center sm:px-8">
        <HourglassMark animated className="h-24 w-24 sm:h-28 sm:w-28" />
        <div>
          <p className="chronos-kicker justify-center">Chronos awakening</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--chronos-ink)] sm:text-4xl">Temple clock engaged</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--chronos-muted)] sm:text-base">
            The vault wakes like a god of time: gold dust turns, the seal tightens, and the hourglass flips before entry.
          </p>
        </div>
        <div className="w-full space-y-3">
          {BOOT_LINES.map((line, index) => (
            <div key={line} className="chronos-boot-line" style={{ animationDelay: `${index * 180}ms` }}>
              <span className="chronos-boot-dot" />
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
