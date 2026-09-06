"use client";

import { useState, useTransition } from "react";
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import Select from "@/components/admin/ui/Select";
import { deleteConductSectionAction, upsertConductSectionAction } from "@/lib/server/admin-actions";

type ConductSectionRow = {
  id: string;
  name: string;
  orderIndex: number;
  isActive: boolean;
  categoryCount: number;
  items: Array<{ id: string; name: string; maxScore: number; isActive: boolean }>;
};

type ConductSectionTableProps = {
  rows: ConductSectionRow[];
};

export default function ConductSectionTable({ rows }: ConductSectionTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
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

  if (rows.length === 0) {
    return <p className="workspace-empty-copy">No conduct categories yet.</p>;
  }

  return (
    <div className="conduct-group-list">
      {errorMessage ? <p className="small text-danger">{errorMessage}</p> : null}
      {rows.map((row) => {
        const isEditing = editingId === row.id;
        const isViewing = viewingId === row.id;

        return (
          <article key={row.id} className="conduct-group-item">
            <div className="conduct-group-summary">
              <span className="conduct-group-mark" aria-hidden="true">
                <i className="fas fa-layer-group" />
              </span>
              <div>
                <strong>{row.name}</strong>
                <small>{row.categoryCount} scored item{row.categoryCount === 1 ? "" : "s"}</small>
              </div>
              <div className="conduct-icon-actions">
                <button
                  type="button"
                  className="conduct-icon-action"
                  title={isViewing ? "Hide category" : "View category"}
                  aria-label={isViewing ? `Hide ${row.name}` : `View ${row.name}`}
                  onClick={() => setViewingId(isViewing ? null : row.id)}
                >
                  <i className={isViewing ? "fas fa-eye-slash" : "fas fa-eye"} />
                </button>
                <button
                  type="button"
                  className="conduct-icon-action"
                  title="Edit category"
                  aria-label={`Edit ${row.name}`}
                  onClick={() => setEditingId(isEditing ? null : row.id)}
                >
                  <i className="fas fa-pen" />
                </button>
                <form
                  action={(formData) => {
                    runAction(async () => {
                      await deleteConductSectionAction(formData);
                    });
                  }}
                >
                  <input type="hidden" name="id" value={row.id} />
                  <button
                    type="submit"
                    className="conduct-icon-action is-danger"
                    title="Delete category"
                    aria-label={`Delete ${row.name}`}
                    disabled={isPending}
                  >
                    <i className="fas fa-trash-alt" />
                  </button>
                </form>
              </div>
            </div>

            {isViewing ? (
              <div className="conduct-group-detail">
                <div className="conduct-group-meta">
                  <span className={row.isActive ? "is-active" : "is-inactive"}>{row.isActive ? "Active" : "Inactive"}</span>
                  <span>Display order {row.orderIndex}</span>
                </div>
                {row.items.length > 0 ? (
                  <div className="conduct-item-chips">
                    {row.items.map((item) => (
                      <span key={item.id} className={!item.isActive ? "is-inactive" : ""}>
                        {item.name}
                        <small>/{item.maxScore}</small>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p>No scored items have been added to this category.</p>
                )}
              </div>
            ) : null}

            {isEditing ? (
              <form
                action={(formData) => {
                  runAction(async () => {
                    await upsertConductSectionAction(formData);
                    setEditingId(null);
                  });
                }}
                className="conduct-group-edit"
              >
                <input type="hidden" name="id" value={row.id} />
                <label>
                  <span className="field-label">Category</span>
                  <Input name="name" defaultValue={row.name} required />
                </label>
                <label>
                  <span className="field-label">Order</span>
                  <Input name="orderIndex" type="number" min={1} max={99} defaultValue={row.orderIndex} required />
                </label>
                <label>
                  <span className="field-label">Status</span>
                  <Select name="isActive" defaultValue={row.isActive ? "on" : "off"}>
                    <option value="on">Active</option>
                    <option value="off">Inactive</option>
                  </Select>
                </label>
                <div>
                  <Button variant="primary" size="sm" type="submit" disabled={isPending}>
                    {isPending ? "Saving..." : "Save changes"}
                  </Button>
                  <Button variant="secondary" size="sm" type="button" onClick={() => setEditingId(null)} disabled={isPending}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
