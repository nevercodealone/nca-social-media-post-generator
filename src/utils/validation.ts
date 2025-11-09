import { VALIDATION_LIMITS, ERROR_MESSAGES } from '../config/constants.js';

export function validateTranscript(transcript: string): string | null {
  if (!transcript || typeof transcript !== 'string') {
    return ERROR_MESSAGES.INVALID_TRANSCRIPT;
  }

  const trimmed = transcript.trim();
  if (trimmed.length === 0) {
    return ERROR_MESSAGES.INVALID_TRANSCRIPT;
  }

  return null;
}

export function validateVideoDuration(duration?: string): string | null {
  if (!duration || duration.trim() === '') {
    return null; // Optional field
  }
  
  const durationPattern = /^([0-9]{1,2}):([0-5][0-9])$/;
  if (!durationPattern.test(duration.trim())) {
    return ERROR_MESSAGES.INVALID_DURATION;
  }
  
  return null;
}

export function validateKeywords(keywords: string[]): string | null {
  if (keywords.length > VALIDATION_LIMITS.MAX_KEYWORDS) {
    return `Maximal ${VALIDATION_LIMITS.MAX_KEYWORDS} Keywords erlaubt.`;
  }
  
  return null;
}

export function sanitizeApiKey(key?: string): string {
  if (!key) return '';
  return key.replace(/["']/g, '').trim();
}