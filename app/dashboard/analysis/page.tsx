"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { AnalysisOutputSchema } from "@/convex/analyses";
import { useUser } from "@clerk/nextjs";
import { EnterIcon } from "@radix-ui/react-icons";
import Avatar from "boring-avatars";
import { useMutation, useQuery } from "convex/react";
import { CheckIcon, Loader2, Trash2, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { z } from "zod";

type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

export default function AnalysisList() {
  const analyses = useQuery(api.analyses.getAll, {});
  const remove = useMutation(api.analyses.remove);
  const { user } = useUser();
  const router = useRouter();

  const columns: ColumnDef<AnalysisOutput>[] = [
    {
      accessorKey: "_id",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          onClick={() => {
            router.push(`/dashboard/analysis/${row.original.id}`);
          }}
        >
          <EnterIcon className="stroke-[0.8px] w-4 h-4 stroke-muted-foreground opacity-75" />
        </Button>
      ),
    },
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-4 text-white">
          <Avatar size={25} name={user?.username || ""} variant="marble" />
          <div>{user?.username}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        if (row.original.status === "running") {
          return (
            <Badge className="flex items-center justify-center gap-2 w-fit">
              <Loader2 className="animate-spin" size={12} />
              <div>{row.original.status}</div>
            </Badge>
          );
        } else if (row.original.status === "complete") {
          return (
            <Badge className="flex items-center justify-center gap-2 w-fit bg-green-500 text-green-50 hover:bg-green-600">
              <CheckIcon size={12} />
              <div>{row.original.status}</div>
            </Badge>
          );
        } else {
          return (
            <Badge className="flex items-center justify-center gap-2 w-fit bg-destructive text-red-50 hover:bg-red-700">
              <XIcon size={12} />
              <div>{row.original.status}</div>
            </Badge>
          );
        }
      },
    },
    {
      accessorKey: "reactionDb",
      header: "Reaction Database",
    },
    {
      accessorKey: "creationTime",
      header: "Created At",
      cell: ({ row }) => (
        <div>{new Date(row.original.creationTime).toLocaleDateString()}</div>
      ),
    },
    {
      accessorKey: "_id",
      header: "",
      cell: ({ row }) => (
        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost">
                <Trash2 className="stroke-[1.2px] w-4 h-4 stroke-red-400 hover:opacity-80" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you absolutely sure you want to delete the analysis?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive"
                  onClick={() => {
                    remove({ id: row.original.id });
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: analyses || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="w-full p-8">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {analyses === undefined ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <Loader2 className="animate-spin" />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
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
              {analyses.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
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
