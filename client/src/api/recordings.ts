/**
 * API client for daily recording endpoints.
 *
 * Used to submit and manage daily chicken growth metrics.
 */

import { apiClient } from './client';

/** Daily recording submission payload. */
export interface CreateRecordingPayload {
  cycleId: number;
  recordingDate: string;
  dead?: number;
  culled?: number;
  remainingPopulation: number;
  bodyWeightG?: number;
  feedConsumedKg?: number;
  notes?: string;
}

/** Created recording response. */
export interface Recording {
  id: number;
  cycleId: number;
  recordingDate: string;
  dayAge: number;
  dead: number;
  culled: number;
  remainingPopulation: number;
  bodyWeightG: number | null;
  feedConsumedKg: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new daily recording.
 *
 * @param data - Recording data (cycle, date, metrics)
 * @returns Created recording entry
 * @throws ApiError if cycle not found, date invalid, or duplicate
 */
export function createRecording(data: CreateRecordingPayload): Promise<{ success: boolean; recording: Recording }> {
  return apiClient<{ success: boolean; recording: Recording }>('/recordings', {
    method: 'POST',
    body: JSON.stringify({
      cycleId: data.cycleId,
      recordingDate: data.recordingDate,
      dead: data.dead,
      culled: data.culled,
      remainingPopulation: data.remainingPopulation,
      bodyWeightG: data.bodyWeightG,
      feedConsumedKg: data.feedConsumedKg,
      notes: data.notes,
    }),
  });
}
