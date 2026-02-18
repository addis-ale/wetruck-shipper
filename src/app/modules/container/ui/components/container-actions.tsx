"use client";

import { useState } from "react";
import { Pencil, Trash2, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Container } from "../../server/types/container.types";
import { UpdateContainerDialog } from "./dialogs/update-container-dialog";
import { UpdateContainerDrawer } from "./update-container-drawer";
import { DeleteContainerDialog } from "./dialogs/delete-container-dialog";

export function ContainerActions({ container }: { container: Container }) {
  const isMobile = useIsMobile();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      {isMobile ? (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditOpen(true)}
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
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
      )}

      {isMobile ? (
        <UpdateContainerDrawer
          key={container.id}
          open={editOpen}
          onOpenChange={setEditOpen}
          container={container}
        />
      ) : (
        <UpdateContainerDialog
          key={container.id}
          open={editOpen}
          onOpenChange={setEditOpen}
          container={container}
        />
      )}
      <DeleteContainerDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        id={container.id}
      />
    </>
  );
}
