import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import type { Frequency, FrequencyType, Habit, HabitType, ReduceConfig } from "@/types/habit";

interface HabitFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, frequency: Frequency, habitType: HabitType, reduceConfig?: ReduceConfig) => void;
    editingHabit?: Habit | null;
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function generateSchedulePreview(start: number, target: number, weeks: number, unit: string): string {
    const totalDays = weeks * 7;
    const decrease = start - target;
    const decreasePerDay = decrease / totalDays;

    const samples: string[] = [];
    // Show day 1, middle, and end
    const daysToShow = [0, Math.floor(totalDays / 2), totalDays];
    for (const day of daysToShow) {
        const currentTarget = Math.max(target, Math.round(start - decreasePerDay * day));
        samples.push(`Day ${day + 1}: ${currentTarget} ${unit}`);
    }
    return samples.join(" → ");
}

function getTodayString(): string {
    return new Date().toISOString().split("T")[0];
}

export const HabitForm = ({ isOpen, onClose, onSubmit, editingHabit }: HabitFormProps) => {
    const [name, setName] = useState(editingHabit?.name ?? "");
    const [habitType, setHabitType] = useState<HabitType>(editingHabit?.habitType ?? "build");
    const [frequencyType, setFrequencyType] = useState<FrequencyType>(editingHabit?.frequency.type ?? "daily");
    const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(editingHabit?.frequency.weekdays ?? [1, 2, 3, 4, 5]);
    const [customDays, setCustomDays] = useState<number>(editingHabit?.frequency.value ?? 2);
    const [customStartDate, setCustomStartDate] = useState<string>(editingHabit?.frequency.startDate ?? getTodayString());
    // Reduce habit config
    const [startValue, setStartValue] = useState<number>(editingHabit?.reduceConfig?.startValue ?? 60);
    const [targetValue, setTargetValue] = useState<number>(editingHabit?.reduceConfig?.targetValue ?? 0);
    const [durationWeeks, setDurationWeeks] = useState<number>(editingHabit?.reduceConfig?.durationWeeks ?? 4);
    const [unit, setUnit] = useState<string>(editingHabit?.reduceConfig?.unit ?? "mins");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            return;
        }

        let frequency: Frequency;

        switch (frequencyType) {
            case "daily":
                frequency = { type: "daily" };
                break;
            case "weekly":
                frequency = { type: "weekly", weekdays: selectedWeekdays };
                break;
            case "custom":
                frequency = { type: "custom", value: customDays, startDate: customStartDate };
                break;
        }

        const reduceConfig: ReduceConfig | undefined =
            habitType === "reduce"
                ? {
                      startValue,
                      targetValue,
                      durationWeeks,
                      unit,
                  }
                : undefined;

        onSubmit(name.trim(), frequency, habitType, reduceConfig);
        handleClose();
    };

    const handleClose = () => {
        setName("");
        setHabitType("build");
        setFrequencyType("daily");
        setSelectedWeekdays([1, 2, 3, 4, 5]);
        setCustomDays(2);
        setCustomStartDate(getTodayString());
        setStartValue(60);
        setTargetValue(0);
        setDurationWeeks(4);
        setUnit("mins");
        onClose();
    };

    const toggleWeekday = (day: number) => {
        setSelectedWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)));
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && handleClose()} isDismissable>
            <Modal>
                <Dialog className="max-w-lg">
                    <div className="w-full rounded-xl bg-primary p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-primary">{editingHabit ? "Edit Habit" : "Add New Habit"}</h2>
                        <p className="mt-1 text-sm text-tertiary">{editingHabit ? "Update your habit details" : "Create a new habit to track"}</p>

                        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                            {/* Habit Name */}
                            <Input
                                label="Habit Name"
                                placeholder={habitType === "build" ? "e.g., Exercise, Read, Meditate" : "e.g., Social media, Smoking, Snacking"}
                                value={name}
                                onChange={(value) => setName(value)}
                                isRequired
                                autoFocus
                            />

                            {/* Habit Type */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-secondary">Habit Type</label>
                                <RadioGroup value={habitType} onChange={(value) => setHabitType(value as HabitType)}>
                                    <RadioButton value="build" label="Build" hint="Build a positive habit (e.g., exercise, reading)" />
                                    <RadioButton value="reduce" label="Reduce" hint="Reduce a bad habit with decreasing targets" />
                                </RadioGroup>
                            </div>

                            {/* Build Habit Options */}
                            {habitType === "build" && (
                                <>
                                    {/* Frequency Type */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-secondary">Frequency</label>
                                        <RadioGroup value={frequencyType} onChange={(value) => setFrequencyType(value as FrequencyType)}>
                                            <RadioButton value="daily" label="Daily" hint="Every day" />
                                            <RadioButton value="weekly" label="Weekly" hint="Specific days of the week" />
                                            <RadioButton value="custom" label="Custom" hint="Every N days" />
                                        </RadioGroup>
                                    </div>

                                    {/* Weekly Days Selection */}
                                    {frequencyType === "weekly" && (
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-secondary">Select Days</label>
                                            <div className="space-y-2">
                                                {WEEKDAY_NAMES.map((day, index) => (
                                                    <Checkbox
                                                        key={index}
                                                        isSelected={selectedWeekdays.includes(index)}
                                                        onChange={() => toggleWeekday(index)}
                                                        label={day}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Custom Days Input */}
                                    {frequencyType === "custom" && (
                                        <div className="space-y-4">
                                            <Input
                                                label="Repeat every"
                                                type="number"
                                                value={customDays.toString()}
                                                onChange={(e) => setCustomDays(Math.max(1, parseInt(e) || 1))}
                                                hint="Number of days between repetitions"
                                            />
                                            <Input
                                                label="Starting from"
                                                type="date"
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e)}
                                                hint="First day to track this habit"
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Reduce Habit Options */}
                            {habitType === "reduce" && (
                                <div className="space-y-4 rounded-lg border border-border-secondary bg-secondary p-4">
                                    <p className="text-sm text-tertiary">
                                        Set your starting point and goal. Daily targets will decrease automatically.
                                    </p>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-secondary">Unit</label>
                                        <div className="flex flex-wrap gap-2">
                                            {["mins", "times", "hours", "cigarettes"].map((u) => (
                                                <button
                                                    key={u}
                                                    type="button"
                                                    onClick={() => setUnit(u)}
                                                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                                                        unit === u
                                                            ? "bg-brand-solid text-white"
                                                            : "bg-tertiary text-secondary hover:bg-quaternary"
                                                    }`}
                                                >
                                                    {u}
                                                </button>
                                            ))}
                                            <Input
                                                placeholder="custom"
                                                value={["mins", "times", "hours", "cigarettes"].includes(unit) ? "" : unit}
                                                onChange={(e) => e && setUnit(e)}
                                                className="w-24"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label={`Starting (${unit}/day)`}
                                            type="number"
                                            value={startValue.toString()}
                                            onChange={(e) => setStartValue(Math.max(1, parseInt(e) || 1))}
                                            hint="Current daily amount"
                                        />
                                        <Input
                                            label={`Target (${unit}/day)`}
                                            type="number"
                                            value={targetValue.toString()}
                                            onChange={(e) => setTargetValue(Math.max(0, parseInt(e) || 0))}
                                            hint="Goal daily amount"
                                        />
                                    </div>
                                    <Input
                                        label="Duration (weeks)"
                                        type="number"
                                        value={durationWeeks.toString()}
                                        onChange={(e) => setDurationWeeks(Math.max(1, parseInt(e) || 1))}
                                        hint="Weeks to reach your goal"
                                    />
                                    {startValue > targetValue && (
                                        <div className="rounded-md bg-brand-secondary p-3">
                                            <p className="text-sm font-medium text-brand-primary">
                                                Schedule Preview
                                            </p>
                                            <p className="mt-1 text-xs text-brand-primary/80">
                                                {generateSchedulePreview(startValue, targetValue, durationWeeks, unit)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <Button type="button" color="secondary" className="flex-1" onClick={handleClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" color="primary" className="flex-1" isDisabled={!name.trim()}>
                                    {editingHabit ? "Update" : "Add Habit"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
