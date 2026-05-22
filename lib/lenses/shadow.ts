import type { Lens } from "./types";

const shadow: Lens = {
  id: "shadow",
  label: "Shadow",
  description: "What you resist, avoid, or push outward onto others. Reveals what is hidden.",
  badge: "Reveals what is hidden",
  badgeColor: "#7F77DD",
  iconBg: "rgba(127,119,221,0.15)",
  iconColor: "#7F77DD",
  terrainLabels: [
    "The Disowned",
    "The Projection",
    "The Trigger",
    "The Root",
    "The Gift in the Shadow",
    "The Integration",
    "The First Move",
  ],
  sample: {
    quote: "Criticizing in others what cannot be seen in the self.",
    pattern:
      "Strong reactions to a quality in others — neediness, arrogance, carelessness — often signal the disowned version of that same quality. The shadow does not disappear when refused; it goes underground and leaks through judgment.",
    cost:
      "The energy spent managing the disowned self is unavailable for actual growth. Relationships become projections rather than encounters.",
    nextMove:
      "Name the quality you most dislike in someone close to you. Ask: where does this live in me, unused?",
  },
};

export default shadow;
