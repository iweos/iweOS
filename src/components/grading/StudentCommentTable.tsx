"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import type { SaveStudentCommentInput, SaveStudentCommentResult } from "@/lib/server/admin-actions";

type StudentCommentRow = {
  studentId: string;
  studentCode: string;
  fullName: string;
  comment: string;
};

type SortKey = "studentCode" | "fullName" | "comment";

type RowStatus = {
  tone: "idle" | "saving" | "saved" | "error";
  message: string;
};

type StudentCommentTableProps = {
  rows: StudentCommentRow[];
  termId: string;
  classId: string;
  saveAction: (input: SaveStudentCommentInput) => Promise<SaveStudentCommentResult>;
  placeholder?: string;
};

const IDLE_STATUS: RowStatus = { tone: "idle", message: "" };

function compareValues(a: StudentCommentRow, b: StudentCommentRow, key: SortKey) {
  return a[key].localeCompare(b[key], undefined, { sensitivity: "base" });
}

export default function StudentCommentTable({
  rows: initialRows,
  termId,
  classId,
  saveAction,
  placeholder = "Enter comment",
}: StudentCommentTableProps) {
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

  function handleValueChange(studentId: string, nextValue: string) {
    setRows((current) =>
      current.map((row) =>
        row.studentId === studentId
          ? {
              ...row,
              comment: nextValue,
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

    const requestVersion = (requestVersionRef.current[studentId] ?? 0) + 1;
    requestVersionRef.current[studentId] = requestVersion;
    clearStatusTimer(studentId);
    setRowStatus(studentId, { tone: "saving", message: "Saving..." });

    startTransition(() => {
      void saveAction({
        studentId,
        termId,
        classId,
        comment: row.comment,
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
              currentRow.studentId === studentId
                ? {
                    ...currentRow,
                    comment: result.comment ?? "",
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
              <button type="button" className="iwe-table-sort-button" onClick={() => updateSort("comment")}>
                Comment <i className={sortIcon("comment")} />
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
                  <textarea
                    name={`comment-${row.studentId}`}
                    value={row.comment}
                    className="form-control"
                    rows={3}
                    placeholder={placeholder}
                    onChange={(event) => handleValueChange(row.studentId, event.target.value)}
                    onBlur={() => saveRow(row.studentId)}
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
              <Td colSpan={4}>No enrolled students found for this class and session.</Td>
            </tr>
          ) : null}
        </tbody>
      </Table>
    </TableWrap>
  );
}
