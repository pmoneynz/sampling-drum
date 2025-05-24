import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Sequencer } from '../Sequencer'
import { createMockAudioEngine } from '../../test/mocks/AudioEngine'
import type { AudioEngine } from '../../audio/AudioEngine'

describe('Sequencer', () => {
  let mockAudioEngine: ReturnType<typeof createMockAudioEngine>

  const defaultProps = {
    audioEngine: null as any as AudioEngine,
    selectedPad: 0
  }

  beforeEach(() => {
    mockAudioEngine = createMockAudioEngine()
    defaultProps.audioEngine = mockAudioEngine as any as AudioEngine
    vi.clearAllMocks()
  })

  it('renders the sequencer title', () => {
    render(<Sequencer {...defaultProps} />)
    
    expect(screen.getByText('SEQUENCER')).toBeInTheDocument()
  })

  it('displays current pattern name', () => {
    mockAudioEngine.getCurrentPattern.mockReturnValue({
      id: 'pattern-1',
      name: 'Test Pattern',
      length: 16,
      steps: Array(16).fill(null).map(() => Array(16).fill(false)),
      velocities: Array(16).fill(null).map(() => Array(16).fill(0.8))
    })

    render(<Sequencer {...defaultProps} />)
    
    expect(screen.getByText('Pattern: Test Pattern')).toBeInTheDocument()
  })

  it('renders 16 pad rows', () => {
    render(<Sequencer {...defaultProps} />)
    
    // Check that pad rows are rendered by looking for pad containers
    const padContainers = document.querySelectorAll('.w-20.p-2')
    expect(padContainers).toHaveLength(16)
  })

  it('renders step numbers', () => {
    render(<Sequencer {...defaultProps} />)
    
    // Check that step numbers are displayed in header by looking for step number containers
    const stepNumbers = document.querySelectorAll('.w-8.text-xs.text-center.text-gray-400')
    expect(stepNumbers).toHaveLength(16)
  })

  it('highlights selected pad', () => {
    render(<Sequencer {...defaultProps} selectedPad={5} />)
    
    const padElements = screen.getAllByText('6') // Pad 6 (index 5)
    const padRow = padElements.find(el => el.closest('.bg-mpc-accent'))
    expect(padRow).toBeInTheDocument()
  })

  it('triggers pad when pad info is clicked', () => {
    render(<Sequencer {...defaultProps} />)
    
    // Find the first pad container (should be pad 1)
    const padContainer = document.querySelector('.w-20.p-2')!
    fireEvent.click(padContainer)
    
    expect(mockAudioEngine.triggerPad).toHaveBeenCalledWith(0, 0.8)
  })

  it('toggles step when step button is clicked', () => {
    render(<Sequencer {...defaultProps} />)
    
    // Find the first step button (should be in the grid)
    const stepButtons = document.querySelectorAll('.step')
    expect(stepButtons.length).toBeGreaterThan(0)
    
    fireEvent.click(stepButtons[0])
    
    expect(mockAudioEngine.toggleStep).toHaveBeenCalledWith(0, 0)
  })

  it('clears selected pad when Clear Pad button is clicked', () => {
    // Mock pattern with some active steps
    const mockPattern = {
      id: 'pattern-1',
      name: 'Pattern 1',
      length: 16,
      steps: Array(16).fill(null).map(() => Array(16).fill(false)),
      velocities: Array(16).fill(null).map(() => Array(16).fill(0.8))
    }
    // Set some steps as active for pad 0
    mockPattern.steps[0][0] = true
    mockPattern.steps[0][4] = true
    mockPattern.steps[0][8] = true
    
    mockAudioEngine.getCurrentPattern.mockReturnValue(mockPattern)

    render(<Sequencer {...defaultProps} selectedPad={0} />)
    
    const clearPadButton = screen.getByText('Clear Pad 1')
    fireEvent.click(clearPadButton)
    
    // Should call toggleStep for each active step
    expect(mockAudioEngine.toggleStep).toHaveBeenCalledWith(0, 0)
    expect(mockAudioEngine.toggleStep).toHaveBeenCalledWith(0, 4)
    expect(mockAudioEngine.toggleStep).toHaveBeenCalledWith(0, 8)
  })

  it('clears all pads when Clear All button is clicked', () => {
    // Mock pattern with some active steps
    const mockPattern = {
      id: 'pattern-1',
      name: 'Pattern 1',
      length: 16,
      steps: Array(16).fill(null).map(() => Array(16).fill(false)),
      velocities: Array(16).fill(null).map(() => Array(16).fill(0.8))
    }
    // Set some steps as active across different pads
    mockPattern.steps[0][0] = true
    mockPattern.steps[1][4] = true
    mockPattern.steps[2][8] = true
    
    mockAudioEngine.getCurrentPattern.mockReturnValue(mockPattern)

    render(<Sequencer {...defaultProps} />)
    
    const clearAllButton = screen.getByText('Clear All')
    fireEvent.click(clearAllButton)
    
    // Should call toggleStep for each active step
    expect(mockAudioEngine.toggleStep).toHaveBeenCalledWith(0, 0)
    expect(mockAudioEngine.toggleStep).toHaveBeenCalledWith(1, 4)
    expect(mockAudioEngine.toggleStep).toHaveBeenCalledWith(2, 8)
  })

  it('creates new pattern when New Pattern button is clicked', () => {
    render(<Sequencer {...defaultProps} />)
    
    const newPatternButton = screen.getByText('New Pattern')
    fireEvent.click(newPatternButton)
    
    expect(mockAudioEngine.addPattern).toHaveBeenCalled()
  })

  it('displays pattern length', () => {
    mockAudioEngine.getCurrentPattern.mockReturnValue({
      id: 'pattern-1',
      name: 'Pattern 1',
      length: 32,
      steps: Array(16).fill(null).map(() => Array(32).fill(false)),
      velocities: Array(16).fill(null).map(() => Array(32).fill(0.8))
    })

    render(<Sequencer {...defaultProps} />)
    
    expect(screen.getByText('Pattern Length: 32 steps')).toBeInTheDocument()
  })

  it('renders correct number of steps based on pattern length', () => {
    mockAudioEngine.getCurrentPattern.mockReturnValue({
      id: 'pattern-1',
      name: 'Pattern 1',
      length: 8,
      steps: Array(16).fill(null).map(() => Array(8).fill(false)),
      velocities: Array(16).fill(null).map(() => Array(8).fill(0.8))
    })

    render(<Sequencer {...defaultProps} />)
    
    // Should only show 8 step numbers
    const stepNumbers = document.querySelectorAll('.w-8.text-xs')
    expect(stepNumbers).toHaveLength(8)
  })

  it('updates current step position', async () => {
    mockAudioEngine.getCurrentStep.mockReturnValue(5)
    
    render(<Sequencer {...defaultProps} />)
    
    // Component should poll for current step
    await waitFor(() => {
      const currentStepElements = document.querySelectorAll('.current')
      expect(currentStepElements.length).toBeGreaterThan(0)
    })
  })

  it('displays sample names for each pad', () => {
    mockAudioEngine.getSample.mockImplementation((padIndex: number) => ({
      id: `sample-${padIndex}`,
      name: `Sample ${padIndex + 1}`,
      buffer: null,
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    }))

    render(<Sequencer {...defaultProps} />)
    
    expect(screen.getByText('Sample 1')).toBeInTheDocument()
    expect(screen.getByText('Sample 5')).toBeInTheDocument()
  })

  it('renders instructions', () => {
    render(<Sequencer {...defaultProps} />)
    
    expect(screen.getByText(/Click steps to toggle them on\/off/)).toBeInTheDocument()
    expect(screen.getByText(/Green border indicates current playing step/)).toBeInTheDocument()
  })

  it('applies active class to active steps', () => {
    const mockPattern = {
      id: 'pattern-1',
      name: 'Pattern 1',
      length: 16,
      steps: Array(16).fill(null).map(() => Array(16).fill(false)),
      velocities: Array(16).fill(null).map(() => Array(16).fill(0.8))
    }
    // Set first step of first pad as active
    mockPattern.steps[0][0] = true
    
    mockAudioEngine.getCurrentPattern.mockReturnValue(mockPattern)

    render(<Sequencer {...defaultProps} />)
    
    const activeSteps = document.querySelectorAll('.step.active')
    expect(activeSteps.length).toBeGreaterThan(0)
  })
}) 