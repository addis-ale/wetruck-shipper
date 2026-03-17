"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useDeleteContainer } from "../../../server/hooks/use-delete-container";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: number;
};

export function DeleteContainerDialog({ open, onOpenChange, id }: Props) {
  const { t } = useTranslation(["container", "common"]);
  const { mutate, isPending } = useDeleteContainer({
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("container:delete.title")}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {t("container:delete.cannot_undo")}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:buttons.cancel")}
          </Button>

          <Button
            variant="destructive"
            onClick={() => mutate(id)}
            disabled={isPending}
          >
            {t("common:buttons.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
