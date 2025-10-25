import type { ActivityCategory } from "@/lib/activities";

export type AnalyticsEventBase = {
  timestamp?: string;
};

export type ActivityStartedEvent = AnalyticsEventBase & {
  type: "activity_started";
  activitySlug: string;
  activityType: ActivityCategory;
};

export type ActivityInteractionEvent = AnalyticsEventBase & {
  type: "activity_interaction";
  activitySlug: string;
  activityType: ActivityCategory;
  detail: {
    id: string;
    correct?: boolean;
    hintUsed?: boolean;
    position?: number;
  };
};

export type ActivityCompletedEvent = AnalyticsEventBase & {
  type: "activity_completed";
  activitySlug: string;
  activityType: ActivityCategory;
  score: number;
  completion: number;
  metadata?: Record<string, unknown>;
};

export type AttemptLoggedEvent = AnalyticsEventBase & {
  type: "attempt_logged";
  attemptId: string;
  userId: string;
  activityId: string;
  success: boolean;
  score?: number | null;
};

export type AnalyticsEvent =
  | ActivityStartedEvent
  | ActivityInteractionEvent
  | ActivityCompletedEvent
  | AttemptLoggedEvent;

export type AnalyticsListener = (event: AnalyticsEvent) => void;

const listeners = new Set<AnalyticsListener>();
const history: AnalyticsEvent[] = [];

const withTimestamp = <T extends AnalyticsEventBase>(event: T): T & { timestamp: string } => ({
  ...event,
  timestamp: event.timestamp ?? new Date().toISOString(),
});

export const dispatchAnalyticsEvent = <T extends AnalyticsEvent>(event: T): T & { timestamp: string } => {
  const payload = withTimestamp(event);
  history.push(payload);

  for (const listener of listeners) {
    try {
      listener(payload);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Listener de analytics falhou", error);
      }
    }
  }

  return payload;
};

export const subscribeToAnalytics = (listener: AnalyticsListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const clearAnalyticsHistory = (): void => {
  history.length = 0;
};

export const getAnalyticsHistory = (): AnalyticsEvent[] => [...history];
