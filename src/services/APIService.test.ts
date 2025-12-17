import { describe, it, expect, vi, beforeEach } from 'vitest';
import APIService from './APIService';

describe('APIService', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    vi.clearAllMocks();
  });

  describe('Model Mappings', () => {
    it('should have fallback mappings for deprecated models', () => {
      const mappings = (APIService as any).modelMappings;

      expect(mappings).toBeDefined();
      expect(mappings['claude-2']).toBe('claude-3-5-sonnet-20241022');
      expect(mappings['claude-3-opus-20240229']).toBe('claude-3-5-sonnet-20241022');
    });
  });

  describe('Token Costs', () => {
    it('should have token costs defined for major models', () => {
      const costs = (APIService as any).tokenCosts;

      expect(costs).toBeDefined();
      expect(costs['claude-3-5-sonnet-20241022']).toEqual({
        input: 3.00,
        output: 15.00,
      });
      expect(costs['gpt-4-turbo']).toBeDefined();
    });

    it('should have higher costs for more powerful models', () => {
      const costs = (APIService as any).tokenCosts;

      const sonnetCost = costs['claude-3-5-sonnet-20241022'].input;
      const haikuCost = costs['claude-3-5-haiku-20241022'].input;

      expect(sonnetCost).toBeGreaterThan(haikuCost);
    });
  });

  describe('Cache Duration', () => {
    it('should have 24 hour cache duration', () => {
      const cacheDuration = (APIService as any).CACHE_DURATION;
      const expectedDuration = 24 * 60 * 60 * 1000; // 24 hours in ms

      expect(cacheDuration).toBe(expectedDuration);
    });
  });
});
