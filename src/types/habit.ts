export type FrequencyType = "daily" | "weekly" | "custom";
export type HabitType = "build" | "reduce";

export interface Frequency {
    type: FrequencyType;
    value?: number; // For 'custom': every N days
    weekdays?: number[]; // For 'weekly': [0-6] where 0=Sunday
    startDate?: string; // For 'custom': start date for interval calculation (YYYY-MM-DD)
}

export interface ReduceConfig {
    startValue: number; // Starting amount (e.g., 60 mins per day)
    targetValue: number; // Target amount (e.g., 0 mins per day)
    durationWeeks: number; // How many weeks to reach the target
    unit: string; // Unit label (e.g., "mins", "times", "hours")
}

export interface Habit {
    id: string; // UUID
    name: string; // Habit name
    habitType: HabitType; // "build" or "reduce"
    frequency: Frequency;
    createdAt: string; // ISO date string
    completions: Record<string, boolean>; // For build habits: { "2026-01-20": true, ... }
    reduceConfig?: ReduceConfig; // For reduce habits only
    reduceCompletions?: Record<string, number>; // For reduce habits: { "2026-01-20": 3, ... } actual count
}
