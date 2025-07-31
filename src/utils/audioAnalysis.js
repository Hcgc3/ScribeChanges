// Audio Analysis Utilities for Real-time Intensity Visualization

export class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;
    this.isInitialized = false;
  }

  async initialize(audioElement) {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Create data array for frequency data
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Connect audio source to analyser
      this.source = this.audioContext.createMediaElementSource(audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing audio analyzer:', error);
      return false;
    }
  }

  getRealTimeIntensity() {
    if (!this.isInitialized || !this.analyser) {
      return 0;
    }

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate average intensity
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    
    // Normalize to 0-1 range
    const average = sum / this.dataArray.length;
    return average / 255;
  }

  getFrequencyBands() {
    if (!this.isInitialized || !this.analyser) {
      return { bass: 0, mid: 0, treble: 0 };
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    const bassEnd = Math.floor(this.dataArray.length * 0.1);
    const midEnd = Math.floor(this.dataArray.length * 0.5);

    let bass = 0, mid = 0, treble = 0;

    // Bass frequencies (0-10% of spectrum)
    for (let i = 0; i < bassEnd; i++) {
      bass += this.dataArray[i];
    }
    bass = (bass / bassEnd) / 255;

    // Mid frequencies (10-50% of spectrum)
    for (let i = bassEnd; i < midEnd; i++) {
      mid += this.dataArray[i];
    }
    mid = (mid / (midEnd - bassEnd)) / 255;

    // Treble frequencies (50-100% of spectrum)
    for (let i = midEnd; i < this.dataArray.length; i++) {
      treble += this.dataArray[i];
    }
    treble = (treble / (this.dataArray.length - midEnd)) / 255;

    return { bass, mid, treble };
  }

  disconnect() {
    if (this.source) {
      this.source.disconnect();
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.isInitialized = false;
  }
}

export async function analyzeAudioFile(audioFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(event.target.result);

        const duration = audioBuffer.duration;
        const sampleRate = audioBuffer.sampleRate;
        const channelData = audioBuffer.getChannelData(0); // Get data from the first channel

        const segmentsPerSecond = 60; // Number of intensity data points per second
        const totalSegments = Math.floor(duration * segmentsPerSecond);
        const samplesPerSegment = Math.floor(sampleRate / segmentsPerSecond);

        const intensityData = [];

        for (let i = 0; i < totalSegments; i++) {
          let sum = 0;
          let count = 0;
          const startSample = i * samplesPerSegment;
          const endSample = Math.min(startSample + samplesPerSegment, channelData.length);

          for (let j = startSample; j < endSample; j++) {
            sum += Math.abs(channelData[j]); // Absolute value for intensity
            count++;
          }
          const average = count > 0 ? sum / count : 0;
          intensityData.push(Math.min(1, average * 10)); // Scale to 0-1, adjust multiplier as needed
        }

        resolve({
          duration,
          intensityData,
          sampleRate,
          channels: audioBuffer.numberOfChannels
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(audioFile);
  });
}

export function generateMockIntensityFromMIDI(midiData) {
  if (!midiData) return [];

  const duration = midiData.duration || 30;
  const segments = Math.floor(duration * 10); // 10 segments per second
  const intensityData = [];

  for (let i = 0; i < segments; i++) {
    const time = (i / segments) * duration;
    let intensity = 0.1; // Base intensity

    // Calculate note density at this time
    if (midiData.tracks) {
      const notesAtTime = midiData.tracks.reduce((count, track) => {
        return count + track.notes.filter(note => 
          note.time <= time && note.time + note.duration > time
        ).length;
      }, 0);

      // Convert note density to intensity
      intensity = Math.min(1, 0.1 + (notesAtTime * 0.1));

      // Add velocity information if available
      const activeNotes = midiData.tracks.reduce((notes, track) => {
        return notes.concat(track.notes.filter(note => 
          note.time <= time && note.time + note.duration > time
        ));
      }, []);

      if (activeNotes.length > 0) {
        const avgVelocity = activeNotes.reduce((sum, note) => sum + note.velocity, 0) / activeNotes.length;
        intensity *= avgVelocity;
      }
    }

    // Add some variation for realism
    intensity += (Math.random() - 0.5) * 0.1;
    intensity = Math.max(0.05, Math.min(1, intensity));
    
    intensityData.push(intensity);
  }

  return intensityData;
}

export function createVisualizationData(intensityData, currentTime, duration, windowSize = 10) {
  if (!intensityData.length || duration === 0) return [];

  const currentIndex = Math.floor((currentTime / duration) * intensityData.length);
  const segmentsPerSecond = intensityData.length / duration;
  const windowSegments = Math.floor(windowSize * segmentsPerSecond);
  const halfWindow = Math.floor(windowSegments / 2);

  const visualData = [];
  
  for (let i = -halfWindow; i <= halfWindow; i++) {
    const dataIndex = currentIndex + i;
    if (dataIndex >= 0 && dataIndex < intensityData.length) {
      visualData.push({
        intensity: intensityData[dataIndex],
        time: (dataIndex / intensityData.length) * duration,
        isCurrent: i === 0
      });
    } else {
      visualData.push({
        intensity: 0,
        time: (dataIndex / intensityData.length) * duration,
        isCurrent: i === 0
      });
    }
  }

  return visualData;
}

