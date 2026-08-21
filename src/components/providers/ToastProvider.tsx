"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      theme="dark"
      position="top-right"
      toastOptions={{
        style: {
          background: "rgba(12, 18, 28, 0.95)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#f2f5f8",
        },
      }}
    />
  );
}
