"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAttributeDefinition,
  updateAttributeDefinition,
} from "@/app/actions/attribute-definitions";
import type { AttributeDefRow } from "@/app/(admin)/admin/attributes/page";

export function AttributeDefinitionsManager({
  definitions,
}: {
  definitions: AttributeDefRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createAttributeDefinition(formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowAdd(false);
    router.refresh();
  }

  async function handleUpdate(key: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateAttributeDefinition(key, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditingKey(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {showAdd ? (
        <form onSubmit={handleAdd} className="p-4 border border-stone-200 rounded-lg space-y-3 bg-stone-50">
          <h3 className="font-medium text-stone-800">Add attribute</h3>
          <AttributeFormFields showKey />
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1.5 bg-stone-900 text-white text-sm rounded">
              Save
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 border border-stone-300 text-sm rounded">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 border border-stone-300 rounded text-sm font-medium hover:bg-stone-50"
        >
          + Add attribute
        </button>
      )}
      <div className="border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="text-left p-3 font-medium">Key</th>
              <th className="text-left p-3 font-medium">Label</th>
              <th className="text-left p-3 font-medium">Group</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Sort</th>
              <th className="text-left p-3 font-medium">Active</th>
              <th className="text-left p-3 font-medium">Required</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {definitions.map((def) => (
              <tr key={def.key} className="border-b border-stone-100">
                {editingKey === def.key ? (
                  <td colSpan={8} className="p-3 bg-stone-50">
                    <form onSubmit={(e) => handleUpdate(def.key, e)} className="space-y-3">
                      <AttributeFormFields
                        defaultLabel={def.label}
                        defaultGroup={def.group}
                        defaultInputType={def.input_type}
                        defaultOptionsJson={def.options_json ?? ""}
                        defaultSortOrder={def.sort_order}
                        defaultIsActive={def.is_active}
                        defaultIsRequired={def.is_required}
                        showKey={false}
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="px-3 py-1.5 bg-stone-900 text-white text-sm rounded">
                          Update
                        </button>
                        <button type="button" onClick={() => setEditingKey(null)} className="px-3 py-1.5 border border-stone-300 text-sm rounded">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="p-3 font-mono text-stone-600">{def.key}</td>
                    <td className="p-3">{def.label}</td>
                    <td className="p-3">{def.group}</td>
                    <td className="p-3">{def.input_type}</td>
                    <td className="p-3">{def.sort_order}</td>
                    <td className="p-3">{def.is_active ? "Yes" : "No"}</td>
                    <td className="p-3">{def.is_required ? "Yes" : "No"}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingKey(def.key)}
                        className="text-stone-600 hover:text-stone-900"
                      >
                        Edit (or disable via Active)
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {definitions.length === 0 && (
          <p className="p-6 text-center text-stone-500 text-sm">No attribute definitions. Run the seed script or add one above.</p>
        )}
      </div>
    </div>
  );
}

function AttributeFormFields({
  showKey = false,
  defaultLabel = "",
  defaultGroup = "Specifications",
  defaultInputType = "text",
  defaultOptionsJson = "",
  defaultSortOrder = 0,
  defaultIsActive = true,
  defaultIsRequired = false,
}: {
  showKey?: boolean;
  defaultLabel?: string;
  defaultGroup?: string;
  defaultInputType?: string;
  defaultOptionsJson?: string;
  defaultSortOrder?: number;
  defaultIsActive?: boolean;
  defaultIsRequired?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {showKey && (
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-0.5">Key (machine name)</label>
          <input name="key" required placeholder="e.g. fabric" className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm" />
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-0.5">Label</label>
        <input name="label" defaultValue={defaultLabel} required className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-0.5">Group</label>
        <input name="group" defaultValue={defaultGroup} className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-0.5">Input type</label>
        <select name="input_type" defaultValue={defaultInputType} className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm">
          <option value="text">text</option>
          <option value="textarea">textarea</option>
          <option value="select">select</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-stone-600 mb-0.5">Options JSON (for select)</label>
        <input name="options_json" defaultValue={defaultOptionsJson} placeholder='["A","B"] or {"a":"Label A"}' className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm font-mono" />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-0.5">Sort order</label>
        <input name="sort_order" type="number" defaultValue={defaultSortOrder} className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm" />
      </div>
      <div className="flex items-center gap-4 pt-5">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_active" defaultChecked={defaultIsActive} className="rounded border-stone-300" />
          <span className="text-sm">Active</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_required" defaultChecked={defaultIsRequired} className="rounded border-stone-300" />
          <span className="text-sm">Required</span>
        </label>
      </div>
    </div>
  );
}
