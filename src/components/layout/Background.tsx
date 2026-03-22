export default function Background({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const isDark = theme === 'dark';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden"
    >
      {/* Main gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'linear-gradient(160deg, #111318 0%, #0f1115 50%, #131620 100%)'
            : 'linear-gradient(160deg, #f5f5f7 0%, #eeeef0 50%, #f0f0f4 100%)',
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: isDark
            ? 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)'
            : 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)'
            : 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.06) 100%)',
        }}
      />
    </div>
  );
}
