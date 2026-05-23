export type Lens = {
  id: string;
  label: string;
  description: string;
  badge: string;
  badgeColor: string;
  iconBg: string;
  iconColor: string;
  /** The 7 terrain section labels this lens generates in the final map report */
  terrainLabels: string[];
  /** Sample output shown as a preview on the lens selection page */
  sample: {
    quote: string;
    pattern: string;
    cost: string;
    nextMove: string;
  };
};
