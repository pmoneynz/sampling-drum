import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FileManager } from '../FileManager'
import { createMockAudioEngine } from '../../test/mocks/AudioEngine'

describe('FileManager', () => {
  let mockAudioEngine: any

  beforeEach(() => {
    mockAudioEngine = createMockAudioEngine()
    vi.clearAllMocks()
  })

  it('renders closed state by default', () => {
    render(<FileManager audioEngine={mockAudioEngine} />)
    
    expect(screen.getByTitle('File Manager')).toBeInTheDocument()
    expect(screen.queryByText('FILE MANAGER')).not.toBeInTheDocument()
  })

  it('opens file manager when button is clicked', () => {
    render(<FileManager audioEngine={mockAudioEngine} />)
    
    const openButton = screen.getByTitle('File Manager')
    fireEvent.click(openButton)
    
    expect(screen.getByText('FILE MANAGER')).toBeInTheDocument()
  })

  it('closes file manager when close button is clicked', () => {
    render(<FileManager audioEngine={mockAudioEngine} />)
    
    // Open the file manager
    fireEvent.click(screen.getByTitle('File Manager'))
    expect(screen.getByText('FILE MANAGER')).toBeInTheDocument()
    
    // Close it
    fireEvent.click(screen.getByText('✕'))
    expect(screen.queryByText('FILE MANAGER')).not.toBeInTheDocument()
  })

  it('renders save project section', async () => {
    render(<FileManager audioEngine={mockAudioEngine} />)
    
    fireEvent.click(screen.getByTitle('File Manager'))
    
    await waitFor(() => {
      expect(screen.getByText('Save Current Project')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Project name')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
    })
  })

  it('updates project name input', async () => {
    render(<FileManager audioEngine={mockAudioEngine} />)
    
    fireEvent.click(screen.getByTitle('File Manager'))
    
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Project name')
      fireEvent.change(nameInput, { target: { value: 'My Test Project' } })
      expect(nameInput).toHaveValue('My Test Project')
    })
  })

  it('renders import/export section', async () => {
    render(<FileManager audioEngine={mockAudioEngine} />)
    
    fireEvent.click(screen.getByTitle('File Manager'))
    
    await waitFor(() => {
      expect(screen.getByText('Import / Export')).toBeInTheDocument()
      expect(screen.getByText('Import Project')).toBeInTheDocument()
      expect(screen.getByText('Export Project')).toBeInTheDocument()
    })
  })

  it('renders saved projects section', async () => {
    render(<FileManager audioEngine={mockAudioEngine} />)
    
    fireEvent.click(screen.getByTitle('File Manager'))
    
    await waitFor(() => {
      expect(screen.getByText('Saved Projects')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', async () => {
    render(<FileManager audioEngine={mockAudioEngine} />)
    
    fireEvent.click(screen.getByTitle('File Manager'))
    
    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows no saved projects message when empty', async () => {
    render(<FileManager audioEngine={mockAudioEngine} />)
    
    fireEvent.click(screen.getByTitle('File Manager'))
    
    await waitFor(() => {
      expect(screen.getByText('No saved projects')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('calls exportProject when export button is clicked', async () => {
    const mockProject = {
      id: 'test-project',
      name: 'Test Project',
      samples: [],
      patterns: [],
      currentPattern: 0,
      bpm: 120
    }
    
    mockAudioEngine.exportProject.mockReturnValue(mockProject)
    
    render(<FileManager audioEngine={mockAudioEngine} />)
    
    fireEvent.click(screen.getByTitle('File Manager'))
    
    await waitFor(() => {
      const exportButton = screen.getByText('Export Project')
      fireEvent.click(exportButton)
    })
    
    expect(mockAudioEngine.exportProject).toHaveBeenCalled()
  })

  it('has proper accessibility', () => {
    render(<FileManager audioEngine={mockAudioEngine} />)
    
    const openButton = screen.getByTitle('File Manager')
    expect(openButton).toHaveAttribute('title', 'File Manager')
    expect(openButton.tagName).toBe('BUTTON')
  })
}) 