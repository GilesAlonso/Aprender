import { afterEach, describe, expect, it } from "vitest";

import {
  clearAnalyticsHistory,
  dispatchAnalyticsEvent,
  getAnalyticsHistory,
  subscribeToAnalytics,
} from "@/lib/analytics";

afterEach(() => {
  clearAnalyticsHistory();
});

describe("Despacho de eventos de analytics", () => {
  it("registra eventos no histórico e aciona ouvintes", () => {
    const receivedEvents: unknown[] = [];
    const unsubscribe = subscribeToAnalytics((event) => {
      receivedEvents.push(event);
    });

    const result = dispatchAnalyticsEvent({
      type: "activity_started",
      activitySlug: "quiz-detectives-das-palavras",
      activityType: "QUIZ",
    });

    unsubscribe();

    const history = getAnalyticsHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.timestamp).toBeDefined();
    expect(receivedEvents).toHaveLength(1);
    expect((history[0] as typeof result).type).toBe("activity_started");
    expect(result.timestamp).toBeDefined();
  });

  it("limpa o histórico quando solicitado", () => {
    dispatchAnalyticsEvent({
      type: "attempt_logged",
      attemptId: "attempt-1",
      activityId: "activity-1",
      userId: "user-1",
      success: true,
      score: 95,
    });

    clearAnalyticsHistory();

    expect(getAnalyticsHistory()).toHaveLength(0);
  });
});
