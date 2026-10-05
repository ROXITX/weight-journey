// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT DAILY HABITS (checkboxes on the Today page).
// Users can add / edit / delete / disable habits in the app: Settings → Habits.
//
// Fields:
//   id        unique key (stored in dailyLogs/{date}.habits[id])
//   label     text shown in the app
//   category  'exercise' | 'food' | 'drinks' | 'lifestyle' | 'custom'
//   icon      emoji
//   type      'boolean' | 'number' | 'quantity' | 'duration' | 'repetition'
//   target    for non-boolean types (value >= target = done)
//   unit      for non-boolean types
//   weight    how much it counts in the daily consistency score
//   auto      computed automatically from other data instead of a checkbox:
//             'steps' (steps ≥ goal) | 'water' (water ≥ goal) | 'sleep' (sleep ≥ goal) | 'bowel' (≥ 1 logged)
//   enabled   show it & count it
// ─────────────────────────────────────────────────────────────────────────────
export const habitCategories = [
  { id: 'exercise', label: 'Exercise', color: 'var(--c-primary)' },
  { id: 'food', label: 'Food', color: 'var(--c-warning)' },
  { id: 'drinks', label: 'Drinks', color: 'var(--c-water)' },
  { id: 'lifestyle', label: 'Lifestyle', color: 'var(--c-accent)' },
  { id: 'custom', label: 'Custom', color: 'var(--c-pink)' },
];

const h = (id, label, category, icon, extra = {}) => ({
  id, label, category, icon, type: 'boolean', target: 1, unit: '', weight: 1, enabled: true, frequency: 'daily', ...extra,
});

export const defaultHabits = [
  // Exercise
  h('morning_workout', 'Morning workout', 'exercise', '🌅', { weight: 2 }),
  h('evening_workout', 'Evening workout', 'exercise', '🌆', { weight: 2 }),
  h('steps_target', 'Steps target reached', 'exercise', '🚶', { weight: 2, auto: 'steps' }),
  h('walking', 'Went for a walk', 'exercise', '🦶'),
  h('stretching', 'Stretching', 'exercise', '🤸'),
  // Food
  h('no_junk', 'No junk food', 'food', '🍔', { weight: 2 }),
  h('no_sugar', 'No added sugar', 'food', '🍬', { weight: 2 }),
  h('no_oil', 'No oily / fried items', 'food', '🛢️', { weight: 1.5 }),
  h('no_overeat', 'Did not overeat', 'food', '🍽️', { weight: 2 }),
  h('protein', 'Ate enough protein', 'food', '🥚'),
  h('fruits_veg', 'Ate fruits / vegetables', 'food', '🥗'),
  h('within_calories', 'Stayed within calorie target', 'food', '🎯'),
  h('no_snacking', 'No unnecessary snacking', 'food', '🍪'),
  h('no_late_eating', 'No late-night eating', 'food', '🌙'),
  // Drinks
  h('water_target', 'Water target achieved', 'drinks', '💧', { weight: 2, auto: 'water' }),
  h('no_sugary_drinks', 'No sugary drinks', 'drinks', '🥤', { weight: 1.5 }),
  h('no_soft_drinks', 'No soft drinks', 'drinks', '🫧'),
  h('no_diet_drinks', 'No diet / zero-sugar drinks', 'drinks', '🧃'),
  // Lifestyle
  h('cold_bath', 'Cold-water bath', 'lifestyle', '🚿', { weight: 1.5 }),
  h('sleep_target', 'Slept enough', 'lifestyle', '😴', { auto: 'sleep' }),
  h('slept_on_time', 'Slept on time', 'lifestyle', '🛏️'),
  h('woke_on_time', 'Woke on time', 'lifestyle', '⏰'),
  h('morning_routine', 'Morning routine', 'lifestyle', '☀️'),
  h('brush_morning', 'Brushed teeth (morning)', 'lifestyle', '🪥', { weight: 0.5 }),
  h('brush_night', 'Brushed teeth (night)', 'lifestyle', '🦷', { weight: 0.5 }),
  h('bowel', 'Bowel movement', 'lifestyle', '🚽', { weight: 0.5, auto: 'bowel' }),
  h('meditation', 'Meditation', 'lifestyle', '🧘', { enabled: false }),
  h('reading', 'Reading', 'lifestyle', '📖', { enabled: false }),
  h('screen_time', 'Reduced screen time', 'lifestyle', '📵', { enabled: false }),
];

export const habitTypes = [
  { id: 'boolean', label: 'Yes / No' },
  { id: 'number', label: 'Number' },
  { id: 'quantity', label: 'Quantity' },
  { id: 'duration', label: 'Duration' },
  { id: 'repetition', label: 'Repetition' },
];
