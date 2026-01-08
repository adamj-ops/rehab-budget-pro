'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useUpdateProject } from './use-projects';
import { toast } from 'sonner';

interface UseAutoSaveNotesOptions {
  projectId: string;
  debounceMs?: number;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

interface UseAutoSaveNotesReturn {
  /** Current notes content (local state) */
  notes: string;
  /** Update notes locally and trigger debounced save */
  setNotes: (notes: string) => void;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Force an immediate save (useful for onBlur) */
  saveNow: () => Promise<void>;
  /** Reset local notes to a specific value without triggering save */
  resetNotes: (notes: string) => void;
}

/**
 * Hook for auto-saving project notes with debouncing.
 * 
 * Features:
 * - Debounced save on typing (default 1 second)
 * - Immediate save on blur via saveNow()
 * - Visual feedback via isSaving state
 * - Error handling with toast notifications
 */
export function useAutoSaveNotes({
  projectId,
  debounceMs = 1000,
  onSaveSuccess,
  onSaveError,
}: UseAutoSaveNotesOptions): UseAutoSaveNotesReturn {
  const [notes, setNotesInternal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const lastSavedNotesRef = useRef(notes);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<string | null>(null);
  
  const updateProject = useUpdateProject();

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Perform the actual save
  const performSave = useCallback(async (notesToSave: string) => {
    // Skip if content hasn't changed from last saved version
    if (notesToSave === lastSavedNotesRef.current) {
      setHasUnsavedChanges(false);
      return;
    }

    setIsSaving(true);
    pendingSaveRef.current = null;

    try {
      await updateProject.mutateAsync({
        id: projectId,
        notes: notesToSave || null, // Convert empty string to null
      });
      
      lastSavedNotesRef.current = notesToSave;
      setHasUnsavedChanges(false);
      onSaveSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to save notes');
      toast.error('Failed to save notes', {
        description: err.message,
      });
      onSaveError?.(err);
      // Keep hasUnsavedChanges true on error
    } finally {
      setIsSaving(false);
    }
  }, [projectId, updateProject, onSaveSuccess, onSaveError]);

  // Debounced save
  const debouncedSave = useCallback((notesToSave: string) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Store the pending save value
    pendingSaveRef.current = notesToSave;

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSave(notesToSave);
    }, debounceMs);
  }, [performSave, debounceMs]);

  // Update notes and trigger debounced save
  const setNotes = useCallback((newNotes: string) => {
    setNotesInternal(newNotes);
    setHasUnsavedChanges(newNotes !== lastSavedNotesRef.current);
    debouncedSave(newNotes);
  }, [debouncedSave]);

  // Force immediate save (for onBlur)
  const saveNow = useCallback(async () => {
    // Clear any pending debounced save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Get the current notes value
    const notesToSave = pendingSaveRef.current ?? notes;
    await performSave(notesToSave);
  }, [notes, performSave]);

  // Reset notes without triggering save (for initial load)
  const resetNotes = useCallback((initialNotes: string) => {
    setNotesInternal(initialNotes);
    lastSavedNotesRef.current = initialNotes;
    setHasUnsavedChanges(false);
    pendingSaveRef.current = null;
    
    // Clear any pending timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  return {
    notes,
    setNotes,
    isSaving,
    hasUnsavedChanges,
    saveNow,
    resetNotes,
  };
}
