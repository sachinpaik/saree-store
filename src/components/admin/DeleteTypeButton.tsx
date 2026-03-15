"use client";

import { useRouter } from "next/navigation";
import { deleteType } from "@/app/actions/types";

export function DeleteTypeButton({
  typeId,
  typeName,
}: {
  typeId: string;
  typeName: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete type "${typeName}"? Products under this type will have type unset.`)) return;
    await deleteType(typeId);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-red-600 hover:text-red-700"
    >
      Delete
    </button>
  );
}
