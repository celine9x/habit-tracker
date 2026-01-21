import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import type { Frequency, FrequencyType, Habit } from "@/types/habit";

interface HabitFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, frequency: Frequency) => void;
    editingHabit?: Habit | null;
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const HabitForm = ({ isOpen, onClose, onSubmit, editingHabit }: HabitFormProps) => {
    const [name, setName] = useState(editingHabit?.name ?? "");
    const [frequencyType, setFrequencyType] = useState<FrequencyType>(editingHabit?.frequency.type ?? "daily");
    const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(editingHabit?.frequency.weekdays ?? [1, 2, 3, 4, 5]);
    const [customDays, setCustomDays] = useState<number>(editingHabit?.frequency.value ?? 2);

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
                frequency = { type: "custom", value: customDays };
                break;
        }

        onSubmit(name.trim(), frequency);
        handleClose();
    };

    const handleClose = () => {
        setName("");
        setFrequencyType("daily");
        setSelectedWeekdays([1, 2, 3, 4, 5]);
        setCustomDays(2);
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
                                placeholder="e.g., Exercise, Read, Meditate"
                                value={name}
                                onChange={(value) => setName(value)}
                                isRequired
                                autoFocus
                            />

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
                                <Input
                                    label="Repeat every"
                                    type="number"
                                    value={customDays.toString()}
                                    onChange={(e) => setCustomDays(Math.max(1, parseInt(e) || 1))}
                                    hint="Number of days between repetitions"
                                />
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
