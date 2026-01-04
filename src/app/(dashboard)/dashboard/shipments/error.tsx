"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function ShipmentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Shipments page error:", error);
  }, [error]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>Something went wrong</CardTitle>
        </div>
        <CardDescription>
          We encountered an error while loading your shipments. Please try again.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Error: {error.message}
          </p>
          <Button onClick={reset}>Try Again</Button>
        </div>
      </CardContent>
    </Card>
  );
}

