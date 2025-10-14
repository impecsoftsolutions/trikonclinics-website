export interface TimeRemaining {
  hours: number;
  minutes: number;
  expired: boolean;
}

export function calculateTimeRemaining(deadline: string | null): TimeRemaining {
  if (!deadline) {
    return { hours: 0, minutes: 0, expired: true };
  }

  const now = new Date().getTime();
  const deadlineTime = new Date(deadline).getTime();
  const diff = deadlineTime - now;

  if (diff <= 0) {
    return { hours: 0, minutes: 0, expired: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes, expired: false };
}

export function formatTimeRemaining(timeRemaining: TimeRemaining): string {
  if (timeRemaining.expired) {
    return 'Expired';
  }

  if (timeRemaining.hours > 0) {
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`;
  }

  return `${timeRemaining.minutes}m remaining`;
}
