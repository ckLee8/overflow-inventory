"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Receiving UX lives on Inventory (unified table). Client redirect; hash optional.
 */
export default function ReceivingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/inventory");
  }, [router]);

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
      Receiving moved to Inventory — redirecting to{" "}
      <a href="/inventory" className="font-medium text-brand-700 underline-offset-2 hover:underline">
        /inventory
      </a>
      …
    </div>
  );
}
