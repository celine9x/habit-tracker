import { useEffect, useState } from "react";
import type { Habit, Frequency } from "@/types/habit";

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
    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    switch (habit.frequency.type) {
        case "daily":
            return true;

        case "weekly":
            return habit.frequency.weekdays?.includes(dayOfWeek) ?? false;

        case "custom": {
            if (!habit.frequency.value) return false;
            const createdDate = new Date(habit.createdAt.split("T")[0]);
            const targetDate = new Date(dateString);
            const daysDiff = Math.floor((targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff >= 0 && daysDiff % habit.frequency.value === 0;
        }

        default:
            return false;
    }
}

export function useHabits() {
    const [habits, setHabits] = useState<Habit[]>([]);

    // Load habits from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setHabits(parsed);
            }
        } catch (error) {
            console.error("Failed to load habits from localStorage:", error);
        }
    }, []);

    // Save habits to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
        } catch (error) {
            console.error("Failed to save habits to localStorage:", error);
        }
    }, [habits]);

    // Add a new habit
    const addHabit = (name: string, frequency: Frequency) => {
        const newHabit: Habit = {
            id: generateId(),
            name,
            frequency,
            createdAt: new Date().toISOString(),
            completions: {},
        };
        setHabits((prev) => [...prev, newHabit]);
    };

    // Update an existing habit
    const updateHabit = (id: string, name: string, frequency: Frequency) => {
        setHabits((prev) => prev.map((habit) => (habit.id === id ? { ...habit, name, frequency } : habit)));
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

    // Toggle completion for a specific date
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
    };
}
