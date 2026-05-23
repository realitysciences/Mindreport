import type { Lens } from "./types";

const foundational: Lens = {
  id: "foundational",
  label: "Foundational",
  description: "The deepest map. Who you are, how it was built, what it costs, and what it produced.",
  badge: "Deepest map",
  badgeColor: "#5A4A7A",
  iconBg: "rgba(90,74,122,0.15)",
  iconColor: "#5A4A7A",
  terrainLabels: [
    "The Foundational Architecture",
    "How It Operates",
    "The Blind Field",
    "The Relational Field",
    "The Body's Map",
    "The Gift in the Architecture",
    "Who You Are",
  ],
  sample: {
    quote: "The architecture doesn't know the building has changed.",
    pattern:
      "A set of adaptations built precisely for a past environment — now running continuously in present conditions that no longer require them. The system solved a real problem. The problem is that it keeps solving it, everywhere, regardless of whether the threat is there.",
    cost:
      "The person the architecture protects rarely gets to fully arrive. Full presence requires conditions the system won't create. The scan runs where openness might otherwise be.",
    nextMove:
      "Notice once this week when the architecture activates in a safe situation. Name what it was originally built to protect against. The gap between that threat and the actual room — that gap is the terrain.",
  },
};

export default foundational;
