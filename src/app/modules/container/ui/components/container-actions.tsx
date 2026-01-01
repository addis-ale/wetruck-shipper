"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Container } from "../../server/types/container.types";
import { UpdateContainerDialog } from "./dialogs/update-container-dialog";
import { DeleteContainerDialog } from "./dialogs/delete-container-dialog";

export function ContainerActions({ container }: { container: Container }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/containers/${container.id}`}>
              View
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UpdateContainerDialog
  key={container.id}
  open={editOpen}
  onOpenChange={setEditOpen}
  container={container}
/>
      <DeleteContainerDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        id={container.id}
      />
    </>
  );
}