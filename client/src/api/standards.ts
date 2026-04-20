import { apiClient } from "./client";

export interface Standard {
  dayAge: number;
  standardBwG: number;
  standardFcr?: number | null;
}

export function getStandardsByDocType(
  docType: string,
): Promise<{ standards: Standard[] }> {
  return apiClient<{ standards: Standard[] }>(`/standards/${docType}`);
}
