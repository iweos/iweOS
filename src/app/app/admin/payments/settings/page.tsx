import Button from "@/components/admin/ui/Button";
import Card from "@/components/admin/Card";
import Input from "@/components/admin/ui/Input";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";
import Select from "@/components/admin/ui/Select";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
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
      <Section>
        <PageHeader
          title="Payments Setup Required"
          subtitle="Payments tables are not available yet in the current Prisma client."
        />
        <Card>
          <p className="small text-muted">
            Run <code>npm run prisma:generate && npm run prisma:migrate</code>, then restart{" "}
            <code>npm run dev</code>.
          </p>
        </Card>
      </Section>
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
    <Section>
      <PageHeader title="Payment Settings" subtitle="Configure settlement details, fee catalog, and compulsory schedule." />

      <Card title="Settlement & Defaults">
        <form action={updatePaymentSettingsAction} className="grid gap-3 md:grid-cols-4">
          <label className="d-grid gap-1">
            <span className="field-label">Processing Fee (%)</span>
            <Input name="processingFeePercent" type="number" min={0} max={20} defaultValue={school.processingFeePercent} required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Currency</span>
            <Input name="currency" defaultValue={school.currency} required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Settlement Bank</span>
            <Input name="settlementBankName" defaultValue={school.settlementBankName ?? ""} />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Account Name</span>
            <Input name="settlementAccountName" defaultValue={school.settlementAccountName ?? ""} />
          </label>
          <label className="d-grid gap-1 md:col-span-2">
            <span className="field-label">Account Number</span>
            <Input name="settlementAccountNumber" defaultValue={school.settlementAccountNumber ?? ""} />
          </label>
          <div className="align-self-end md:col-span-2">
            <Button variant="primary" type="submit">
              Save Payment Settings
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Fee Catalog" subtitle="Maintain compulsory and optional fee items.">
        <form action={upsertFeeCatalogAction} className="grid gap-3 xl:grid-cols-7">
          <label className="d-grid gap-1">
            <span className="field-label">Type</span>
            <Select name="type" defaultValue="COMPULSORY">
              <option value="COMPULSORY">Compulsory</option>
              <option value="OTHER">Other</option>
            </Select>
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Name</span>
            <Input name="name" required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Category</span>
            <Input name="category" />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Amount</span>
            <Input name="amount" type="number" min={0} step="0.01" required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Priority</span>
            <Input name="priority" type="number" min={1} max={999} defaultValue={100} required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Allow Qty</span>
            <Select name="allowQuantity" defaultValue="off">
              <option value="off">No</option>
              <option value="on">Yes</option>
            </Select>
          </label>
          <div className="align-self-end">
            <Button variant="primary" type="submit">
              Add Fee Item
            </Button>
          </div>
        </form>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Compulsory Items">
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Amount</Th>
                    <Th>Priority</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {compulsoryItems.map((item) => (
                    <tr key={item.id}>
                      <Td>{item.name}</Td>
                      <Td>{toNumber(item.amount).toFixed(2)}</Td>
                      <Td>{item.priority}</Td>
                      <Td>
                        <form action={deleteFeeCatalogAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <Button variant="danger" size="sm" type="submit">
                            Delete
                          </Button>
                        </form>
                      </Td>
                    </tr>
                  ))}
                  {compulsoryItems.length === 0 ? (
                    <tr>
                      <Td className="text-muted" colSpan={4}>
                        No compulsory items yet.
                      </Td>
                    </tr>
                  ) : null}
                </tbody>
              </Table>
            </TableWrap>
          </Card>

          <Card title="Other Items">
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Amount</Th>
                    <Th>Qty?</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {otherItems.map((item) => (
                    <tr key={item.id}>
                      <Td>{item.name}</Td>
                      <Td>{toNumber(item.amount).toFixed(2)}</Td>
                      <Td>{item.allowQuantity ? "Yes" : "No"}</Td>
                      <Td>
                        <form action={deleteFeeCatalogAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <Button variant="danger" size="sm" type="submit">
                            Delete
                          </Button>
                        </form>
                      </Td>
                    </tr>
                  ))}
                  {otherItems.length === 0 ? (
                    <tr>
                      <Td className="text-muted" colSpan={4}>
                        No optional items yet.
                      </Td>
                    </tr>
                  ) : null}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        </div>
      </Card>

      <Card title="Compulsory Fee Schedule" subtitle="Assign compulsory fee items to class/session/term combinations.">
        <form action={upsertFeeScheduleAction} className="grid gap-3 xl:grid-cols-6">
          <label className="d-grid gap-1">
            <span className="field-label">Class</span>
            <Input name="className" placeholder="JSS 1" required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Session</span>
            <Input name="sessionLabel" placeholder="2025/2026" defaultValue={activeTerm?.sessionLabel ?? ""} required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Term</span>
            <Input name="termLabel" placeholder="1st Term" defaultValue={activeTerm?.termLabel ?? ""} required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Compulsory Item</span>
            <Select name="feeItemCatalogId" required>
              <option value="">Select fee item</option>
              {compulsoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Amount</span>
            <Input name="amount" type="number" min={0} step="0.01" required />
          </label>
          <div className="align-self-end">
            <Button variant="primary" type="submit">
              Add to Schedule
            </Button>
          </div>
        </form>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Class</Th>
                <Th>Session</Th>
                <Th>Term</Th>
                <Th>Item</Th>
                <Th>Amount</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {scheduleItems.map((item) => (
                <tr key={item.id}>
                  <Td>{item.feeSchedule.className}</Td>
                  <Td>{item.feeSchedule.sessionLabel}</Td>
                  <Td>{item.feeSchedule.termLabel}</Td>
                  <Td>{item.feeItemCatalog.name}</Td>
                  <Td>{toNumber(item.amount).toFixed(2)}</Td>
                  <Td>
                    <form action={deleteFeeScheduleItemAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button variant="danger" size="sm" type="submit">
                        Remove
                      </Button>
                    </form>
                  </Td>
                </tr>
              ))}
              {scheduleItems.length === 0 ? (
                <tr>
                  <Td className="text-muted" colSpan={6}>
                    No fee schedule rows yet.
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </Section>
  );
}
