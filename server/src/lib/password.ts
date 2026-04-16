import { generateRandomInteger } from 'oslo/crypto'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'

export function validatePasswordStrength(password: string): string | null {
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character'
  }
  return null
}

export function generateTempPassword(length = 12): string {
  let password = ''
  for (let i = 0; i < length; i++) {
    password += TEMP_PASSWORD_CHARS[generateRandomInteger(TEMP_PASSWORD_CHARS.length)]
  }
  return password
}
