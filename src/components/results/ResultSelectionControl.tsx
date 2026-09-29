"use client";

import { useEffect, useRef, useState } from "react";

export default function ResultSelectionControl({ formId }: { formId: string }) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const selector = `input[data-result-select][form="${formId}"]`;
    const checkboxes = Array.from(document.querySelectorAll<HTMLInputElement>(selector));

    function updateSelection() {
      const selected = checkboxes.filter((checkbox) => checkbox.checked).length;
      setSelectedCount(selected);
      setTotalCount(checkboxes.length);
      if (selectAllRef.current) {
        selectAllRef.current.checked = checkboxes.length > 0 && selected === checkboxes.length;
        selectAllRef.current.indeterminate = selected > 0 && selected < checkboxes.length;
      }
    }

    checkboxes.forEach((checkbox) => checkbox.addEventListener("change", updateSelection));
    const frame = window.requestAnimationFrame(updateSelection);
    return () => {
      window.cancelAnimationFrame(frame);
      checkboxes.forEach((checkbox) => checkbox.removeEventListener("change", updateSelection));
    };
  }, [formId]);

  function toggleAll(checked: boolean) {
    const selector = `input[data-result-select][form="${formId}"]`;
    const checkboxes = Array.from(document.querySelectorAll<HTMLInputElement>(selector));
    checkboxes.forEach((checkbox) => {
      checkbox.checked = checked;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  return (
    <label className="result-select-all">
      <input ref={selectAllRef} type="checkbox" onChange={(event) => toggleAll(event.currentTarget.checked)} disabled={totalCount === 0} />
      <span>{selectedCount > 0 ? `${selectedCount} selected` : "All"}</span>
    </label>
  );
}
