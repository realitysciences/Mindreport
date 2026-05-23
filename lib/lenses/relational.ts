import type { Lens } from "./types";

const relational: Lens = {
  id: "relational",
  label: "Relational",
  description: "How you connect, protect yourself, and create distance with others.",
  badge: "Most searched",
  badgeColor: "#378ADD",
  iconBg: "rgba(55,138,221,0.15)",
  iconColor: "#378ADD",
  terrainLabels: [
    "The Approach Style",
    "The Pull",
    "The Defense",
    "The Dynamic You Recreate",
    "The Actual Need",
    "The Relational Cost",
    "The First Move",
  ],
  sample: {
    quote: "Offering everything before knowing if it is safe.",
    pattern:
      "A pattern of leading with generosity, warmth, or capability to secure connection before testing for reciprocity. The dynamic creates intimacy quickly, then surprise when the level of investment is not matched.",
    cost:
      "Relationships begin in imbalance and often stay there. The resentment that follows is structural, not accidental.",
    nextMove:
      "In the next new connection, wait to see what is offered before leading with what you can give.",
  },
};

export default relational;
