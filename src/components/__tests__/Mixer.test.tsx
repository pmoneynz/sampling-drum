import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Mixer } from '../Mixer'
import { createMockAudioEngine } from '../../test/mocks/AudioEngine'

describe('Mixer', () => {
  let mockAudioEngine: any

  beforeEach(() => {
    mockAudioEngine = createMockAudioEngine()
    vi.clearAllMocks()
  })

  it('renders the mixer title', () => {
    render(<Mixer audioEngine={mockAudioEngine} />)
    expect(screen.getByText('MIXER')).toBeInTheDocument()
  })

  it('renders master volume control', () => {
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    expect(screen.getByText('Master:')).toBeInTheDocument()
    expect(screen.getByLabelText('Master volume control')).toBeInTheDocument()
    
    // Find the master volume display specifically (should be in the header area)
    const masterVolumeDisplay = screen.getByText('Master:').parentElement?.querySelector('span')
    expect(masterVolumeDisplay).toHaveTextContent('80%')
  })

  it('renders mixer channels for all pads', () => {
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    for (let i = 1; i <= 16; i++) {
      expect(screen.getByText(`PAD ${i}`)).toBeInTheDocument()
    }
  })

  it('updates master volume when slider changes', () => {
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    const masterVolumeSlider = screen.getByLabelText('Master volume control')
    fireEvent.change(masterVolumeSlider, { target: { value: '0.5' } })
    
    expect(mockAudioEngine.setMasterVolume).toHaveBeenCalledWith(0.5)
  })

  it('handles individual pad volume changes', () => {
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    const volumeSliders = screen.getAllByLabelText(/Volume for/)
    const firstPadVolumeSlider = volumeSliders[0]
    
    fireEvent.change(firstPadVolumeSlider, { target: { value: '0.6' } })
    
    expect(mockAudioEngine.setSampleProperty).toHaveBeenCalledWith(0, 'volume', 0.6)
  })

  it('handles pan control changes', () => {
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    const panSliders = screen.getAllByLabelText(/Pan control for/)
    const firstPadPanSlider = panSliders[0]
    
    fireEvent.change(firstPadPanSlider, { target: { value: '0.5' } })
    
    expect(mockAudioEngine.setSampleProperty).toHaveBeenCalledWith(0, 'pan', 0.5)
  })

  it('displays pan values correctly', () => {
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    // Check for center pan display (default)
    expect(screen.getAllByText('C')).toHaveLength(16) // All pads start at center
  })

  it('toggles mute functionality', () => {
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    const muteButtons = screen.getAllByText('MUTE')
    const firstMuteButton = muteButtons[0]
    
    // Click to mute
    fireEvent.click(firstMuteButton)
    expect(mockAudioEngine.setSampleProperty).toHaveBeenCalledWith(0, 'volume', 0)
  })

  it('handles solo functionality', () => {
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    const soloButtons = screen.getAllByText('SOLO')
    const firstSoloButton = soloButtons[0]
    
    fireEvent.click(firstSoloButton)
    
    // Should set first pad to volume 0.8 and others to 0
    expect(mockAudioEngine.setSampleProperty).toHaveBeenCalledWith(0, 'volume', 0.8)
    
    // Check that other pads were muted
    for (let i = 1; i < 16; i++) {
      expect(mockAudioEngine.setSampleProperty).toHaveBeenCalledWith(i, 'volume', 0)
    }
  })

  it('triggers pad playback when play button is clicked', () => {
    // Mock the first sample to have a buffer so the play button is enabled
    const samplesWithBuffer = mockAudioEngine.getSamples()
    samplesWithBuffer[0].buffer = {} // Mock buffer
    mockAudioEngine.getSamples.mockReturnValue(samplesWithBuffer)
    
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    const playButtons = screen.getAllByText('PLAY')
    const firstPlayButton = playButtons[0]
    
    fireEvent.click(firstPlayButton)
    
    expect(mockAudioEngine.triggerPad).toHaveBeenCalledWith(0, 0.8) // Default volume
  })

  it('handles reset all volumes button', () => {
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    const resetAllButton = screen.getByText('Reset All Volumes')
    fireEvent.click(resetAllButton)
    
    // Should reset all 16 pads to volume 0.8
    for (let i = 0; i < 16; i++) {
      expect(mockAudioEngine.setSampleProperty).toHaveBeenCalledWith(i, 'volume', 0.8)
    }
  })

  it('handles center all pans button', () => {
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    const centerAllButton = screen.getByText('Center All Pans')
    fireEvent.click(centerAllButton)
    
    // Should center all 16 pads pan to 0
    for (let i = 0; i < 16; i++) {
      expect(mockAudioEngine.setSampleProperty).toHaveBeenCalledWith(i, 'pan', 0)
    }
  })

  it('handles mute all button', () => {
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    const muteAllButton = screen.getByText('Mute All')
    fireEvent.click(muteAllButton)
    
    // Should mute all 16 pads
    for (let i = 0; i < 16; i++) {
      expect(mockAudioEngine.setSampleProperty).toHaveBeenCalledWith(i, 'volume', 0)
    }
  })

  it('updates samples periodically via useEffect', async () => {
    vi.useFakeTimers()
    
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    // Fast-forward time to trigger the interval
    vi.advanceTimersByTime(200)
    
    // Check that the functions were called during initial render and interval
    expect(mockAudioEngine.getSamples).toHaveBeenCalled()
    expect(mockAudioEngine.getMasterVolume).toHaveBeenCalled()
    
    vi.useRealTimers()
  })

  it('displays volume percentages correctly', () => {
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    // Check for volume percentage displays (default 80%)
    const volumePercentages = screen.getAllByText('80%')
    expect(volumePercentages.length).toBeGreaterThan(0)
  })

  it('renders instructions text', () => {
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    expect(screen.getByText('Adjust volume and pan for each pad. Use MUTE/SOLO for quick mixing.')).toBeInTheDocument()
    expect(screen.getByText('Click PLAY to test individual samples.')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<Mixer audioEngine={mockAudioEngine} />)
    
    const masterVolumeSlider = screen.getByLabelText('Master volume control')
    expect(masterVolumeSlider).toHaveAttribute('type', 'range')
    expect(masterVolumeSlider).toHaveAttribute('min', '0')
    expect(masterVolumeSlider).toHaveAttribute('max', '1')
    
    const volumeSliders = screen.getAllByLabelText(/Volume for/)
    volumeSliders.forEach(slider => {
      expect(slider).toHaveAttribute('type', 'range')
      expect(slider).toHaveAttribute('min', '0')
      expect(slider).toHaveAttribute('max', '1')
    })
  })
}) 