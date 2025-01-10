"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { downloadDefaultReactions } from "@/actions/default-reactions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ReactionDatabaseSchema } from "@/convex/schema";
import { useUser } from "@clerk/nextjs";
import Avatar from "boring-avatars";
import { useMutation, useQuery } from "convex/react";
import {
  Download,
  Loader2,
  MinusCircle,
  MoreHorizontal,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

type ReactionDB = z.infer<typeof ReactionDatabaseSchema> & {
  _id: Id<"reactionDatabases">;
};

export default function ReactionDBList() {
  const reactionDbs = useQuery(api.reactions.getAll, {});
  const remove = useMutation(api.reactions.remove);
  const { user } = useUser();

  const columns: ColumnDef<ReactionDB>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-4">
          <div className="text-foreground">{row.original.name}</div>
          {row.original.name.startsWith("Default") && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={async () => {
                    const { csv } = await downloadDefaultReactions(
                      row.original.ionMode
                    );
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `default-reactions-${row.original.ionMode}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Provides molecular mass and formula changes between substrates
                  and products for most metabolic reactions in the KEGG
                  database. Helps users further interpret unknown edges in MRMN.
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-4">
          <Avatar size={25} name={user?.username || ""} variant="marble" />
          <div className="text-foreground">{user?.username}</div>
        </div>
      ),
    },
    {
      accessorKey: "ionMode",
      header: "Ion Mode",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-4 text-foreground">
          <div className="flex items-center justify-center gap-4">
            {row.original.ionMode === "neg" ? (
              <>
                <MinusCircle size={14} className="text-foreground" />
                Negative
              </>
            ) : (
              <>
                <PlusCircle size={14} className="text-foreground" />
                Positive
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "_id",
      header: "",
      cell: ({ row }) => (
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xs">
                <MoreHorizontal className="h-4 w-4 text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="flex flex-col items-center justify-center">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between gap-2"
                  >
                    <Trash2 className="stroke-[1.2px] w-4 h-4 stroke-red-500" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to delete the reaction database?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The database will be
                      permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      onClick={async () => {
                        await remove({ id: row.original._id });
                        toast.success(
                          `Reaction database ${row.original.name} deleted successfully`
                        );
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: reactionDbs || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="flex flex-col h-full max-w-screen-xl mx-auto px-8 py-4">
      <div className="flex-1 flex flex-col min-h-0">
        <Table>
          <TableHeader>
            <TableRow className="sticky top-0 bg-background z-10 hover:bg-background">
              {table.getHeaderGroups()[0].headers.map((header, i) => (
                <TableHead key={i} className="text-foreground">
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
            {reactionDbs === undefined ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : (
              <>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {reactionDbs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>

        <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="py-2 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {reactionDbs?.length} total results
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t">
            <div className="py-4 flex items-center justify-between gap-8">
              <div className="flex-1 max-w-2xl">
                <h4 className="text-sm font-medium mb-1">
                  Download KEGG Reactions Database
                </h4>
                <p className="text-sm text-muted-foreground">
                  Provides molecular mass and formula changes between substrates
                  and products for most metabolic reactions in the KEGG
                  database. Helps users further interpret unknown edges in MRMN.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = "/files/1536-reactions.csv";
                  a.download = "1536-reactions.csv";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="flex items-center gap-2 min-w-[200px]"
              >
                <Download className="h-4 w-4" />
                Download Database
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
