"use client";

import { useState, useTransition } from "react";
import { deleteAssessmentTypeAction, upsertAssessmentTypeAction } from "@/lib/server/admin-actions";

type AssessmentTypeRow = {
  id: string;
  name: string;
  weight: number;
  orderIndex: number;
  isActive: boolean;
};

type AssessmentTypeTableProps = {
  rows: AssessmentTypeRow[];
};

export default function AssessmentTypeTable({ rows }: AssessmentTypeTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Weight</th>
            <th>Order</th>
            <th>Active</th>
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
                            await upsertAssessmentTypeAction(formData);
                            setEditingId(null);
                          });
                        }}
                        className="flex flex-wrap gap-1"
                      >
                        <input type="hidden" name="id" value={row.id} />
                        <input name="name" className="input w-28" defaultValue={row.name} required />
                        <input name="weight" type="number" className="input w-20" defaultValue={row.weight} required />
                        <input name="orderIndex" type="number" className="input w-16" defaultValue={row.orderIndex} required />
                        <select name="isActive" className="select w-20" defaultValue={row.isActive ? "on" : "off"}>
                          <option value="on">Yes</option>
                          <option value="off">No</option>
                        </select>
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
                            await deleteAssessmentTypeAction(formData);
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
                    <td>{row.name}</td>
                    <td>{row.weight}</td>
                    <td>{row.orderIndex}</td>
                    <td>{row.isActive ? "Yes" : "No"}</td>
                    <td className="flex flex-wrap gap-1">
                      <button className="btn btn-muted" type="button" onClick={() => setEditingId(row.id)}>
                        Edit
                      </button>
                      <form
                        action={(formData) => {
                          startTransition(async () => {
                            await deleteAssessmentTypeAction(formData);
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
              <td colSpan={5}>No assessment types yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
