import { CapeIcon } from '../legacy/icons';

/** AI sparkle mark (Cape ai-sparkles-filled), used wherever a suggestion comes from the AI agent. */
export function AiIcon({ size = 18, className }: { size?: number; className?: string }) {
  return <CapeIcon name="aiSparkles" size={size} className={className} />;
}
