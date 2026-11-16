/**
 * Subscription plan DTOs and display helpers.
 *
 * IMPORTANT: This file intentionally contains no plan catalogue. Prices,
 * durations and visibility are loaded from MongoDB through the backend API.
 */

export type DurationUnit = 'DAYS' | 'MONTHS';

export interface PlanDuration {
  unit: DurationUnit;
  value: number; // e.g. 15 for 15 Days, 1 for 1 Month, 3 for 3 Months, 6 for 6 Months, 12 for 1 Year
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  priceUsd: number;        // In USD dollars (for display, derived from priceCents / 100)
  priceCents: number;      // Decimal-safe integer cents (15000 = $150.00, no floating-point inaccuracies)
  duration: PlanDuration;  // Explicit duration representation
  durationDays: number;    // Reference day count
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
  isVisible: boolean;
  displayOrder?: number;
}

export const MODERATOR_COMMISSION_RATE = 0.50; // 50% referral commission for moderators

export const DEFAULT_PLANS_CATALOG: SubscriptionPlan[] = [
  {
    id: 'PLAN_15_DAYS',
    name: '15 Days Pass',
    badge: 'STARTER',
    description: '15 calendar days full live access to European Roulette prediction feeds across 20+ tables.',
    priceUsd: 15,
    priceCents: 1500,
    duration: { unit: 'DAYS', value: 15 },
    durationDays: 15,
    features: [
      'Access to 20+ Evolution & Pragmatic live tables',
      'Real-time live spin tracking',
      'Offset Strategy prediction metrics',
      'Pocket distance (0-3) indicators',
      'Real-time hot streak alerts',
      'Telegram community support'
    ],
    isActive: true,
    isVisible: true,
    displayOrder: 0
  },
  {
    id: 'PLAN_1_MONTH',
    name: '1 Month Pro',
    badge: 'MOST POPULAR',
    isPopular: true,
    description: '1 full calendar month algorithmic coverage for disciplined session profitability.',
    priceUsd: 200,
    priceCents: 20000,
    duration: { unit: 'MONTHS', value: 1 },
    durationDays: 30,
    features: [
      'Everything in 15 Days Pass',
      'Target Strategy unlocked (W/L streak counter)',
      'Momentum weakening warning signals',
      'Automated hot table detection',
      'Priority live customer support'
    ],
    isActive: true,
    isVisible: true,
    displayOrder: 1
  },
  {
    id: 'PLAN_3_MONTHS',
    name: '3 Months Master',
    badge: 'PRO VALUE',
    description: '3 full calendar months of tactical telemetry and high-confidence wheel trends.',
    priceUsd: 450,
    priceCents: 45000,
    duration: { unit: 'MONTHS', value: 3 },
    durationDays: 90,
    features: [
      'Everything in 1 Month Pro',
      'Dealer Signature Strategy unlocked',
      'Ball Travel Line (Over/Under) triggers',
      'Live dealer shift change transition alerts',
      'Private VIP subscriber channel'
    ],
    isActive: true,
    isVisible: true,
    displayOrder: 2
  },
  {
    id: 'PLAN_6_MONTHS',
    name: '6 Months Elite',
    badge: 'ADVANCED EDGE',
    description: '6 full calendar months of institutional predictive metrics across 20+ live tables.',
    priceUsd: 700,
    priceCents: 70000,
    duration: { unit: 'MONTHS', value: 6 },
    durationDays: 180,
    features: [
      'Everything in 3 Months Master',
      'Multi-table simultaneous surveillance feed',
      'Predictive confidence threshold scoring',
      'Historical session telemetry archive',
      'Dedicated priority desk support'
    ],
    isActive: true,
    isVisible: true,
    displayOrder: 3
  },
  {
    id: 'PLAN_1_YEAR',
    name: '1 Year VIP Annual',
    badge: 'MAXIMUM VALUE',
    description: '365 days of elite European Roulette intelligence for dedicated professionals.',
    priceUsd: 1000,
    priceCents: 100000,
    duration: { unit: 'MONTHS', value: 12 },
    durationDays: 365,
    features: [
      'Everything in 6 Months Elite',
      'Zero latency direct API predictive stream',
      'Dedicated 1-on-1 founder support desk',
      'Early access to experimental predictive algorithms',
      'Guaranteed 24/7 uninterrupted uptime SLA'
    ],
    isActive: true,
    isVisible: true,
    displayOrder: 4
  }
];

/**
 * Returns the exact days in a given month of a given year,
 * correctly handling 28/29 days in February for leap years.
 */
export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Accurately calculates subscription expiration dates.
 * Handles calendar-month boundary conditions and leap-year edge cases.
 * E.g., Jan 31 + 1 month in non-leap year -> Feb 28.
 * E.g., Jan 31 + 1 month in leap year (2028) -> Feb 29.
 */
export function calculatePlanExpiration(startDate: Date, duration: PlanDuration): Date {
  const result = new Date(startDate.getTime());

  if (duration.unit === 'DAYS') {
    result.setTime(result.getTime() + duration.value * 24 * 60 * 60 * 1000);
    return result;
  }

  // Unit: MONTHS
  // Using UTC methods avoids timezone and daylight saving time variance
  const currentDay = result.getUTCDate();
  const currentMonth = result.getUTCMonth();
  const currentYear = result.getUTCFullYear();

  const totalMonths = currentMonth + duration.value;
  const targetYear = currentYear + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;

  const maxDaysInTarget = getDaysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(currentDay, maxDaysInTarget);

  // Set date to 1 first to prevent intermediate month rollover
  result.setUTCDate(1);
  result.setUTCFullYear(targetYear);
  result.setUTCMonth(targetMonth);
  result.setUTCDate(targetDay);

  return result;
}

/**
 * Converts integer cents to formatted USD currency display.
 * Prevents floating-point precision artifacts (e.g. 15000 -> "$150").
 */
export function formatCentsToUsd(cents: number): string {
  const dollars = Math.floor(cents / 100);
  const remainderCents = cents % 100;
  if (remainderCents === 0) {
    return `$${dollars.toLocaleString('en-US')}`;
  }
  return `$${dollars.toLocaleString('en-US')}.${remainderCents.toString().padStart(2, '0')}`;
}

export interface UpdatePlanInput {
  name?: string;
  badge?: string;
  description?: string;
  priceCents?: number;
  durationUnit?: 'DAYS' | 'MONTHS';
  durationValue?: number;
  features?: string[];
  isPopular?: boolean;
  isActive?: boolean;
  isVisible?: boolean;
  displayOrder?: number;
}

export interface CreatePlanInput {
  id?: string;
  name: string;
  badge?: string;
  description: string;
  priceCents: number;
  durationUnit: 'DAYS' | 'MONTHS';
  durationValue: number;
  features: string[];
  isPopular?: boolean;
  isActive?: boolean;
  isVisible?: boolean;
  displayOrder?: number;
}

