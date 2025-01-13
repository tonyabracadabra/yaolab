"use client";

import { DataTable } from "@/components/data-table";
import { DataTablePageLayout } from "@/components/data-table-page-layout";
import { RawFileCreationDialog } from "@/components/new-analysis/raw-file/dialog";
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
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RawFileSchema } from "@/convex/schema";
import { useUser } from "@clerk/nextjs";
import { ColumnDef } from "@tanstack/react-table";
import Avatar from "boring-avatars";
import { useAction, useQuery } from "convex/react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

type RawFile = z.infer<typeof RawFileSchema> & {
  _id: Id<"rawFiles">;
};

export default function RawfileList() {
  const rawFiles = useQuery(api.rawFiles.getAll, {});
  const remove = useAction(api.actions.removeRawFile);
  const { user } = useUser();

  const columns: ColumnDef<RawFile>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-4">
          <div className="text-foreground">{row.original.name}</div>
        </div>
      ),
    },
    {
      accessorKey: "desc",
      header: "Description",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-4">
          <div className="text-foreground">{row.original.desc}</div>
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
                      Are you sure you want to delete the raw File?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      All the analyses that depend on this raw file will be
                      affected. This action cannot be undone. This will
                      permanently delete your account and remove your data from
                      our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      onClick={async () => {
                        await remove({ id: row.original._id });
                        toast.success(
                          `Raw file ${row.original.name} deleted successfully`
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

  return (
    <DataTablePageLayout
      title="Raw Files"
      action={
        <RawFileCreationDialog
          onCreate={() => {}}
          trigger={<Button>Create Raw File</Button>}
        />
      }
    >
      <DataTable columns={columns} data={rawFiles} pageSize={10} />
    </DataTablePageLayout>
  );
}
