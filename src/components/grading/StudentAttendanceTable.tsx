"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import Input from "@/components/admin/ui/Input";
import type { SaveStudentAttendanceInput, SaveStudentAttendanceResult } from "@/lib/server/admin-actions";

type StudentAttendanceRow = {
  studentId: string;
  studentCode: string;
  fullName: string;
  timesSchoolOpened: number;
  timesPresent: number;
  timesAbsent: number;
};

type AttendanceField = "timesSchoolOpened" | "timesPresent" | "timesAbsent";

type SortKey = "studentCode" | "fullName" | "timesSchoolOpened" | "timesPresent" | "timesAbsent";

type RowStatus = {
  tone: "idle" | "saving" | "saved" | "error";
  message: string;
};

type StudentAttendanceTableProps = {
  rows: StudentAttendanceRow[];
  termId: string;
  classId: string;
  saveAction: (input: SaveStudentAttendanceInput) => Promise<SaveStudentAttendanceResult>;
};

const IDLE_STATUS: RowStatus = { tone: "idle", message: "" };

function compareValues(a: StudentAttendanceRow, b: StudentAttendanceRow, key: SortKey) {
  if (key === "studentCode" || key === "fullName") {
    return a[key].localeCompare(b[key], undefined, { sensitivity: "base" });
  }
  return a[key] - b[key];
}

function normalizeAttendanceRow(
  row: StudentAttendanceRow,
  key: AttendanceField,
  nextValue: number,
): StudentAttendanceRow {
  const nextRow = { ...row, [key]: nextValue };

  if (key === "timesPresent") {
    if (nextRow.timesSchoolOpened > 0) {
      nextRow.timesAbsent = Math.max(nextRow.timesSchoolOpened - nextRow.timesPresent, 0);
    } else if (nextRow.timesAbsent > 0) {
      nextRow.timesSchoolOpened = nextRow.timesPresent + nextRow.timesAbsent;
    }
    return nextRow;
  }

  if (key === "timesAbsent") {
    if (nextRow.timesSchoolOpened > 0) {
      nextRow.timesPresent = Math.max(nextRow.timesSchoolOpened - nextRow.timesAbsent, 0);
    } else if (nextRow.timesPresent > 0) {
      nextRow.timesSchoolOpened = nextRow.timesPresent + nextRow.timesAbsent;
    }
    return nextRow;
  }

  if (nextRow.timesPresent > 0 || nextRow.timesAbsent > 0) {
    if (nextRow.timesPresent > 0 && nextRow.timesAbsent === 0) {
      nextRow.timesAbsent = Math.max(nextRow.timesSchoolOpened - nextRow.timesPresent, 0);
    } else if (nextRow.timesAbsent > 0 && nextRow.timesPresent === 0) {
      nextRow.timesPresent = Math.max(nextRow.timesSchoolOpened - nextRow.timesAbsent, 0);
    } else {
      nextRow.timesAbsent = Math.max(nextRow.timesSchoolOpened - nextRow.timesPresent, 0);
    }
  }

  return nextRow;
}

