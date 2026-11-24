/** AI sparkle mark, used wherever a suggestion comes from the AI agent. */
export function AiIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M10 3l1.9 5.3L17 10l-5.1 1.7L10 17l-1.9-5.3L3 10l5.1-1.7L10 3z" />
      <path d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9L18 14z" />
    </svg>
  );
}
