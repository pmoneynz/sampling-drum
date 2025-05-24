import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../Header'
import type { View } from '../../App'

describe('Header', () => {
  const mockOnViewChange = vi.fn()
  
  const defaultProps = {
    currentView: 'pads' as View,
    onViewChange: mockOnViewChange
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the header title', () => {
    render(<Header {...defaultProps} />)
    expect(screen.getByText('SAMPLING DRUM')).toBeInTheDocument()
  })

  it('renders the version number', () => {
    render(<Header {...defaultProps} />)
    expect(screen.getByText('v1.0')).toBeInTheDocument()
  })

  it('renders all navigation buttons', () => {
    render(<Header {...defaultProps} />)
    
    expect(screen.getByText('PADS')).toBeInTheDocument()
    expect(screen.getByText('SEQUENCER')).toBeInTheDocument()
    expect(screen.getByText('WAVEFORM')).toBeInTheDocument()
    expect(screen.getByText('MIXER')).toBeInTheDocument()
  })

  it('highlights the current view', () => {
    render(<Header {...defaultProps} />)
    
    const padsButton = screen.getByText('PADS')
    expect(padsButton).toHaveClass('bg-mpc-accent')
    expect(padsButton).toHaveClass('text-white')
  })

  it('calls onViewChange when a different view is clicked', () => {
    render(<Header {...defaultProps} />)
    
    const sequencerButton = screen.getByText('SEQUENCER')
    fireEvent.click(sequencerButton)
    
    expect(mockOnViewChange).toHaveBeenCalledWith('sequencer')
  })

  it('applies hover styles to non-active buttons', () => {
    render(<Header {...defaultProps} />)
    
    const sequencerButton = screen.getByText('SEQUENCER')
    expect(sequencerButton).toHaveClass('hover:text-white')
    expect(sequencerButton).toHaveClass('hover:bg-mpc-light')
  })

  it('renders correctly with different current views', () => {
    const { rerender } = render(<Header {...defaultProps} />)
    
    // Test with sequencer view active
    rerender(<Header currentView="sequencer" onViewChange={mockOnViewChange} />)
    
    const sequencerButton = screen.getByText('SEQUENCER')
    expect(sequencerButton).toHaveClass('bg-mpc-accent')
    
    const padsButton = screen.getByText('PADS')
    expect(padsButton).not.toHaveClass('bg-mpc-accent')
  })

  it('maintains accessibility with proper button elements', () => {
    render(<Header {...defaultProps} />)
    
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)
    
    buttons.forEach(button => {
      expect(button.tagName).toBe('BUTTON')
    })
  })
}) 