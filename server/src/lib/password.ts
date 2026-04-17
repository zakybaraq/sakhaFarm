import { generateRandomInteger } from 'oslo/crypto'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/

const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'

export function validatePasswordStrength(password: string): string | null {
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character'
  }
  return null
}

export function generateTempPassword(length = 12): string {
  // Guarantee at least 1 uppercase, 1 lowercase, 1 number, 1 special char
  const upperChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowerChars = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const specialChars = '!@#$%'
  
  const password = [
    upperChars[generateRandomInteger(upperChars.length)],
    lowerChars[generateRandomInteger(lowerChars.length)],
    digits[generateRandomInteger(digits.length)],
    specialChars[generateRandomInteger(specialChars.length)],
  ]
  
  // Fill remaining with any character type
  const allChars = upperChars + lowerChars + digits + specialChars
  for (let i = password.length; i < length; i++) {
    password.push(allChars[generateRandomInteger(allChars.length)])
  }
  
  // Shuffle to avoid predictable positions
  for (let i = password.length - 1; i > 0; i--) {
    const j = generateRandomInteger(i + 1)
    ;[password[i], password[j]] = [password[j], password[i]]
  }
  
  return password.join('')
}
