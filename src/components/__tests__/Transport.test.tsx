import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Transport } from '../Transport'
import { createMockAudioEngine } from '../../test/mocks/AudioEngine'
import type { AudioEngine } from '../../audio/AudioEngine'

// Mock the lucide-react icons
vi.mock('lucide-react', () => ({
  Play: ({ size, fill, ...props }: any) => <div data-testid="play-icon" {...props}>{fill ? 'filled' : 'outline'}</div>,
  Square: ({ size, ...props }: any) => <div data-testid="square-icon" {...props} />,
  Circle: ({ size, fill, ...props }: any) => <div data-testid="circle-icon" {...props}>{fill ? 'filled' : 'outline'}</div>,
  RotateCcw: ({ size, ...props }: any) => <div data-testid="rotate-icon" {...props} />
}))

describe('Transport', () => {
  let mockAudioEngine: ReturnType<typeof createMockAudioEngine>

  beforeEach(() => {
    mockAudioEngine = createMockAudioEngine()
    vi.clearAllMocks()
  })

  it('renders transport controls', () => {
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    expect(screen.getByTestId('play-icon')).toBeInTheDocument()
    expect(screen.getByTestId('square-icon')).toBeInTheDocument()
    expect(screen.getByTestId('circle-icon')).toBeInTheDocument()
    expect(screen.getByTestId('rotate-icon')).toBeInTheDocument()
  })

  it('renders step indicators', () => {
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    expect(screen.getByText('STEP:')).toBeInTheDocument()
    
    // Should have 16 step indicators
    const stepIndicators = document.querySelectorAll('.w-3.h-3.rounded-full')
    expect(stepIndicators).toHaveLength(16)
  })

  it('renders BPM control', () => {
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    expect(screen.getByText('BPM:')).toBeInTheDocument()
    
    const bpmInput = screen.getByDisplayValue('120')
    expect(bpmInput).toBeInTheDocument()
    expect(bpmInput).toHaveAttribute('type', 'number')
    expect(bpmInput).toHaveAttribute('min', '60')
    expect(bpmInput).toHaveAttribute('max', '200')
  })

  it('calls audioEngine.play when play button is clicked and not playing', () => {
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    const playButton = screen.getByTestId('play-icon').closest('button')!
    fireEvent.click(playButton)
    
    expect(mockAudioEngine.play).toHaveBeenCalledOnce()
  })

  it('calls audioEngine.pause when play button is clicked and playing', async () => {
    // Mock the engine as playing
    mockAudioEngine.getIsPlaying.mockReturnValue(true)
    
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    // Wait for the component to update with playing state
    await waitFor(() => {
      const playButton = screen.getByTestId('play-icon').closest('button')!
      expect(playButton).toHaveClass('bg-mpc-green')
    })
    
    const playButton = screen.getByTestId('play-icon').closest('button')!
    fireEvent.click(playButton)
    
    expect(mockAudioEngine.pause).toHaveBeenCalledOnce()
  })

  it('calls audioEngine.stop when stop button is clicked', () => {
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    const stopButton = screen.getByTestId('square-icon').closest('button')!
    fireEvent.click(stopButton)
    
    expect(mockAudioEngine.stop).toHaveBeenCalledOnce()
  })

  it('calls audioEngine.startRecording when record button is clicked and not recording', () => {
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    const recordButton = screen.getByTestId('circle-icon').closest('button')!
    fireEvent.click(recordButton)
    
    expect(mockAudioEngine.startRecording).toHaveBeenCalledOnce()
  })

  it('calls audioEngine.stopRecording when record button is clicked and recording', async () => {
    // Mock the engine as recording
    mockAudioEngine.getIsRecording.mockReturnValue(true)
    
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    // Wait for the component to update with recording state
    await waitFor(() => {
      const recordButton = screen.getByTestId('circle-icon').closest('button')!
      expect(recordButton).toHaveClass('bg-red-600')
    })
    
    const recordButton = screen.getByTestId('circle-icon').closest('button')!
    fireEvent.click(recordButton)
    
    expect(mockAudioEngine.stopRecording).toHaveBeenCalledOnce()
  })

  it('updates BPM when input changes', () => {
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    const bpmInput = screen.getByDisplayValue('120')
    fireEvent.change(bpmInput, { target: { value: '140' } })
    
    expect(mockAudioEngine.setBPM).toHaveBeenCalledWith(140)
  })

  it('increments BPM when + button is clicked', () => {
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    const incrementButton = screen.getByText('+')
    fireEvent.click(incrementButton)
    
    expect(mockAudioEngine.setBPM).toHaveBeenCalledWith(121)
  })

  it('decrements BPM when - button is clicked', () => {
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    const decrementButton = screen.getByText('-')
    fireEvent.click(decrementButton)
    
    expect(mockAudioEngine.setBPM).toHaveBeenCalledWith(119)
  })

  it('does not allow BPM below 60', () => {
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    // Change the BPM input to 60 first
    const bpmInput = screen.getByDisplayValue('120')
    fireEvent.change(bpmInput, { target: { value: '60' } })
    
    // Now try to decrement - should not go below 60
    const decrementButton = screen.getByText('-')
    fireEvent.click(decrementButton)
    
    expect(mockAudioEngine.setBPM).toHaveBeenCalledWith(60) // Should stay at 60
  })

  it('does not allow BPM above 200', () => {
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    // Change the BPM input to 200 first
    const bpmInput = screen.getByDisplayValue('120')
    fireEvent.change(bpmInput, { target: { value: '200' } })
    
    // Now try to increment - should not go above 200
    const incrementButton = screen.getByText('+')
    fireEvent.click(incrementButton)
    
    expect(mockAudioEngine.setBPM).toHaveBeenCalledWith(200) // Should stay at 200
  })

  it('displays correct status when playing', async () => {
    mockAudioEngine.getIsPlaying.mockReturnValue(true)
    mockAudioEngine.getIsRecording.mockReturnValue(false)
    
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    await waitFor(() => {
      expect(screen.getByText('▶ PLAY')).toBeInTheDocument()
    })
  })

  it('displays correct status when recording', async () => {
    mockAudioEngine.getIsPlaying.mockReturnValue(false)
    mockAudioEngine.getIsRecording.mockReturnValue(true)
    
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    await waitFor(() => {
      expect(screen.getByText('● REC')).toBeInTheDocument()
    })
  })

  it('displays correct status when stopped', async () => {
    mockAudioEngine.getIsPlaying.mockReturnValue(false)
    mockAudioEngine.getIsRecording.mockReturnValue(false)
    
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    await waitFor(() => {
      expect(screen.getByText('⏸ STOP')).toBeInTheDocument()
    })
  })

  it('highlights current step', async () => {
    mockAudioEngine.getCurrentStep.mockReturnValue(5)
    
    render(<Transport audioEngine={mockAudioEngine as any as AudioEngine} />)
    
    await waitFor(() => {
      const stepIndicators = document.querySelectorAll('.w-3.h-3.rounded-full')
      expect(stepIndicators[5]).toHaveClass('bg-mpc-green')
    })
  })
}) 