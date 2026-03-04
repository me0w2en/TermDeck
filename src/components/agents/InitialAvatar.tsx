import type { InitialAvatarProps } from '../../types';

export default function InitialAvatar({
  name,
  color,
  size = 40,
}: InitialAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const fontSize = size * 0.42;

  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold select-none"
      style={{
        width: size,
        height: size,
        backgroundColor: color + '20',
        color,
        fontSize,
        lineHeight: 1,
      }}
      aria-label={`Avatar for ${name}`}
      role="img"
    >
      {initial}
    </div>
  );
}
