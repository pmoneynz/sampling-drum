import { Session, CuePoint } from '../types/cuepoints';

const API_BASE_URL = 'http://localhost:3001/api';

class SessionService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async saveSession(
    videoUrl: string,
    videoTitle: string,
    videoDuration: number,
    cuePoints: CuePoint[]
  ): Promise<{ sessionId: string; success: boolean }> {
    return this.makeRequest<{ sessionId: string; success: boolean }>('/sessions/save', {
      method: 'POST',
      body: JSON.stringify({
        videoUrl,
        videoTitle,
        videoDuration,
        cuePoints,
      }),
    });
  }

  async loadSession(sessionId: string): Promise<Session> {
    const session = await this.makeRequest<any>(`/sessions/load/${sessionId}`);
    
    // Convert date strings back to Date objects
    return {
      ...session,
      createdAt: new Date(session.createdAt),
      lastModified: new Date(session.lastModified),
    };
  }

  async listSessions(): Promise<Session[]> {
    const sessions = await this.makeRequest<any[]>('/sessions/list');
    
    // Convert date strings back to Date objects
    return sessions.map(session => ({
      ...session,
      createdAt: new Date(session.createdAt),
      lastModified: new Date(session.lastModified),
    }));
  }

  // Local storage fallback for offline usage
  saveSessionLocally(session: Omit<Session, 'id'>): string {
    const sessionId = `local_${Date.now()}`;
    const sessions = this.getLocalSessions();
    const newSession = {
      id: sessionId,
      ...session,
      createdAt: new Date(),
      lastModified: new Date(),
    };
    
    sessions.push(newSession);
    localStorage.setItem('youtube_cuepoint_sessions', JSON.stringify(sessions));
    
    return sessionId;
  }

  loadSessionLocally(sessionId: string): Session | null {
    const sessions = this.getLocalSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  getLocalSessions(): Session[] {
    try {
      const stored = localStorage.getItem('youtube_cuepoint_sessions');
      if (!stored) return [];
      
      const sessions = JSON.parse(stored);
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        lastModified: new Date(session.lastModified),
      }));
    } catch (error) {
      console.error('Failed to load local sessions:', error);
      return [];
    }
  }

  exportSession(session: Session): void {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      session,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuepoints_${session.videoTitle.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importSession(file: File): Promise<Session> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (!data.session) {
            throw new Error('Invalid session file format');
          }
          
          const session = {
            ...data.session,
            id: `imported_${Date.now()}`,
            createdAt: new Date(data.session.createdAt),
            lastModified: new Date(),
          };
          
          resolve(session);
        } catch (error) {
          reject(new Error('Failed to parse session file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

export const sessionService = new SessionService();