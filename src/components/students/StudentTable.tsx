"use client";

import { useState, useTransition } from "react";
import { deleteStudentAction, updateStudentAction } from "@/lib/server/admin-actions";

type StudentRow = {
  id: string;
  studentCode: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  className: string | null;
  address: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  status: string;
  gender: string | null;
};

type StudentClassOption = {
  id: string;
  name: string;
};

type StudentTableProps = {
  rows: StudentRow[];
  classes: StudentClassOption[];
};

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3.25" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7.5v11a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 17 18.5v-11" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v5M14 11v5" />
    </svg>
  );
}

export default function StudentTable({ rows, classes }: StudentTableProps) {
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [isModalEditing, setIsModalEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const activeStudent = rows.find((row) => row.id === activeStudentId) ?? null;

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Class</th>
              <th>Guardian</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((student) => {
              const fallbackFirstName = student.firstName ?? student.fullName.split(/\s+/)[0] ?? "";
              const fallbackLastName =
                student.lastName ??
                student.fullName
                  .split(/\s+/)
                  .slice(1)
                  .join(" ");
              return (
                <tr key={student.id}>
                  <td>{student.studentCode}</td>
                  <td>{[fallbackFirstName, fallbackLastName].filter(Boolean).join(" ") || "-"}</td>
                  <td>{student.className ?? "-"}</td>
                  <td>{student.guardianName ?? "-"}</td>
                  <td>{student.status}</td>
                  <td className="flex flex-wrap gap-1">
                    <button
                      className="btn btn-muted inline-flex h-8 w-8 items-center justify-center p-0"
                      type="button"
                      aria-label="View student"
                      title="View student"
                      onClick={() => {
                        setActiveStudentId(student.id);
                        setIsModalEditing(false);
                      }}
                    >
                      <EyeIcon />
                    </button>
                    <form
                      action={(formData) => {
                        startTransition(async () => {
                          await deleteStudentAction(formData);
                          if (activeStudentId === student.id) {
                            setActiveStudentId(null);
                            setIsModalEditing(false);
                          }
                        });
                      }}
                    >
                      <input type="hidden" name="studentId" value={student.id} />
                      <button
                        className="btn btn-danger inline-flex h-8 w-8 items-center justify-center p-0"
                        type="submit"
                        aria-label="Delete student"
                        title="Delete student"
                        disabled={isPending}
                      >
                        <TrashIcon />
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6}>No students yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="card w-full max-w-3xl space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2">
              <div>
                <p className="section-subtle">Student Profile</p>
                <h3 className="text-lg font-semibold">{activeStudent.studentCode}</h3>
              </div>
              <button
                type="button"
                className="btn btn-muted"
                onClick={() => {
                  setActiveStudentId(null);
                  setIsModalEditing(false);
                }}
              >
                Close
              </button>
            </div>

            {isModalEditing ? (
              <form
                action={(formData) => {
                  startTransition(async () => {
                    await updateStudentAction(formData);
                    setIsModalEditing(false);
                    setActiveStudentId(null);
                  });
                }}
                className="grid gap-2 md:grid-cols-2"
              >
                <input type="hidden" name="studentId" value={activeStudent.id} />
                <input
                  name="firstName"
                  className="input"
                  defaultValue={activeStudent.firstName ?? activeStudent.fullName.split(/\s+/)[0] ?? ""}
                  placeholder="First Name"
                  required
                />
                <input
                  name="lastName"
                  className="input"
                  defaultValue={
                    activeStudent.lastName ??
                    activeStudent.fullName
                      .split(/\s+/)
                      .slice(1)
                      .join(" ")
                  }
                  placeholder="Last Name"
                  required
                />
                <select name="className" className="select" defaultValue={activeStudent.className ?? ""}>
                  <option value="">No class</option>
                  {classes.map((klass) => (
                    <option key={klass.id} value={klass.name}>
                      {klass.name}
                    </option>
                  ))}
                </select>
                <input name="address" className="input" defaultValue={activeStudent.address ?? ""} placeholder="Address" />
                <input
                  name="guardianName"
                  className="input"
                  defaultValue={activeStudent.guardianName ?? ""}
                  placeholder="Parent/Guardian Name"
                />
                <input
                  name="guardianPhone"
                  className="input"
                  defaultValue={activeStudent.guardianPhone ?? ""}
                  placeholder="Parent/Guardian Phone"
                />
                <input
                  name="guardianEmail"
                  type="email"
                  className="input"
                  defaultValue={activeStudent.guardianEmail ?? ""}
                  placeholder="Parent/Guardian Email"
                />
                <select name="status" className="select" defaultValue={activeStudent.status}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                  <option value="suspended">Suspended</option>
                </select>
                <select name="gender" className="select" defaultValue={activeStudent.gender ?? ""}>
                  <option value="">-</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <div className="md:col-span-2 flex flex-wrap gap-1">
                  <button className="btn btn-primary" type="submit" disabled={isPending}>
                    {isPending ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    className="btn btn-muted"
                    type="button"
                    onClick={() => setIsModalEditing(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="field-label">First Name</p>
                  <p>{activeStudent.firstName ?? activeStudent.fullName.split(/\s+/)[0] ?? "-"}</p>
                </div>
                <div>
                  <p className="field-label">Last Name</p>
                  <p>
                    {(activeStudent.lastName ??
                      activeStudent.fullName
                        .split(/\s+/)
                        .slice(1)
                        .join(" ")) ||
                      "-"}
                  </p>
                </div>
                <div>
                  <p className="field-label">Class</p>
                  <p>{activeStudent.className ?? "-"}</p>
                </div>
                <div>
                  <p className="field-label">Status</p>
                  <p>{activeStudent.status}</p>
                </div>
                <div>
                  <p className="field-label">Gender</p>
                  <p>{activeStudent.gender ?? "-"}</p>
                </div>
                <div>
                  <p className="field-label">Address</p>
                  <p>{activeStudent.address ?? "-"}</p>
                </div>
                <div>
                  <p className="field-label">Parent/Guardian Name</p>
                  <p>{activeStudent.guardianName ?? "-"}</p>
                </div>
                <div>
                  <p className="field-label">Parent/Guardian Phone</p>
                  <p>{activeStudent.guardianPhone ?? "-"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="field-label">Parent/Guardian Email</p>
                  <p>{activeStudent.guardianEmail ?? "-"}</p>
                </div>
                <div className="md:col-span-2 flex flex-wrap gap-1 border-t border-[var(--line)] pt-2">
                  <button className="btn btn-primary" type="button" onClick={() => setIsModalEditing(true)}>
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
