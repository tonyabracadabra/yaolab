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
      id: "view",
      accessorKey: "_id",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-accent/40 transition-colors"
          onClick={() => {
            router.push(`${pathname}/${row.original.id}`);
          }}
        >
          <EnterIcon className="w-4 h-4 text-muted-foreground" />
        </Button>
      ),
    },
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar size={28} name={user?.username || ""} variant="marble" />
          <span className="text-sm font-medium">{user?.username}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusConfig = {
          running: {
            variant: "secondary" as const,
            icon: <Loader2 className="w-3 h-3 animate-spin" />,
            label: "Running",
            className: "px-2 py-0.5",
          },
          complete: {
            variant: "default" as const,
            icon: <CheckIcon className="w-3 h-3" />,
            label: "Complete",
            className:
              "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 px-2 py-0.5",
          },
          failed: {
            variant: "destructive" as const,
            icon: <XIcon className="w-3 h-3" />,
            label: "Failed",
            className: "px-2 py-0.5",
          },
        };

        const config = statusConfig[row.original.status];

        return (
          <Badge
            variant={config.variant}
            className={`inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap ${config.className}`}
          >
            {config.icon}
            <span>{config.label}</span>
          </Badge>
        );
      },
    },
    {
      accessorKey: "reactionDb",
      header: "Reaction Database",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {typeof row.original.reactionDb === "string"
            ? row.original.reactionDb
            : row.original.reactionDb.name}
        </span>
      ),
    },
    {
      accessorKey: "creationTime",
      header: "Created At",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.creationTime).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      accessorKey: "_id",
      header: () => (
        <Button
          size="sm"
          variant="outline"
          className="border-dashed"
          onClick={() => {
            router.push("/workspace/new");
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Analysis
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 px-2 py-1.5 text-sm"
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
