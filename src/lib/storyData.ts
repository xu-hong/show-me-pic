export const sourceConstants = {
  muskGain2024: 213_000_000_000,
  medianWeeklyEarnings: 1_192,
  medianLifetimeEarnings: 2_500_000,
  secondsPerDay: 24 * 60 * 60,
  daysPerYear: 365,
  weeksPerYear: 52
} as const;

const secondsPerYear = sourceConstants.daysPerYear * sourceConstants.secondsPerDay;
const secondsPerWeek = 7 * sourceConstants.secondsPerDay;

export const derivedNumbers = {
  secondsPerYear,
  secondsPerWeek,
  muskPerSecond: sourceConstants.muskGain2024 / secondsPerYear,
  medianPerSecond: sourceConstants.medianWeeklyEarnings / secondsPerWeek,
  muskPerMinute: sourceConstants.muskGain2024 / secondsPerYear * 60,
  muskPerHour: sourceConstants.muskGain2024 / secondsPerYear * 60 * 60,
  muskPerDay: sourceConstants.muskGain2024 / sourceConstants.daysPerYear,
  muskPerWeek: sourceConstants.muskGain2024 / sourceConstants.weeksPerYear,
  secondsPerMedianPaycheck:
    sourceConstants.medianWeeklyEarnings / (sourceConstants.muskGain2024 / secondsPerYear),
  fiveSecondGain: sourceConstants.muskGain2024 / secondsPerYear * 5,
  weeksForFiveSecondGain:
    (sourceConstants.muskGain2024 / secondsPerYear * 5) / sourceConstants.medianWeeklyEarnings,
  weeklyRatio:
    sourceConstants.muskGain2024 / sourceConstants.weeksPerYear / sourceConstants.medianWeeklyEarnings,
  minutesForLifetimeEarnings:
    sourceConstants.medianLifetimeEarnings / (sourceConstants.muskGain2024 / secondsPerYear * 60),
  yearsForDayGainAtMedianWeekly:
    (sourceConstants.muskGain2024 / sourceConstants.daysPerYear) /
    (sourceConstants.medianWeeklyEarnings * sourceConstants.weeksPerYear)
} as const;

export const sources = {
  fortune:
    'https://fortune.com/2024/12/31/billionaires-combined-net-worth-hits-10-trillion-elon-musk-trump-2024/',
  bls: 'https://www.bls.gov/news.release/archives/wkyeng_01222025.htm',
  vercel: 'https://vercel.com/docs/frameworks/full-stack/sveltekit'
} as const;

export type SceneKind =
  | 'year'
  | 'cutdown'
  | 'sixth'
  | 'week'
  | 'race';

export type StoryScene = {
  id: string;
  step: string;
  cue: string;
  keyNumber: string;
  formula: string;
  kind: SceneKind;
};

export const storyScenes: StoryScene[] = [
  {
    id: 'year',
    step: 'Step 1',
    cue: 'Start with the annual gain only.',
    keyNumber: '$213B',
    formula: '365 equal tiles, each tile = one day of the $213B year.',
    kind: 'year',
  },
  {
    id: 'cutdown',
    step: 'Step 2',
    cue: 'Let’s call it a Musk second.',
    keyNumber: '$6,754/sec',
    formula: 'Zoom: year -> day -> one second. One sixth is about $1,126.',
    kind: 'cutdown',
  },
  {
    id: 'sixth',
    step: 'Step 3',
    cue: 'That slice becomes a person’s week.',
    keyNumber: '$1,192/week',
    formula: '$1,192 is close to 1/6 of a Musk second; exact timing is 0.176 sec.',
    kind: 'sixth',
  },
  {
    id: 'week',
    step: 'Step 4',
    cue: 'Now zoom back out: week against week.',
    keyNumber: '$1,192 vs $4.10B',
    formula: '$213B / 52 = $4.10B per week; ratio = 3.44M:1.',
    kind: 'week',
  },
  {
    id: 'race',
    step: 'Step 5',
    cue: 'Hold the place; change the time.',
    keyNumber: 'Musk time',
    formula: 'Musk day -> Musk week -> Musk year, with normal-worker years below.',
    kind: 'race',
  }
];
