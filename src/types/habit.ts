export type FrequencyType = "daily" | "weekly" | "custom";

export interface Frequency {
    type: FrequencyType;
    value?: number; // For 'custom': every N days
    weekdays?: number[]; // For 'weekly': [0-6] where 0=Sunday
}

export interface Habit {
    id: string; // UUID
    name: string; // Habit name
    frequency: Frequency;
    createdAt: string; // ISO date string
    completions: Record<string, boolean>; // { "2026-01-20": true, ... }
}
