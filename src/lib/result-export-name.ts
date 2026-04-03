type ResultExportIdentity = {
  studentName?: string | null;
  className: string;
  sessionLabel: string;
  termLabel: string;
};

function cleanSegment(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\\/:"*?<>|]+/g, "")
    .trim();
}

export function buildStudentResultFileName(input: ResultExportIdentity) {
  const studentName = cleanSegment(input.studentName) || "student";
  const className = cleanSegment(input.className) || "class";
  const sessionLabel = cleanSegment(input.sessionLabel) || "session";
  const termLabel = cleanSegment(input.termLabel) || "term";

  return `${studentName}_${className}_${sessionLabel}_${termLabel}_Result`;
}

export function buildClassResultFileName(input: Omit<ResultExportIdentity, "studentName">) {
  const className = cleanSegment(input.className) || "class";
  const sessionLabel = cleanSegment(input.sessionLabel) || "session";
  const termLabel = cleanSegment(input.termLabel) || "term";

  return `${className}_${sessionLabel}_${termLabel}_Class_Results`;
}
