import type { Lens } from "./types";

const desire: Lens = {
  id: "desire",
  label: "Desire",
  description: "What you are actually moving toward, beneath what you say you want.",
  badge: "Most revealing",
  badgeColor: "#D4537E",
  iconBg: "rgba(212,83,126,0.15)",
  iconColor: "#D4537E",
  terrainLabels: [
    "The Surface Want",
    "The Actual Want",
    "The Approach",
    "The Retreat",
    "The Fear of Arrival",
    "The Fuel",
    "The First Move",
  ],
  sample: {
    quote: "Moving toward recognition, not the thing itself.",
    pattern:
      "The stated goal - the project, the relationship, the achievement - is often a carrier for the real want underneath it: to be seen, to matter, to be free. The actual desire stays hidden because naming it directly feels more dangerous than pursuing its stand-in.",
    cost:
      "The stand-in never fully satisfies. The goal is reached; the real want remains unaddressed. The next goal appears immediately.",
    nextMove:
      "Ask: if I got the thing I am working toward, what would it prove about me? That answer is the actual want.",
  },
};

export default desire;
