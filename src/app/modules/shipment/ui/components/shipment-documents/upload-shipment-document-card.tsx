"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { UploadShipmentDocumentDialog } from "./upload-shipment-document-dialog";
import { useTranslation } from "react-i18next";

export function UploadShipmentDocumentCard({
  shipId,
}: {
  shipId: number | null;
}) {
  const { t } = useTranslation(["shipment", "common"]);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="border rounded-md p-4 flex items-center justify-between bg-card text-card-foreground shadow-sm">
        <div>
          <p className="font-medium">{t("shipment:documents.shipment_documents")}</p>
          <p className="text-sm text-muted-foreground">
            {t("shipment:documents.manage_files")}
          </p>
        </div>

        <Button 
          onClick={() => setOpen(true)}
          disabled={!shipId}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("common:buttons.upload")}
        </Button>
      </div>

      {shipId && (
        <UploadShipmentDocumentDialog
          shipId={shipId}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
