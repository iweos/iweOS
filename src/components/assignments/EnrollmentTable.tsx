"use client";

import { useDeferredValue, useState } from "react";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";

type EnrollmentRow = {
  id: string;
  student: { fullName: string };
  class: { name: string };
  term: { sessionLabel: string; termLabel: string };
};

type EnrollmentTableProps = {
  rows: EnrollmentRow[];
  removeAction: (formData: FormData) => Promise<void>;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export default function EnrollmentTable({ rows, removeAction }: EnrollmentTableProps) {
  const [studentQuery, setStudentQuery] = useState("");
  const [classQuery, setClassQuery] = useState("");
  const [termQuery, setTermQuery] = useState("");

  const deferredStudentQuery = useDeferredValue(studentQuery);
  const deferredClassQuery = useDeferredValue(classQuery);
  const deferredTermQuery = useDeferredValue(termQuery);

  const filteredRows = rows.filter((row) => {
    const termLabel = `${row.term.sessionLabel} ${row.term.termLabel}`;
    return (
      normalize(row.student.fullName).includes(normalize(deferredStudentQuery)) &&
      normalize(row.class.name).includes(normalize(deferredClassQuery)) &&
      normalize(termLabel).includes(normalize(deferredTermQuery))
    );
  });

  return (
    <>
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-4">
          <label className="d-grid gap-1">
            <span className="field-label">Filter by student</span>
            <input
              className="form-control"
              type="search"
              placeholder="Search student name"
              value={studentQuery}
              onChange={(event) => setStudentQuery(event.target.value)}
            />
          </label>
        </div>
        <div className="col-12 col-md-4">
          <label className="d-grid gap-1">
            <span className="field-label">Filter by class</span>
            <input
              className="form-control"
              type="search"
              placeholder="Search class"
              value={classQuery}
              onChange={(event) => setClassQuery(event.target.value)}
            />
          </label>
        </div>
        <div className="col-12 col-md-4">
          <label className="d-grid gap-1">
            <span className="field-label">Filter by term</span>
            <input
              className="form-control"
              type="search"
              placeholder="Search term"
              value={termQuery}
              onChange={(event) => setTermQuery(event.target.value)}
            />
          </label>
        </div>
      </div>

      <TableWrap>
        <Table data-iwe-table-enhancer="off">
          <thead>
            <tr>
              <Th>Student</Th>
              <Th>Class</Th>
              <Th>Term</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <Td>{row.student.fullName}</Td>
                <Td>{row.class.name}</Td>
                <Td>
                  {row.term.sessionLabel} {row.term.termLabel}
                </Td>
                <Td>
                  <form action={removeAction}>
                    <input type="hidden" name="enrollmentId" value={row.id} />
                    <button className="btn btn-danger" type="submit">
                      Remove
                    </button>
                  </form>
                </Td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <Td colSpan={4}>No enrollments match the current filters.</Td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableWrap>
    </>
  );
}
