import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef as TanStackColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Box,
  Typography,
  TableSortLabel,
  IconButton,
  TablePagination,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import type { ColumnDef, TableProps, CellContext } from '@/types/table';

interface ResponsiveTableProps<TData> extends TableProps<TData> {
  className?: string;
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

function convertColumns<TData>(columns: ColumnDef<TData>[]): TanStackColumnDef<TData, unknown>[] {
  return columns.map((col) => {
    const isVirtualColumn = col.accessorKey === 'actions' || col.accessorKey === 'status';

    const tanStackCol: TanStackColumnDef<TData, unknown> = {
      id: col.accessorKey as string,
      header: col.header,
      size: col.size ?? col.minWidth ?? 150,
      minSize: col.minWidth ?? 50,
      maxSize: col.maxWidth ?? 500,
      enableSorting: col.enableSorting !== false && !isVirtualColumn,
    };

    if (!isVirtualColumn) {
      (tanStackCol as unknown as Record<string, unknown>).accessorKey = col.accessorKey as string;
    }

    if (col.cell) {
      tanStackCol.cell = (info) => {
        const ctx: CellContext<TData> = {
          row: {
            original: info.row.original as TData,
            id: info.row.id,
            index: info.row.index,
          },
          getValue: () => info.getValue(),
          column: { id: info.column.id },
          table: info.table,
        };
        return col.cell!(ctx);
      };
    }

    return tanStackCol;
  });
}

function TablePaginationActions({
  count,
  page,
  rowsPerPage,
  onPageChange,
}: {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
}) {
  const totalPages = Math.ceil(count / rowsPerPage);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <IconButton
        onClick={(e) => onPageChange(e, 0)}
        disabled={page === 0}
        aria-label="first page"
        size="small"
      >
        <FirstPageIcon />
      </IconButton>
      <IconButton
        onClick={(e) => onPageChange(e, page - 1)}
        disabled={page === 0}
        aria-label="previous page"
        size="small"
      >
        <KeyboardArrowLeft />
      </IconButton>
      <IconButton
        onClick={(e) => onPageChange(e, page + 1)}
        disabled={page >= totalPages - 1}
        aria-label="next page"
        size="small"
      >
        <KeyboardArrowRight />
      </IconButton>
      <IconButton
        onClick={(e) => onPageChange(e, totalPages - 1)}
        disabled={page >= totalPages - 1}
        aria-label="last page"
        size="small"
      >
        <LastPageIcon />
      </IconButton>
    </Box>
  );
}

export function ResponsiveTable<TData>({
  data,
  className = '',
  columns: columnDefs,
  loading = false,
  initialPageSize = 10,
  enableSorting = true,
  enablePagination = true,
}: ResponsiveTableProps<TData>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const tanStackColumns = useMemo(() => convertColumns(columnDefs), [columnDefs]);

  const table = useReactTable({
    data,
    columns: tanStackColumns,
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting && { getSortedRowModel: getSortedRowModel() }),
    ...(enablePagination && { getPaginationRowModel: getPaginationRowModel() }),
    initialState: {
      pagination: { pageSize: initialPageSize },
    },
  });

  const headerGroups = table.getHeaderGroups();
  const rows = enablePagination ? table.getPaginationRowModel().rows : table.getRowModel().rows;
  const { pageIndex, pageSize } = table.getState().pagination;
  const sorting = table.getState().sorting as SortingState;

  const handleSort = (columnId: string) => {
    const column = table.getColumn(columnId);
    if (!column) return;
    column.toggleSorting(undefined, false);
  };

  const handlePageChange = (_event: React.MouseEvent | null, newPage: number) => {
    table.setPageIndex(newPage);
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    table.setPageSize(newSize);
  };

  const priorityColumns = isMobile
    ? columnDefs.filter((col) => {
        const priority =
          col.priority ??
          (col.accessorKey === 'actions'
            ? 3
            : col.accessorKey === 'status' || col.accessorKey === 'isDeleted'
              ? 2
              : 1);
        return priority <= 1;
      })
    : columnDefs;

  const visibleHeaderIds = new Set(priorityColumns.map((col) => col.accessorKey as string));

  return (
    <Box className={className} sx={{ width: '100%' }}>
      {loading && <LinearProgress />}

      <TableContainer
        sx={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            {headerGroups.map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  if (isMobile && !visibleHeaderIds.has(header.id)) return null;

                  const colDef = columnDefs.find((c) => c.accessorKey === header.id);
                  const align = colDef?.headerAlign ?? colDef?.align ?? 'left';
                  const width = header.getSize();

                  return (
                    <TableCell
                      key={header.id}
                      align={align}
                      sx={{
                        width,
                        minWidth: colDef?.minWidth ?? 80,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        color: theme.palette.text.secondary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {enableSorting && header.column.getCanSort() ? (
                        <TableSortLabel
                          active={sorting.some((s) => s.id === header.id)}
                          direction={sorting.find((s) => s.id === header.id)?.desc ? 'desc' : 'asc'}
                          onClick={() => handleSort(header.id)}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableSortLabel>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {rows.length === 0 && !loading ? (
              <TableRow>
                <TableCell
                  colSpan={columnDefs.length}
                  align="center"
                  sx={{ py: 6, color: 'text.secondary' }}
                >
                  <Typography variant="body2">Tidak ada data</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    '&:nth-of-type(even)': { backgroundColor: theme.palette.action.hover },
                    '&:hover': { backgroundColor: theme.palette.action.selected },
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const colDef = columnDefs.find((c) => c.accessorKey === cell.column.id);

                    if (isMobile && !visibleHeaderIds.has(cell.column.id)) return null;

                    const align = colDef?.align ?? 'left';

                    return (
                      <TableCell key={cell.id} align={align}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {enablePagination && (
        <TablePagination
          component="div"
          count={data.length}
          page={pageIndex}
          rowsPerPage={pageSize}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handlePageSizeChange}
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
          ActionsComponent={TablePaginationActions}
          labelRowsPerPage="Baris per halaman:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`
          }
        />
      )}
    </Box>
  );
}
