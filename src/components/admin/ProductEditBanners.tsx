"use client";

type Props = {
  productStatus: string;
  draftStatus: string | null;
  isDiscontinued: boolean;
  rejectionReason: string | null;
  draftRejectionReason: string | null;
};

export function ProductEditBanners({
  productStatus,
  draftStatus,
  isDiscontinued,
  rejectionReason,
  draftRejectionReason,
}: Props) {
  const isApproved = productStatus === "approved";
  const showDraftNotice = isApproved;
  const reason = draftRejectionReason || rejectionReason;

  return (
    <div className="space-y-2 mb-6">
      {showDraftNotice && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          You are editing a draft. Customers still see the last approved version.
        </div>
      )}
      {productStatus === "rejected" && reason && (
        <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          <span className="font-medium">Rejected:</span> {reason}
        </div>
      )}
      {draftStatus === "rejected" && reason && (
        <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          <span className="font-medium">Draft rejected:</span> {reason}
        </div>
      )}
      {isDiscontinued && (
        <div className="text-sm text-stone-700 bg-stone-100 border border-stone-300 rounded-md px-3 py-2">
          This product is discontinued and hidden from customers.
        </div>
      )}
    </div>
  );
}
