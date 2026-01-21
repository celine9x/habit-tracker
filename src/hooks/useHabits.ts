import { useEffect, useState } from "react";
import type { Habit, Frequency, HabitType, ReduceConfig } from "@/types/habit";

const STORAGE_KEY = "habits";

// Generate a simple UUID
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get today's date in YYYY-MM-DD format
function getTodayString(): string {
    return new Date().toISOString().split("T")[0];
}

// Check if a habit is scheduled for a given date
function isHabitScheduledForDate(habit: Habit, dateString: string): boolean {
    // Reduce habits are always tracked daily
    if (habit.habitType === "reduce") {
        const createdDate = new Date(habit.createdAt.split("T")[0]);
        const targetDate = new Date(dateString);
        return targetDate >= createdDate;
    }

    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    switch (habit.frequency.type) {
        case "daily":
            return true;

        case "weekly":
            return habit.frequency.weekdays?.includes(dayOfWeek) ?? false;

        case "custom": {
            if (!habit.frequency.value) return false;
            // Use startDate if provided, otherwise fall back to createdAt
            const startDateStr = habit.frequency.startDate ?? habit.createdAt.split("T")[0];
            const startDate = new Date(startDateStr);
            const targetDate = new Date(dateString);
            const daysDiff = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff >= 0 && daysDiff % habit.frequency.value === 0;
        }

        default:
            return false;
    }
}

