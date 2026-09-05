"use client";

import { ChevronRight } from "lucide-react";
import { useFormStatus } from "react-dom";
import styles from "@/app/onboarding/onboarding.module.css";

type WorkspaceOptionButtonProps = {
  profileId: string;
  schoolName: string;
  role: "ADMIN" | "TEACHER";
};

export default function WorkspaceOptionButton({ profileId, schoolName, role }: WorkspaceOptionButtonProps) {
  const { pending, data } = useFormStatus();
  const selected = pending && data?.get("profileId") === profileId;
  return (
    <button className={styles.option} type="submit" name="profileId" value={profileId} disabled={pending} aria-busy={selected}>
      <span className={styles.schoolMark}>{schoolName.slice(0, 1).toUpperCase()}</span>
      <span className={styles.schoolCopy}>
        <strong>{schoolName}</strong>
        <small>{selected ? "Opening workspace..." : role === "ADMIN" ? "School administration" : "Teacher workspace"}</small>
      </span>
      <i className={role === "ADMIN" ? styles.adminRole : styles.teacherRole}>{role === "ADMIN" ? "Admin" : "Teacher"}</i>
      {selected ? <span className={styles.spinner} aria-hidden="true" /> : <ChevronRight className={styles.arrow} />}
    </button>
  );
}
