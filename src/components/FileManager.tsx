import React, { useState, useEffect } from 'react';
import { AudioEngine, Project } from '../audio/AudioEngine';
import { Save, FolderOpen, Download, Trash2 } from 'lucide-react';

interface FileManagerProps {
  audioEngine: AudioEngine;
}

interface StoredProject {
  id: string;
  name: string;
  data: Project;
  createdAt: Date;
  updatedAt: Date;
}

export function FileManager({ audioEngine }: FileManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SamplingDrumDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
      };
    });
  };

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const db = await openDB();
      const transaction = db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.getAll();
      
      request.onsuccess = () => {
        setProjects(request.result);
        setIsLoading(false);
      };
      
      request.onerror = () => {
        console.error('Error loading projects:', request.error);
        setIsLoading(false);
      };
    } catch (error) {
      console.error('Error opening database:', error);
      setIsLoading(false);
    }
  };

  const saveProject = async () => {
    try {
      setIsLoading(true);
      const projectData = audioEngine.exportProject();
      const now = new Date();
      
      const storedProject: StoredProject = {
        id: `project-${Date.now()}`,
        name: projectName,
        data: { ...projectData, name: projectName },
        createdAt: now,
        updatedAt: now
      };

      const db = await openDB();
      const transaction = db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.add(storedProject);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      await loadProjects();
      setIsLoading(false);
      alert('Project saved successfully!');
    } catch (error) {
      console.error('Error saving project:', error);
      setIsLoading(false);
      alert('Error saving project. Please try again.');
    }
  };

  const loadProject = async (project: StoredProject) => {
    try {
      setIsLoading(true);
      audioEngine.loadProject(project.data);
      setProjectName(project.name);
      setIsOpen(false);
      setIsLoading(false);
      alert('Project loaded successfully!');
    } catch (error) {
      console.error('Error loading project:', error);
      setIsLoading(false);
      alert('Error loading project. Please try again.');
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      setIsLoading(true);
      const db = await openDB();
      const transaction = db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(projectId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      await loadProjects();
      setIsLoading(false);
    } catch (error) {
      console.error('Error deleting project:', error);
      setIsLoading(false);
      alert('Error deleting project. Please try again.');
    }
  };

  const exportProject = () => {
    const projectData = audioEngine.exportProject();
    const dataStr = JSON.stringify({ ...projectData, name: projectName }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const importProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target?.result as string);
        audioEngine.loadProject(projectData);
        setProjectName(projectData.name || 'Imported Project');
        alert('Project imported successfully!');
      } catch (error) {
        console.error('Error importing project:', error);
        alert('Error importing project. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 flex space-x-2">
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 bg-mpc-accent hover:bg-mpc-accent/80 text-white rounded-full shadow-lg transition-colors"
          title="File Manager"
        >
          <FolderOpen size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-mpc-dark border border-mpc-light rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">FILE MANAGER</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Save section */}
        <div className="mb-6 p-4 bg-mpc-gray rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Save Current Project</h3>
          <div className="flex space-x-4">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="flex-1 px-3 py-2 bg-mpc-dark border border-mpc-light rounded text-white"
            />
            <button
              onClick={saveProject}
              disabled={isLoading}
              className="px-4 py-2 bg-mpc-accent hover:bg-mpc-accent/80 text-white rounded transition-colors disabled:opacity-50"
            >
              <Save size={16} className="inline mr-2" />
              Save
            </button>
          </div>
        </div>

        {/* Import/Export section */}
        <div className="mb-6 p-4 bg-mpc-gray rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Import / Export</h3>
          <div className="flex space-x-4">
            <label className="px-4 py-2 bg-mpc-light hover:bg-mpc-accent text-white rounded transition-colors cursor-pointer">
              <FolderOpen size={16} className="inline mr-2" />
              Import Project
              <input
                type="file"
                accept=".json"
                onChange={importProject}
                className="hidden"
              />
            </label>
            <button
              onClick={exportProject}
              className="px-4 py-2 bg-mpc-light hover:bg-mpc-accent text-white rounded transition-colors"
            >
              <Download size={16} className="inline mr-2" />
              Export Project
            </button>
          </div>
        </div>

        {/* Saved projects */}
        <div className="p-4 bg-mpc-gray rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Saved Projects</h3>
          
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No saved projects</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 bg-mpc-light rounded hover:bg-mpc-accent/20 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-gray-400">
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => loadProject(project)}
                      className="px-3 py-1 bg-mpc-accent hover:bg-mpc-accent/80 text-white rounded text-sm transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 