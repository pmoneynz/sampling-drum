import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PadGrid } from '../PadGrid'
import { createMockAudioEngine } from '../../test/mocks/AudioEngine'
import type { AudioEngine } from '../../audio/AudioEngine'

// Mock the lucide-react icons
vi.mock('lucide-react', () => ({
  Upload: ({ size, ...props }: any) => <div data-testid="upload-icon" {...props} />
}))

describe('PadGrid', () => {
  let mockAudioEngine: ReturnType<typeof createMockAudioEngine>
  const mockOnPadSelect = vi.fn()

  const defaultProps = {
    audioEngine: null as any as AudioEngine,
    selectedPad: 0,
    onPadSelect: mockOnPadSelect
  }

  beforeEach(() => {
    mockAudioEngine = createMockAudioEngine()
    defaultProps.audioEngine = mockAudioEngine as any as AudioEngine
    vi.clearAllMocks()
  })

  it('renders the pad grid title and description', () => {
    render(<PadGrid {...defaultProps} />)
    
    expect(screen.getByText('PAD GRID')).toBeInTheDocument()
    expect(screen.getByText('Click pads to trigger samples, use upload button to load samples')).toBeInTheDocument()
  })

  it('renders 16 pads', () => {
    render(<PadGrid {...defaultProps} />)
    
    // Check that we have 16 pad containers
    const padContainers = document.querySelectorAll('.pad')
    expect(padContainers).toHaveLength(16)
  })

  it('displays keyboard shortcuts for each pad', () => {
    render(<PadGrid {...defaultProps} />)
    
    // Check some key mappings - look specifically in the key label areas
    expect(screen.getByText('Q')).toBeInTheDocument() // Pad 1
    expect(screen.getByText('W')).toBeInTheDocument() // Pad 2
    expect(screen.getByText('A')).toBeInTheDocument() // Pad 5
    
    // Find elements with the keyboard shortcut styling
    const keyLabels = document.querySelectorAll('.text-mpc-accent')
    expect(keyLabels.length).toBeGreaterThan(0)
  })

  it('shows audio activation warning initially', () => {
    render(<PadGrid {...defaultProps} />)
    
    expect(screen.getByText('⚠️ Click any pad to activate audio')).toBeInTheDocument()
  })

  it('triggers pad and calls onPadSelect when pad is clicked', async () => {
    render(<PadGrid {...defaultProps} />)
    
    // Find the first pad container directly
    const firstPad = document.querySelector('.pad')!
    fireEvent.click(firstPad)
    
    // Wait for async operations to complete
    await waitFor(() => {
      expect(mockOnPadSelect).toHaveBeenCalledWith(0)
      expect(mockAudioEngine.triggerPad).toHaveBeenCalledWith(0, 0.8)
      expect(mockAudioEngine.init).toHaveBeenCalled()
    })
  })

  it('highlights selected pad', () => {
    render(<PadGrid {...defaultProps} selectedPad={5} />)
    
    // Find the 6th pad (index 5) directly
    const padContainers = document.querySelectorAll('.pad')
    const selectedPad = padContainers[5]
    expect(selectedPad).toHaveClass('ring-2', 'ring-mpc-blue')
  })

  it('shows upload button for pads without samples', () => {
    render(<PadGrid {...defaultProps} />)
    
    const uploadIcons = screen.getAllByTestId('upload-icon')
    expect(uploadIcons).toHaveLength(16) // All pads start empty
  })

  it('displays sample name when pad has a sample', () => {
    // Mock a pad with a sample
    const sampleName = 'test-sample.wav'
    mockAudioEngine.getSample.mockImplementation((padIndex: number) => ({
      id: `sample-${padIndex}`,
      name: padIndex === 0 ? sampleName : `Pad ${padIndex + 1}`,
      buffer: padIndex === 0 ? {} : null, // Mock buffer for pad 0
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    }))

    render(<PadGrid {...defaultProps} />)
    
    expect(screen.getByText(sampleName)).toBeInTheDocument()
  })

  it('shows volume information for pads with samples', () => {
    // Mock a pad with a sample
    mockAudioEngine.getSample.mockImplementation((padIndex: number) => ({
      id: `sample-${padIndex}`,
      name: `Pad ${padIndex + 1}`,
      buffer: padIndex === 0 ? {} : null, // Mock buffer for pad 0
      startTime: 0,
      endTime: 1,
      volume: 0.7,
      pan: 0
    }))

    render(<PadGrid {...defaultProps} />)
    
    expect(screen.getByText('Vol: 70%')).toBeInTheDocument()
  })

  it('shows replace button for pads with samples', () => {
    // Mock a pad with a sample
    mockAudioEngine.getSample.mockImplementation((padIndex: number) => ({
      id: `sample-${padIndex}`,
      name: `Pad ${padIndex + 1}`,
      buffer: padIndex === 0 ? {} : null, // Mock buffer for pad 0
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    }))

    render(<PadGrid {...defaultProps} />)
    
    expect(screen.getByText('Replace')).toBeInTheDocument()
  })

  it('handles keyboard input for pad triggering', async () => {
    render(<PadGrid {...defaultProps} />)
    
    // Trigger pad 0 with 'q' key
    fireEvent.keyDown(window, { key: 'q' })
    
    await waitFor(() => {
      expect(mockAudioEngine.triggerPad).toHaveBeenCalledWith(0, 0.8)
    })
  })

  it('handles keyboard input case insensitively', async () => {
    render(<PadGrid {...defaultProps} />)
    
    // Trigger pad 0 with uppercase 'Q'
    fireEvent.keyDown(window, { key: 'Q' })
    
    await waitFor(() => {
      expect(mockAudioEngine.triggerPad).toHaveBeenCalledWith(0, 0.8)
    })
  })

  it('prevents multiple triggers for the same key held down', async () => {
    render(<PadGrid {...defaultProps} />)
    
    // First keydown - should trigger
    fireEvent.keyDown(window, { key: 'q' })
    
    await waitFor(() => {
      expect(mockAudioEngine.triggerPad).toHaveBeenCalledTimes(1)
    })
    
    // Second keydown (key held) - should not trigger again
    fireEvent.keyDown(window, { key: 'q' })
    
    // Should still be only 1 call since key is held down
    expect(mockAudioEngine.triggerPad).toHaveBeenCalledTimes(1)
  })

  it('resets active pad state on key up', async () => {
    render(<PadGrid {...defaultProps} />)
    
    // Press and release key
    fireEvent.keyDown(window, { key: 'q' })
    fireEvent.keyUp(window, { key: 'q' })
    
    // Press same key again - should trigger again
    fireEvent.keyDown(window, { key: 'q' })
    
    await waitFor(() => {
      expect(mockAudioEngine.triggerPad).toHaveBeenCalledTimes(2)
    })
  })

  it('creates file input when upload button is clicked', async () => {
    const mockClick = vi.fn()
    
    // First render the component
    render(<PadGrid {...defaultProps} />)
    
    // Then set up the mock after rendering
    const originalCreateElement = document.createElement
    
    try {
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'input') {
          return {
            type: '',
            accept: '',
            onchange: null,
            click: mockClick,
            files: null
          } as any
        }
        return originalCreateElement.call(document, tagName)
      }) as any
      
      const uploadIcon = screen.getAllByTestId('upload-icon')[0]
      const uploadButton = uploadIcon.closest('button')!
      
      // Click and wait for async operations
      fireEvent.click(uploadButton)
      
      await waitFor(() => {
        expect(document.createElement).toHaveBeenCalledWith('input')
        expect(mockClick).toHaveBeenCalled()
      })
    } finally {
      // Always restore original function
      document.createElement = originalCreateElement
    }
  })

  it('displays keyboard shortcuts help text', () => {
    render(<PadGrid {...defaultProps} />)
    
    expect(screen.getByText('Keyboard shortcuts: Q-R, A-F, Z-V, 1-4')).toBeInTheDocument()
  })

  it('shows audio activation message initially', () => {
    render(<PadGrid {...defaultProps} />)
    
    expect(screen.getByText('🔊 Audio will activate on first interaction (required by browsers)')).toBeInTheDocument()
  })
}) 