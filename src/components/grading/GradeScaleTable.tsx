"use client";

import { useState, useTransition } from "react";
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import { deleteGradeScaleAction, upsertGradeScaleAction } from "@/lib/server/admin-actions";

type GradeRow = {
  id: string;
  gradeLetter: string;
  minScore: number;
  maxScore: number;
  orderIndex: number;
};

type GradeScaleTableProps = {
  rows: GradeRow[];
};

export default function GradeScaleTable({ rows }: GradeScaleTableProps) {
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
              <Th>Grade</Th>
              <Th>Min</Th>
              <Th>Max</Th>
              <Th>Order</Th>
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
                      <Td colSpan={4}>
                        <form
                          action={(formData) => {
                            runAction(async () => {
                              await upsertGradeScaleAction(formData);
                              setEditingId(null);
                            });
                          }}
                          className="d-flex flex-wrap gap-2 align-items-end"
                        >
                          <input type="hidden" name="id" value={row.id} />
                          <Input name="gradeLetter" className="assessment-input assessment-short" defaultValue={row.gradeLetter} required />
                          <Input
                            name="minScore"
                            className="assessment-input assessment-short"
                            type="number"
                            defaultValue={row.minScore}
                            required
                          />
                          <Input
                            name="maxScore"
                            className="assessment-input assessment-short"
                            type="number"
                            defaultValue={row.maxScore}
                            required
                          />
                          <Input
                            name="orderIndex"
                            className="assessment-input assessment-short"
                            type="number"
                            defaultValue={row.orderIndex}
                            required
                          />
                          <Button variant="primary" size="sm" type="submit" disabled={isPending}>
                            {isPending ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={() => setEditingId(null)}
                            disabled={isPending}
                          >
                            Cancel
                          </Button>
                        </form>
                      </Td>
                      <Td>
                        <form
                          action={(formData) => {
                            runAction(async () => {
                              await deleteGradeScaleAction(formData);
                              setEditingId(null);
                            });
                          }}
                        >
                          <input type="hidden" name="id" value={row.id} />
                          <Button variant="danger" size="sm" type="submit" disabled={isPending}>
                            Delete
                          </Button>
                        </form>
                      </Td>
                    </>
                  ) : (
                    <>
                      <Td>{row.gradeLetter}</Td>
                      <Td>{row.minScore}</Td>
                      <Td>{row.maxScore}</Td>
                      <Td>{row.orderIndex}</Td>
                      <Td className="d-flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" type="button" onClick={() => setEditingId(row.id)}>
                          Edit
                        </Button>
                        <form
                          action={(formData) => {
                            runAction(async () => {
                              await deleteGradeScaleAction(formData);
                            });
                          }}
                        >
                          <input type="hidden" name="id" value={row.id} />
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

            {rows.length === 0 ? (
              <tr>
                <Td colSpan={5} className="text-muted">
                  No grade bands set.
                </Td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </TableWrap>
    </>
  );
}
