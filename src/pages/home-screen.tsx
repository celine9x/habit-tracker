import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { Tabs } from "@/components/application/tabs/tabs";
import { HabitForm } from "@/components/habit-form";
import { useHabits } from "@/hooks/useHabits";
import type { Habit, HabitType, ReduceConfig } from "@/types/habit";

type ProgressView = "day" | "week" | "month";

// Get today's date string in YYYY-MM-DD format
function getTodayString(): string {
    return new Date().toISOString().split("T")[0];
}

// Get all days in a month as YYYY-MM-DD strings
function getDaysInMonth(year: number, month: number): string[] {
    const days: string[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        days.push(dateStr);
    }
    return days;
}

// Get weekday abbreviation
function getWeekday(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short" });
}

// Get day number
function getDayNumber(dateString: string): number {
    const date = new Date(dateString);
    return date.getDate();
}

// Check if date is in the past (before today)
function isPastDate(dateString: string, today: string): boolean {
    return dateString < today;
}

// Format month/year for display
function formatMonthYear(year: number, month: number): string {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Inline editable habit name component
function InlineEditableHabitName({
    habit,
    onRename,
    todayTarget
}: {
    habit: Habit;
    onRename: (id: string, name: string) => void;
    todayTarget?: number;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(habit.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (editValue.trim() && editValue.trim() !== habit.name) {
            onRename(habit.id, editValue.trim());
        } else {
            setEditValue(habit.name);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            setEditValue(habit.name);
            setIsEditing(false);
        }
    };

    // Get the unit for reduce habits
    const unit = habit.reduceConfig?.unit ?? "";

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-full rounded border border-brand-primary bg-primary px-1 py-0.5 text-sm font-medium text-primary outline-none"
            />
        );
    }

    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-2">
                <span
                    onClick={() => setIsEditing(true)}
                    className="cursor-pointer text-sm font-medium text-primary hover:text-brand-primary"
                    title="Click to edit"
                >
                    {habit.name}
                </span>
                {habit.habitType === "reduce" && (
                    <span className="rounded bg-warning-secondary px-1.5 py-0.5 text-[10px] font-medium text-warning-primary">
                        Reduce
                    </span>
                )}
            </div>
            {habit.habitType === "reduce" && todayTarget !== undefined && (
                <span className="text-xs text-tertiary">
                    Today: {todayTarget} {unit}
                </span>
            )}
        </div>
    );
}

