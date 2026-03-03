import {
  deleteFeeCatalogAction,
  deleteFeeScheduleItemAction,
  updatePaymentSettingsAction,
  upsertFeeCatalogAction,
  upsertFeeScheduleAction,
} from "@/lib/server/payment-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export default async function PaymentsSettingsPage() {
  const profile = await requireRole("admin");
  const paymentClient = prisma as unknown as {
    feeItemCatalog?: typeof prisma.feeItemCatalog;
    feeScheduleItem?: typeof prisma.feeScheduleItem;
  };

  if (!paymentClient.feeItemCatalog || !paymentClient.feeScheduleItem) {
    return (
      <section className="section-panel space-y-2">
        <p className="section-kicker">Payments</p>
        <h1 className="section-title">Setup Required</h1>
        <p className="section-subtle">
          Payments tables are not available yet. Run <code>npm run prisma:generate && npm run prisma:migrate</code>,
          then restart <code>npm run dev</code>.
        </p>
      </section>
    );
  }

  const [school, compulsoryItems, otherItems, scheduleItems, terms] = await Promise.all([
    prisma.school.findUnique({ where: { id: profile.schoolId } }),
    paymentClient.feeItemCatalog.findMany({
      where: {
        schoolId: profile.schoolId,
        type: "COMPULSORY",
      },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
    }),
    paymentClient.feeItemCatalog.findMany({
      where: {
        schoolId: profile.schoolId,
        type: "OTHER",
      },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
    }),
    paymentClient.feeScheduleItem.findMany({
      where: {
        schoolId: profile.schoolId,
      },
      include: {
        feeSchedule: true,
        feeItemCatalog: true,
      },
      orderBy: [{ feeSchedule: { createdAt: "desc" } }, { feeItemCatalog: { priority: "asc" } }],
      take: 200,
    }),
    prisma.term.findMany({
      where: { schoolId: profile.schoolId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  if (!school) {
    throw new Error("School not found.");
  }

  const activeTerm = terms.find((term) => term.isActive);

  return (
    <>
      <section className="section-panel space-y-3">
        <div>
          <p className="section-kicker">Payments</p>
          <h1 className="section-title">Settings</h1>
          <p className="section-subtle">Configure settlement details and payment defaults.</p>
        </div>

        <form action={updatePaymentSettingsAction} className="grid gap-2 md:grid-cols-4">
          <label className="space-y-1">
            <span className="field-label">Processing Fee (%)</span>
            <input className="input" name="processingFeePercent" type="number" min={0} max={20} defaultValue={school.processingFeePercent} required />
          </label>
          <label className="space-y-1">
            <span className="field-label">Currency</span>
            <input className="input" name="currency" defaultValue={school.currency} required />
          </label>
          <label className="space-y-1">
            <span className="field-label">Settlement Bank</span>
            <input className="input" name="settlementBankName" defaultValue={school.settlementBankName ?? ""} />
          </label>
          <label className="space-y-1">
            <span className="field-label">Account Name</span>
            <input className="input" name="settlementAccountName" defaultValue={school.settlementAccountName ?? ""} />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="field-label">Account Number</span>
            <input className="input" name="settlementAccountNumber" defaultValue={school.settlementAccountNumber ?? ""} />
          </label>
          <div className="self-end md:col-span-2">
            <button className="btn btn-primary" type="submit">
              Save Payment Settings
            </button>
          </div>
        </form>
      </section>

      <section className="section-panel space-y-3">
        <h2 className="section-heading">Fee Catalog</h2>
        <form action={upsertFeeCatalogAction} className="grid gap-2 md:grid-cols-7">
          <label className="space-y-1">
            <span className="field-label">Type</span>
            <select name="type" className="select" defaultValue="COMPULSORY">
              <option value="COMPULSORY">Compulsory</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="field-label">Name</span>
            <input name="name" className="input" required />
          </label>
          <label className="space-y-1">
            <span className="field-label">Category</span>
            <input name="category" className="input" />
          </label>
          <label className="space-y-1">
            <span className="field-label">Amount</span>
            <input name="amount" className="input" type="number" min={0} step="0.01" required />
          </label>
          <label className="space-y-1">
            <span className="field-label">Priority</span>
            <input name="priority" className="input" type="number" min={1} max={999} defaultValue={100} required />
          </label>
          <label className="space-y-1">
            <span className="field-label">Allow Qty</span>
            <select name="allowQuantity" className="select" defaultValue="off">
              <option value="off">No</option>
              <option value="on">Yes</option>
            </select>
          </label>
          <div className="self-end">
            <button className="btn btn-primary" type="submit">
              Add Fee Item
            </button>
          </div>
        </form>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="table-wrap">
            <h3 className="section-subtle">Compulsory Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Priority</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {compulsoryItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{toNumber(item.amount).toFixed(2)}</td>
                    <td>{item.priority}</td>
                    <td>
                      <form action={deleteFeeCatalogAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button className="btn btn-danger" type="submit">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {compulsoryItems.length === 0 && (
                  <tr>
                    <td colSpan={4}>No compulsory items yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-wrap">
            <h3 className="section-subtle">Other Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Qty?</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {otherItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{toNumber(item.amount).toFixed(2)}</td>
                    <td>{item.allowQuantity ? "Yes" : "No"}</td>
                    <td>
                      <form action={deleteFeeCatalogAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button className="btn btn-danger" type="submit">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {otherItems.length === 0 && (
                  <tr>
                    <td colSpan={4}>No optional items yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section-panel space-y-3">
        <h2 className="section-heading">Compulsory Fee Schedule</h2>
        <form action={upsertFeeScheduleAction} className="grid gap-2 md:grid-cols-6">
          <label className="space-y-1">
            <span className="field-label">Class</span>
            <input name="className" className="input" placeholder="JSS 1" required />
          </label>
          <label className="space-y-1">
            <span className="field-label">Session</span>
            <input
              name="sessionLabel"
              className="input"
              placeholder="2025/2026"
              defaultValue={activeTerm?.sessionLabel ?? ""}
              required
            />
          </label>
          <label className="space-y-1">
            <span className="field-label">Term</span>
            <input name="termLabel" className="input" placeholder="1st Term" defaultValue={activeTerm?.termLabel ?? ""} required />
          </label>
          <label className="space-y-1">
            <span className="field-label">Compulsory Item</span>
            <select name="feeItemCatalogId" className="select" required>
              <option value="">Select fee item</option>
              {compulsoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="field-label">Amount</span>
            <input name="amount" className="input" type="number" min={0} step="0.01" required />
          </label>
          <div className="self-end">
            <button className="btn btn-primary" type="submit">
              Add to Schedule
            </button>
          </div>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Session</th>
                <th>Term</th>
                <th>Item</th>
                <th>Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {scheduleItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.feeSchedule.className}</td>
                  <td>{item.feeSchedule.sessionLabel}</td>
                  <td>{item.feeSchedule.termLabel}</td>
                  <td>{item.feeItemCatalog.name}</td>
                  <td>{toNumber(item.amount).toFixed(2)}</td>
                  <td>
                    <form action={deleteFeeScheduleItemAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <button className="btn btn-danger" type="submit">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {scheduleItems.length === 0 && (
                <tr>
                  <td colSpan={6}>No fee schedule rows yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
