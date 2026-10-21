import { describe, expect, it } from '@jest/globals';
import { canAccessPoll } from './pollAccess.js';

const poll = {
  organizerId: 'organizer-1',
  status: 'ACTIVE',
  isPublic: true
};

describe('canAccessPoll', () => {
  it('allows anonymous access to a published public poll', () => {
    expect(canAccessPoll(poll, undefined)).toBe(true);
  });

  it('requires an account for a published private poll', () => {
    expect(canAccessPoll({ ...poll, isPublic: false }, undefined)).toBe(false);
    expect(canAccessPoll({ ...poll, isPublic: false }, { id: 'participant-1' })).toBe(true);
  });

  it('only allows the organizer to access a draft poll', () => {
    const draft = { ...poll, status: 'DRAFT' };
    expect(canAccessPoll(draft, undefined)).toBe(false);
    expect(canAccessPoll(draft, { id: 'participant-1' })).toBe(false);
    expect(canAccessPoll(draft, { id: 'organizer-1' })).toBe(true);
  });
});
