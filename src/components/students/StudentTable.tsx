"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import Select from "@/components/admin/ui/Select";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
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
  photoUrl: string | null;
};

type StudentClassOption = {
  id: string;
  name: string;
};

type StudentTableProps = {
  rows: StudentRow[];
  classes: StudentClassOption[];
};

function toSentenceCase(value: string | null | undefined, fallback = "-") {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return fallback;
  }

  const lower = normalized.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function toDisplayName(value: string | null | undefined, fallback = "-") {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return fallback;
  }

  return normalized
    .toLowerCase()
    .split(/\s+/)
    .map((part) =>
      part
        .split(/([-'])/)
        .map((token) => {
          if (token === "-" || token === "'") {
            return token;
          }
          return token.charAt(0).toUpperCase() + token.slice(1);
        })
        .join(""),
    )
    .join(" ");
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3.25" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7.5v11a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 17 18.5v-11" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v5M14 11v5" />
    </svg>
  );
}

export default function StudentTable({ rows, classes }: StudentTableProps) {
  const router = useRouter();
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [isModalEditing, setIsModalEditing] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const activeStudent = rows.find((row) => row.id === activeStudentId) ?? null;

  function runAction(task: () => Promise<void>, options?: { successMessage?: string; onSuccess?: () => void }) {
    startTransition(() => {
      setFeedback(null);
      void task()
        .then(() => {
          router.refresh();
          if (options?.successMessage) {
            setFeedback({ tone: "success", message: options.successMessage });
          }
          options?.onSuccess?.();
        })
        .catch((error: unknown) => {
          setFeedback({
            tone: "error",
            message: error instanceof Error ? error.message : "Request failed. Please try again.",
          });
        });
    });
  }

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((student) => {
      const searchable = [
        student.studentCode,
        student.fullName,
        student.firstName ?? "",
        student.lastName ?? "",
        student.className ?? "",
        student.guardianName ?? "",
        student.guardianPhone ?? "",
        student.guardianEmail ?? "",
        student.status,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [rows, searchTerm]);

  const totalEntries = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const entryStart = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const entryEnd = totalEntries === 0 ? 0 : Math.min(currentPage * pageSize, totalEntries);

  const visiblePages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, -1, totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
  }, [currentPage, totalPages]);

  const displayFirstName = activeStudent ? activeStudent.firstName ?? activeStudent.fullName.split(/\s+/)[0] ?? "" : "";
  const displayLastName = activeStudent
    ? activeStudent.lastName ??
      activeStudent.fullName
        .split(/\s+/)
        .slice(1)
        .join(" ")
    : "";
  const activeStudentFullName = activeStudent ? toDisplayName(activeStudent.fullName, "") : "";
  const activeGuardianName = activeStudent ? toDisplayName(activeStudent.guardianName) : "-";
  const visiblePhotoUrl = activeStudent?.photoUrl?.startsWith("data:image/") ? "" : activeStudent?.photoUrl ?? "";

  return (
    <>
      {feedback ? (
        <div className={`alert ${feedback.tone === "success" ? "alert-success" : "alert-danger"} py-2`} role="alert">
          {feedback.message}
        </div>
      ) : null}
      <div id="student-directory-datatables_wrapper" className="dataTables_wrapper dt-bootstrap5">
        <div className="row mb-3">
          <div className="col-sm-12 col-md-6">
            <div className="dataTables_length" id="student-directory-datatables_length">
              <label htmlFor="student-entries-size">
                Show
                <select
                  id="student-entries-size"
                  className="form-select form-select-sm"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                  }}
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                entries
              </label>
            </div>
          </div>
          <div className="col-sm-12 col-md-6">
            <div className="dataTables_filter text-md-end mt-2 mt-md-0" id="student-directory-datatables_filter">
              <label htmlFor="student-directory-search">
                Search:
                <input
                  id="student-directory-search"
                  type="search"
                  className="form-control form-control-sm"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-12">
            <TableWrap>
              <Table id="student-directory-datatables" className="display table-striped table-hover">
                <thead>
                  <tr>
                    <Th>Student code</Th>
                    <Th>Full name</Th>
                    <Th>Class</Th>
                    <Th>Guardian name</Th>
                    <Th>Status</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tfoot>
                  <tr>
                    <Th>Student code</Th>
                    <Th>Full name</Th>
                    <Th>Class</Th>
                    <Th>Guardian name</Th>
                    <Th>Status</Th>
                    <Th>Action</Th>
                  </tr>
                </tfoot>
                <tbody>
                  {paginatedRows.map((student) => {
                    const fallbackFirstName = student.firstName ?? student.fullName.split(/\s+/)[0] ?? "";
                    const fallbackLastName =
                      student.lastName ??
                      student.fullName
                        .split(/\s+/)
                        .slice(1)
                        .join(" ");
                    return (
                      <tr key={student.id}>
                        <Td>{student.studentCode}</Td>
                        <Td>{toDisplayName([fallbackFirstName, fallbackLastName].filter(Boolean).join(" "))}</Td>
                        <Td>{student.className ?? "-"}</Td>
                        <Td>{toDisplayName(student.guardianName)}</Td>
                        <Td>{toSentenceCase(student.status)}</Td>
                        <Td className="d-flex flex-wrap gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="btn-icon-square"
                            type="button"
                            aria-label="View student"
                            title="View student"
                            onClick={() => {
                              setActiveStudentId(student.id);
                              setIsModalEditing(false);
                            }}
                          >
                            <EyeIcon />
                          </Button>
                          <form
                            action={(formData) => {
                              runAction(async () => {
                                await deleteStudentAction(formData);
                              }, {
                                successMessage: `${toDisplayName(student.fullName, "Student")} deleted successfully.`,
                                onSuccess: () => {
                                  if (activeStudentId === student.id) {
                                    setActiveStudentId(null);
                                    setIsModalEditing(false);
                                  }
                                },
                              });
                            }}
                          >
                            <input type="hidden" name="studentId" value={student.id} />
                            <Button
                              variant="danger"
                              size="sm"
                              className="btn-icon-square"
                              type="submit"
                              aria-label="Delete student"
                              title="Delete student"
                              disabled={isPending}
                            >
                              <TrashIcon />
                            </Button>
                          </form>
                        </Td>
                      </tr>
                    );
                  })}
                  {paginatedRows.length === 0 && (
                    <tr>
                      <Td colSpan={6} className="text-muted">
                        No matching students.
                      </Td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableWrap>
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-sm-12 col-md-5">
            <div className="dataTables_info" id="student-directory-datatables_info">
              Showing {entryStart} to {entryEnd} of {totalEntries} entries
              {totalEntries !== rows.length ? ` (filtered from ${rows.length} total entries)` : ""}
            </div>
          </div>
          <div className="col-sm-12 col-md-7">
            <div
              className="dataTables_paginate paging_simple_numbers d-flex justify-content-md-end mt-2 mt-md-0"
              id="student-directory-datatables_paginate"
            >
              <ul className="pagination mb-0">
                <li className={`paginate_button page-item previous ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                {visiblePages.map((page, index) =>
                  page === -1 ? (
                    <li key={`ellipsis-${index}`} className="paginate_button page-item disabled">
                      <span className="page-link">…</span>
                    </li>
                  ) : (
                    <li key={page} className={`paginate_button page-item ${currentPage === page ? "active" : ""}`}>
                      <button type="button" className="page-link" onClick={() => setCurrentPage(page)}>
                        {page}
                      </button>
                    </li>
                  ),
                )}
                <li className={`paginate_button page-item next ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {activeStudent && (
        <div className="student-swal-overlay">
          <div className="swal-modal student-swal-modal" role="dialog" aria-modal="true" aria-labelledby="student-modal-title">
            <div className="student-swal-head">
              <div className="swal-icon swal-icon--custom student-swal-icon">
                <i className={`fas ${isModalEditing ? "fa-user-edit" : "fa-user-graduate"}`} />
              </div>
              <h3 id="student-modal-title" className="swal-title">
                {isModalEditing ? "Edit student record" : "Student profile"}
              </h3>
              <p className="swal-text mb-0">
                {activeStudentFullName} · {activeStudent.studentCode}
              </p>
            </div>

            <div className="swal-content">
              {isModalEditing ? (
                <form
                  action={(formData) => {
                    runAction(async () => {
                      await updateStudentAction(formData);
                    }, {
                      successMessage: `${activeStudentFullName || "Student"} updated successfully.`,
                      onSuccess: () => {
                        setIsModalEditing(false);
                      },
                    });
                  }}
                  encType="multipart/form-data"
                  className="row g-2"
                >
                  <input type="hidden" name="studentId" value={activeStudent.id} />
                  <input type="hidden" name="currentPhotoUrl" value={activeStudent.photoUrl ?? ""} />
                  <div className="col-md-6">
                    <Input
                      name="firstName"
                      defaultValue={toDisplayName(displayFirstName, "")}
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <Input
                      name="lastName"
                      defaultValue={toDisplayName(displayLastName, "")}
                      placeholder="Last name"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <Select name="className" defaultValue={activeStudent.className ?? ""}>
                      <option value="">No class</option>
                      {classes.map((klass) => (
                        <option key={klass.id} value={klass.name}>
                          {klass.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="col-md-6">
                    <Input name="address" defaultValue={activeStudent.address ?? ""} placeholder="Address" />
                  </div>
                  <div className="col-md-6">
                    <label className="d-grid gap-1">
                      <span className="field-label">Upload student photo</span>
                      <input name="photoFile" type="file" accept="image/*" className="form-control" />
                    </label>
                  </div>
                  <div className="col-md-6">
                    <Input
                      name="photoUrl"
                      type="text"
                      defaultValue={visiblePhotoUrl}
                      placeholder="Student photo URL (optional)"
                    />
                  </div>
                  <div className="col-md-6">
                    <Input
                      name="guardianName"
                      defaultValue={toDisplayName(activeStudent.guardianName, "")}
                      placeholder="Parent/guardian name"
                    />
                  </div>
                  <div className="col-md-6">
                    <Input
                      name="guardianPhone"
                      defaultValue={activeStudent.guardianPhone ?? ""}
                      placeholder="Parent/guardian phone"
                    />
                  </div>
                  <div className="col-md-6">
                    <Input
                      name="guardianEmail"
                      type="email"
                      defaultValue={activeStudent.guardianEmail ?? ""}
                      placeholder="Parent/guardian email"
                    />
                  </div>
                  <div className="col-md-3">
                    <Select name="status" defaultValue={activeStudent.status}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="graduated">Graduated</option>
                      <option value="suspended">Suspended</option>
                    </Select>
                  </div>
                  <div className="col-md-3">
                    <Select name="gender" defaultValue={activeStudent.gender ?? ""}>
                      <option value="">-</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </Select>
                  </div>
                  <div className="swal-footer mt-3 mb-0">
                    <Button variant="primary" type="submit" disabled={isPending}>
                      {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setIsModalEditing(false)}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        setActiveStudentId(null);
                        setIsModalEditing(false);
                      }}
                      disabled={isPending}
                    >
                      Close
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="row g-3 student-swal-details">
                    <div className="col-12">
                      <div className="rounded border bg-white px-3 py-3">
                        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                          <div className="d-flex align-items-start gap-3">
                            <div className="student-profile-photo rounded border bg-light d-flex align-items-center justify-content-center overflow-hidden">
                              {activeStudent.photoUrl ? (
                                <img src={activeStudent.photoUrl} alt={activeStudentFullName || "Student"} className="student-profile-photo-image" />
                              ) : (
                                <i className="fas fa-user-graduate text-muted" />
                              )}
                            </div>
                            <div>
                              <p className="field-label mb-1">Student</p>
                              <h4 className="h5 fw-bold mb-1">{activeStudentFullName}</h4>
                              <p className="small text-muted mb-0">{activeStudent.studentCode}</p>
                            </div>
                          </div>
                          <div className="d-flex flex-wrap gap-2">
                            <span className="badge text-bg-light border">{activeStudent.className ?? "No class"}</span>
                            <span className="badge text-bg-success">{toSentenceCase(activeStudent.status)}</span>
                            <span className="badge text-bg-light border">{toSentenceCase(activeStudent.gender, "Unspecified")}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="rounded border bg-white px-3 py-3 h-100">
                        <p className="field-label mb-2">Student details</p>
                        <div className="d-grid gap-2">
                          <div>
                            <p className="field-label mb-1">Student</p>
                            <p className="mb-0">{activeStudent.studentCode}</p>
                          </div>
                          <div>
                            <p className="small text-muted mb-1">First name</p>
                            <p className="mb-0">{toDisplayName(displayFirstName)}</p>
                          </div>
                          <div>
                            <p className="small text-muted mb-1">Last name</p>
                            <p className="mb-0">{toDisplayName(displayLastName)}</p>
                          </div>
                          <div>
                            <p className="small text-muted mb-1">Address</p>
                            <p className="mb-0">{activeStudent.address ?? "-"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="rounded border bg-white px-3 py-3 h-100">
                        <p className="field-label mb-2">Guardian contact</p>
                        <div className="d-grid gap-2">
                          <div>
                            <p className="small text-muted mb-1">Parent/guardian name</p>
                            <p className="mb-0">{activeGuardianName}</p>
                          </div>
                          <div>
                            <p className="small text-muted mb-1">Phone</p>
                            <p className="mb-0">{activeStudent.guardianPhone ?? "-"}</p>
                          </div>
                          <div>
                            <p className="small text-muted mb-1">Email</p>
                            <p className="mb-0">{activeStudent.guardianEmail ?? "-"}</p>
                          </div>
                          <div>
                            <p className="small text-muted mb-1">Student photo</p>
                            <p className="mb-0 text-break">{activeStudent.photoUrl ?? "-"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="swal-footer mt-3 mb-0">
                    <Button variant="primary" type="button" onClick={() => setIsModalEditing(true)}>
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        setActiveStudentId(null);
                        setIsModalEditing(false);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
