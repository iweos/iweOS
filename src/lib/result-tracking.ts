export const RESULT_STATES = ["Not started", "In progress", "Ready to publish", "Published", "Withdrawn"] as const;
export type TrackedResultState = typeof RESULT_STATES[number];
export function trackedResultState(publication: string | undefined, ready: boolean, scoredSubjects: number): TrackedResultState {
  if (publication === "PUBLISHED") return "Published";
  if (publication === "UNPUBLISHED") return "Withdrawn";
  if (ready) return "Ready to publish";
  return scoredSubjects > 0 ? "In progress" : "Not started";
}
