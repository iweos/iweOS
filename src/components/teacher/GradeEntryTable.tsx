"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import { saveStudentScoresAction, type SaveStudentScoresInput, type SaveStudentScoresResult } from "@/lib/server/teacher-actions";

type AssessmentTypeRow = {
  id: string;
  name: string;
  weight: number;
};

type GradeEntryStudentRow = {
  enrollmentId: string;
  studentId: string;
  studentCode: string;
  fullName: string;
  total: number | null;
  grade: string | null;
  values: Record<string, string>;
};

type GradeEntryTableProps = {
  teacherProfileId?: string;
  termId: string;
  classId: string;
  subjectId: string;
  assessmentTypes: AssessmentTypeRow[];
  initialRows: GradeEntryStudentRow[];
};

type RowStatus = {
  tone: "idle" | "saving" | "saved" | "error";
  message: string;
};

const IDLE_STATUS: RowStatus = { tone: "idle", message: "" };

export default function GradeEntryTable({
  teacherProfileId,
  termId,
  classId,
  subjectId,
  assessmentTypes,
  initialRows,
}: GradeEntryTableProps) {
  const [rows, setRows] = useState(initialRows);
  const [rowStatusByStudentId, setRowStatusByStudentId] = useState<Record<string, RowStatus>>({});
  const [isPending, startTransition] = useTransition();
  const clearTimersRef = useRef<Record<string, number>>({});
  const requestVersionRef = useRef<Record<string, number>>({});

  const totalColumns = assessmentTypes.length + 4;
  const rowsByStudentId = useMemo(() => new Map(rows.map((row) => [row.studentId, row])), [rows]);

  function setRowStatus(studentId: string, status: RowStatus) {
    setRowStatusByStudentId((current) => ({
      ...current,
      [studentId]: status,
    }));
  }

  function scheduleStatusClear(studentId: string) {
    const currentTimeout = clearTimersRef.current[studentId];
    if (currentTimeout) {
      window.clearTimeout(currentTimeout);
    }

    clearTimersRef.current[studentId] = window.setTimeout(() => {
      setRowStatus(studentId, IDLE_STATUS);
      delete clearTimersRef.current[studentId];
    }, 2200);
  }

  function handleValueChange(studentId: string, assessmentTypeId: string, nextValue: string) {
    setRows((current) =>
      current.map((row) =>
        row.studentId === studentId
          ? {
              ...row,
              values: {
                ...row.values,
                [assessmentTypeId]: nextValue,
              },
            }
          : row,
      ),
    );
  }

  function saveRow(studentId: string) {
    const row = rowsByStudentId.get(studentId);
    if (!row) {
      return;
    }

    const payload: SaveStudentScoresInput = {
      teacherProfileId,
      termId,
      classId,
      subjectId,
      studentId,
      scores: assessmentTypes.map((assessment) => ({
        assessmentTypeId: assessment.id,
        value: row.values[assessment.id] ?? "0",
      })),
    };

    const nextRequestVersion = (requestVersionRef.current[studentId] ?? 0) + 1;
    requestVersionRef.current[studentId] = nextRequestVersion;

    startTransition(() => {
      setRowStatus(studentId, { tone: "saving", message: "Saving..." });
      void saveStudentScoresAction(payload)
        .then((result: SaveStudentScoresResult) => {
          if (requestVersionRef.current[studentId] !== nextRequestVersion) {
            return;
          }

          if (!result.ok) {
            setRowStatus(studentId, { tone: "error", message: result.message });
            return;
          }

          setRows((current) =>
            current.map((currentRow) =>
              currentRow.studentId === studentId
                ? {
                    ...currentRow,
                    total: result.total,
                    grade: result.grade,
                    values: result.values,
                  }
                : currentRow,
            ),
          );
          setRowStatus(studentId, { tone: "saved", message: "Saved" });
          scheduleStatusClear(studentId);
        })
        .catch((error: unknown) => {
          if (requestVersionRef.current[studentId] !== nextRequestVersion) {
            return;
          }

          setRowStatus(studentId, {
            tone: "error",
            message: error instanceof Error ? error.message : "Unable to save this row right now.",
          });
        });
    });
  }

  return (
    <div className="space-y-3">
      <p className="section-subtle">Scores save automatically when you leave a score field.</p>
      <TableWrap className="table-wrap">
        <Table>
          <thead>
            <tr>
              <Th>Student</Th>
              {assessmentTypes.map((assessment) => (
                <Th key={assessment.id}>
                  {assessment.name}
                  <br />
                  <span className="text-xs text-[var(--muted)]">Max {assessment.weight}</span>
                </Th>
              ))}
              <Th>Total</Th>
              <Th>Grade</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowStatus = rowStatusByStudentId[row.studentId] ?? IDLE_STATUS;
              return (
                <tr key={row.enrollmentId}>
                  <Td>
                    {row.studentCode} - {row.fullName}
                  </Td>
                  {assessmentTypes.map((assessment) => (
                    <Td key={`${row.enrollmentId}_${assessment.id}`}>
                      <input
                        type="number"
                        min={0}
                        max={assessment.weight}
                        step={0.01}
                        className="input"
                        value={row.values[assessment.id] ?? "0"}
                        onChange={(event) => handleValueChange(row.studentId, assessment.id, event.target.value)}
                        onBlur={() => saveRow(row.studentId)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            (event.currentTarget as HTMLInputElement).blur();
                          }
                        }}
                      />
                    </Td>
                  ))}
                  <Td>{row.total?.toString() ?? "-"}</Td>
                  <Td>{row.grade ?? "-"}</Td>
                  <Td>
                    <span
                      className={
                        rowStatus.tone === "error"
                          ? "text-danger text-xs"
                          : rowStatus.tone === "saved"
                            ? "text-success text-xs"
                            : "text-[var(--muted)] text-xs"
                      }
                    >
                      {rowStatus.message || (isPending ? "" : "Ready")}
                    </span>
                  </Td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <Td colSpan={totalColumns}>No enrolled students for this class/term.</Td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}
