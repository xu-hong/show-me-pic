import { describe, expect, it } from 'vitest';
import { derivedNumbers } from './storyData';

describe('derived story numbers', () => {
  it('keeps the core public figures stable', () => {
    expect(derivedNumbers.muskPerSecond).toBeCloseTo(6754.19, 2);
    expect(derivedNumbers.medianPerSecond).toBeCloseTo(0.00197, 5);
    expect(derivedNumbers.secondsPerMedianPaycheck).toBeCloseTo(0.176, 3);
    expect(derivedNumbers.fiveSecondGain).toBeCloseTo(33770.93, 2);
    expect(derivedNumbers.weeksForFiveSecondGain).toBeCloseTo(28.33, 2);
    expect(derivedNumbers.weeklyRatio).toBeCloseTo(3436370.68, 2);
  });

  it('uses corrected versions of the two scale-check claims', () => {
    expect(derivedNumbers.minutesForLifetimeEarnings).toBeCloseTo(6.17, 2);
    expect(derivedNumbers.yearsForDayGainAtMedianWeekly).toBeCloseTo(9414.71, 2);
  });
});