// Calculate the target value for a reduce habit on a specific date
function getReduceTargetForDate(habit: Habit, dateString: string): number {
    if (habit.habitType !== "reduce" || !habit.reduceConfig) {
        return 0;
    }

    const { startValue, targetValue, durationWeeks } = habit.reduceConfig;
    const createdDate = new Date(habit.createdAt.split("T")[0]);
    const currentDate = new Date(dateString);

    // If date is before creation, return start value
    if (currentDate < createdDate) {
        return startValue;
    }

    const daysDiff = Math.floor((currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = durationWeeks * 7;

    // If past the duration, return target value
    if (daysDiff >= totalDays) {
        return targetValue;
    }

    // Linear interpolation
    const decrease = startValue - targetValue;
    const decreasePerDay = decrease / totalDays;
    const currentTarget = Math.round(startValue - decreasePerDay * daysDiff);

    return Math.max(targetValue, currentTarget);
}

export function useHabits() {
    const [habits, setHabits] = useState<Habit[]>(() => {
        // Initialize from localStorage synchronously to avoid race conditions
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Migrate old habits without habitType
                return parsed.map((habit: Habit) => ({
                    ...habit,
                    habitType: habit.habitType ?? "build",
                }));
            }
        } catch (error) {
            console.error("Failed to load habits from localStorage:", error);
        }
        return [];
    });

    // Save habits to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
        } catch (error) {
            console.error("Failed to save habits to localStorage:", error);
        }
    }, [habits]);

    // Add a new habit
    const addHabit = (name: string, frequency: Frequency, habitType: HabitType = "build", reduceConfig?: ReduceConfig) => {
        const newHabit: Habit = {
            id: generateId(),
            name,
            habitType,
            frequency,
            createdAt: new Date().toISOString(),
            completions: {},
            ...(habitType === "reduce" && reduceConfig
                ? { reduceConfig, reduceCompletions: {} }
                : {}),
        };
        setHabits((prev) => [...prev, newHabit]);
    };

    // Update an existing habit
    const updateHabit = (id: string, name: string, frequency: Frequency, habitType: HabitType = "build", reduceConfig?: ReduceConfig) => {
        setHabits((prev) =>
            prev.map((habit) =>
                habit.id === id
                    ? {
                          ...habit,
                          name,
                          frequency,
                          habitType,
                          ...(habitType === "reduce" && reduceConfig
                              ? { reduceConfig, reduceCompletions: habit.reduceCompletions ?? {} }
                              : { reduceConfig: undefined, reduceCompletions: undefined }),
                      }
                    : habit,
            ),
        );
    };

    // Delete a habit
    const deleteHabit = (id: string) => {
        setHabits((prev) => prev.filter((habit) => habit.id !== id));
    };

    // Toggle completion for today
    const toggleCompletion = (id: string) => {
        const today = getTodayString();
        toggleCompletionForDate(id, today);
    };

    // Toggle completion for a specific date (works for both build and reduce habits)
    const toggleCompletionForDate = (id: string, dateString: string) => {
        setHabits((prev) =>
            prev.map((habit) => {
                if (habit.id === id) {
                    const currentValue = habit.completions[dateString] ?? false;
                    return {
                        ...habit,
                        completions: {
                            ...habit.completions,
                            [dateString]: !currentValue,
                        },
                    };
                }
                return habit;
            }),
        );
    };

    // Set completion value for a reduce habit on a specific date
    const setReduceCompletion = (id: string, dateString: string, value: number) => {
        setHabits((prev) =>
            prev.map((habit) => {
                if (habit.id === id && habit.habitType === "reduce") {
                    const target = getReduceTargetForDate(habit, dateString);
                    const isCompleted = value <= target;
                    return {
                        ...habit,
                        reduceCompletions: {
                            ...(habit.reduceCompletions ?? {}),
                            [dateString]: value,
                        },
                        completions: {
                            ...habit.completions,
                            [dateString]: isCompleted,
                        },
                    };
                }
                return habit;
            }),
        );
    };

    // Increment/decrement reduce habit count for a date
    const adjustReduceCompletion = (id: string, dateString: string, delta: number) => {
        setHabits((prev) =>
            prev.map((habit) => {
                if (habit.id === id && habit.habitType === "reduce") {
                    const currentValue = habit.reduceCompletions?.[dateString] ?? 0;
                    const newValue = Math.max(0, currentValue + delta);
                    const target = getReduceTargetForDate(habit, dateString);
                    const isCompleted = newValue <= target;
                    return {
                        ...habit,
                        reduceCompletions: {
                            ...(habit.reduceCompletions ?? {}),
                            [dateString]: newValue,
                        },
                        completions: {
                            ...habit.completions,
                            [dateString]: isCompleted,
                        },
                    };
                }
                return habit;
            }),
        );
    };

    // Get the reduce target for a habit on a specific date
    const getReduceTarget = (habit: Habit, dateString: string): number => {
        return getReduceTargetForDate(habit, dateString);
    };

    // Get the actual reduce value for a habit on a specific date
    const getReduceValue = (habit: Habit, dateString: string): number => {
        return habit.reduceCompletions?.[dateString] ?? 0;
    };

    // Get the unit for a reduce habit
    const getReduceUnit = (habit: Habit): string => {
        return habit.reduceConfig?.unit ?? "";
    };

    // Get habits scheduled for today
    const getTodaysHabits = (): Habit[] => {
        const today = getTodayString();
        return habits.filter((habit) => isHabitScheduledForDate(habit, today));
    };

    // Check if a habit is completed today
    const isCompletedToday = (habit: Habit): boolean => {
        const today = getTodayString();
        return habit.completions[today] ?? false;
    };

    // Check if a habit is completed on a specific date
    const isCompletedOnDate = (habit: Habit, dateString: string): boolean => {
        return habit.completions[dateString] ?? false;
    };

    // Get completion count for a specific date
    const getCompletionCountForDate = (dateString: string): { completed: number; total: number } => {
        const total = habits.length;
        const completed = habits.filter((habit) => habit.completions[dateString]).length;
        return { completed, total };
    };

    // Get all dates in a week (Monday to Sunday) containing the given date
    const getWeekDates = (dateString: string): string[] => {
        const date = new Date(dateString);
        const day = date.getDay();
        const diff = day === 0 ? -6 : 1 - day; // Adjust to get Monday
        const monday = new Date(date);
        monday.setDate(date.getDate() + diff);

        const dates: string[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            dates.push(d.toISOString().split("T")[0]);
        }
        return dates;
    };

    // Get completion count for a week (habits with at least 1 completion in the week)
    const getCompletionCountForWeek = (dateString: string): { completed: number; total: number } => {
        const weekDates = getWeekDates(dateString);
        const total = habits.length;
        const completed = habits.filter((habit) => weekDates.some((date) => habit.completions[date])).length;
        return { completed, total };
    };

    // Get completion count for a month (habits with at least 1 completion in the month)
    const getCompletionCountForMonth = (year: number, month: number): { completed: number; total: number } => {
        const total = habits.length;
        const completed = habits.filter((habit) => {
            return Object.keys(habit.completions).some((dateStr) => {
                if (!habit.completions[dateStr]) return false;
                const date = new Date(dateStr);
                return date.getFullYear() === year && date.getMonth() === month;
            });
        }).length;
        return { completed, total };
    };

    // Rename a habit
    const renameHabit = (id: string, newName: string) => {
        if (!newName.trim()) return;
        setHabits((prev) => prev.map((habit) => (habit.id === id ? { ...habit, name: newName.trim() } : habit)));
    };

    return {
        habits,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleCompletion,
        toggleCompletionForDate,
        getTodaysHabits,
        isCompletedToday,
        isCompletedOnDate,
        getCompletionCountForDate,
        getCompletionCountForWeek,
        getCompletionCountForMonth,
        renameHabit,
        // Reduce habit functions
        setReduceCompletion,
        adjustReduceCompletion,
        getReduceTarget,
        getReduceValue,
        getReduceUnit,
    };
}
