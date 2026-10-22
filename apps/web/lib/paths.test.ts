import { describe, expect, it } from 'vitest'
import { safePath } from './paths'

describe('safePath', () => {
  it('keeps paths on this site', () => {
    expect(safePath('/h/abc/room')).toBe('/h/abc/room')
    expect(safePath('/keys?x=1#top')).toBe('/keys?x=1#top')
  })

  it('turns away anything that leaves the site', () => {
    for (const bad of [
      '//evil.com',
      '/\\evil.com',
      '/\\/evil.com',
      '\\\\evil.com',
      'https://evil.com',
      'evil.com',
      '/\t/evil.com',
      '/\n/evil.com',
      'javascript:alert(1)',
    ])
      expect(safePath(bad), bad).toBe('/keys')
  })

  it('falls back when there is nothing', () => {
    expect(safePath(null)).toBe('/keys')
    expect(safePath('', '/home')).toBe('/home')
  })
})
