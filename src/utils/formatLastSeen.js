import { formatDistanceToNow, isValid } from 'date-fns';

// RTDB presence nodes carry `lastChanged` as a server timestamp (epoch ms).
// Returns null when there is nothing meaningful to show, so callers can render
// nothing rather than "Last seen unknown".
export function formatLastSeen(lastChanged) {
  if (lastChanged == null) return null;

  const date = new Date(typeof lastChanged === 'number' ? lastChanged : Number(lastChanged));
  if (!isValid(date) || date.getTime() === 0) return null;

  // Clock skew between the RTDB server and this browser can put the timestamp
  // slightly in the future; treat anything within a minute as "just now".
  const deltaMs = Date.now() - date.getTime();
  if (deltaMs < 60_000) return 'Just now';

  return `${formatDistanceToNow(date)} ago`;
}
