// Interview Recording & Transcription Service for EVIDENRA Ultimate
// Enables in-app interview recording, automatic transcription, and document integration

export interface InterviewRecording {
  id: string;
  title: string;
  duration: number; // in seconds
  recordedAt: string;
  audioBlob?: Blob;
  audioUrl?: string;
  transcription?: string;
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  addedToDocuments: boolean;
  projectId?: string;
}

export interface TranscriptionResult {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  language: string;
}

export class InterviewRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordings: InterviewRecording[] = [];
  private isRecording: boolean = false;

  // Start recording interview
  async startRecording(): Promise<{ success: boolean; error: string | null }> {
    try {
      if (this.isRecording) {
        return { success: false, error: 'Recording already in progress' };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;

      console.log('Interview recording started');
      return { success: true, error: null };
    } catch (err) {
      console.error('Failed to start recording:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to access microphone'
      };
    }
  }

  // Stop recording and save
  async stopRecording(title: string): Promise<{ recording: InterviewRecording | null; error: string | null }> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve({ recording: null, error: 'No recording in progress' });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const recording: InterviewRecording = {
          id: crypto.randomUUID(),
          title: title || `Interview ${new Date().toLocaleDateString('de-DE')}`,
          duration: this.calculateDuration(),
          recordedAt: new Date().toISOString(),
          audioBlob,
          audioUrl,
          transcriptionStatus: 'pending',
          addedToDocuments: false
        };

        this.recordings.push(recording);
        this.saveRecordingsToStorage();
        this.isRecording = false;

        // Stop all tracks
        if (this.mediaRecorder?.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }

        console.log('Interview recording saved:', recording.id);
        resolve({ recording, error: null });
      };

      this.mediaRecorder.stop();
    });
  }

  // Cancel ongoing recording
  cancelRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      this.mediaRecorder = null;
      this.audioChunks = [];
      this.isRecording = false;
      console.log('Recording cancelled');
    }
  }

  // Get recording status
  getRecordingStatus(): { isRecording: boolean; duration: number } {
    return {
      isRecording: this.isRecording,
      duration: this.calculateDuration()
    };
  }

  // Transcribe recording using AI (Whisper API via Claude or OpenAI)
  async transcribeRecording(
    recordingId: string,
    apiKey: string,
    provider: 'openai' | 'anthropic' = 'openai'
  ): Promise<{ transcription: string | null; error: string | null }> {
    const recording = this.recordings.find(r => r.id === recordingId);
    if (!recording || !recording.audioBlob) {
      return { transcription: null, error: 'Recording not found' };
    }

    try {
      recording.transcriptionStatus = 'processing';
      this.saveRecordingsToStorage();

      if (provider === 'openai') {
        // Use OpenAI Whisper API
        const formData = new FormData();
        formData.append('file', recording.audioBlob, 'interview.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'de');
        formData.append('response_format', 'verbose_json');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Transcription failed: ${response.statusText}`);
        }

        const result = await response.json();
        recording.transcription = result.text;
        recording.transcriptionStatus = 'completed';
        this.saveRecordingsToStorage();

        return { transcription: result.text, error: null };
      } else {
        // For Anthropic, we would need to use a different approach
        // since Claude doesn't directly support audio transcription
        return {
          transcription: null,
          error: 'Direct audio transcription not supported with Anthropic. Please use OpenAI Whisper API.'
        };
      }
    } catch (err) {
      recording.transcriptionStatus = 'failed';
      this.saveRecordingsToStorage();
      return {
        transcription: null,
        error: err instanceof Error ? err.message : 'Transcription failed'
      };
    }
  }

  // Add transcribed interview to project documents
  addToDocuments(recordingId: string): { document: any | null; error: string | null } {
    const recording = this.recordings.find(r => r.id === recordingId);
    if (!recording) {
      return { document: null, error: 'Recording not found' };
    }

    if (!recording.transcription) {
      return { document: null, error: 'Recording has no transcription yet' };
    }

    const document = {
      id: crypto.randomUUID(),
      name: `Interview: ${recording.title}`,
      type: 'interview' as const,
      content: recording.transcription,
      sourceRecordingId: recording.id,
      metadata: {
        recordedAt: recording.recordedAt,
        duration: recording.duration,
        transcribedAt: new Date().toISOString()
      }
    };

    recording.addedToDocuments = true;
    this.saveRecordingsToStorage();

    return { document, error: null };
  }

  // Get all recordings
  getRecordings(): InterviewRecording[] {
    return this.recordings.map(r => ({
      ...r,
      audioBlob: undefined // Don't return blob in list
    }));
  }

  // Get single recording with audio
  getRecording(id: string): InterviewRecording | null {
    return this.recordings.find(r => r.id === id) || null;
  }

  // Delete recording
  deleteRecording(id: string): { success: boolean; error: string | null } {
    const index = this.recordings.findIndex(r => r.id === id);
    if (index === -1) {
      return { success: false, error: 'Recording not found' };
    }

    const recording = this.recordings[index];
    if (recording.audioUrl) {
      URL.revokeObjectURL(recording.audioUrl);
    }

    this.recordings.splice(index, 1);
    this.saveRecordingsToStorage();

    return { success: true, error: null };
  }

  // Export recording as WAV
  async exportAsWav(recordingId: string): Promise<Blob | null> {
    const recording = this.recordings.find(r => r.id === recordingId);
    if (!recording?.audioBlob) {
      return null;
    }

    // Convert webm to wav (simplified - in production use audio library)
    return recording.audioBlob;
  }

  // Export transcription as text file
  exportTranscription(recordingId: string): string | null {
    const recording = this.recordings.find(r => r.id === recordingId);
    if (!recording?.transcription) {
      return null;
    }

    return `Interview: ${recording.title}
Aufgenommen: ${new Date(recording.recordedAt).toLocaleString('de-DE')}
Dauer: ${this.formatDuration(recording.duration)}

---

${recording.transcription}`;
  }

  // Private helper methods
  private calculateDuration(): number {
    if (!this.audioChunks.length) return 0;
    // Approximate duration based on chunks (1 chunk per second)
    return this.audioChunks.length;
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private saveRecordingsToStorage(): void {
    // Save metadata to localStorage (not audio blobs)
    const metadata = this.recordings.map(r => ({
      id: r.id,
      title: r.title,
      duration: r.duration,
      recordedAt: r.recordedAt,
      transcription: r.transcription,
      transcriptionStatus: r.transcriptionStatus,
      addedToDocuments: r.addedToDocuments,
      projectId: r.projectId
    }));
    localStorage.setItem('evidenra_interview_recordings', JSON.stringify(metadata));
  }

  loadRecordingsFromStorage(): void {
    const stored = localStorage.getItem('evidenra_interview_recordings');
    if (stored) {
      try {
        const metadata = JSON.parse(stored);
        this.recordings = metadata.map((m: any) => ({
          ...m,
          audioBlob: undefined,
          audioUrl: undefined
        }));
      } catch (err) {
        console.error('Failed to load recordings:', err);
      }
    }
  }
}

export const interviewRecordingService = new InterviewRecordingService();
