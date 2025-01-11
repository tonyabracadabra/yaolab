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
import { Download, MoreHorizontal, Trash2 } from "lucide-react";
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

  const footerContent = (
    <div className="flex items-center justify-between gap-8">
      <div className="flex-1 max-w-2xl">
        <h4 className="text-sm font-medium mb-1">Download Sample Raw File</h4>
        <p className="text-sm text-muted-foreground">
          Download a sample raw file to understand the format and structure
          required for analysis. This will help you prepare your own data files
          correctly.
        </p>
      </div>
      <Button
        size="lg"
        onClick={() => {
          const a = document.createElement("a");
          a.href = "/files/sample-raw.csv";
          a.download = "sample-raw.csv";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }}
        className="flex items-center gap-2 min-w-[200px]"
      >
        <Download className="h-4 w-4" />
        Download Sample
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full max-w-screen-xl mx-auto px-8 py-4">
      <div className="flex-1 flex flex-col min-h-0">
        <DataTable
          columns={columns}
          data={rawFiles}
          pageSize={10}
          footerContent={footerContent}
        />
      </div>
    </div>
  );
}
