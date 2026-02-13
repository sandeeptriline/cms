/**
 * Date formatting utilities
 * Handles invalid dates and null values safely
 */

/**
 * Parse a date string into a Date object, handling various formats
 */
function parseDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null
  
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date
  }
  
  if (typeof date !== 'string') {
    // Try to convert to string if it's an object with toString
    if (date && typeof date === 'object' && 'toString' in date) {
      date = String(date)
    } else {
      return null
    }
  }
  
  // Trim whitespace
  date = date.trim()
  if (!date || date === 'null' || date === 'undefined') {
    return null
  }
  
  // Try parsing as ISO string first (most common)
  let parsed = new Date(date)
  if (!isNaN(parsed.getTime())) {
    return parsed
  }
  
  // Try parsing as timestamp (number string or milliseconds)
  const timestamp = Number(date)
  if (!isNaN(timestamp) && timestamp > 0) {
    // If it's a 10-digit number, it might be seconds, convert to milliseconds
    const ms = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp
    parsed = new Date(ms)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }
  }
  
  // Try MySQL datetime format: YYYY-MM-DD HH:MM:SS
  const mysqlMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(\.\d+)?$/)
  if (mysqlMatch) {
    // Convert to ISO format
    const isoDate = `${mysqlMatch[1]}-${mysqlMatch[2]}-${mysqlMatch[3]}T${mysqlMatch[4]}:${mysqlMatch[5]}:${mysqlMatch[6]}${mysqlMatch[7] || ''}`
    parsed = new Date(isoDate)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }
  }
  
  return null
}

/**
 * Format a date string or Date object to a localized string
 * Returns a fallback message if date is invalid or null
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = parseDate(date)
    
    if (!dateObj) {
      console.warn('Invalid date format:', date)
      return 'N/A'
    }
    
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    })
  } catch (error) {
    console.error('Error formatting date:', error, date)
    return 'N/A'
  }
}

/**
 * Format a date to date-only string (no time)
 */
export function formatDateOnly(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = parseDate(date)
    
    if (!dateObj) {
      console.warn('Invalid date format:', date)
      return 'N/A'
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    })
  } catch (error) {
    console.error('Error formatting date:', error, date)
    return 'N/A'
  }
}

/**
 * Format a date to time-only string
 */
export function formatTimeOnly(
  date: string | Date | null | undefined
): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = parseDate(date)
    
    if (!dateObj) {
      console.warn('Invalid date format:', date)
      return 'N/A'
    }
    
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (error) {
    console.error('Error formatting time:', error, date)
    return 'N/A'
  }
}
