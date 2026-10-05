import {
  LayoutDashboard, SquareCheckBig, Scale, Droplets, Footprints, Utensils, CalendarDays, ScrollText,
  ChartColumn, Settings, ListChecks, User, House, Users,
} from 'lucide-react';

export const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'var(--c-primary)' },
  { to: '/today', label: 'Today', icon: SquareCheckBig, color: 'var(--c-secondary)' },
  { to: '/weight', label: 'Weight', icon: Scale, color: 'var(--c-accent)' },
  { to: '/water', label: 'Water', icon: Droplets, color: 'var(--c-water)' },
  { to: '/activity', label: 'Activity', icon: Footprints, color: 'var(--c-orange)' },
  { to: '/food', label: 'Food', icon: Utensils, color: 'var(--c-warning)' },
  { to: '/habits', label: 'Habits', icon: ListChecks, color: 'var(--c-pink)' },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, color: 'var(--c-primary)' },
  { to: '/logs', label: 'Logs', icon: ScrollText, color: 'var(--c-secondary)' },
  { to: '/analytics', label: 'Analytics', icon: ChartColumn, color: 'var(--c-accent)' },
  { to: '/friends', label: 'Friends', icon: Users, color: 'var(--c-pink)' },
  { to: '/profile', label: 'Profile', icon: User, color: 'var(--c-pink)' },
  { to: '/settings', label: 'Settings', icon: Settings, color: 'var(--c-muted)' },
];

export const BOTTOM_NAV = [
  { to: '/dashboard', label: 'Home', icon: House },
  { to: '/today', label: 'Today', icon: SquareCheckBig },
  { to: '/friends', label: 'Friends', icon: Users },
  { to: '/analytics', label: 'Stats', icon: ChartColumn },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/settings', label: 'Settings', icon: Settings },
];
