import { describe, it, expect } from 'vitest';
import { formatPost } from '../src/core';

describe('formatPost', () => {
  it('formats post correctly', () => {
    const md = formatPost({ author: 'Bob', text: 'Test' });
    expect(md).toBe('**Bob**: Test');
  });
});
