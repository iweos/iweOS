"use client";

import { useMemo, useState } from "react";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import Button from "@/components/admin/ui/Button";

type StudentCommentRow = {
  studentId: string;
  studentCode: string;
  fullName: string;
  comment: string;
};

type SortKey = "studentCode" | "fullName" | "comment";

type StudentCommentTableProps = {
  rows: StudentCommentRow[];
  termId: string;
  classId: string;
  saveAction: (formData: FormData) => void | Promise<void>;
  placeholder?: string;
};

function compareValues(a: StudentCommentRow, b: StudentCommentRow, key: SortKey) {
  return a[key].localeCompare(b[key], undefined, { sensitivity: "base" });
}

export default function StudentCommentTable({
  rows,
  termId,
  classId,
  saveAction,
  placeholder = "Enter comment",
}: StudentCommentTableProps) {
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
              <button type="button" className="btn btn-link p-0 text-decoration-none fw-semibold" onClick={() => updateSort("comment")}>
                Comment <i className={sortIcon("comment")} />
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
                <textarea
                  form={`comment-row-${row.studentId}`}
                  name="comment"
                  defaultValue={row.comment}
                  className="form-control"
                  rows={3}
                  placeholder={placeholder}
                />
              </Td>
              <Td className="text-end">
                <form id={`comment-row-${row.studentId}`} action={saveAction} className="d-inline">
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
              <Td colSpan={4}>No enrolled students found for this class and session.</Td>
            </tr>
          ) : null}
        </tbody>
      </Table>
    </TableWrap>
  );
}