export default function StudentAttendanceTable({ rows: initialRows, termId, classId, saveAction }: StudentAttendanceTableProps) {
  const [rows, setRows] = useState(initialRows);
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [rowStatusByStudentId, setRowStatusByStudentId] = useState<Record<string, RowStatus>>({});
  const [, startTransition] = useTransition();
  const clearTimersRef = useRef<Record<string, number>>({});
  const requestVersionRef = useRef<Record<string, number>>({});

  useEffect(() => {
    setRows(initialRows);
    setRowStatusByStudentId({});
    requestVersionRef.current = {};
    Object.values(clearTimersRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
    clearTimersRef.current = {};
  }, [initialRows, termId, classId]);

  useEffect(() => {
    return () => {
      Object.values(clearTimersRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  const sortedRows = useMemo(() => {
    return [...rows].sort((left, right) => {
      const comparison = compareValues(left, right, sortKey);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [rows, sortDirection, sortKey]);

  const rowsByStudentId = useMemo(() => new Map(rows.map((row) => [row.studentId, row])), [rows]);

  function updateSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection("asc");
  }

  function sortIcon(key: SortKey) {
    if (key !== sortKey) {
      return "fas fa-sort text-muted";
    }
    return sortDirection === "asc" ? "fas fa-sort-up" : "fas fa-sort-down";
  }

  function setRowStatus(studentId: string, status: RowStatus) {
    setRowStatusByStudentId((current) => ({ ...current, [studentId]: status }));
  }

  function clearStatusTimer(studentId: string) {
    const timeoutId = clearTimersRef.current[studentId];
    if (!timeoutId) {
      return;
    }
    window.clearTimeout(timeoutId);
    delete clearTimersRef.current[studentId];
  }

  function scheduleStatusClear(studentId: string) {
    clearStatusTimer(studentId);
    clearTimersRef.current[studentId] = window.setTimeout(() => {
      setRowStatus(studentId, IDLE_STATUS);
      delete clearTimersRef.current[studentId];
    }, 2200);
  }

  function handleValueChange(studentId: string, key: AttendanceField, nextValue: string) {
    setRows((current) =>
      current.map((row) =>
        row.studentId === studentId
          ? normalizeAttendanceRow(row, key, Number.parseInt(nextValue || "0", 10) || 0)
          : row,
      ),
    );
  }

  function saveRow(studentId: string) {
    const row = rowsByStudentId.get(studentId);
    if (!row) {
      return;
    }

    const requestVersion = (requestVersionRef.current[studentId] ?? 0) + 1;
    requestVersionRef.current[studentId] = requestVersion;
    clearStatusTimer(studentId);
    setRowStatus(studentId, { tone: "saving", message: "Saving..." });

    startTransition(() => {
      void saveAction({
        studentId,
        termId,
        classId,
        timesSchoolOpened: row.timesSchoolOpened.toString(),
        timesPresent: row.timesPresent.toString(),
        timesAbsent: row.timesAbsent.toString(),
      })
        .then((result) => {
          if (requestVersionRef.current[studentId] !== requestVersion) {
            return;
          }

          if (!result.ok) {
            setRowStatus(studentId, { tone: "error", message: result.message });
            return;
          }

          setRows((current) =>
            current.map((currentRow) =>
              currentRow.studentId === studentId && result.record
                ? {
                    ...currentRow,
                    timesSchoolOpened: result.record.timesSchoolOpened,
                    timesPresent: result.record.timesPresent,
                    timesAbsent: result.record.timesAbsent,
                  }
                : currentRow,
            ),
          );
          setRowStatus(studentId, { tone: "saved", message: "Saved" });
          scheduleStatusClear(studentId);
        })
        .catch((error: unknown) => {
          if (requestVersionRef.current[studentId] !== requestVersion) {
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
    <TableWrap>
      <Table data-iwe-table-enhancer="off">
        <thead>
          <tr>
            <Th>
              <button type="button" className="iwe-table-sort-button" onClick={() => updateSort("studentCode")}>
                Student code <i className={sortIcon("studentCode")} />
              </button>
            </Th>
            <Th>
              <button type="button" className="iwe-table-sort-button" onClick={() => updateSort("fullName")}>
                Student <i className={sortIcon("fullName")} />
              </button>
            </Th>
            <Th>
              <button type="button" className="iwe-table-sort-button" onClick={() => updateSort("timesSchoolOpened")}>
                Times school open <i className={sortIcon("timesSchoolOpened")} />
              </button>
            </Th>
            <Th>
              <button type="button" className="iwe-table-sort-button" onClick={() => updateSort("timesPresent")}>
                Times present <i className={sortIcon("timesPresent")} />
              </button>
            </Th>
            <Th>
              <button type="button" className="iwe-table-sort-button" onClick={() => updateSort("timesAbsent")}>
                Times absent <i className={sortIcon("timesAbsent")} />
              </button>
            </Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => {
            const rowStatus = rowStatusByStudentId[row.studentId] ?? IDLE_STATUS;
            return (
              <tr key={row.studentId}>
                <Td>{row.studentCode}</Td>
                <Td>{row.fullName}</Td>
                <Td>
                  <Input
                    name={`timesSchoolOpened-${row.studentId}`}
                    type="number"
                    min={0}
                    max={366}
                    value={row.timesSchoolOpened}
                    onChange={(event) => handleValueChange(row.studentId, "timesSchoolOpened", event.target.value)}
                    onBlur={() => saveRow(row.studentId)}
                    className="min-w-[88px]"
                  />
                </Td>
                <Td>
                  <Input
                    name={`timesPresent-${row.studentId}`}
                    type="number"
                    min={0}
                    max={366}
                    value={row.timesPresent}
                    onChange={(event) => handleValueChange(row.studentId, "timesPresent", event.target.value)}
                    onBlur={() => saveRow(row.studentId)}
                    className="min-w-[88px]"
                  />
                </Td>
                <Td>
                  <Input
                    name={`timesAbsent-${row.studentId}`}
                    type="number"
                    min={0}
                    max={366}
                    value={row.timesAbsent}
                    onChange={(event) => handleValueChange(row.studentId, "timesAbsent", event.target.value)}
                    onBlur={() => saveRow(row.studentId)}
                    className="min-w-[88px]"
                  />
                </Td>
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
          {sortedRows.length === 0 ? (
            <tr>
              <Td colSpan={6}>No enrolled students found for this class and session.</Td>
            </tr>
          ) : null}
        </tbody>
      </Table>
    </TableWrap>
  );
}
