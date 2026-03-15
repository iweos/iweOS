"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import { saveStudentConductAction, type SaveStudentConductInput, type SaveStudentConductResult } from "@/lib/server/teacher-actions";

type ConductCategoryRow = {
  id: string;
  name: string;
  maxScore: number;
};

type ConductSectionRow = {
  id: string;
  name: string;
  categories: ConductCategoryRow[];
};

type ConductStudentRow = {
  enrollmentId: string;
  studentId: string;
  studentCode: string;
  fullName: string;
  values: Record<string, string>;
};

type TeacherConductTableProps = {
  teacherProfileId?: string;
  termId: string;
  classId: string;
  conductSections: ConductSectionRow[];
  initialRows: ConductStudentRow[];
};

type RowStatus = {
  tone: "idle" | "saving" | "saved" | "error";
  message: string;
};

const IDLE_STATUS: RowStatus = { tone: "idle", message: "" };

export default function TeacherConductTable({
  teacherProfileId,
  termId,
  classId,
  conductSections,
  initialRows,
}: TeacherConductTableProps) {
  const [rows, setRows] = useState(initialRows);
  const [rowStatusByStudentId, setRowStatusByStudentId] = useState<Record<string, RowStatus>>({});
  const [, startTransition] = useTransition();
  const clearTimersRef = useRef<Record<string, number>>({});
  const requestVersionRef = useRef<Record<string, number>>({});

  const conductCategories = useMemo(
    () => conductSections.flatMap((section) => section.categories),
    [conductSections],
  );
  const totalColumns = conductCategories.length + 2;
  const rowsByStudentId = useMemo(() => new Map(rows.map((row) => [row.studentId, row])), [rows]);

  function setRowStatus(studentId: string, status: RowStatus) {
    setRowStatusByStudentId((current) => ({
      ...current,
      [studentId]: status,
    }));
  }

  function clearStatusClearTimer(studentId: string) {
    const currentTimeout = clearTimersRef.current[studentId];
    if (!currentTimeout) {
      return;
    }
    window.clearTimeout(currentTimeout);
    delete clearTimersRef.current[studentId];
  }

  function scheduleStatusClear(studentId: string) {
    clearStatusClearTimer(studentId);
    clearTimersRef.current[studentId] = window.setTimeout(() => {
      setRowStatus(studentId, IDLE_STATUS);
      delete clearTimersRef.current[studentId];
    }, 2200);
  }

  function handleValueChange(studentId: string, conductCategoryId: string, nextValue: string) {
    setRows((current) =>
      current.map((row) =>
        row.studentId === studentId
          ? {
              ...row,
              values: {
                ...row.values,
                [conductCategoryId]: nextValue,
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

    const payload: SaveStudentConductInput = {
      teacherProfileId,
      termId,
      classId,
      studentId,
      conduct: conductCategories.map((category) => ({
        conductCategoryId: category.id,
        value: row.values[category.id] ?? "0",
      })),
    };

    const nextRequestVersion = (requestVersionRef.current[studentId] ?? 0) + 1;
    requestVersionRef.current[studentId] = nextRequestVersion;
    clearStatusClearTimer(studentId);
    setRowStatus(studentId, { tone: "saving", message: "Saving..." });

    startTransition(() => {
      void saveStudentConductAction(payload)
        .then((result: SaveStudentConductResult) => {
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
            message: error instanceof Error ? error.message : "Unable to save this conduct row right now.",
          });
        });
    });
  }

  return (
    <div className="space-y-3">
      <p className="section-subtle">Conduct scores save automatically when you leave a conduct field.</p>
      <TableWrap className="table-wrap">
        <Table>
          <thead>
            <tr>
              <Th rowSpan={2}>Student</Th>
              {conductSections.map((section) => (
                <Th key={section.id} colSpan={section.categories.length} className="text-center">
                  {section.name}
                </Th>
              ))}
              <Th rowSpan={2}>Status</Th>
            </tr>
            <tr>
              {conductSections.flatMap((section) =>
                section.categories.map((category) => (
                  <Th key={category.id}>
                    {category.name}
                    <br />
                    <span className="text-xs text-[var(--muted)]">Max {category.maxScore}</span>
                  </Th>
                )),
              )}
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
                  {conductCategories.map((category) => (
                    <Td key={`${row.enrollmentId}_${category.id}`}>
                      <input
                        type="number"
                        min={0}
                        max={category.maxScore}
                        step={0.01}
                        className="input"
                        value={row.values[category.id] ?? "0"}
                        onChange={(event) => handleValueChange(row.studentId, category.id, event.target.value)}
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
                  <Td>
                    {rowStatus.tone === "saving" ? (
                      <span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
                        <span className="global-pending-bird inline-bird-loader" aria-hidden="true">
                          <i className="fas fa-dove bird-base" />
                          <span className="bird-fill-mask">
                            <i className="fas fa-dove bird-fill" />
                          </span>
                        </span>
                        <span>{rowStatus.message}</span>
                      </span>
                    ) : (
                      <span
                        className={
                          rowStatus.tone === "error"
                            ? "text-danger text-xs"
                            : rowStatus.tone === "saved"
                              ? "text-success text-xs"
                              : "text-[var(--muted)] text-xs"
                        }
                      >
                        {rowStatus.message || "Ready"}
                      </span>
                    )}
                  </Td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <Td colSpan={totalColumns}>No enrolled students for this class/term.</Td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}
