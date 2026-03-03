"use client";

import { useState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Grade</th>
            <th>Min</th>
            <th>Max</th>
            <th>Order</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isEditing = editingId === row.id;
            return (
              <tr key={row.id}>
                {isEditing ? (
                  <>
                    <td colSpan={4}>
                      <form
                        action={(formData) => {
                          startTransition(async () => {
                            await upsertGradeScaleAction(formData);
                            setEditingId(null);
                          });
                        }}
                        className="flex flex-wrap gap-1"
                      >
                        <input type="hidden" name="id" value={row.id} />
                        <input name="gradeLetter" className="input w-16" defaultValue={row.gradeLetter} required />
                        <input name="minScore" className="input w-20" type="number" defaultValue={row.minScore} required />
                        <input name="maxScore" className="input w-20" type="number" defaultValue={row.maxScore} required />
                        <input name="orderIndex" className="input w-16" type="number" defaultValue={row.orderIndex} required />
                        <button className="btn btn-primary" type="submit" disabled={isPending}>
                          {isPending ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="btn btn-muted"
                          type="button"
                          onClick={() => setEditingId(null)}
                          disabled={isPending}
                        >
                          Cancel
                        </button>
                      </form>
                    </td>
                    <td>
                      <form
                        action={(formData) => {
                          startTransition(async () => {
                            await deleteGradeScaleAction(formData);
                            setEditingId(null);
                          });
                        }}
                      >
                        <input type="hidden" name="id" value={row.id} />
                        <button className="btn btn-danger" type="submit" disabled={isPending}>
                          Delete
                        </button>
                      </form>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{row.gradeLetter}</td>
                    <td>{row.minScore}</td>
                    <td>{row.maxScore}</td>
                    <td>{row.orderIndex}</td>
                    <td className="flex flex-wrap gap-1">
                      <button className="btn btn-muted" type="button" onClick={() => setEditingId(row.id)}>
                        Edit
                      </button>
                      <form
                        action={(formData) => {
                          startTransition(async () => {
                            await deleteGradeScaleAction(formData);
                          });
                        }}
                      >
                        <input type="hidden" name="id" value={row.id} />
                        <button className="btn btn-danger" type="submit" disabled={isPending}>
                          Delete
                        </button>
                      </form>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5}>No grade bands set.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
