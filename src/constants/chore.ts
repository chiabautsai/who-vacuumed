export const TIMELINE_CONFIG = {
  TOTAL_DAYS: 90,
  RECTANGLE_WIDTH: 16, // w-4 = 16px
  RECTANGLE_GAP: 4, // gap-1 = 4px
  MIN_VISIBLE_DAYS: 7,
  // Mobile-specific configurations
  MOBILE_RECTANGLE_WIDTH: 20, // w-5 = 20px - larger for touch
  MOBILE_RECTANGLE_GAP: 6, // gap-1.5 = 6px - more spacing
  MOBILE_MIN_VISIBLE_DAYS: 5, // Fewer days on mobile
  MOBILE_BREAKPOINT: 768, // md breakpoint
} as const

export const USER_COLORS = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-purple-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-indigo-500',
] as const