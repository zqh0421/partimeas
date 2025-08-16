import { RubricVersion, RubricItem, HistoryEntry } from "@/app/types";

export const saveVersion = (currentVersion: RubricVersion): void => {
  const versionName = prompt("Enter version name:");
  if (versionName) {
    const newVersion: RubricVersion = {
      ...currentVersion,
      id: Date.now().toString(),
      name: versionName,
      createdAt: new Date(),
    };
    console.log("Saved version:", newVersion);
  }
};

export const exportVersion = (currentVersion: RubricVersion): void => {
  const dataStr = JSON.stringify(currentVersion, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rubric-version-${currentVersion.name}.json`;
  link.click();
};

export const addHistoryEntry = (
  currentVersion: RubricVersion,
  setCurrentVersion: (version: RubricVersion | ((prev: RubricVersion) => RubricVersion)) => void,
  action: "created" | "modified" | "merged" | "star" | "unstared",
  field?: string,
  oldValue?: string,
  newValue?: string,
  comment?: string
): void => {
  const historyEntry: HistoryEntry = {
    id: Date.now().toString(),
    timestamp: new Date(),
    modifier: "Current User",
    action,
    field,
    oldValue,
    newValue,
    comment,
    version: currentVersion.version,
    changeType:
      field === "criteria"
        ? "criteria_name"
        : field === "description"
        ? "criteria_description"
        : field === "category"
        ? "change_category"
        : "add_criteria",
  };

  setCurrentVersion((prev) => ({
    ...prev,
    history: [...prev.history, historyEntry],
  }));
};

export const updateRubricItem = (
  currentVersion: RubricVersion,
  setCurrentVersion: (version: RubricVersion | ((prev: RubricVersion) => RubricVersion)) => void,
  itemId: string,
  field: keyof RubricItem,
  value: string
): void => {
  setCurrentVersion((prev) => ({
    ...prev,
    rubricItems: prev.rubricItems.map((item) =>
      item.id === itemId ? { ...item, [field]: value } : item
    ),
  }));

  const item = currentVersion.rubricItems.find((item) => item.id === itemId);
  if (item) {
    addHistoryEntry(
      currentVersion,
      setCurrentVersion,
      "modified",
      field,
      item[field as keyof RubricItem] as string,
      value,
      `Updated ${field} for "${item.criteria}"`
    );
  }
};

export const getCategoriesInOrder = (currentVersion: RubricVersion): string[] => {
  const stableCategoryOrder = [
    "Theory Application",
    "Safety & Ethics",
    "Practical Application",
    "Assessment & Observation",
    "Communication & Collaboration",
    "Professional Development",
  ];

  const existingCategories = Array.from(
    new Set(currentVersion.rubricItems.map((item) => item.category))
  );
  const orderedCategories = stableCategoryOrder.filter((cat) =>
    existingCategories.includes(cat)
  );
  const newCategories = existingCategories.filter(
    (cat) => !stableCategoryOrder.includes(cat)
  );
  return [...orderedCategories, ...newCategories];
}; 