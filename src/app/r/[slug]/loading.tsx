export default function CustomerLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-carte-bg px-4">
      {/* Cloché mascot silhouette with pulse animation */}
      <div className="relative flex flex-col items-center gap-4">
        {/* Glow ring behind mascot */}
        <div
          className="absolute -inset-4 animate-pulse rounded-full blur-xl opacity-30"
          style={{ backgroundColor: "var(--cuisine-color, var(--carte-primary))" }}
        />

        {/* Cloche dome icon (SVG) */}
        <div className="relative animate-bounce" style={{ animationDuration: "1.4s" }}>
          <svg
            width="72"
            height="72"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            {/* Dome */}
            <path
              d="M8 44c0-13.255 10.745-24 24-24s24 10.745 24 24H8z"
              fill="var(--cuisine-color, var(--carte-primary))"
              opacity="0.85"
            />
            {/* Knob */}
            <circle cx="32" cy="18" r="3.5" fill="var(--cuisine-color, var(--carte-primary))" />
            {/* Plate */}
            <rect x="4" y="44" width="56" height="4" rx="2" fill="var(--carte-text-muted)" opacity="0.5" />
            {/* Shine highlight */}
            <path
              d="M18 36c0-7.732 6.268-14 14-14"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.3"
            />
          </svg>
        </div>

        {/* Loading text */}
        <p className="text-sm font-medium text-carte-text-muted animate-pulse">
          Cloché prépare votre menu...
        </p>

        {/* Subtle skeleton cards below */}
        <div className="mt-6 w-full max-w-xs space-y-2.5 opacity-30">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl"
              style={{
                backgroundColor: "var(--carte-surface)",
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
