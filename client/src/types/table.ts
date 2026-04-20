// client/src/types/table.ts
// Compatible with TanStack Table v8 column definitions.

export interface CellContext<TData> {
  row: { original: TData; id: string; index: number };
  getValue: () => unknown;
  column: { id: string };
  table: unknown;
}

export interface ColumnDef<TData> {
  accessorKey: string;
  header: string;
  width?: number;
  size?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  priority?: number;
  cell?: (ctx: CellContext<TData>) => React.ReactNode;
  enableSorting?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
}

export interface SortingState {
  id: string;
  desc: boolean;
}

export interface TableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  loading?: boolean;
  initialPageSize?: number;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
}
