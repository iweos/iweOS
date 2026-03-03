import type { ReactNode } from "react";

type TableProps = {
  className?: string;
  children: ReactNode;
};

export function Table({ className = "", children }: TableProps) {
  return <table className={`admin-ui-table ${className}`}>{children}</table>;
}

export function TableWrap({ className = "", children }: TableProps) {
  return <div className={`admin-ui-table-wrap ${className}`}>{children}</div>;
}

export function THead({ className = "", children }: TableProps) {
  return <thead className={`admin-ui-thead ${className}`}>{children}</thead>;
}

export function Th({ className = "", children }: TableProps) {
  return <th className={`admin-ui-th ${className}`}>{children}</th>;
}

export function Td({ className = "", children }: TableProps) {
  return <td className={`admin-ui-td ${className}`}>{children}</td>;
}
