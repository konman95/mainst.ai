type OwnerCoverSettings = {
  mode: "off" | "monitor" | "auto";
  confidenceThreshold: number;
  restrictedTopics: string[];
};

const seed: OwnerCoverSettings = {
  mode: "monitor",
  confidenceThreshold: 0.85,
  restrictedTopics: ["billing", "complaints", "legal"]
};

let settings: OwnerCoverSettings | null = null;

export function getSettings() {
  if (!settings) settings = { ...seed };
  return settings;
}

export function setSettings(next: Partial<OwnerCoverSettings>) {
  settings = { ...getSettings(), ...next };
  return settings;
}
