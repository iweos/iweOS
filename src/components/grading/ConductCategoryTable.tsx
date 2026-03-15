"use client";

import { useState, useTransition } from "react";
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import Select from "@/components/admin/ui/Select";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import { deleteConductCategoryAction, upsertConductCategoryAction } from "@/lib/server/admin-actions";

type ConductCategoryRow = {
  id: string;
  name: string;
  maxScore: number;
  orderIndex: number;
  isActive: boolean;
};

type ConductCategoryTableProps = {
  rows: ConductCategoryRow[];
};

export default function ConductCategoryTable({ rows }: ConductCategoryTableProps) {
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
              <Th>Name</Th>
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
                      <Td colSpan={4}>
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
                          <Input name="name" className="assessment-input assessment-name" defaultValue={row.name} required />
                          <Input
                            name="maxScore"
                            type="number"
                            className="assessment-input assessment-short"
                            defaultValue={row.maxScore}
                            required
                          />
                          <Input
                            name="orderIndex"
                            type="number"
                            className="assessment-input assessment-short"
                            defaultValue={row.orderIndex}
                            required
                          />
                          <Select
                            name="isActive"
                            className="assessment-input assessment-short"
                            defaultValue={row.isActive ? "on" : "off"}
                          >
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
                          <Button variant="danger" size="sm" type="submit" disabled={isPending}>
                            Delete
                          </Button>
                        </form>
                      </Td>
                    </>
                  ) : (
                    <>
                      <Td>{row.name}</Td>
                      <Td>{row.maxScore}</Td>
                      <Td>{row.orderIndex}</Td>
                      <Td>{row.isActive ? "Yes" : "No"}</Td>
                      <Td className="d-flex flex-wrap gap-1">
                        <Button variant="secondary" size="sm" type="button" onClick={() => setEditingId(row.id)} disabled={isPending}>
                          Edit
                        </Button>
                        <form
                          action={(formData) => {
                            runAction(async () => {
                              await deleteConductCategoryAction(formData);
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
                  No conduct categories yet.
                </Td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </TableWrap>
    </>
  );
}
