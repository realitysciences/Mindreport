import type { Lens } from "./types";

const origin: Lens = {
  id: "origin",
  label: "Origin",
  description: "What from your past is still drawing the lines of the present.",
  badge: "Deepest read",
  badgeColor: "#BA7517",
  iconBg: "rgba(186,117,23,0.15)",
  iconColor: "#BA7517",
  terrainLabels: [
    "The Formation",
    "The Central Wound",
    "The Survival Strategy",
    "The Legacy Running Now",
    "The Unfinished Business",
    "The Revision",
    "The First Move",
  ],
  sample: {
    quote: "Still solving for a room that no longer exists.",
    pattern:
      "The strategies that kept a child safe — staying small, performing, over-giving, staying alert — become the default architecture of the adult. The original conditions are gone; the adaptations continue, aimed at ghosts.",
    cost:
      "Present circumstances are filtered through old lenses. People in the now are responded to as if they were people from then.",
    nextMove:
      "Identify one response you have today that would have made sense when you were twelve. Ask: is this still the right tool?",
  },
};

export default origin;
