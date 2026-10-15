import { describe, expect, it } from '@jest/globals';
import { validateEmail, validatePollInput } from './validators.js';

describe('validateEmail', () => {
  it('accepts a standard email address', () => {
    expect(validateEmail('voter@example.com')).toBe(true);
  });

  it.each(['', 'not-an-email', 'missing-domain@', '@missing-user.com'])(
    'rejects an invalid email address: %s',
    (email) => {
      expect(validateEmail(email)).toBe(false);
    }
  );
});

describe('validatePollInput', () => {
  const validPoll = {
    title: 'Community meeting',
    options: ['Yes', 'No'],
    startDate: '2026-10-16T10:00:00.000Z',
    endDate: '2026-10-17T10:00:00.000Z',
    maxVotes: 100
  };

  it('accepts valid poll data', () => {
    expect(validatePollInput(validPoll)).toEqual([]);
  });

  it('rejects missing or malformed fields without throwing', () => {
    expect(() => validatePollInput({
      title: 42,
      options: 'Yes,No',
      startDate: 'not-a-date',
      endDate: 'also-not-a-date'
    })).not.toThrow();
    expect(validatePollInput({
      title: 42,
      options: 'Yes,No',
      startDate: 'not-a-date',
      endDate: 'also-not-a-date'
    })).toEqual(expect.arrayContaining([
      'Title must be at least 3 characters.',
      'At least 2 options are required.',
      'Start date must be valid.',
      'End date must be valid.'
    ]));
  });

  it('rejects titles outside the supported length', () => {
    expect(validatePollInput({ ...validPoll, title: 'No' })).toContain(
      'Title must be at least 3 characters.'
    );
    expect(validatePollInput({ ...validPoll, title: 'a'.repeat(201) })).toContain(
      'Title must be 200 characters or fewer.'
    );
  });

  it('rejects non-positive or fractional vote limits', () => {
    for (const maxVotes of [0, -1, 1.5]) {
      expect(validatePollInput({ ...validPoll, maxVotes })).toContain(
        'Max votes must be a positive whole number.'
      );
    }
  });

  it('requires at least two poll options', () => {
    expect(validatePollInput({ ...validPoll, options: ['Only one'] })).toContain(
      'At least 2 options are required.'
    );
  });

  it('rejects an end date that is not after the start date', () => {
    expect(validatePollInput({
      ...validPoll,
      endDate: validPoll.startDate
    })).toContain('End date must be after start date.');
  });
});
