type Props = {
  className?: string;
  animated?: boolean;
};

export function HourglassMark({ className = "", animated = false }: Props) {
  return (
    <div className={`chronos-hourglass ${animated ? "chronos-hourglass-animated" : ""} ${className}`.trim()} aria-hidden="true">
      <div className="chronos-hourglass-frame">
        <div className="chronos-hourglass-neck" />
        <div className="chronos-hourglass-top-sand" />
        <div className="chronos-hourglass-bottom-sand" />
      </div>
    </div>
  );
}
