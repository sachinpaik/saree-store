"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  submitProductForApproval,
  approveProduct,
  rejectProduct,
  discontinueProduct,
  reEnableProduct,
  submitDraftForApproval,
  approveDraft,
  rejectDraft,
  deleteProductPermanently,
  type ProductStatus,
} from "@/app/actions/products";

type DraftStatus = "draft" | "pending" | "approved" | "rejected" | null;

type Props = {
  productId: string;
  productCode: string;
  productStatus: ProductStatus;
  imageCount: number;
  isDiscontinued: boolean;
  draftStatus: DraftStatus;
  canSubmitForApproval: boolean;
  saving: boolean;
  lastSavedAt: Date | null;
  toastMessage: string | null;
  onClearToast: () => void;
  onSaveDraft: () => void;
  onShowToast?: (message: string) => void;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export function ProductEditStickyFooter({
  productId,
  productCode,
  productStatus,
  imageCount,
  isDiscontinued,
  draftStatus,
  canSubmitForApproval,
  saving,
  lastSavedAt,
  toastMessage,
  onClearToast,
  onSaveDraft,
  onShowToast,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [discontinueReason, setDiscontinueReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [showDiscontinue, setShowDiscontinue] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(onClearToast, 3000);
    return () => clearTimeout(t);
  }, [toastMessage, onClearToast]);

  const isDraft = productStatus === "draft";
  const isPending = productStatus === "pending";
  const hasDraft = draftStatus !== null;
  const draftIsPending = draftStatus === "pending";
  const isApproved = productStatus === "approved";

  const displayStatus = isDiscontinued
    ? "Discontinued"
    : hasDraft && draftStatus
      ? `Approved · Draft: ${STATUS_LABELS[draftStatus] ?? draftStatus}`
      : STATUS_LABELS[productStatus] ?? productStatus;

  async function handleSubmitForApproval() {
    setError(null);
    const form = document.getElementById("product-form") as HTMLFormElement | null;
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const r = await submitProductForApproval(productId);
    if (r.error) setError(r.error);
    else {
      onShowToast?.("Submitted for approval");
      router.refresh();
    }
  }

  async function handleSubmitDraftForApproval() {
    setError(null);
    const form = document.getElementById("product-form") as HTMLFormElement | null;
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const r = await submitDraftForApproval(productId);
    if (r.error) setError(r.error);
    else {
      onShowToast?.("Submitted for approval");
      router.refresh();
    }
  }

  async function handleApprove() {
    setError(null);
    const r = await approveProduct(productId);
    if (r.error) setError(r.error);
    else router.refresh();
  }

  async function handleReject() {
    setError(null);
    const r = await rejectProduct(productId, rejectReason);
    if (r.error) setError(r.error);
    else {
      setShowReject(false);
      setRejectReason("");
      router.refresh();
    }
  }

  async function handleDraftApprove() {
    setError(null);
    const r = await approveDraft(productId);
    if (r.error) setError(r.error);
    else router.refresh();
  }

  async function handleDraftReject() {
    setError(null);
    const r = await rejectDraft(productId, rejectReason);
    if (r.error) setError(r.error);
    else {
      setShowReject(false);
      setRejectReason("");
      router.refresh();
    }
  }

  async function handleDiscontinue() {
    setError(null);
    const r = await discontinueProduct(productId, discontinueReason);
    if (r.error) setError(r.error);
    else {
      setShowDiscontinue(false);
      setDiscontinueReason("");
      router.refresh();
    }
  }

  async function handleReEnable() {
    setError(null);
    const r = await reEnableProduct(productId);
    if (r.error) setError(r.error);
    else router.refresh();
  }

  async function handleDeletePermanently() {
    setError(null);
    const r = await deleteProductPermanently(productId, productCode, deleteConfirmation);
    if (r.error) setError(r.error);
    else {
      setShowDeleteConfirm(false);
      setDeleteConfirmation("");
      router.push("/admin/products");
      router.refresh();
    }
  }

  const showSubmitForApproval = isDraft || (hasDraft && draftStatus === "draft");
  const submitDisabled = saving || (showSubmitForApproval && !canSubmitForApproval);

  return (
    <>
      {toastMessage && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-stone-800 text-white text-sm rounded-lg shadow-lg"
          role="status"
        >
          {toastMessage}
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.08)]">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          {error && (
            <p className="text-sm text-red-600 mb-2">{error}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 shrink-0"
              title="Workflow status"
            >
              {displayStatus}
            </span>
            <span className="text-stone-400 hidden sm:inline">|</span>
            {lastSavedAt && (
              <span className="text-xs text-stone-500 shrink-0">
                Last saved {lastSavedAt.toLocaleTimeString()}
              </span>
            )}
            {saving && (
              <span className="text-xs text-amber-700 shrink-0">Saving…</span>
            )}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={saving}
                className="px-3 py-1.5 sm:px-4 sm:py-2 border border-stone-300 text-stone-700 text-sm font-medium rounded hover:bg-stone-50 disabled:opacity-50"
              >
                Save draft
              </button>
              {isDraft && (
                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                  disabled={submitDisabled}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-stone-900 text-white text-sm font-medium rounded hover:bg-stone-800 disabled:opacity-50"
                >
                  Submit for approval
                </button>
              )}
              {hasDraft && draftStatus === "draft" && !isDraft && (
                <button
                  type="button"
                  onClick={handleSubmitDraftForApproval}
                  disabled={submitDisabled}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-stone-900 text-white text-sm font-medium rounded hover:bg-stone-800 disabled:opacity-50"
                >
                  Submit for approval
                </button>
              )}
              {isPending && !hasDraft && (
                <>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReject(true)}
                    className="px-3 py-1.5 border border-red-600 text-red-700 text-sm rounded hover:bg-red-50"
                  >
                    Reject
                  </button>
                </>
              )}
              {draftIsPending && (
                <>
                  <button
                    type="button"
                    onClick={handleDraftApprove}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Approve draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReject(true)}
                    className="px-3 py-1.5 border border-red-600 text-red-700 text-sm rounded hover:bg-red-50"
                  >
                    Reject draft
                  </button>
                </>
              )}
              {isApproved && !isDiscontinued && (
                <button
                  type="button"
                  onClick={() => setShowDiscontinue(true)}
                  className="px-3 py-1.5 border border-stone-400 text-stone-600 text-sm rounded hover:bg-stone-100"
                >
                  Discontinue
                </button>
              )}
              {isDiscontinued && (
                <button
                  type="button"
                  onClick={handleReEnable}
                  className="px-3 py-1.5 bg-stone-700 text-white text-sm rounded hover:bg-stone-800"
                >
                  Re-enable
                </button>
              )}
              <span className="text-stone-300 hidden sm:inline">|</span>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 text-red-600 text-sm hover:text-red-700"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      </footer>

      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 space-y-3">
            <h3 className="font-medium text-stone-900">Rejection reason</h3>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-stone-300 rounded text-sm"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowReject(false)}
                className="px-3 py-1.5 border border-stone-300 text-sm rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={draftIsPending ? handleDraftReject : handleReject}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded"
              >
                Confirm reject
              </button>
            </div>
          </div>
        </div>
      )}

      {showDiscontinue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 space-y-3">
            <h3 className="font-medium text-stone-900">Discontinue product</h3>
            <input
              type="text"
              value={discontinueReason}
              onChange={(e) => setDiscontinueReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full px-3 py-2 border border-stone-300 rounded text-sm"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowDiscontinue(false)}
                className="px-3 py-1.5 border border-stone-300 text-sm rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDiscontinue}
                className="px-3 py-1.5 bg-stone-700 text-white text-sm rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 space-y-3">
            <h3 className="font-medium text-stone-900">Delete permanently</h3>
            <p className="text-sm text-stone-600">
              Type <strong>{productCode}</strong> or DELETE to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={productCode || "DELETE"}
              className="w-full px-3 py-2 border border-red-200 rounded text-sm"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmation("");
                }}
                className="px-3 py-1.5 border border-stone-300 text-sm rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePermanently}
                disabled={
                  deleteConfirmation.trim() !== productCode &&
                  deleteConfirmation.trim() !== "DELETE"
                }
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded disabled:opacity-50"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
