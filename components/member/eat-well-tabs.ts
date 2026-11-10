// Eat well tabs (deep-linkable with ?tab=). Plain module: safe for server and client.
export const EAT_WELL_TABS = ['ideas', 'plan', 'shopping', 'habits'] as const;
export type EatWellTab = (typeof EAT_WELL_TABS)[number];
