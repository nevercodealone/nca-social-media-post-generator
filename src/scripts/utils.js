import { VALIDATION_LIMITS, ERROR_MESSAGES, UI_MESSAGES } from './types.js';

// Validation utilities
export function validateTranscript(transcript) {
  if (!transcript || typeof transcript !== 'string') {
    return ERROR_MESSAGES.INVALID_TRANSCRIPT;
  }

  const trimmed = transcript.trim();
  if (trimmed.length === 0) {
    return ERROR_MESSAGES.INVALID_TRANSCRIPT;
  }

  return null;
}

export function validateVideoDuration(duration) {
  if (!duration || duration.trim() === '') {
    return null; // Optional field
  }
  
  const durationPattern = /^([0-9]{1,2}):([0-5][0-9])$/;
  if (!durationPattern.test(duration.trim())) {
    return ERROR_MESSAGES.INVALID_DURATION;
  }
  
  return null;
}

// DOM utilities
export function getElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id '${id}' not found`);
  }
  return element;
}

export function hideElement(element) {
  element.classList.add('hidden');
}

export function showElement(element) {
  element.classList.remove('hidden');
}

export function setTextContent(element, text) {
  element.textContent = text;
}

export function copyToClipboard(contentElement, buttonElement) {
  const content = contentElement.textContent || '';
  const originalText = buttonElement.textContent || '';
  
  navigator.clipboard.writeText(content)
    .then(() => {
      setTextContent(buttonElement, UI_MESSAGES.COPIED);
      setTimeout(() => {
        setTextContent(buttonElement, originalText);
      }, 2000);
    })
    .catch(err => {
      console.error(ERROR_MESSAGES.COPY_FAILED, err);
    });
}

export function createKeywordTag(keyword, index, onRemove) {
  const tag = document.createElement('span');
  tag.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800';
  tag.innerHTML = `
    ${keyword}
    <button type="button" class="ml-2 text-indigo-600 hover:text-indigo-800 focus:outline-none" data-index="${index}">
      ×
    </button>
  `;
  
  const removeButton = tag.querySelector('button');
  if (removeButton) {
    removeButton.addEventListener('click', () => onRemove(index));
  }
  
  return tag;
}

export function clearContainer(container) {
  container.innerHTML = '';
}

export function displayError(errorDiv, errorMessage, message) {
  setTextContent(errorMessage, message);
  showElement(errorDiv);
}

export function hideError(errorDiv) {
  hideElement(errorDiv);
}

// API utilities
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function generateContent(transcript, type, options = {}) {
  const requestData = {
    transcript,
    type,
    ...options
  };

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || ERROR_MESSAGES.GENERATION_FAILED,
        response.status,
        errorData.details
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(ERROR_MESSAGES.NETWORK_ERROR);
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERATION_FAILED
    );
  }
}

export async function detectKeywords(transcript) {
  try {
    const response = await generateContent(transcript, 'keywords');
    return response.keywords || [];
  } catch (error) {
    const message = error instanceof ApiError 
      ? ERROR_MESSAGES.KEYWORD_DETECTION_FAILED + error.message
      : ERROR_MESSAGES.KEYWORD_DETECTION_FAILED + 'Unbekannter Fehler';
    throw new ApiError(message);
  }
}