export const HomeScreen = () => {
    const {
        habits,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleCompletionForDate,
        isCompletedOnDate,
        getCompletionCountForDate,
        getCompletionCountForWeek,
        getCompletionCountForMonth,
        renameHabit,
        getReduceTarget,
    } = useHabits();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
    const [progressView, setProgressView] = useState<ProgressView>("day");

    const today = getTodayString();
    const [selectedDate, setSelectedDate] = useState(today);

    // Current month data
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const daysInMonth = useMemo(() => getDaysInMonth(currentYear, currentMonth), [currentYear, currentMonth]);

    // Progress stats based on selected view
    const getProgressStats = () => {
        switch (progressView) {
            case "day":
                return getCompletionCountForDate(selectedDate);
            case "week":
                return getCompletionCountForWeek(today);
            case "month":
                return getCompletionCountForMonth(currentYear, currentMonth);
            default:
                return { completed: 0, total: 0 };
        }
    };

    const { completed, total } = getProgressStats();
    const progressPercentage = total > 0 ? (completed / total) * 100 : 0;

    const getProgressLabel = () => {
        switch (progressView) {
            case "day":
                return selectedDate === today ? "Today" : new Date(selectedDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
            case "week":
                return "This Week";
            case "month":
                return formatMonthYear(currentYear, currentMonth);
            default:
                return "";
        }
    };

    const handleAddHabit = () => {
        setEditingHabit(null);
        setIsFormOpen(true);
    };

    const handleFormSubmit = (name: string, frequency: any, habitType: HabitType, reduceConfig?: ReduceConfig) => {
        if (editingHabit) {
            updateHabit(editingHabit.id, name, frequency, habitType, reduceConfig);
        } else {
            addHabit(name, frequency, habitType, reduceConfig);
        }
    };

    const handleDeleteHabit = (habitId: string) => {
        if (deletingHabitId === habitId) {
            deleteHabit(habitId);
            setDeletingHabitId(null);
        } else {
            setDeletingHabitId(habitId);
            setTimeout(() => setDeletingHabitId(null), 3000);
        }
    };

    const handleCellClick = (habitId: string, dateString: string) => {
        toggleCompletionForDate(habitId, dateString);
    };

    const handleDayHeaderClick = (dateString: string) => {
        setSelectedDate(dateString);
        setProgressView("day");
    };

    return (
        <div className="flex min-h-dvh flex-col bg-primary">
            {/* Header */}
            <div className="border-b border-border-secondary bg-primary px-4 py-6">
                <div className="mx-auto max-w-6xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-primary">Habit Tracker</h1>
                            <p className="mt-1 text-sm text-tertiary">{formatMonthYear(currentYear, currentMonth)}</p>
                        </div>
                        <Button color="primary" size="md" iconLeading={Plus} onClick={handleAddHabit}>
                            Add Habit
                        </Button>
                    </div>
                </div>
            </div>

            {/* Progress Section */}
            <div className="border-b border-border-secondary bg-secondary px-4 py-4">
                <div className="mx-auto max-w-6xl">
                    {/* View Toggle */}
                    <Tabs selectedKey={progressView} onSelectionChange={(key) => setProgressView(key as ProgressView)} className="mb-3">
                        <Tabs.List
                            type="button-gray"
                            size="sm"
                            items={[
                                { id: "day", label: "Day" },
                                { id: "week", label: "Week" },
                                { id: "month", label: "Month" },
                            ]}
                        >
                            {(item) => <Tabs.Item key={item.id} id={item.id}>{item.label}</Tabs.Item>}
                        </Tabs.List>
                    </Tabs>
                    {/* Progress Info */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <p className="mb-2 text-sm font-medium text-secondary">
                                {getProgressLabel()}
                                <span className="ml-2 text-tertiary">
                                    {progressView === "day"
                                        ? `${completed}/${total} habits completed`
                                        : `${Math.round(progressPercentage)}% completed`}
                                </span>
                            </p>
                            <ProgressBar value={progressPercentage} className="h-2" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 px-4 py-6">
                <div className="mx-auto max-w-6xl">
                    {habits.length === 0 ? (
                        <EmptyState>
                            <EmptyState.Header>
                                <EmptyState.FeaturedIcon icon={Plus} color="gray" />
                            </EmptyState.Header>
                            <EmptyState.Content>
                                <EmptyState.Title>No habits yet</EmptyState.Title>
                                <EmptyState.Description>Get started by adding your first habit to track.</EmptyState.Description>
                            </EmptyState.Content>
                            <EmptyState.Footer>
                                <Button color="primary" size="lg" iconLeading={Plus} onClick={handleAddHabit}>
                                    Add Your First Habit
                                </Button>
                            </EmptyState.Footer>
                        </EmptyState>
                    ) : (
                        <div className="overflow-x-auto">
                            {/* Matrix Table */}
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        {/* Habit name column header */}
                                        <th className="sticky left-0 z-10 min-w-[160px] border-b border-r border-border-secondary bg-primary px-3 py-2 text-left text-xs font-medium text-tertiary">
                                            Habit
                                        </th>
                                        {/* Day column headers */}
                                        {daysInMonth.map((dateStr) => {
                                            const isToday = dateStr === today;
                                            const isPast = isPastDate(dateStr, today);
                                            const isSelected = dateStr === selectedDate && progressView === "day";
                                            return (
                                                <th
                                                    key={dateStr}
                                                    onClick={() => handleDayHeaderClick(dateStr)}
                                                    className={`min-w-[44px] cursor-pointer border-b border-border-secondary px-1 py-1.5 text-center transition-colors ${
                                                        isToday
                                                            ? "bg-brand-solid text-white"
                                                            : isSelected
                                                              ? "bg-brand-secondary text-brand-primary"
                                                              : isPast
                                                                ? "text-quaternary hover:bg-secondary"
                                                                : "text-secondary hover:bg-secondary"
                                                    }`}
                                                >
                                                    <div className={`text-[10px] font-normal ${isToday ? "text-white/80" : isPast ? "text-quaternary" : "text-tertiary"}`}>
                                                        {getWeekday(dateStr)}
                                                    </div>
                                                    <div className={`text-sm font-semibold ${isToday ? "text-white" : ""}`}>{getDayNumber(dateStr)}</div>
                                                </th>
                                            );
                                        })}
                                        {/* Actions column header */}
                                        <th className="sticky right-0 z-10 min-w-[48px] border-b border-l border-border-secondary bg-primary px-2 py-2 text-center text-xs font-medium text-tertiary">

                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {habits.map((habit) => {
                                        const todayReduceTarget = habit.habitType === "reduce" ? getReduceTarget(habit, today) : undefined;
                                        return (
                                            <tr key={habit.id} className="group">
                                                {/* Habit name cell - inline editable */}
                                                <td className="sticky left-0 z-10 border-b border-r border-border-secondary bg-primary px-3 py-2">
                                                    <InlineEditableHabitName habit={habit} onRename={renameHabit} todayTarget={todayReduceTarget} />
                                                </td>
                                                {/* Day cells */}
                                                {daysInMonth.map((dateStr) => {
                                                    const isCompleted = isCompletedOnDate(habit, dateStr);
                                                    const isToday = dateStr === today;
                                                    const isPast = isPastDate(dateStr, today);
                                                    const isReduceHabit = habit.habitType === "reduce";
                                                    const reduceTarget = isReduceHabit ? getReduceTarget(habit, dateStr) : 0;

                                                    return (
                                                        <td
                                                            key={dateStr}
                                                            onClick={() => handleCellClick(habit.id, dateStr)}
                                                            className={`cursor-pointer border-b border-border-secondary px-1 py-2 text-center transition-colors hover:bg-secondary ${
                                                                isToday ? "bg-brand-solid/10" : isPast ? "bg-tertiary/30" : ""
                                                            }`}
                                                        >
                                                            <div className="flex flex-col items-center justify-center gap-0.5">
                                                                {/* Checkbox - same for both habit types */}
                                                                <div
                                                                    className={`h-5 w-5 rounded-full border-2 transition-colors ${
                                                                        isCompleted
                                                                            ? isPast
                                                                                ? "border-brand-solid/60 bg-brand-solid/60"
                                                                                : "border-brand-solid bg-brand-solid"
                                                                            : isPast
                                                                              ? "border-border-secondary bg-transparent"
                                                                              : "border-border-primary bg-transparent hover:border-brand-secondary"
                                                                    }`}
                                                                >
                                                                    {isCompleted && (
                                                                        <svg className="h-full w-full text-white" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path
                                                                                fillRule="evenodd"
                                                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                                clipRule="evenodd"
                                                                            />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                {/* Show target for reduce habits */}
                                                                {isReduceHabit && (
                                                                    <span className={`text-[10px] ${isPast ? "text-quaternary" : "text-tertiary"}`}>
                                                                        /{reduceTarget}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            {/* Delete button cell */}
                                            <td className="sticky right-0 z-10 border-b border-l border-border-secondary bg-primary px-2 py-2">
                                                <div className="flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                                                    <ButtonUtility
                                                        size="sm"
                                                        color="tertiary"
                                                        icon={Trash01}
                                                        tooltip={deletingHabitId === habit.id ? "Click again to confirm" : "Delete habit"}
                                                        onClick={() => handleDeleteHabit(habit.id)}
                                                        aria-label={`Delete ${habit.name}`}
                                                        className={deletingHabitId === habit.id ? "text-error-primary hover:text-error-primary_hover" : ""}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Habit Form Modal */}
            <HabitForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleFormSubmit} editingHabit={editingHabit} />
        </div>
    );
};
