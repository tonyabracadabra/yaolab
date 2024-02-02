"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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
import { api } from "@/convex/_generated/api";
import { AnalysisOutputSchema } from "@/convex/analyses";
import { useUser } from "@clerk/nextjs";
import { EnterIcon } from "@radix-ui/react-icons";
import Avatar from "boring-avatars";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { z } from "zod";

type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

export default function AnalysisList() {
  const analyses = useQuery(api.analyses.getAll, {});
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
          <EnterIcon strokeWidth={5} />
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
      cell: ({ row }) => row.original.status,
    },
    {
      accessorKey: "reactionDb",
      header: "Reaction Database",
    },
    {
      accessorKey: "creationTime",
      header: "Created At",
      cell: ({ row }) => new Date(row.original.creationTime),
    },
  ];

  const table = useReactTable({
    data: analyses || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
