"use client";

import { useState, useTransition } from "react";
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import Select from "@/components/admin/ui/Select";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import { deleteConductCategoryAction, upsertConductCategoryAction } from "@/lib/server/admin-actions";

type ConductCategoryRow = {
  id: string;
  sectionId: string;
  sectionName: string;
  name: string;
  maxScore: number;
  orderIndex: number;
  isActive: boolean;
};

type ConductSectionOption = {
  id: string;
  name: string;
};

type ConductCategoryTableProps = {
  sections: ConductSectionOption[];
  rows: ConductCategoryRow[];
};

export default function ConductCategoryTable({ sections, rows }: ConductCategoryTableProps) {
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
      {errorMessage ? <p className="small text-danger">{errorMessage}</p> : null}
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Category</Th>
              <Th>Sub-category</Th>
              <Th>Max Score</Th>
              <Th>Order</Th>
              <Th>Active</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isEditing = editingId === row.id;
              return (
                <tr key={row.id}>
                  {isEditing ? (
                    <>
                      <Td colSpan={5}>
                        <form
                          action={(formData) => {
                            runAction(async () => {
                              await upsertConductCategoryAction(formData);
                              setEditingId(null);
                            });
                          }}
                          className="d-flex flex-wrap gap-2 align-items-end"
                        >
                          <input type="hidden" name="id" value={row.id} />
                          <Select name="sectionId" defaultValue={row.sectionId} required>
                            {sections.map((section) => (
                              <option key={section.id} value={section.id}>
                                {section.name}
                              </option>
                            ))}
                          </Select>
                          <Input name="name" defaultValue={row.name} required />
                          <Input name="maxScore" type="number" min={1} max={100} defaultValue={row.maxScore} required />
                          <Input name="orderIndex" type="number" min={1} max={99} defaultValue={row.orderIndex} required />
                          <Select name="isActive" defaultValue={row.isActive ? "on" : "off"}>
                            <option value="on">Yes</option>
                            <option value="off">No</option>
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
                              await deleteConductCategoryAction(formData);
                              setEditingId(null);
                            });
                          }}
                        >
                          <input type="hidden" name="id" value={row.id} />
                          <button className="conduct-icon-action is-danger" type="submit" title="Delete scored item" aria-label={`Delete ${row.name}`} disabled={isPending}>
                            <i className="fas fa-trash-alt" aria-hidden="true" />
                          </button>
                        </form>
                      </Td>
                    </>
                  ) : (
                    <>
                      <Td>{row.sectionName}</Td>
                      <Td>{row.name}</Td>
                      <Td>{row.maxScore}</Td>
                      <Td>{row.orderIndex}</Td>
                      <Td>{row.isActive ? "Yes" : "No"}</Td>
                      <Td className="d-flex flex-wrap gap-1">
                        <button className="conduct-icon-action" type="button" title="Edit scored item" aria-label={`Edit ${row.name}`} onClick={() => setEditingId(row.id)}>
                          <i className="fas fa-pen" aria-hidden="true" />
                        </button>
                        <form
                          action={(formData) => {
                            runAction(async () => {
                              await deleteConductCategoryAction(formData);
                            });
                          }}
                        >
                          <input type="hidden" name="id" value={row.id} />
                          <button className="conduct-icon-action is-danger" type="submit" title="Delete scored item" aria-label={`Delete ${row.name}`} disabled={isPending}>
                            <i className="fas fa-trash-alt" aria-hidden="true" />
                          </button>
                        </form>
                      </Td>
                    </>
                  )}
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-muted">
                  No conduct sub-categories yet.
                </Td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </TableWrap>
    </>
  );
}
