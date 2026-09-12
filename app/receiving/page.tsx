"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";

/**
 * Receiving UX lives on Inventory (unified table). Client redirect; hash optional.
 */
export default function ReceivingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/inventory");
  }, [router]);

  return (
    <Card className="border-dashed px-5 py-10 text-center text-muted-foreground">
      Receiving moved to Inventory — redirecting to{" "}
      <a href="/inventory" className="font-medium text-primary underline-offset-4 hover:underline">
        Stock
      </a>
      …
    </Card>
  );
}
