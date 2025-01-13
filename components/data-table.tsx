import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[] | undefined;
  pageSize?: number;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  footerContent?: React.ReactNode;
}

export function DataTable<TData>({
  columns,
  data,
  pageSize = 10,
  emptyState,
  loadingState,
  footerContent,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const defaultLoadingState = (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  );

  const defaultEmptyState = (
    <div className="flex flex-col items-center justify-center gap-2">
      <p className="text-sm text-muted-foreground">No results found</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 rounded-lg border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 overflow-hidden shadow-sm">
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="sticky top-0 bg-card hover:bg-muted/50 z-10 border-b">
              {table.getHeaderGroups()[0].headers.map((header, i) => (
                <TableHead
                  key={i}
                  className={`bg-card h-10 font-medium text-primary ${
                    i === 0 ? "rounded-tl-lg" : ""
                  } ${
                    i === table.getHeaderGroups()[0].headers.length - 1
                      ? "rounded-tr-lg"
                      : ""
                  }`}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data === undefined ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-[calc(100vh-20rem)] text-center"
                >
                  {loadingState || defaultLoadingState}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-[calc(100vh-20rem)] text-center"
                >
                  {emptyState || defaultEmptyState}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/30 transition-colors border-b border-border/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-foreground/90">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-auto border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 rounded-b-lg">
        <div className="px-4 py-2 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {data?.length} total results
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 hover:bg-primary/10 hover:text-primary"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 hover:bg-primary/10 hover:text-primary"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
        {footerContent && (
          <div className="border-t border-border/50">
            <div className="p-4 flex flex-col gap-4">{footerContent}</div>
          </div>
        )}
      </div>
    </div>
  );
}
