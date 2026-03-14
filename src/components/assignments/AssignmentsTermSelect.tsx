"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TermOption = {
  id: string;
  sessionLabel: string;
  termLabel: string;
  isActive: boolean;
};

type AssignmentsTermSelectProps = {
  terms: TermOption[];
  selectedTermId: string;
};

export default function AssignmentsTermSelect({ terms, selectedTermId }: AssignmentsTermSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(nextTermId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("termId", nextTermId);
    params.delete("status");
    params.delete("message");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      className="form-select form-select-sm d-inline-block w-auto ms-2"
      value={selectedTermId}
      onChange={(event) => handleChange(event.target.value)}
      aria-label="Select enrollment term"
    >
      {terms.map((term) => (
        <option key={term.id} value={term.id}>
          {term.sessionLabel} {term.termLabel} {term.isActive ? "(Active)" : ""}
        </option>
      ))}
    </select>
  );
}
