"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
  selectedStudent: ConductStudentRow;
};

type ItemStatus = {
  tone: "idle" | "saving" | "saved" | "error";
  message: string;
};

const IDLE_STATUS: ItemStatus = { tone: "idle", message: "" };

export default function TeacherConductTable({
  teacherProfileId,
  termId,
  classId,
  conductSections,
  selectedStudent,
}: TeacherConductTableProps) {
  const [student, setStudent] = useState(selectedStudent);
  const [statusByCategoryId, setStatusByCategoryId] = useState<Record<string, ItemStatus>>({});
  const [, startTransition] = useTransition();
  const clearTimersRef = useRef<Record<string, number>>({});
  const requestVersionRef = useRef<Record<string, number>>({});

  const conductCategories = useMemo(
    () => conductSections.flatMap((section) => section.categories),
    [conductSections],
  );

  useEffect(() => {
    setStudent(selectedStudent);
    setStatusByCategoryId({});
    Object.values(clearTimersRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
    clearTimersRef.current = {};
    requestVersionRef.current = {};
  }, [selectedStudent]);

  function setItemStatus(categoryId: string, status: ItemStatus) {
    setStatusByCategoryId((current) => ({
      ...current,
      [categoryId]: status,
    }));
  }

  function clearStatusClearTimer(categoryId: string) {
    const currentTimeout = clearTimersRef.current[categoryId];
    if (!currentTimeout) {
      return;
    }
    window.clearTimeout(currentTimeout);
    delete clearTimersRef.current[categoryId];
  }

  function scheduleStatusClear(categoryId: string) {
    clearStatusClearTimer(categoryId);
    clearTimersRef.current[categoryId] = window.setTimeout(() => {
      setItemStatus(categoryId, IDLE_STATUS);
      delete clearTimersRef.current[categoryId];
    }, 2200);
  }

  function handleValueChange(conductCategoryId: string, nextValue: string) {
    setStudent((current) => ({
      ...current,
      values: {
        ...current.values,
        [conductCategoryId]: nextValue,
      },
    }));
  }

  function saveCategory(conductCategoryId: string) {
    const payload: SaveStudentConductInput = {
      teacherProfileId,
      termId,
      classId,
      studentId: student.studentId,
      conduct: conductCategories.map((category) => ({
        conductCategoryId: category.id,
        value: student.values[category.id] ?? "0",
      })),
    };

    const nextRequestVersion = (requestVersionRef.current[conductCategoryId] ?? 0) + 1;
    requestVersionRef.current[conductCategoryId] = nextRequestVersion;
    clearStatusClearTimer(conductCategoryId);
    setItemStatus(conductCategoryId, { tone: "saving", message: "Saving..." });

    startTransition(() => {
      void saveStudentConductAction(payload)
        .then((result: SaveStudentConductResult) => {
          if (requestVersionRef.current[conductCategoryId] !== nextRequestVersion) {
            return;
          }
          if (!result.ok) {
            setItemStatus(conductCategoryId, { tone: "error", message: result.message });
            return;
          }

          setStudent((current) => ({
            ...current,
            values: result.values,
          }));
          setItemStatus(conductCategoryId, { tone: "saved", message: "Saved" });
          scheduleStatusClear(conductCategoryId);
        })
        .catch((error: unknown) => {
          if (requestVersionRef.current[conductCategoryId] !== nextRequestVersion) {
            return;
          }
          setItemStatus(conductCategoryId, {
            tone: "error",
            message: error instanceof Error ? error.message : "Unable to save this conduct item right now.",
          });
        });
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-4 border border-[var(--line)] bg-white px-4 py-3">
        <p className="mb-1 text-sm font-semibold text-[var(--ink)]">
          {student.studentCode} - {student.fullName}
        </p>
        <p className="mb-0 section-subtle">Conduct scores save automatically when you leave a score field.</p>
      </div>

      <TableWrap className="table-wrap">
        <Table>
          <thead>
            <tr>
              <Th>Conduct</Th>
              <Th>Score</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {conductSections.map((section) => (
              <FragmentSection
                key={section.id}
                section={section}
                student={student}
                statusByCategoryId={statusByCategoryId}
                onValueChange={handleValueChange}
                onSave={saveCategory}
              />
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}

function FragmentSection({
  section,
  student,
  statusByCategoryId,
  onValueChange,
  onSave,
}: {
  section: ConductSectionRow;
  student: ConductStudentRow;
  statusByCategoryId: Record<string, ItemStatus>;
  onValueChange: (conductCategoryId: string, nextValue: string) => void;
  onSave: (conductCategoryId: string) => void;
}) {
  return (
    <>
      <tr>
        <Td colSpan={3} className="bg-[rgba(15,139,76,0.08)] font-semibold text-[var(--green)]">
          {section.name}
        </Td>
      </tr>
      {section.categories.map((category) => {
        const status = statusByCategoryId[category.id] ?? IDLE_STATUS;
        return (
          <tr key={category.id}>
            <Td>
              {category.name}
              <br />
              <span className="text-xs text-[var(--muted)]">Max {category.maxScore}</span>
            </Td>
            <Td>
              <input
                type="number"
                min={0}
                max={category.maxScore}
                step={0.01}
                className="input"
                value={student.values[category.id] ?? "0"}
                onChange={(event) => onValueChange(category.id, event.target.value)}
                onBlur={() => onSave(category.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    (event.currentTarget as HTMLInputElement).blur();
                  }
                }}
              />
            </Td>
            <Td>
              {status.tone === "saving" ? (
                <span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span className="global-pending-bird inline-bird-loader" aria-hidden="true">
                    <i className="fas fa-dove bird-base" />
                    <span className="bird-fill-mask">
                      <i className="fas fa-dove bird-fill" />
                    </span>
                  </span>
                  <span>{status.message}</span>
                </span>
              ) : (
                <span
                  className={
                    status.tone === "error"
                      ? "text-danger text-xs"
                      : status.tone === "saved"
                        ? "text-success text-xs"
                        : "text-[var(--muted)] text-xs"
                  }
                >
                  {status.message || "Ready"}
                </span>
              )}
            </Td>
          </tr>
        );
      })}
    </>
  );
}
