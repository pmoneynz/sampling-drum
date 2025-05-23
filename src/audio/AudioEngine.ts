import * as Tone from 'tone';

export interface Sample {
  id: string;
  name: string;
  buffer: Tone.ToneAudioBuffer | null;
  startTime: number;
  endTime: number;
  volume: number;
  pan: number;
}

export interface Pattern {
  id: string;
  name: string;
  length: number;
  steps: boolean[][];
  velocities: number[][];
}

export interface Project {
  id: string;
  name: string;
  samples: Sample[];
  patterns: Pattern[];
  currentPattern: number;
  bpm: number;
}

export class AudioEngine {
  private players: Tone.Player[] = [];
  private sequence: Tone.Sequence | null = null;
  private samples: Sample[] = [];
  private patterns: Pattern[] = [];
  private currentPattern = 0;
  private isPlaying = false;
  private isRecording = false;
  private currentStep = 0;
  private bpm = 120;
  private quantization: Tone.Unit.Time = '16n';
  private metronome: Tone.Player | null = null;

  constructor() {
    // Initialize 16 players for the pads with explicit destination connection
    for (let i = 0; i < 16; i++) {
      const player = new Tone.Player().toDestination();
      player.volume.value = 0; // Start with 0dB (full volume)
      this.players.push(player);
      
      // Initialize empty sample
      this.samples.push({
        id: `sample-${i}`,
        name: `Pad ${i + 1}`,
        buffer: null,
        startTime: 0,
        endTime: 1,
        volume: 0.8,
        pan: 0
      });
    }

    // Initialize default pattern
    this.patterns.push({
      id: 'pattern-1',
      name: 'Pattern 1',
      length: 16,
      steps: Array(16).fill(null).map(() => Array(16).fill(false)),
      velocities: Array(16).fill(null).map(() => Array(16).fill(0.8))
    });

    // Set up transport
    Tone.Transport.bpm.value = this.bpm;
  }

