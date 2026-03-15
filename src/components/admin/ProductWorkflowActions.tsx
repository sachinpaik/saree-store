"use client";

import { useState } from "react";
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

export function ProductWorkflowActions({
  productId,
  productCode,
  productStatus,
  imageCount,
  isDiscontinued,
  draftStatus,
}: {
  productId: string;
  productCode: string;
  productStatus: ProductStatus;
  imageCount: number;
  isDiscontinued: boolean;
  draftStatus: DraftStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [discontinueReason, setDiscontinueReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [showDiscontinue, setShowDiscontinue] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  async function handleSubmitForApproval() {
    setError(null);
    const r = await submitProductForApproval(productId);
    if (r.error) setError(r.error);
    else router.refresh();
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

  async function handleSubmitDraft() {
    setError(null);
    const r = await submitDraftForApproval(productId);
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

  const isApproved = productStatus === "approved";
  const isDraft = productStatus === "draft";
  const isPending = productStatus === "pending";
  const hasDraft = draftStatus !== null;
  const draftIsPending = draftStatus === "pending";

  return (
    <div className="space-y-3 border border-stone-200 rounded-lg p-4 bg-stone-50">
      <h3 className="font-medium text-stone-800">Workflow</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-stone-600">
          Status: <strong>{productStatus}</strong>
          {hasDraft && draftStatus && ` · Draft: ${draftStatus}`}
          {isDiscontinued && " · Discontinued"}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {isDraft && (
          <button
            type="button"
            onClick={handleSubmitForApproval}
            disabled={imageCount < 1}
            className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 disabled:opacity-50"
          >
            Submit for approval
          </button>
        )}
        {isDraft && imageCount < 1 && (
          <span className="text-xs text-amber-700">Add at least one image to submit.</span>
        )}
        {isPending && !hasDraft && (
          <>
            <button
              type="button"
              onClick={handleApprove}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
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
        {hasDraft && draftIsPending && (
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
        {hasDraft && draftStatus === "draft" && (
          <button
            type="button"
            onClick={handleSubmitDraft}
            className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded hover:bg-amber-700"
          >
            Submit draft for approval
          </button>
        )}
        {isApproved && !isDiscontinued && (
          <button
            type="button"
            onClick={() => setShowDiscontinue(true)}
            className="px-3 py-1.5 border border-stone-500 text-stone-700 text-sm rounded hover:bg-stone-100"
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
            Re-enable product
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="px-3 py-1.5 border border-red-700 text-red-700 text-sm rounded hover:bg-red-50"
        >
          Delete permanently
        </button>
      </div>
      {showReject && (
        <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-stone-200">
          <label className="flex-1 min-w-[200px]">
            <span className="block text-xs text-stone-600 mb-0.5">Rejection reason</span>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Optional"
              className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
            />
          </label>
          <button
            type="button"
            onClick={draftIsPending ? handleDraftReject : handleReject}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded"
          >
            Confirm reject
          </button>
          <button
            type="button"
            onClick={() => setShowReject(false)}
            className="px-3 py-1.5 border border-stone-300 text-sm rounded"
          >
            Cancel
          </button>
        </div>
      )}
      {showDiscontinue && (
        <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-stone-200">
          <label className="flex-1 min-w-[200px]">
            <span className="block text-xs text-stone-600 mb-0.5">Reason (optional)</span>
            <input
              type="text"
              value={discontinueReason}
              onChange={(e) => setDiscontinueReason(e.target.value)}
              className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm"
            />
          </label>
          <button
            type="button"
            onClick={handleDiscontinue}
            className="px-3 py-1.5 bg-stone-700 text-white text-sm rounded"
          >
            Confirm discontinue
          </button>
          <button
            type="button"
            onClick={() => setShowDiscontinue(false)}
            className="px-3 py-1.5 border border-stone-300 text-sm rounded"
          >
            Cancel
          </button>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-stone-200">
          <label className="flex-1 min-w-[200px]">
            <span className="block text-xs text-stone-600 mb-0.5">
              Type <strong>{productCode}</strong> or DELETE to confirm
            </span>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={productCode || "DELETE"}
              className="w-full px-2 py-1.5 border border-red-300 rounded text-sm"
            />
          </label>
          <button
            type="button"
            onClick={handleDeletePermanently}
            disabled={deleteConfirmation.trim() !== productCode && deleteConfirmation.trim() !== "DELETE"}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded disabled:opacity-50"
          >
            Delete permanently
          </button>
          <button
            type="button"
            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmation(""); }}
            className="px-3 py-1.5 border border-stone-300 text-sm rounded"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
