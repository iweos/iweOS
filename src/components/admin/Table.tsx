import type { ComponentPropsWithoutRef } from "react";

type DivProps = ComponentPropsWithoutRef<"div">;
type TableElProps = ComponentPropsWithoutRef<"table">;
type THeadProps = ComponentPropsWithoutRef<"thead">;
type ThProps = ComponentPropsWithoutRef<"th">;
type TdProps = ComponentPropsWithoutRef<"td">;

export function Table({ className = "", ...props }: TableElProps) {
  return <table className={`table ${className}`} {...props} />;
}

export default Table;

export function TableWrap({ className = "", ...props }: DivProps) {
  return <div className={`table-responsive ${className}`} {...props} />;
}

export function THead({ className = "", ...props }: THeadProps) {
  return <thead className={className} {...props} />;
}

export function Th({ className = "", ...props }: ThProps) {
  return <th className={className} {...props} />;
}

export function Td({ className = "", ...props }: TdProps) {
  return <td className={className} {...props} />;
}
