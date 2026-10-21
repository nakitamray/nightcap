// the rules for usernames and passwords, shared by the forms and their tests

export const USERNAME = /^[A-Za-z0-9_]{3,20}$/

export function usernameProblem(name: string) {
  if (name.length < 3) return 'at least 3 characters'
  if (name.length > 20) return 'at most 20 characters'
  if (!USERNAME.test(name)) return 'letters, numbers and _ only'
  return null
}

export interface PasswordCheck {
  label: string
  ok: boolean
}

export function passwordChecks(password: string): PasswordCheck[] {
  return [
    { label: '8 or more characters', ok: password.length >= 8 },
    { label: 'a capital letter', ok: /[A-Z]/.test(password) },
    { label: 'a special character', ok: /[^A-Za-z0-9]/.test(password) },
  ]
}

export function passwordOk(password: string) {
  return passwordChecks(password).every((c) => c.ok)
}
