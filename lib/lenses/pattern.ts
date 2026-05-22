import type { Lens } from "./types";

const pattern: Lens = {
  id: "pattern",
  label: "Pattern",
  description: "The recurring loops in your thinking, feeling, and relating. Best first map.",
  badge: "Best first map",
  badgeColor: "#C09230",
  iconBg: "rgba(192,146,48,0.15)",
  iconColor: "#C09230",
  terrainLabels: [
    "Surface Behavior",
    "The Loop",
    "The Driver",
    "The Cost",
    "The Protection",
    "The Fracture Point",
    "The First Move",
  ],
  sample: {
    quote: "Performing competence before allowing presence.",
    pattern:
      "A pattern of leading with achievement and capability to secure space in a room before being known as a person. The loop: enter, demonstrate, then cautiously allow contact — always in that order.",
    cost: "Real intimacy arrives late, if at all. The performance exhausts; the person never quite lands.",
    nextMove:
      "In one conversation this week, say something true before saying something impressive.",
  },
};

export default pattern;
