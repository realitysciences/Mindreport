import type { Lens } from "./types";

const identity: Lens = {
  id: "identity",
  label: "Identity",
  description: "Who you are across your contexts, roles, and masks.",
  badge: "Broadest view",
  badgeColor: "#5AA87A",
  iconBg: "rgba(90,168,122,0.15)",
  iconColor: "#5AA87A",
  terrainLabels: [
    "The Roles",
    "The Core Beneath the Roles",
    "The Primary Mask",
    "The Hidden Self",
    "The Identity Conflict",
    "The Unresolved Question",
    "The First Move",
  ],
  sample: {
    quote: "Known everywhere, seen nowhere.",
    pattern:
      "A capacity to adapt the self across contexts — professional, social, intimate — so fluidly that the consistent core becomes hard to locate. Others receive a version; the person themselves may struggle to name what remains constant.",
    cost:
      "The adaptability that makes a person effective in rooms also makes them unknowable. Loneliness inside high function.",
    nextMove:
      "Describe yourself in three words to someone who has never met you. If the words change depending on who is asking, notice that.",
  },
};

export default identity;
