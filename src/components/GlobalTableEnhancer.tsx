"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const PAGE_SIZES = [10, 25, 50, 100];
const TARGET_SELECTOR = "table.display.table-striped.table-hover";

function visiblePages(totalPages: number, currentPage: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, -1, totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function enhanceTable(table: HTMLTableElement, index: number) {
  if (table.dataset.iweTableEnhanced === "true") {
    return;
  }
  if (table.dataset.iweTableEnhancer === "off") {
    return;
  }
  if (table.closest(".dataTables_wrapper")) {
    return;
  }

  const tbody = table.tBodies[0];
  const theadRow = table.tHead?.rows[0];
  if (!tbody || !theadRow) {
    return;
  }

  const responsiveWrap = table.closest(".table-responsive") as HTMLElement | null;
  const tableWrap = responsiveWrap ?? table.parentElement;
  if (!tableWrap || !tableWrap.parentElement) {
    return;
  }

  const rows = Array.from(tbody.querySelectorAll("tr"));
  const headerCount = theadRow.cells.length;
  const currentNoDataRow =
    rows.find((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length !== 1) return false;
      return (cells[0]?.colSpan ?? 0) >= headerCount;
    }) ?? null;

  const hasDataRows = currentNoDataRow ? rows.length > 1 : rows.length > 0;
  if (!hasDataRows) {
    return;
  }

  table.dataset.iweTableEnhanced = "true";
  if (!table.id) {
    table.id = `iwe-table-${index + 1}`;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "dataTables_wrapper dt-bootstrap5 iwe-data-table";
  wrapper.id = `${table.id}_wrapper`;

  const topRow = document.createElement("div");
  topRow.className = "row mb-3";

  const lengthCol = document.createElement("div");
  lengthCol.className = "col-sm-12 col-md-6";
  const lengthBox = document.createElement("div");
  lengthBox.className = "dataTables_length";
  lengthBox.id = `${table.id}_length`;
  const lengthLabel = document.createElement("label");
  lengthLabel.htmlFor = `${table.id}_size`;
  lengthLabel.append("Show ");
  const lengthSelect = document.createElement("select");
  lengthSelect.id = `${table.id}_size`;
  lengthSelect.className = "form-select form-select-sm";
  for (const size of PAGE_SIZES) {
    const option = document.createElement("option");
    option.value = size.toString();
    option.textContent = size.toString();
    lengthSelect.appendChild(option);
  }
  lengthSelect.value = "10";
  lengthLabel.appendChild(lengthSelect);
  lengthLabel.append(" entries");
  lengthBox.appendChild(lengthLabel);
  lengthCol.appendChild(lengthBox);

  const filterCol = document.createElement("div");
  filterCol.className = "col-sm-12 col-md-6";
  const filterBox = document.createElement("div");
  filterBox.className = "dataTables_filter text-md-end mt-2 mt-md-0";
  filterBox.id = `${table.id}_filter`;
  const filterLabel = document.createElement("label");
  filterLabel.htmlFor = `${table.id}_search`;
  filterLabel.append("Search: ");
  const filterInput = document.createElement("input");
  filterInput.id = `${table.id}_search`;
  filterInput.type = "search";
  filterInput.className = "form-control form-control-sm";
  filterLabel.appendChild(filterInput);
  filterBox.appendChild(filterLabel);
  filterCol.appendChild(filterBox);

  topRow.append(lengthCol, filterCol);

  const bottomRow = document.createElement("div");
  bottomRow.className = "row mt-3";

  const infoCol = document.createElement("div");
  infoCol.className = "col-sm-12 col-md-5";
  const infoBox = document.createElement("div");
  infoBox.className = "dataTables_info";
  infoBox.id = `${table.id}_info`;
  infoCol.appendChild(infoBox);

  const paginateCol = document.createElement("div");
  paginateCol.className = "col-sm-12 col-md-7";
  const paginateWrap = document.createElement("div");
  paginateWrap.className = "dataTables_paginate paging_simple_numbers d-flex justify-content-md-end mt-2 mt-md-0";
  paginateWrap.id = `${table.id}_paginate`;
  const paginateList = document.createElement("ul");
  paginateList.className = "pagination mb-0";
  paginateWrap.appendChild(paginateList);
  paginateCol.appendChild(paginateWrap);

  bottomRow.append(infoCol, paginateCol);

  tableWrap.parentElement.insertBefore(wrapper, tableWrap);
  wrapper.append(topRow, tableWrap, bottomRow);

  let currentPage = 1;
  let pageSize = Number(lengthSelect.value);
  let query = "";
  const noMatchRowId = `${table.id}_no_match_row`;

  function getDataRows() {
    return Array.from(tbody.querySelectorAll("tr")).filter((row) => row.id !== noMatchRowId);
  }

  function ensureNoMatchRow() {
    const existing = tbody.querySelector<HTMLTableRowElement>(`#${noMatchRowId}`);
    if (existing) {
      return existing;
    }
    const row = document.createElement("tr");
    row.id = noMatchRowId;
    row.style.display = "none";
    const cell = document.createElement("td");
    cell.colSpan = headerCount;
    cell.className = "text-muted";
    cell.textContent = "No matching entries.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return row;
  }

  function renderPagination(totalPages: number) {
    paginateList.innerHTML = "";

    const previousLi = document.createElement("li");
    previousLi.className = `paginate_button page-item previous ${currentPage === 1 ? "disabled" : ""}`.trim();
    const previousBtn = document.createElement("button");
    previousBtn.type = "button";
    previousBtn.className = "page-link";
    previousBtn.textContent = "Previous";
    previousBtn.disabled = currentPage === 1;
    previousBtn.addEventListener("click", () => {
      currentPage = Math.max(1, currentPage - 1);
      render();
    });
    previousLi.appendChild(previousBtn);
    paginateList.appendChild(previousLi);

    for (const page of visiblePages(totalPages, currentPage)) {
      const li = document.createElement("li");
      li.className = `paginate_button page-item ${page === currentPage ? "active" : ""}`.trim();

      if (page === -1) {
        li.className = "paginate_button page-item disabled";
        const span = document.createElement("span");
        span.className = "page-link";
        span.textContent = "...";
        li.appendChild(span);
      } else {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "page-link";
        button.textContent = page.toString();
        button.addEventListener("click", () => {
          currentPage = page;
          render();
        });
        li.appendChild(button);
      }

      paginateList.appendChild(li);
    }

    const nextLi = document.createElement("li");
    nextLi.className = `paginate_button page-item next ${currentPage === totalPages ? "disabled" : ""}`.trim();
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "page-link";
    nextBtn.textContent = "Next";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => {
      currentPage = Math.min(totalPages, currentPage + 1);
      render();
    });
    nextLi.appendChild(nextBtn);
    paginateList.appendChild(nextLi);
  }

  function render() {
    const allRows = getDataRows();
    const matchingRows = allRows.filter((row) => normalize(row.textContent ?? "").includes(query));
    const totalEntries = matchingRows.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    for (const row of allRows) {
      row.style.display = "none";
    }

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageRows = matchingRows.slice(start, end);
    for (const row of pageRows) {
      row.style.display = "";
    }

    const noMatchRow = ensureNoMatchRow();
    noMatchRow.style.display = totalEntries === 0 ? "" : "none";

    const entryStart = totalEntries === 0 ? 0 : start + 1;
    const entryEnd = totalEntries === 0 ? 0 : Math.min(end, totalEntries);
    infoBox.textContent = `Showing ${entryStart} to ${entryEnd} of ${totalEntries} entries${
      query ? ` (filtered from ${allRows.length} total entries)` : ""
    }`;

    renderPagination(totalPages);
  }

  filterInput.addEventListener("input", () => {
    query = normalize(filterInput.value);
    currentPage = 1;
    render();
  });

  lengthSelect.addEventListener("change", () => {
    pageSize = Number(lengthSelect.value);
    currentPage = 1;
    render();
  });

  render();
}

export default function GlobalTableEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    const run = () => {
      const tables = Array.from(document.querySelectorAll<HTMLTableElement>(TARGET_SELECTOR));
      tables.forEach((table, index) => enhanceTable(table, index));
    };

    let rafId = 0;
    let timeoutId = 0;
    let disposed = false;

    const schedule = () => {
      if (disposed) {
        return;
      }
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(run);
    };

    schedule();
    timeoutId = window.setTimeout(schedule, 120);

    const observer = new MutationObserver((records) => {
      const shouldRun = records.some((record) =>
        Array.from(record.addedNodes).some((node) => {
          if (!(node instanceof HTMLElement)) {
            return false;
          }
          return node.matches(TARGET_SELECTOR) || Boolean(node.querySelector(TARGET_SELECTOR));
        }),
      );
      if (shouldRun) {
        schedule();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      disposed = true;
      observer.disconnect();
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}
