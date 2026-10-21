import { describe, expect, it } from 'vitest'
import { passwordChecks, passwordOk, usernameProblem } from './rules'

describe('passwords', () => {
  it('needs 8 characters, a capital and a special character', () => {
    expect(passwordOk('short1!A')).toBe(true)
    expect(passwordOk('Sh0rt!')).toBe(false)
    expect(passwordOk('alllowercase!')).toBe(false)
    expect(passwordOk('NoSpecials123')).toBe(false)
    expect(passwordOk('Night cap')).toBe(true)
  })

  it('reports each rule separately for the checklist', () => {
    expect(passwordChecks('abc').map((c) => c.ok)).toEqual([false, false, false])
    expect(passwordChecks('Abcdefgh').map((c) => c.ok)).toEqual([true, true, false])
  })
})

describe('usernames', () => {
  it('takes letters, numbers and underscores, 3 to 20 long', () => {
    expect(usernameProblem('nakita')).toBeNull()
    expect(usernameProblem('Dev_99')).toBeNull()
    expect(usernameProblem('ab')).not.toBeNull()
    expect(usernameProblem('a'.repeat(21))).not.toBeNull()
    expect(usernameProblem('no spaces')).not.toBeNull()
    expect(usernameProblem('emoji🙂')).not.toBeNull()
  })
})