  async init() {
    try {
      // Ensure audio context is started
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
      }
      
      // Set master volume
      Tone.getDestination().volume.value = 0; // 0dB = full volume
      
      console.log('Audio engine initialized');
      console.log('Audio context state:', Tone.getContext().state);
      console.log('Sample rate:', Tone.getContext().sampleRate);
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
    }
  }

  dispose() {
    this.stop();
    this.players.forEach(player => player.dispose());
    if (this.sequence) {
      this.sequence.dispose();
    }
    if (this.metronome) {
      this.metronome.dispose();
    }
  }

  // Sample management
  async loadSample(padIndex: number, file: File): Promise<void> {
    try {
      console.log(`Loading sample for pad ${padIndex}: ${file.name}`);
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Ensure audio context is running
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
      }
      
      // Create a proper audio context to decode the buffer
      const audioContext = Tone.getContext().rawContext;
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create ToneAudioBuffer from the decoded AudioBuffer
      const buffer = new Tone.ToneAudioBuffer(audioBuffer);
      
      // Wait for the buffer to be ready
      await new Promise<void>((resolve) => {
        if (buffer.loaded) {
          resolve();
        } else {
          buffer.onload = () => resolve();
        }
      });
      
      // Update sample info
      this.samples[padIndex] = {
        ...this.samples[padIndex],
        name: file.name,
        buffer,
        endTime: 1.0 // Use normalized time (0-1) initially
      };

      // Dispose old player and create new one with the buffer
      this.players[padIndex].dispose();
      this.players[padIndex] = new Tone.Player(buffer).toDestination();
      this.players[padIndex].volume.value = Tone.gainToDb(this.samples[padIndex].volume);
      
      console.log(`Sample loaded successfully for pad ${padIndex}: ${file.name}`);
      console.log(`Buffer duration: ${buffer.duration}s, sample rate: ${buffer.sampleRate}Hz`);
      
      // Test playback immediately
      this.testPadAudio(padIndex);
      
    } catch (error) {
      console.error('Error loading sample:', error);
    }
  }

  // Test method to verify audio is working
  testPadAudio(padIndex: number) {
    console.log(`Testing audio for pad ${padIndex}`);
    setTimeout(() => {
      this.triggerPad(padIndex, 0.8);
    }, 100);
  }

  // Test basic Tone.js audio output
  async testBasicAudio() {
    console.log('🧪 Testing basic Tone.js audio output...');
    try {
      // Ensure audio context is running
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
      }

      // Create a simple oscillator test
      const osc = new Tone.Oscillator(440, "sine").toDestination();
      osc.volume.value = -12; // Quieter test tone
      
      console.log('🎵 Playing test tone (440Hz sine wave for 0.2s)...');
      osc.start();
      
      setTimeout(() => {
        osc.stop();
        osc.dispose();
        console.log('🔇 Test tone finished');
      }, 200);
      
    } catch (error) {
      console.error('❌ Basic audio test failed:', error);
    }
  }

  getSample(padIndex: number): Sample {
    return this.samples[padIndex];
  }

  setSampleProperty(padIndex: number, property: keyof Sample, value: any) {
    this.samples[padIndex] = {
      ...this.samples[padIndex],
      [property]: value
    };

    // Update player properties
    const player = this.players[padIndex];
    if (property === 'volume') {
      player.volume.value = Tone.gainToDb(value);
    }
  }

  // Pad triggering
  triggerPad(padIndex: number, velocity: number = 0.8, time?: Tone.Unit.Time) {
    console.log(`Attempting to trigger pad ${padIndex} with velocity ${velocity}`);
    
    const sample = this.samples[padIndex];
    if (!sample.buffer) {
      console.warn(`No sample loaded for pad ${padIndex}`);
      return;
    }

    try {
      // Ensure audio context is running
      if (Tone.getContext().state !== 'running') {
        Tone.start().then(() => {
          console.log('Audio context started, retrying trigger');
          this.triggerPad(padIndex, velocity, time);
        });
        return;
      }

      const player = this.players[padIndex];
      
      // Ensure buffer duration is valid
      const bufferDuration = sample.buffer.duration;
      if (!bufferDuration || isNaN(bufferDuration) || bufferDuration <= 0) {
        console.warn(`Invalid buffer duration for pad ${padIndex}: ${bufferDuration}`);
        return;
      }

      // Calculate start time and duration with validation
      const startTime = Math.max(0, sample.startTime * bufferDuration);
      const endTime = Math.min(bufferDuration, sample.endTime * bufferDuration);
      const duration = endTime - startTime;

      // Validate calculated values
      if (isNaN(startTime) || isNaN(duration) || duration <= 0) {
        console.warn(`Invalid timing values for pad ${padIndex}: startTime=${startTime}, duration=${duration}`);
        return;
      }

      // Set volume before playing (ensure it's audible)
      const finalVolume = Math.max(-60, Tone.gainToDb(velocity * sample.volume));
      player.volume.value = finalVolume;
      
      console.log(`Triggering pad ${padIndex}:`);
      console.log(`- Player state before: ${player.state}`);
      console.log(`- Volume: ${finalVolume}dB (velocity: ${velocity}, sample volume: ${sample.volume})`);
      console.log(`- Start time: ${startTime.toFixed(3)}s`);
      console.log(`- Duration: ${duration.toFixed(3)}s`);
      console.log(`- Audio context state: ${Tone.getContext().state}`);
      console.log(`- Master volume: ${Tone.getDestination().volume.value}dB`);

      // Stop any currently playing instance
      if (player.state === 'started') {
        player.stop();
        console.log(`- Stopped previous playback`);
      }

      // Start playback with correct Tone.js API
      if (time) {
        // When time is specified (for sequencer)
        player.start(time, startTime, duration);
        console.log(`- Started with scheduled time: ${time}`);
      } else {
        // When triggered immediately - use "+0" instead of undefined
        player.start("+0", startTime, duration);
        console.log(`- Started immediately with offset: ${startTime}s, duration: ${duration}s`);
      }
      
      // Add event listeners to track playback
      player.onstop = () => {
        console.log(`🔇 Pad ${padIndex} playback stopped`);
      };
      
      console.log(`✓ Pad ${padIndex} triggered successfully`);
      console.log(`- Player state after: ${player.state}`);
      
      // Additional debugging: Check if audio is actually flowing
      setTimeout(() => {
        console.log(`- Player state after 50ms: ${player.state}`);
        if (player.state !== 'started') {
          console.error(`❌ Player did not start! Current state: ${player.state}`);
        } else {
          console.log(`🔊 Player is running!`);
        }
      }, 50);

    } catch (error) {
      console.error(`Error triggering pad ${padIndex}:`, error);
    }

    // Record if recording is enabled
    if (this.isRecording && time === undefined) {
      this.recordStep(padIndex, velocity);
    }
  }

  // Pattern management
  getCurrentPattern(): Pattern {
    return this.patterns[this.currentPattern];
  }

  setCurrentPattern(index: number) {
    if (index >= 0 && index < this.patterns.length) {
      this.currentPattern = index;
      this.updateSequence();
    }
  }

  addPattern(): Pattern {
    const newPattern: Pattern = {
      id: `pattern-${this.patterns.length + 1}`,
      name: `Pattern ${this.patterns.length + 1}`,
      length: 16,
      steps: Array(16).fill(null).map(() => Array(16).fill(false)),
      velocities: Array(16).fill(null).map(() => Array(16).fill(0.8))
    };
    
    this.patterns.push(newPattern);
    return newPattern;
  }

  toggleStep(padIndex: number, stepIndex: number) {
    const pattern = this.getCurrentPattern();
    pattern.steps[padIndex][stepIndex] = !pattern.steps[padIndex][stepIndex];
    this.updateSequence();
  }

  setStepVelocity(padIndex: number, stepIndex: number, velocity: number) {
    const pattern = this.getCurrentPattern();
    pattern.velocities[padIndex][stepIndex] = velocity;
  }

  // Transport controls
  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.updateSequence();
      Tone.Transport.start();
    }
  }

  stop() {
    this.isPlaying = false;
    this.currentStep = 0;
    Tone.Transport.stop();
  }

  pause() {
    this.isPlaying = false;
    Tone.Transport.pause();
  }

  // Recording
  startRecording() {
    this.isRecording = true;
    if (!this.isPlaying) {
      this.play();
    }
  }

  stopRecording() {
    this.isRecording = false;
  }

  private recordStep(padIndex: number, velocity: number) {
    const pattern = this.getCurrentPattern();
    const quantizedStep = this.getQuantizedStep();
    
    pattern.steps[padIndex][quantizedStep] = true;
    pattern.velocities[padIndex][quantizedStep] = velocity;
    this.updateSequence();
  }

  private getQuantizedStep(): number {
    // Convert position to step number based on quantization
    // This is a simplified implementation
    return Math.floor((Tone.Transport.ticks / Tone.Transport.PPQ) * 4) % 16;
  }

  private updateSequence() {
    if (this.sequence) {
      this.sequence.dispose();
    }

    const pattern = this.getCurrentPattern();
    
    this.sequence = new Tone.Sequence((time, step) => {
      this.currentStep = step;
      
      // Trigger all active pads for this step
      for (let padIndex = 0; padIndex < 16; padIndex++) {
        if (pattern.steps[padIndex][step]) {
          const velocity = pattern.velocities[padIndex][step];
          this.triggerPad(padIndex, velocity, time);
        }
      }
    }, Array.from({ length: pattern.length }, (_, i) => i), this.quantization);

    if (this.isPlaying) {
      this.sequence.start();
    }
  }

  // Getters
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  getBPM(): number {
    return this.bpm;
  }

  setBPM(bpm: number) {
    this.bpm = bpm;
    Tone.Transport.bpm.value = bpm;
  }

  getPatterns(): Pattern[] {
    return this.patterns;
  }

  getSamples(): Sample[] {
    return this.samples;
  }

  // Project management
  exportProject(): Project {
    return {
      id: `project-${Date.now()}`,
      name: 'Untitled Project',
      samples: this.samples,
      patterns: this.patterns,
      currentPattern: this.currentPattern,
      bpm: this.bpm
    };
  }

  loadProject(project: Project) {
    this.samples = project.samples;
    this.patterns = project.patterns;
    this.currentPattern = project.currentPattern;
    this.setBPM(project.bpm);
    
    // Update players with loaded samples
    this.samples.forEach((sample, index) => {
      if (sample.buffer) {
        this.players[index].buffer = sample.buffer;
      }
    });
    
    this.updateSequence();
  }
} 