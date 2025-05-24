import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WaveformEditor } from '../WaveformEditor'
import { createMockAudioEngine } from '../../test/mocks/AudioEngine'
import WaveSurfer from 'wavesurfer.js'

// Mock WaveSurfer
vi.mock('wavesurfer.js', () => ({
  default: {
    create: vi.fn()
  }
}))

const mockedWaveSurfer = vi.mocked(WaveSurfer)

describe('WaveformEditor', () => {
  let mockAudioEngine: any
  let mockWaveSurferInstance: any

  beforeEach(() => {
    mockAudioEngine = createMockAudioEngine()
    mockWaveSurferInstance = {
      on: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
      destroy: vi.fn()
    }
    
    mockedWaveSurfer.create.mockReturnValue(mockWaveSurferInstance)
    vi.clearAllMocks()
  })

  it('renders empty state when no sample is loaded', () => {
    // Mock getSample to return a sample without buffer
    mockAudioEngine.getSample.mockReturnValue({
      id: 'sample-0',
      name: 'Pad 1',
      buffer: null,
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    })

    render(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={0} />)
    
    expect(screen.getByText('WAVEFORM EDITOR')).toBeInTheDocument()
    expect(screen.getByText('No sample loaded for Pad 1')).toBeInTheDocument()
    expect(screen.getByText('Load a sample in the Pads view to edit it here.')).toBeInTheDocument()
  })

  it('renders waveform editor when sample is loaded', () => {
    // Mock getSample to return a sample with buffer
    const mockBuffer = {
      get: vi.fn().mockReturnValue({
        numberOfChannels: 2,
        getChannelData: vi.fn().mockReturnValue(new Float32Array([0.1, 0.2, 0.3])),
        duration: 2.5,
        sampleRate: 44100,
        length: 110250
      }),
      duration: 2.5,
      sampleRate: 44100,
      length: 110250
    }

    mockAudioEngine.getSample.mockReturnValue({
      id: 'sample-0',
      name: 'Kick.wav',
      buffer: mockBuffer,
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    })

    render(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={0} />)
    
    expect(screen.getByText('WAVEFORM EDITOR')).toBeInTheDocument()
    expect(screen.getByText('Pad 1: Kick.wav')).toBeInTheDocument()
  })

  it('creates WaveSurfer instance when sample has buffer', () => {
    const mockBuffer = {
      get: vi.fn().mockReturnValue({
        numberOfChannels: 2,
        getChannelData: vi.fn().mockReturnValue(new Float32Array([0.1, 0.2, 0.3])),
        duration: 2.5
      }),
      duration: 2.5
    }

    mockAudioEngine.getSample.mockReturnValue({
      id: 'sample-0',
      name: 'Kick.wav',
      buffer: mockBuffer,
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    })

    render(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={0} />)
    
    expect(WaveSurfer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        waveColor: '#ff6b35',
        progressColor: '#4ade80',
        cursorColor: '#3b82f6',
        barWidth: 2,
        height: 100
      })
    )
  })

  it('handles play button click', () => {
    const mockBuffer = {
      get: vi.fn().mockReturnValue(null),
      duration: 2.5
    }

    mockAudioEngine.getSample.mockReturnValue({
      id: 'sample-0',
      name: 'Kick.wav',
      buffer: mockBuffer,
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    })

    render(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={0} />)
    
    const playButton = screen.getByRole('button', { name: /play/i })
    fireEvent.click(playButton)
    
    expect(mockWaveSurferInstance.play).toHaveBeenCalled()
  })

  it('handles stop button click', () => {
    const mockBuffer = {
      get: vi.fn().mockReturnValue(null),
      duration: 2.5
    }

    mockAudioEngine.getSample.mockReturnValue({
      id: 'sample-0',
      name: 'Kick.wav',
      buffer: mockBuffer,
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    })

    render(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={0} />)
    
    const stopButton = screen.getByRole('button', { name: /stop/i })
    fireEvent.click(stopButton)
    
    expect(mockWaveSurferInstance.stop).toHaveBeenCalled()
  })

  it('handles start time slider change', () => {
    const mockBuffer = {
      get: vi.fn().mockReturnValue(null),
      duration: 2.5
    }

    mockAudioEngine.getSample.mockReturnValue({
      id: 'sample-0',
      name: 'Kick.wav',
      buffer: mockBuffer,
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    })

    render(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={0} />)
    
    const startTimeSlider = screen.getByLabelText('Start Time')
    fireEvent.change(startTimeSlider, { target: { value: '0.2' } })
    
    expect(mockAudioEngine.setSampleProperty).toHaveBeenCalledWith(0, 'startTime', 0.2)
  })

  it('handles end time slider change', () => {
    const mockBuffer = {
      get: vi.fn().mockReturnValue(null),
      duration: 2.5
    }

    mockAudioEngine.getSample.mockReturnValue({
      id: 'sample-0',
      name: 'Kick.wav',
      buffer: mockBuffer,
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    })

    render(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={0} />)
    
    const endTimeSlider = screen.getByLabelText('End Time')
    fireEvent.change(endTimeSlider, { target: { value: '0.8' } })
    
    expect(mockAudioEngine.setSampleProperty).toHaveBeenCalledWith(0, 'endTime', 0.8)
  })

  it('handles volume slider change', () => {
    const mockBuffer = {
      get: vi.fn().mockReturnValue(null),
      duration: 2.5
    }

    mockAudioEngine.getSample.mockReturnValue({
      id: 'sample-0',
      name: 'Kick.wav',
      buffer: mockBuffer,
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    })

    render(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={0} />)
    
    const volumeSlider = screen.getByRole('slider', { name: /volume/i })
    fireEvent.change(volumeSlider, { target: { value: '0.6' } })
    
    expect(mockAudioEngine.setSampleProperty).toHaveBeenCalledWith(0, 'volume', 0.6)
  })

  it('handles normalize button click', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    const mockBuffer = {
      get: vi.fn().mockReturnValue(null),
      duration: 2.5
    }

    mockAudioEngine.getSample.mockReturnValue({
      id: 'sample-0',
      name: 'Kick.wav',
      buffer: mockBuffer,
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    })

    render(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={0} />)
    
    const normalizeButton = screen.getByText('Normalize')
    fireEvent.click(normalizeButton)
    
    expect(consoleSpy).toHaveBeenCalledWith('Normalize function would be implemented here')
    consoleSpy.mockRestore()
  })

  it('handles reverse button click', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    const mockBuffer = {
      get: vi.fn().mockReturnValue(null),
      duration: 2.5
    }

    mockAudioEngine.getSample.mockReturnValue({
      id: 'sample-0',
      name: 'Kick.wav',
      buffer: mockBuffer,
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    })

    render(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={0} />)
    
    const reverseButton = screen.getByText('Reverse')
    fireEvent.click(reverseButton)
    
    expect(consoleSpy).toHaveBeenCalledWith('Reverse function would be implemented here')
    consoleSpy.mockRestore()
  })

  it('handles test sample button click', () => {
    const mockBuffer = {
      get: vi.fn().mockReturnValue(null),
      duration: 2.5
    }

    mockAudioEngine.getSample.mockReturnValue({
      id: 'sample-0',
      name: 'Kick.wav',
      buffer: mockBuffer,
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    })

    render(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={0} />)
    
    const testButton = screen.getByText('Test Sample')
    fireEvent.click(testButton)
    
    expect(mockAudioEngine.triggerPad).toHaveBeenCalledWith(0, 0.8)
  })

  it('displays sample information correctly', () => {
    const mockBuffer = {
      get: vi.fn().mockReturnValue(null),
      duration: 2.5,
      sampleRate: 44100,
      numberOfChannels: 2,
      length: 110250
    }

    mockAudioEngine.getSample.mockReturnValue({
      id: 'sample-0',
      name: 'Kick.wav',
      buffer: mockBuffer,
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    })

    render(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={0} />)
    
    expect(screen.getByText('Sample Info')).toBeInTheDocument()
    
    // Use more specific selectors to find the sample info section
    const sampleInfoSection = screen.getByText('Sample Info').closest('div')
    expect(sampleInfoSection).toHaveTextContent('2.50s') // Duration
    expect(sampleInfoSection).toHaveTextContent('44100 Hz') // Sample rate
    expect(sampleInfoSection).toHaveTextContent('2') // Channels
    expect(sampleInfoSection).toHaveTextContent('108 KB') // Size
  })

  it('updates when selectedPad changes', () => {
    const mockBuffer = {
      get: vi.fn().mockReturnValue(null),
      duration: 2.5
    }

    mockAudioEngine.getSample.mockReturnValue({
      id: 'sample-0',
      name: 'Kick.wav',
      buffer: mockBuffer,
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    })

    const { rerender } = render(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={0} />)
    
    expect(mockAudioEngine.getSample).toHaveBeenCalledWith(0)
    
    rerender(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={1} />)
    
    expect(mockAudioEngine.getSample).toHaveBeenCalledWith(1)
  })

  it('cleans up WaveSurfer instance on unmount', () => {
    const mockBuffer = {
      get: vi.fn().mockReturnValue(null),
      duration: 2.5
    }

    mockAudioEngine.getSample.mockReturnValue({
      id: 'sample-0',
      name: 'Kick.wav',
      buffer: mockBuffer,
      startTime: 0,
      endTime: 1,
      volume: 0.8,
      pan: 0
    })

    const { unmount } = render(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={0} />)
    
    unmount()
    
    expect(mockWaveSurferInstance.destroy).toHaveBeenCalled()
  })

  it('displays time values for start and end time sliders', () => {
    const mockBuffer = {
      get: vi.fn().mockReturnValue(null),
      duration: 2.5
    }

    mockAudioEngine.getSample.mockReturnValue({
      id: 'sample-0',
      name: 'Kick.wav',
      buffer: mockBuffer,
      startTime: 0.2,
      endTime: 0.8,
      volume: 0.8,
      pan: 0
    })

    render(<WaveformEditor audioEngine={mockAudioEngine} selectedPad={0} />)
    
    expect(screen.getByText('0.50s (start)')).toBeInTheDocument() // Start time display
    expect(screen.getByText('2.00s (end)')).toBeInTheDocument() // End time display
  })
}) 