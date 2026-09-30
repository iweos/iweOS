import SchoolResultsView from "./SchoolResultsView";
import { prisma } from "@/lib/server/prisma";
import { schoolResultTracking } from "@/lib/server/school-result-tracking";
export default async function SchoolResults({ schoolId, params }: { schoolId: string; params: Record<string, string | undefined> }) {
  const terms = await prisma.term.findMany({ where: { schoolId }, orderBy: [{ isActive: "desc" }, { createdAt: "desc" }] });
  const term = params.termId ? terms.find(t => t.id === params.termId) : terms[0];
  const classes = await prisma.class.findMany({ where: { schoolId }, orderBy: { name: "asc" } });
  const classId = classes.find(c => c.id === params.classId)?.id;
  const tracking = term ? await schoolResultTracking(schoolId, term.id, classId) : null;
  return <SchoolResultsView schoolId={schoolId} params={params} terms={terms} classes={classes} term={term} classId={classId} tracking={tracking}/>;
}
