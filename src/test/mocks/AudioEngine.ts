import { vi } from 'vitest'
import type { Sample, Pattern, Project, AudioEngine } from '../../audio/AudioEngine'

export class MockAudioEngine implements Partial<AudioEngine> {
  private samples: Sample[] = []
  private patterns: Pattern[] = []
  private currentPattern = 0
  private isPlaying = false
  private isRecording = false
  private currentStep = 0
  private bpm = 120

  constructor() {
    // Initialize mock samples
    for (let i = 0; i < 16; i++) {
      this.samples.push({
        id: `sample-${i}`,
        name: `Pad ${i + 1}`,
        buffer: null,
        startTime: 0,
        endTime: 1,
        volume: 0.8,
        pan: 0
      })
    }

    // Initialize default pattern
    this.patterns.push({
      id: 'pattern-1',
      name: 'Pattern 1',
      length: 16,
      steps: Array(16).fill(null).map(() => Array(16).fill(false)),
      velocities: Array(16).fill(null).map(() => Array(16).fill(0.8))
    })
  }

  init = vi.fn().mockResolvedValue(undefined)
  dispose = vi.fn()
  
  loadSample = vi.fn().mockImplementation(async (padIndex: number, file: File) => {
    this.samples[padIndex] = {
      ...this.samples[padIndex],
      name: file.name,
      buffer: {} as any // Mock buffer
    }
  })

  getSample = vi.fn().mockImplementation((padIndex: number) => this.samples[padIndex])
  getSamples = vi.fn().mockImplementation(() => this.samples)
  
  triggerPad = vi.fn()
  testPadAudio = vi.fn()
  testBasicAudio = vi.fn()

  // Pattern methods
  getCurrentPattern = vi.fn().mockImplementation(() => this.patterns[this.currentPattern])
  setCurrentPattern = vi.fn().mockImplementation((index: number) => {
    this.currentPattern = index
  })
  addPattern = vi.fn().mockImplementation(() => {
    const newPattern: Pattern = {
      id: `pattern-${this.patterns.length + 1}`,
      name: `Pattern ${this.patterns.length + 1}`,
      length: 16,
      steps: Array(16).fill(null).map(() => Array(16).fill(false)),
      velocities: Array(16).fill(null).map(() => Array(16).fill(0.8))
    }
    this.patterns.push(newPattern)
    return newPattern
  })
  getPatterns = vi.fn().mockImplementation(() => this.patterns)
  
  toggleStep = vi.fn().mockImplementation((padIndex: number, stepIndex: number) => {
    const pattern = this.patterns[this.currentPattern]
    pattern.steps[padIndex][stepIndex] = !pattern.steps[padIndex][stepIndex]
  })
  
  setStepVelocity = vi.fn().mockImplementation((padIndex: number, stepIndex: number, velocity: number) => {
    const pattern = this.patterns[this.currentPattern]
    pattern.velocities[padIndex][stepIndex] = velocity
  })

  // Transport methods
  play = vi.fn().mockImplementation(() => {
    this.isPlaying = true
  })
  
  stop = vi.fn().mockImplementation(() => {
    this.isPlaying = false
    this.currentStep = 0
  })
  
  pause = vi.fn().mockImplementation(() => {
    this.isPlaying = false
  })

  startRecording = vi.fn().mockImplementation(() => {
    this.isRecording = true
  })
  
  stopRecording = vi.fn().mockImplementation(() => {
    this.isRecording = false
  })

  // Getters
  getIsPlaying = vi.fn().mockImplementation(() => this.isPlaying)
  getIsRecording = vi.fn().mockImplementation(() => this.isRecording)
  getCurrentStep = vi.fn().mockImplementation(() => this.currentStep)
  getBPM = vi.fn().mockImplementation(() => this.bpm)
  
  setBPM = vi.fn().mockImplementation((newBpm: number) => {
    this.bpm = newBpm
  })

  getMasterVolume = vi.fn().mockReturnValue(0.8)
  setMasterVolume = vi.fn()

  // Sample property method
  setSampleProperty = vi.fn().mockImplementation((padIndex: number, property: string, value: any) => {
    if (this.samples[padIndex]) {
      (this.samples[padIndex] as any)[property] = value
    }
  })

  // Project methods
  exportProject = vi.fn().mockImplementation((): Project => ({
    id: 'mock-project',
    name: 'Mock Project',
    samples: this.samples,
    patterns: this.patterns,
    currentPattern: this.currentPattern,
    bpm: this.bpm
  }))
  
  loadProject = vi.fn().mockImplementation((project: Project) => {
    this.samples = project.samples
    this.patterns = project.patterns
    this.currentPattern = project.currentPattern
    this.bpm = project.bpm
  })

  // Mock internal methods for testing
  mockSetCurrentStep(step: number) {
    this.currentStep = step
  }
}

export const createMockAudioEngine = () => new MockAudioEngine() 