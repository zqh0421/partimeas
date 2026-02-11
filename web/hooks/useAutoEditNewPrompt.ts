import { MutableRefObject, useEffect, useState } from "react";
import { PromptConfig } from "@/types/admin";

export function useAutoEditNewPrompt(
  prompts: PromptConfig[],
  editingId: string | null,
  setEditingId: (id: string | null) => void,
  promptRefs: MutableRefObject<Record<string, HTMLDivElement | null>>,
) {
  const [newPromptId, setNewPromptId] = useState<string | null>(null);

  useEffect(() => {
    if (prompts.length === 0 || editingId) return;

    const lastPrompt = prompts[prompts.length - 1];
    const isNewPrompt =
      lastPrompt.content === "" && lastPrompt.name.startsWith("New");
    if (!isNewPrompt) return;

    setNewPromptId(lastPrompt.id);
    setEditingId(lastPrompt.id);

    const scrollTimer = setTimeout(() => {
      const promptEl = promptRefs.current[lastPrompt.id];
      if (!promptEl) return;

      promptEl.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusTimer = setTimeout(() => {
        const nameInput = promptEl.querySelector(
          'input[placeholder="Enter prompt name"]',
        ) as HTMLInputElement | null;
        if (!nameInput) return;
        nameInput.focus();
        nameInput.select();
      }, 200);

      return () => clearTimeout(focusTimer);
    }, 100);

    return () => clearTimeout(scrollTimer);
  }, [prompts, editingId, setEditingId, promptRefs]);

  useEffect(() => {
    if (!editingId && newPromptId) {
      setNewPromptId(null);
    }
  }, [editingId, newPromptId]);

  return newPromptId;
}
