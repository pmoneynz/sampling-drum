import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Tone.js since it requires Web Audio API
global.AudioContext = vi.fn().mockImplementation(() => ({
  createGain: vi.fn(),
  createOscillator: vi.fn(),
  createBufferSource: vi.fn(),
  decodeAudioData: vi.fn(),
  destination: {},
  currentTime: 0,
  sampleRate: 44100,
  state: 'suspended',
  suspend: vi.fn(),
  resume: vi.fn(),
  close: vi.fn(),
}))

// Mock window.Tone
Object.defineProperty(window, 'Tone', {
  value: {
    getContext: () => ({
      state: 'running'
    }),
    start: vi.fn(),
    Transport: {
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      bpm: { value: 120 }
    }
  },
  writable: true,
})

// Mock file input for file upload tests
Object.defineProperty(window, 'FileReader', {
  value: class {
    readAsArrayBuffer = vi.fn()
    readAsDataURL = vi.fn()
    readAsText = vi.fn()
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    dispatchEvent = vi.fn()
    abort = vi.fn()
    result = null
    error = null
    readyState = 0
    EMPTY = 0
    LOADING = 1
    DONE = 2
  }
})

// Mock URL.createObjectURL and revokeObjectURL for export functionality
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-object-url'),
    revokeObjectURL: vi.fn()
  },
  writable: true
}) 