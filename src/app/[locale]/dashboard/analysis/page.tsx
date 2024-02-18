"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { api } from "@/convex/_generated/api";
import { AnalysisOutputSchema } from "@/convex/analyses";
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
} from "@/src/components/ui/alert-dialog";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { useAuth, useUser } from "@clerk/nextjs";
import { EnterIcon } from "@radix-ui/react-icons";
import Avatar from "boring-avatars";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  CheckIcon,
  Copy,
  Loader2,
  MoreHorizontal,
  RefreshCcw,
  Trash2,
  XIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { z } from "zod";

type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

export default function AnalysisList() {
  const analyses = useQuery(api.analyses.getAll, {});
  const remove = useMutation(api.analyses.remove);
  const { user } = useUser();
  const router = useRouter();
  const { getToken } = useAuth();
  const restart = useAction(api.actions.retryAnalysis);
  const pathname = usePathname();

  const columns: ColumnDef<AnalysisOutput>[] = [
    {
      accessorKey: "_id",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          onClick={() => {
            router.push(`${pathname}/${row.original.id}`);
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xs">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="flex flex-col items-center justify-center">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between gap-2"
                onClick={async () => {
                  const token = await getToken({
                    template: "convex",
                    skipCache: true,
                  });

                  if (!token) return;

                  restart({ id: row.original.id, token });
                }}
              >
                <RefreshCcw className="stroke-[1.2px] w-4 h-4" />
                Restart
              </Button>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between gap-2"
                onClick={() => {
                  router.push(`/dashboard/new?from=${row.original.id}`);
                }}
              >
                <Copy className="stroke-[1.2px] w-4 h-4" />
                Copy
              </Button>
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
                      Are you sure you want to delete the analysis?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive text-white"
                      onClick={() => {
                        remove({ id: row.original.id });
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
    data: analyses || [],
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
              {headerGroup.headers.map((header, i) => {
                return (
                  <TableHead key={i}>
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
        <TableBody className="max-h-[70vh] overflow-hidden">
          {analyses === undefined ? (
            <TableRow className="flex items-center justify-center">
              <Loader2 className="animate-spin" />
            </TableRow>
          ) : (
            <>
              {table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={i}
                  data-state={row.getIsSelected() && "selected"}
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
