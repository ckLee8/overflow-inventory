"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Receiving UX lives on Inventory (`/inventory#receiving`).
 * Client redirect so the hash fragment is preserved (HTTP Location often drops it).
 */
export default function ReceivingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/inventory#receiving");
  }, [router]);

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
      Receiving moved to Inventory — redirecting to{" "}
      <a href="/inventory#receiving" className="font-medium text-brand-700 underline-offset-2 hover:underline">
        /inventory#receiving
      </a>
      …
    </div>
  );
}
