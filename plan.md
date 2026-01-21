# Habit Tracker - Matrix View Plan

## Scope: Matrix View with Multi-Period Progress

This plan covers the habit completion matrix with daily granularity and multi-period progress tracking.

---

## Core Features

1. **Habit Completion Matrix**
   - Rows: Habits (all habits, regardless of frequency)
   - Columns: Days of the current month (1-31)
   - Cells: Clickable to toggle completion for that habit/date

2. **Visual States**
   - Empty cell: Not completed
   - Filled cell: Completed (filled circle/indicator)

3. **Progress Bar with View Toggle**
   - **View toggle buttons**: Day | Week | Month
   - Shows completion stats based on selected view:
     - **Day**: "X / Y habits completed today" (completions for selected day)
     - **Week**: "X / Y habits completed this week" (habits with at least 1 completion this week)
     - **Month**: "X / Y habits completed this month" (habits with at least 1 completion this month)
   - Progress bar updates automatically when:
     - View is changed
     - Cells are toggled
     - Selected date changes

4. **Inline Habit Name Editing**
   - Click on habit name in the matrix to edit inline
   - Text input appears in place of the habit name
   - Press Enter or click outside to save
   - Press Escape to cancel
   - No modal needed for name changes

5. **Calendar Date Headers**
   - Each column shows weekday abbreviation (Mon, Tue, etc.) + date number
   - **Today**: Strongly highlighted with brand color background and bold text
   - **Past dates**: Dimmed/muted appearance (lower opacity text)
   - **Future dates**: Normal appearance
   - Clicking a column header selects that day for the progress bar

---

## Assumptions

1. The existing `useHabits` hook and data model will be extended (not replaced)
2. The existing `completions: Record<string, boolean>` format is sufficient (keyed by `YYYY-MM-DD`)
3. All habits are shown in the matrix regardless of their frequency setting
4. The matrix shows the current month only (no month navigation in basic version)
5. Reuse existing Tailwind classes and design tokens from `theme.css`
6. Reuse existing components: Button, Progress bar, etc.
7. Horizontal scrolling is acceptable for wide matrices

---

## Out of Scope

- Yearly view for progress
- Matrix column grouping by week/month (matrix always shows daily columns)
- Month/date range navigation
- Habit filtering or sorting
- Habit grouping or categories
- Data export/import
- Streak calculations
- Heatmap coloring based on streaks
- Mobile-specific optimizations
- Animations beyond basic transitions

---

## Data Model

### Existing (No Changes Needed)

```typescript
interface Habit {
  id: string;
  name: string;
  frequency: Frequency;
  createdAt: string;
  completions: Record<string, boolean>; // e.g., {"2026-01-20": true}
}
```

### Hook Extension Needed

```typescript
// Add to useHabits hook:
toggleCompletionForDate: (habitId: string, date: string) => void;
isCompletedOnDate: (habit: Habit, date: string) => boolean;
getCompletionCountForDate: (date: string) => { completed: number; total: number };
getCompletionCountForWeek: (date: string) => { completed: number; total: number };
getCompletionCountForMonth: (year: number, month: number) => { completed: number; total: number };
renameHabit: (habitId: string, newName: string) => void;
```

---

## Basic User Flows

### 1. View Matrix
- User navigates to home screen
- Matrix displays with all habits as rows
- Current month's days as columns (1-31)
- Today's column is visually highlighted
- Completed cells are filled, incomplete are empty

### 2. Toggle Completion
- User clicks a cell (intersection of habit row and day column)
- Cell toggles between completed/incomplete
- Progress bar updates if the toggled day is the selected day
- Change persists to localStorage

### 3. View Progress (Day/Week/Month)
- Default view: Day - shows "X / Y habits completed today"
- Click "Week" button to see weekly progress (habits with at least 1 completion this week)
- Click "Month" button to see monthly progress (habits with at least 1 completion this month)
- Progress bar and text update based on selected view

### 4. Inline Edit Habit Name
- Click on habit name in the matrix table
- Name becomes an editable text input
- Type new name
- Press Enter or click outside to save
- Press Escape to cancel without saving

---

## Implementation Steps

1. **Extend `useHabits` hook** with date-specific toggle and query functions
2. **Build matrix grid** in home-screen using Tailwind CSS grid utilities
3. **Integrate existing Progress component** for daily summary
4. **Add day selection state** to track which day's progress to display
5. **Test** toggle behavior and localStorage persistence

---

## UI Layout

```
+------------------------------------------------------------------+
| Habit Tracker                                     [+ Add Habit]  |
+------------------------------------------------------------------+
| [Day] [Week] [Month]              <- View toggle buttons         |
| Today  5/10 habits completed                                     |
| [================          ]      <- Progress bar                |
+------------------------------------------------------------------+
|              | Mon | Tue | Wed | ... | Sun | Mon | Tue | ... |   |
|              |  1  |  2  |  3  | ... | 19  | 20* | 21  | ... |   |
+--------------+-----+-----+-----+-----+-----+-----+-----+-----+---+
| Habit A (*)  | dim | dim | dim | ... | dim | [x] |     | ... | X |
| Habit B      | dim | dim | dim | ... | dim | [x] |     | ... | X |
| Habit C      | dim | dim | dim | ... | dim | [ ] |     | ... | X |
+--------------+-----+-----+-----+-----+-----+-----+-----+-----+---+

Legend:
- [x] = completed (filled circle)
- [ ] = not completed (empty circle)
- dim = past dates (muted/dimmed appearance)
- 20* = today (highlighted with brand color)
- (*) = click habit name to edit inline
- X = delete button (no edit button needed, inline edit replaces it)
- [Day] [Week] [Month] = view toggle for progress stats
```

---

## Components to Reuse

- `Button` - Add habit action
- `Progress` / progress bar styles - Daily completion bar
- `Modal` / `HabitForm` - Existing habit add/edit flow
- Tailwind grid utilities - Matrix layout
- Design tokens from `theme.css` - Colors, spacing, borders

---

## Files to Modify

1. `src/hooks/useHabits.ts` - Add date-specific functions
2. `src/pages/home-screen.tsx` - Replace list view with matrix view

---

## Status

**Implemented features:**
- [x] Habit completion matrix with daily columns
- [x] Calendar date headers (weekday + day number)
- [x] Past/today/future visual distinction
- [x] Click cells to toggle completion
- [x] Progress bar for selected day
- [x] Day/Week/Month view toggle for progress
- [x] Inline habit name editing
