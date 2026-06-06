const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmail(email) {
  const trimmed = email?.trim()
  if (!trimmed) return false
  return EMAIL_PATTERN.test(trimmed)
}

export function getEmailError(email) {
  const trimmed = email?.trim()
  if (!trimmed) return 'Email is required'
  if (/\s/.test(trimmed)) return 'Email cannot contain spaces'
  if (!EMAIL_PATTERN.test(trimmed)) return 'Please enter a valid email address'
  return ''
}
