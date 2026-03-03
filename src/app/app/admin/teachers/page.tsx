import { addTeacherAction, setProfileRoleAction, toggleTeacherStatusAction } from "@/lib/server/admin-actions";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { ProfileRole } from "@prisma/client";
import Link from "next/link";

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
      <section className="section-panel space-y-4">
        <div className="management-header">
          <div>
            <p className="section-kicker">User Management</p>
            <h1 className="section-title">Teachers</h1>
            <p className="section-subtle">Add staff records before signup, then track activation and linked accounts.</p>
          </div>
          <div className="management-actions">
            <Link className="btn btn-muted" href="/app/admin/assignments/teacher-classes">
              Teacher-Class
            </Link>
            <Link className="btn btn-muted" href="/app/admin/dashboard">
              Dashboard
            </Link>
          </div>
        </div>
        <div className="management-stats">
          <article className="metric-card">
            <p className="metric-label">Total Teachers</p>
            <p className="metric-value">{totalTeachers}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Active Teachers</p>
            <p className="metric-value">{activeTeachers}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Linked Accounts</p>
            <p className="metric-value">{linkedAccounts}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Pending Link</p>
            <p className="metric-value">{pendingAccounts}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Admins</p>
            <p className="metric-value">{totalAdmins}</p>
          </article>
        </div>
        <form action={addTeacherAction} className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="field-label">Full Name</span>
            <input name="fullName" className="input" required />
          </label>
          <label className="space-y-1">
            <span className="field-label">Email</span>
            <input name="email" type="email" className="input" required />
          </label>
          <div className="self-end">
            <button className="btn btn-primary" type="submit">
              Add / Update Teacher
            </button>
          </div>
        </form>
        <p className="section-subtle">
          Add teachers before they sign up. When they sign up with the same email, their Clerk user is linked.
        </p>
      </section>

      <section className="section-panel table-wrap">
        <h2 className="section-heading">Teacher Directory</h2>
        <table className="mt-2">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Linked Account</th>
              <th>Status</th>
              <th>Role</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td>{teacher.fullName}</td>
                <td>{teacher.email}</td>
                <td>{teacher.clerkUserId ? "Linked" : "Pending signup"}</td>
                <td>{teacher.isActive ? "Active" : "Inactive"}</td>
                <td>Teacher</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    <form action={toggleTeacherStatusAction}>
                      <input type="hidden" name="teacherId" value={teacher.id} />
                      <button className="btn btn-muted" type="submit">
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
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={6}>No teachers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="section-panel table-wrap">
        <h2 className="section-heading">Admin Privileges</h2>
        <table className="mt-2">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Linked Account</th>
              <th>Status</th>
              <th>Role</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td>{admin.fullName}</td>
                <td>{admin.email}</td>
                <td>{admin.clerkUserId ? "Linked" : "Pending signup"}</td>
                <td>{admin.isActive ? "Active" : "Inactive"}</td>
                <td>Admin</td>
                <td>
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
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan={6}>No admins found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
