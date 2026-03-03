"use client";

import { useMemo, useState, useTransition } from "react";
import { updateStartupChecklistItemAction } from "@/app/actions";
import {
  startupChecklistSections,
  type StartupChecklistItem,
  type StartupChecklistSection,
} from "@/lib/startup-checklist";

const STORAGE_KEY = "revenue-os-startup-checklist-v1";

export function StartupChecklistPanel(props: {
  sectionLimit?: number;
  defaultOpenCount?: number;
  initialCheckedItemKeys?: string[];
  viewerEmail?: string | null;
}) {
  const sections = useMemo(
    () =>
      props.sectionLimit
        ? startupChecklistSections.slice(0, props.sectionLimit)
        : startupChecklistSections,
    [props.sectionLimit],
  );
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(
    () => buildInitialCheckedState(props.initialCheckedItemKeys, props.viewerEmail),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      startupChecklistSections.map((section, index) => [
        section.id,
        index < (props.defaultOpenCount ?? 0),
      ]),
    ),
  );
  const [isPending, startTransition] = useTransition();

  function handleCheckedChange(itemKey: string, checked: boolean) {
    setSaveError(null);
    setCheckedItems((currentState) => {
      const nextState = {
        ...currentState,
        [itemKey]: checked,
      };

      if (!props.viewerEmail) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      }

      return nextState;
    });

    if (props.viewerEmail) {
      const [sectionId, ...labelParts] = itemKey.split(":");
      const itemLabel = labelParts.join(":");

      startTransition(async () => {
        const result = await updateStartupChecklistItemAction({
          itemKey,
          sectionId,
          itemLabel,
          checked,
        });

        if (!result.ok) {
          setSaveError(result.error);
          setCheckedItems((currentState) => ({
            ...currentState,
            [itemKey]: !checked,
          }));
        }
      });
    }
  }

  function handleSectionToggle(sectionId: string, isOpen: boolean) {
    setOpenSections((currentState) => {
      if (currentState[sectionId] === isOpen) {
        return currentState;
      }

      return {
        ...currentState,
        [sectionId]: isOpen,
      };
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">
          {props.viewerEmail
            ? "Checklist progress is saved to Supabase for your account."
            : "Checklist progress is saved only in this browser until login is enabled."}
        </p>
        {isPending ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Saving...
          </span>
        ) : null}
      </div>

      {saveError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {saveError}
        </div>
      ) : null}

      {sections.map((section) => {
        const completedCount = section.items.filter((item) =>
          checkedItems[getItemKey(section, item)],
        ).length;

        return (
          <details
            key={section.id}
            className="rounded-3xl border border-white/70 bg-white/75 p-5 open:shadow-[inset_0_1px_0_rgba(255,255,255,0.48)]"
            onToggle={(event) =>
              handleSectionToggle(section.id, event.currentTarget.open)
            }
            open={openSections[section.id] ?? false}
          >
            <summary className="cursor-pointer list-none">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    {section.eyebrow}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {section.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {section.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                    {completedCount}/{section.items.length} complete
                  </span>
                  <span className="rounded-full border border-[rgba(33,42,52,0.12)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {section.items.length} items
                  </span>
                </div>
              </div>
            </summary>

            <div className="mt-5 grid gap-3">
              {section.items.map((item) => (
                <ChecklistItemRow
                  checked={checkedItems[getItemKey(section, item)] ?? false}
                  item={item}
                  key={item.label}
                  onCheckedChange={(checked) =>
                    handleCheckedChange(getItemKey(section, item), checked)
                  }
                  sectionId={section.id}
                />
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function ChecklistItemRow(props: {
  sectionId: string;
  item: StartupChecklistItem;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const checkboxId = `${props.sectionId}-${props.item.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
  const toneClassName =
    props.item.tone === "critical"
      ? "bg-[rgba(157,100,65,0.14)] text-[var(--foreground)]"
      : props.item.tone === "optional"
        ? "bg-[rgba(77,91,134,0.12)] text-[var(--foreground)]"
        : props.item.tone === "rule"
          ? "bg-[rgba(30,102,104,0.15)] text-[var(--foreground)]"
          : "bg-[rgba(33,42,52,0.08)] text-[var(--foreground)]";
  const toneLabel =
    props.item.tone === "critical"
      ? "Critical"
      : props.item.tone === "optional"
        ? "Optional"
        : props.item.tone === "rule"
          ? "Rule"
          : "Required";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[rgba(33,42,52,0.08)] bg-[rgba(255,255,255,0.52)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex cursor-pointer items-start gap-3" htmlFor={checkboxId}>
        <input
          checked={props.checked}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-[var(--teal)]"
          id={checkboxId}
          onChange={(event) => props.onCheckedChange(event.target.checked)}
          type="checkbox"
        />
        <span
          className={`text-sm leading-6 ${
            props.checked ? "text-slate-500 line-through" : "text-slate-700"
          }`}
        >
          {props.item.label}
        </span>
      </label>

      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClassName}`}
      >
        {toneLabel}
      </span>
    </div>
  );
}

function getItemKey(section: StartupChecklistSection, item: StartupChecklistItem) {
  return `${section.id}:${item.label}`;
}

function buildInitialCheckedState(
  initialCheckedItemKeys?: string[],
  viewerEmail?: string | null,
) {
  if (viewerEmail) {
    return Object.fromEntries((initialCheckedItemKeys ?? []).map((itemKey) => [itemKey, true]));
  }

  return readStoredChecklistState();
}

function readStoredChecklistState() {
  if (typeof window === "undefined") {
    return {};
  }

  const savedState = window.localStorage.getItem(STORAGE_KEY);

  if (!savedState) {
    return {};
  }

  try {
    return JSON.parse(savedState) as Record<string, boolean>;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}
