"use client";

import { useUiStore } from "@/store/uiStore";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function ConfirmModalHost() {
  const { confirmModal, closeConfirm } = useUiStore();

  return (
    <Modal
      open={confirmModal.open}
      onClose={closeConfirm}
      title={confirmModal.title}
      footer={
        <>
          <Button variant="secondary" onClick={closeConfirm}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              confirmModal.onConfirm?.();
              closeConfirm();
            }}
          >
            {confirmModal.confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--muted)]">{confirmModal.description}</p>
    </Modal>
  );
}
