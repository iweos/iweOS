import { addTeacherAction, setProfileRoleAction, toggleTeacherStatusAction } from "@/lib/server/admin-actions";
import { Table, TableWrap, Td, Th } from "@/components/admin/Table";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { ProfileRole } from "@prisma/client";
import Link from "next/link";
import StatCard from "@/components/admin/ui/StatCard";

export default async function AdminTeachersPage() {
  const profile = await requireRole("admin");

  const [teachers, admins] = await Promise.all([
    prisma.profile.findMany({
      where: {
        schoolId: profile.schoolId,
        role: ProfileRole.TEACHER,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.profile.findMany({
      where: {
        schoolId: profile.schoolId,
        role: ProfileRole.ADMIN,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter((teacher) => teacher.isActive).length;
  const linkedAccounts = teachers.filter((teacher) => Boolean(teacher.clerkUserId)).length;
  const pendingAccounts = totalTeachers - linkedAccounts;
  const totalAdmins = admins.length;

  return (
    <>
      <section className="card card-body d-grid gap-3">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
          <div>
            <p className="section-kicker">User Management</p>
            <h1 className="section-title">Teachers</h1>
            <p className="section-subtle">Add staff records before signup, then track activation and linked accounts.</p>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Link className="btn btn-secondary" href="/app/admin/assignments/teacher-classes">
              Teacher-Class
            </Link>
            <Link className="btn btn-secondary" href="/app/admin/dashboard">
              Dashboard
            </Link>
          </div>
        </div>
        <div className="row g-3">
          <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
            <StatCard label="Total Teachers" value={totalTeachers} icon="fas fa-chalkboard-teacher" cardVariant="secondary" />
          </div>
          <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
            <StatCard label="Active Teachers" value={activeTeachers} icon="fas fa-user-check" cardVariant="success" />
          </div>
          <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
            <StatCard label="Linked Accounts" value={linkedAccounts} icon="fas fa-link" cardVariant="info" />
          </div>
          <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
            <StatCard label="Pending Link" value={pendingAccounts} icon="fas fa-user-clock" cardVariant="warning" />
          </div>
          <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
            <StatCard label="Admins" value={totalAdmins} icon="fas fa-user-shield" cardVariant="primary" />
          </div>
        </div>
        <form action={addTeacherAction} className="grid gap-3 md:grid-cols-3">
          <label className="d-grid gap-1">
            <span className="field-label">Full Name</span>
            <input name="fullName" className="form-control" required />
          </label>
          <label className="d-grid gap-1">
            <span className="field-label">Email</span>
            <input name="email" type="email" className="form-control" required />
          </label>
          <div className="align-self-end">
            <button className="btn btn-primary" type="submit">
              Add / Update Teacher
            </button>
          </div>
        </form>
        <p className="section-subtle">
          Add teachers before they sign up. When they sign up with the same email, their Clerk user is linked.
        </p>
      </section>

      <section className="card card-body">
        <h2 className="section-heading">Teacher Directory</h2>
        <TableWrap className="mt-2">
          <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Linked Account</Th>
              <Th>Status</Th>
              <Th>Role</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id}>
                <Td>{teacher.fullName}</Td>
                <Td>{teacher.email}</Td>
                <Td>{teacher.clerkUserId ? "Linked" : "Pending signup"}</Td>
                <Td>{teacher.isActive ? "Active" : "Inactive"}</Td>
                <Td>Teacher</Td>
                <Td>
                  <div className="d-flex flex-wrap gap-1">
                    <form action={toggleTeacherStatusAction}>
                      <input type="hidden" name="teacherId" value={teacher.id} />
                      <button className="btn btn-secondary" type="submit">
                        {teacher.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <form action={setProfileRoleAction}>
                      <input type="hidden" name="profileId" value={teacher.id} />
                      <input type="hidden" name="targetRole" value="admin" />
                      <button className="btn btn-primary" type="submit">
                        Make Admin
                      </button>
                    </form>
                  </div>
                </Td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <Td colSpan={6}>No teachers yet.</Td>
              </tr>
            )}
          </tbody>
          </Table>
        </TableWrap>
      </section>

      <section className="card card-body">
        <h2 className="section-heading">Admin Privileges</h2>
        <TableWrap className="mt-2">
          <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Linked Account</Th>
              <Th>Status</Th>
              <Th>Role</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id}>
                <Td>{admin.fullName}</Td>
                <Td>{admin.email}</Td>
                <Td>{admin.clerkUserId ? "Linked" : "Pending signup"}</Td>
                <Td>{admin.isActive ? "Active" : "Inactive"}</Td>
                <Td>Admin</Td>
                <Td>
                  {admin.id === profile.id ? (
                    <span className="section-subtle">Current account</span>
                  ) : (
                    <form action={setProfileRoleAction}>
                      <input type="hidden" name="profileId" value={admin.id} />
                      <input type="hidden" name="targetRole" value="teacher" />
                      <button className="btn btn-danger" type="submit">
                        Remove Admin
                      </button>
                    </form>
                  )}
                </Td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <Td colSpan={6}>No admins found.</Td>
              </tr>
            )}
          </tbody>
          </Table>
        </TableWrap>
      </section>
    </>
  );
}
