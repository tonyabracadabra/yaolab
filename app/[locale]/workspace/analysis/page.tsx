"use client";

import { DataTable } from "@/components/data-table";
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
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth, useUser } from "@clerk/nextjs";
import { EnterIcon } from "@radix-ui/react-icons";
import { ColumnDef } from "@tanstack/react-table";
import Avatar from "boring-avatars";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  CheckIcon,
  Copy,
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
          className="h-7 w-7 p-0 hover:bg-accent/40 transition-colors"
          onClick={() => router.push(`${pathname}/${row.original.id}`)}
        >
          <EnterIcon className="w-3.5 h-3.5 text-muted-foreground" />
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
            icon: <RefreshCcw className="w-3 h-3 animate-spin" />,
            label: "Running",
            className: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
          },
          complete: {
            variant: "default" as const,
            icon: <CheckIcon className="w-3 h-3" />,
            label: "Complete",
            className:
              "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
          },
          failed: {
            variant: "destructive" as const,
            icon: <XIcon className="w-3 h-3" />,
            label: "Failed",
            className: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
          },
        };

        const config = statusConfig[row.original.status];

        return (
          <Badge
            variant={config.variant}
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${config.className}`}
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
      header: () => <></>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-accent/40"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
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
      ),
    },
  ];

  const emptyState = (
    <div className="flex flex-col items-center justify-center gap-2">
      <p className="text-sm text-muted-foreground">No analyses found</p>
      <Button
        size="sm"
        variant="outline"
        onClick={() => router.push("/workspace/new")}
      >
        <Plus className="w-3.5 h-3.5 mr-2" />
        Create your first analysis
      </Button>
    </div>
  );

  return (
    <div className="h-full w-full p-6">
      <div className="flex flex-col h-full space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Analyses</h2>
          <Button
            size="sm"
            className="h-8"
            onClick={() => router.push("/workspace/new")}
          >
            <Plus className="w-3.5 h-3.5 mr-2" />
            New Analysis
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={analyses}
          pageSize={8}
          emptyState={emptyState}
        />
      </div>
    </div>
  );
}
