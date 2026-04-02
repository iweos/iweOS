function toSafeInteger(value: string | number) {
  const numeric = typeof value === "number" ? value : Number.parseInt(value || "0", 10);
  return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
}

export function normalizeAttendanceInput(input: {
  timesSchoolOpened: string | number;
  timesPresent: string | number;
  timesAbsent: string | number;
}) {
  let timesSchoolOpened = toSafeInteger(input.timesSchoolOpened);
  let timesPresent = toSafeInteger(input.timesPresent);
  let timesAbsent = toSafeInteger(input.timesAbsent);

  if (timesSchoolOpened === 0 && (timesPresent > 0 || timesAbsent > 0)) {
    timesSchoolOpened = timesPresent + timesAbsent;
  } else if (timesPresent === 0 && timesSchoolOpened >= timesAbsent) {
    timesPresent = timesSchoolOpened - timesAbsent;
  } else if (timesAbsent === 0 && timesSchoolOpened >= timesPresent) {
    timesAbsent = timesSchoolOpened - timesPresent;
  }

  return {
    timesSchoolOpened,
    timesPresent,
    timesAbsent,
  };
}
