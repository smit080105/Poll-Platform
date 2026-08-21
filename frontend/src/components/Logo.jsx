function Logo({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <line x1="5" y1="4" x2="5" y2="20" />
      <line x1="9.5" y1="4" x2="9.5" y2="20" />
      <line x1="14" y1="4" x2="14" y2="20" />
      <line x1="18.5" y1="4" x2="18.5" y2="20" />
      <line x1="3" y1="18" x2="20.5" y2="5" />
    </svg>
  );
}

export default Logo;