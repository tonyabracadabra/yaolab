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
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth, useUser } from "@clerk/nextjs";
import { EnterIcon } from "@radix-ui/react-icons";
import Avatar from "boring-avatars";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  CheckIcon,
  Copy,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Trash2,
  XIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

type Analysis = {
  id: Id<"analyses">;
  user: string;
  status: "running" | "complete" | "failed";
  rawFile: {
    name: string;
    tool: "MZmine3" | "MDial";
    mgf: string;
    ions: string;
    sampleCols: string[];
  };
  reactionDb: "default-pos" | { name: string; reactions: any[] };
  config: any;
  creationTime: number;
};

export default function AnalysisList() {
  const analyses = useQuery(api.analyses.getAll, {});
  const remove = useMutation(api.analyses.remove);
  const { user } = useUser();
  const router = useRouter();
  const { getToken } = useAuth();
  const restart = useAction(api.actions.retryAnalysis);
  const pathname = usePathname();

  const columns: ColumnDef<Analysis>[] = [
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
      header: () => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            router.push("/workspace/new");
          }}
        >
          <Plus size={16} strokeWidth={3} />
        </Button>
      ),
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
                  router.push(`/workspace/new?from=${row.original.id}`);
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
                      onClick={async () => {
                        await remove({ id: row.original.id });
                        toast.success("Analysis deleted successfully");
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
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col min-h-0">
        <Table>
          <TableHeader>
            <TableRow className="sticky top-0 bg-background z-10 hover:bg-background">
              {table.getHeaderGroups()[0].headers.map((header, i) => (
                <TableHead key={i}>
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
            {analyses === undefined ? (
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
                  <TableRow key={row.id}>
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
              </>
            )}
          </TableBody>
        </Table>
        <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-8 py-2 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {analyses?.length} total results
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
        </div>
      </div>
    </div>
  );
}
