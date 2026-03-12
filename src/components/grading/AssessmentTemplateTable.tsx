"use client";

import { useState, useTransition } from "react";
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import Select from "@/components/admin/ui/Select";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import {
  deleteAssessmentTemplateAction,
  setActiveAssessmentTemplateAction,
  upsertAssessmentTemplateAction,
} from "@/lib/server/admin-actions";

type AssessmentTemplateRow = {
  id: string;
  name: string;
  isActive: boolean;
  itemCount: number;
};

type AssessmentTemplateTableProps = {
  rows: AssessmentTemplateRow[];
  selectedTemplateId?: string;
};

export default function AssessmentTemplateTable({ rows, selectedTemplateId }: AssessmentTemplateTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(task: () => Promise<void>) {
    startTransition(() => {
      setErrorMessage(null);
      void task().catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "Request failed. Please try again.");
      });
    });
  }

  return (
    <>
      {errorMessage && <p className="small text-danger">{errorMessage}</p>}
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Assessments</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isEditing = editingId === row.id;
              const isSelected = selectedTemplateId === row.id;

              return (
                <tr key={row.id}>
                  {isEditing ? (
                    <>
                      <Td colSpan={3}>
                        <form
                          action={(formData) => {
                            runAction(async () => {
                              await upsertAssessmentTemplateAction(formData);
                              setEditingId(null);
                            });
                          }}
                          className="d-flex flex-wrap gap-2 align-items-end"
                        >
                          <input type="hidden" name="id" value={row.id} />
                          <Input name="name" className="assessment-input assessment-name" defaultValue={row.name} required />
                          <Select name="setActive" className="assessment-input assessment-short" defaultValue={row.isActive ? "on" : "off"}>
                            <option value="on">Set Active</option>
                            <option value="off">Keep Status</option>
                          </Select>
                          <Button variant="primary" size="sm" type="submit" disabled={isPending}>
                            {isPending ? "Saving..." : "Save"}
                          </Button>
                          <Button variant="secondary" size="sm" type="button" onClick={() => setEditingId(null)} disabled={isPending}>
                            Cancel
                          </Button>
                        </form>
                      </Td>
                      <Td>
                        <form
                          action={(formData) => {
                            runAction(async () => {
                              await deleteAssessmentTemplateAction(formData);
                              setEditingId(null);
                            });
                          }}
                        >
                          <input type="hidden" name="templateId" value={row.id} />
                          <Button variant="danger" size="sm" type="submit" disabled={isPending}>
                            Delete
                          </Button>
                        </form>
                      </Td>
                    </>
                  ) : (
                    <>
                      <Td>
                        {row.name}
                        {isSelected ? <span className="ms-2 badge bg-light text-dark">Selected</span> : null}
                      </Td>
                      <Td>{row.itemCount}</Td>
                      <Td>{row.isActive ? "Active" : "Inactive"}</Td>
                      <Td className="d-flex flex-wrap gap-1">
                        <a className="btn btn-sm btn-secondary" href={`/app/admin/grading/assessment-types?templateId=${row.id}`}>
                          Open
                        </a>
                        {!row.isActive ? (
                          <form
                            action={(formData) => {
                              runAction(async () => {
                                await setActiveAssessmentTemplateAction(formData);
                              });
                            }}
                          >
                            <input type="hidden" name="templateId" value={row.id} />
                            <Button variant="primary" size="sm" type="submit" disabled={isPending}>
                              Make Active
                            </Button>
                          </form>
                        ) : null}
                        <Button variant="secondary" size="sm" type="button" onClick={() => setEditingId(row.id)} disabled={isPending}>
                          Edit
                        </Button>
                        <form
                          action={(formData) => {
                            runAction(async () => {
                              await deleteAssessmentTemplateAction(formData);
                            });
                          }}
                        >
                          <input type="hidden" name="templateId" value={row.id} />
                          <Button variant="danger" size="sm" type="submit" disabled={isPending}>
                            Delete
                          </Button>
                        </form>
                      </Td>
                    </>
                  )}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <Td colSpan={4} className="text-muted">
                  No assessment templates yet.
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableWrap>
    </>
  );
}
