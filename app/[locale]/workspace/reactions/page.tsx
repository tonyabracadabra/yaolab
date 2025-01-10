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
  });

  return (
    <div className="w-full py-2 px-4 overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header, i) => (
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
          ))}
        </TableHeader>
        <TableBody className="max-h-[70vh] overflow-hidden">
          {reactionDbs === undefined ? (
            <TableRow className="flex items-center justify-center">
              <TableCell>
                <Loader2 className="animate-spin text-foreground" />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={i}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell, j) => (
                    <TableCell key={j}>
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
    </div>
  );
}
