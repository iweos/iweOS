"use client";

import { useMemo, useState } from "react";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";

type StudentAttendanceRow = {
  studentId: string;
  studentCode: string;
  fullName: string;
  timesSchoolOpened: number;
  timesPresent: number;
  timesAbsent: number;
};

type SortKey = "studentCode" | "fullName" | "timesSchoolOpened" | "timesPresent" | "timesAbsent";

type StudentAttendanceTableProps = {
  rows: StudentAttendanceRow[];
  termId: string;
  classId: string;
  saveAction: (formData: FormData) => void | Promise<void>;
};

function compareValues(a: StudentAttendanceRow, b: StudentAttendanceRow, key: SortKey) {
  if (key === "studentCode" || key === "fullName") {
    return a[key].localeCompare(b[key], undefined, { sensitivity: "base" });
  }
  return a[key] - b[key];
}

export default function StudentAttendanceTable({
  rows,
  termId,
  classId,
  saveAction,
}: StudentAttendanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sortedRows = useMemo(() => {
    return [...rows].sort((left, right) => {
      const comparison = compareValues(left, right, sortKey);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [rows, sortDirection, sortKey]);

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

  return (
    <TableWrap>
      <Table data-iwe-table-enhancer="off">
        <thead>
          <tr>
            <Th>
              <button type="button" className="btn btn-link p-0 text-decoration-none fw-semibold" onClick={() => updateSort("studentCode")}>
                Student code <i className={sortIcon("studentCode")} />
              </button>
            </Th>
            <Th>
              <button type="button" className="btn btn-link p-0 text-decoration-none fw-semibold" onClick={() => updateSort("fullName")}>
                Student <i className={sortIcon("fullName")} />
              </button>
            </Th>
            <Th>
              <button type="button" className="btn btn-link p-0 text-decoration-none fw-semibold" onClick={() => updateSort("timesSchoolOpened")}>
                Times school open <i className={sortIcon("timesSchoolOpened")} />
              </button>
            </Th>
            <Th>
              <button type="button" className="btn btn-link p-0 text-decoration-none fw-semibold" onClick={() => updateSort("timesPresent")}>
                Times present <i className={sortIcon("timesPresent")} />
              </button>
            </Th>
            <Th>
              <button type="button" className="btn btn-link p-0 text-decoration-none fw-semibold" onClick={() => updateSort("timesAbsent")}>
                Times absent <i className={sortIcon("timesAbsent")} />
              </button>
            </Th>
            <Th className="text-end">Action</Th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={row.studentId}>
              <Td>{row.studentCode}</Td>
              <Td>{row.fullName}</Td>
              <Td>
                <Input
                  form={`attendance-row-${row.studentId}`}
                  name="timesSchoolOpened"
                  type="number"
                  min={0}
                  max={366}
                  defaultValue={row.timesSchoolOpened}
                  className="min-w-[88px]"
                />
              </Td>
              <Td>
                <Input
                  form={`attendance-row-${row.studentId}`}
                  name="timesPresent"
                  type="number"
                  min={0}
                  max={366}
                  defaultValue={row.timesPresent}
                  className="min-w-[88px]"
                />
              </Td>
              <Td>
                <Input
                  form={`attendance-row-${row.studentId}`}
                  name="timesAbsent"
                  type="number"
                  min={0}
                  max={366}
                  defaultValue={row.timesAbsent}
                  className="min-w-[88px]"
                />
              </Td>
              <Td className="text-end">
                <form id={`attendance-row-${row.studentId}`} action={saveAction} className="d-inline">
                  <input type="hidden" name="studentId" value={row.studentId} />
                  <input type="hidden" name="termId" value={termId} />
                  <input type="hidden" name="classId" value={classId} />
                  <Button type="submit" variant="primary" size="sm">
                    Save
                  </Button>
                </form>
              </Td>
            </tr>
          ))}
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
