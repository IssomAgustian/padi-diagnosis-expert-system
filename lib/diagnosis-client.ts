/**
 * Diagnosis API Client for Rice Disease Expert System
 * Handles all diagnosis-related API calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Symptom {
  id: string;
  name: string;
  description: string;
  mb_value: number;
  md_value: number;
  category: string;
  severity: string;
  is_active: 'yes' | 'no';
  created_at: string;
}

export interface Disease {
  id: string;
  name: string;
  scientific_name?: string;
  description: string;
  overview?: string;
  causal_agent?: string;
  favorable_conditions?: string;
  economic_impact?: string;
  is_active: 'yes' | 'no';
  treatments?: Treatment[];
  created_at: string;
}

export interface Treatment {
  id: string;
  disease_id: string;
  treatment_type: 'chemical' | 'biological' | 'cultural' | 'integrated';
  title: string;
  description: string;
  steps: string[];
  recommendation?: string;
  preventive_measures?: string;
  is_active: 'yes' | 'no';
  priority: number;
  created_at: string;
  medications?: Medication[];
}

export interface Medication {
  id: string;
  treatment_id: string;
  name: string;
  active_ingredient: string;
  dosage: string;
  application_method: string;
  frequency: string;
  pre_harvest_interval?: string;
  safety_precautions?: string;
  manufacturer?: string;
  is_active: 'yes' | 'no';
  created_at: string;
}

export interface DiagnosisResult {
  diagnosis: 'completed' | 'uncertain' | 'unknown' | string;
  disease?: Disease;
  confidence?: number;
  method?: 'forward_chaining' | 'certainty_factor' | 'hybrid';
  rule_id?: string;
  treatment_plan?: any;
  symptom_cf_scores?: Record<string, number>;
  message?: string;
  recommendations?: string[];
  ai_error?: string;
  diagnosis_id?: string;
  requires_certainty_factors?: boolean;
  selected_symptoms?: string[];
}

export interface DiagnosisHistory {
  id: string;
  user_id: string;
  session_id: string;
  symptoms_selected: string[];
  symptom_details: Record<string, any>;
  certainty_factors?: Record<string, number>;
  disease_id?: string;
  disease_name?: string;
  final_certainty_score?: number;
  diagnosis_method: string;
  rule_id?: string;
  ai_response?: string;
  ai_model?: string;
  ai_tokens_used?: number;
  processing_time?: number;
  status: string;
  created_at: string;
  expires_at: string;
}

class DiagnosisClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;

    // Get auth token
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/sign-in';
      }
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response;
  }

  // Symptoms
  async getSymptoms(): Promise<Symptom[]> {
    const response = await this.request('/api/symptoms');
    const data = await response.json();
    return data.symptoms;
  }

  async searchSymptoms(query: string, category?: string): Promise<{ symptoms: Symptom[]; count: number }> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (category) params.append('category', category);

    const response = await this.request(`/api/search-symptoms?${params}`);
    const data = await response.json();
    return data;
  }

  async getSymptomCategories(): Promise<string[]> {
    const response = await this.request('/api/symptom-categories');
    const data = await response.json();
    return data.categories;
  }

  // Diseases
  async getDiseases(includeTreatments = false): Promise<Disease[]> {
    const response = await this.request(`/api/diseases?include_treatments=${includeTreatments}`);
    const data = await response.json();
    return data.diseases;
  }

  // Diagnosis
  async diagnose(symptoms: string[]): Promise<DiagnosisResult> {
    const response = await this.request('/api/diagnose', {
      method: 'POST',
      body: JSON.stringify({ symptoms }),
    });

    const data = await response.json();
    return data;
  }

  async calculateCertainty(symptoms: string[], certaintyFactors: Record<string, number>): Promise<DiagnosisResult> {
    const response = await this.request('/api/calculate-certainty', {
      method: 'POST',
      body: JSON.stringify({
        symptoms,
        certainty_factors: certaintyFactors,
      }),
    });

    const data = await response.json();
    return data;
  }

  async validateSymptoms(symptoms: string[]): Promise<{
    valid: boolean;
    symptoms: Symptom[];
    potential_matches: any;
    requires_certainty_factors: boolean;
    invalid_symptoms?: string[];
    message?: string;
  }> {
    const response = await this.request('/api/validate-symptoms', {
      method: 'POST',
      body: JSON.stringify({ symptoms }),
    });

    const data = await response.json();
    return data;
  }

  // History
  async getHistory(page = 1, perPage = 20): Promise<{
    diagnoses: DiagnosisHistory[];
    pagination: {
      page: number;
      per_page: number;
      total: number;
      pages: number;
      has_prev: boolean;
      has_next: boolean;
    };
  }> {
    const response = await this.request(`/api/history?page=${page}&per_page=${perPage}`);
    const data = await response.json();
    return data;
  }

  async getDiagnosisDetails(diagnosisId: string): Promise<DiagnosisHistory & {
    steps?: any[];
    feedback?: any;
    ai_response?: any;
  }> {
    const response = await this.request(`/api/history/${diagnosisId}`);
    const data = await response.json();
    return data;
  }

  async deleteDiagnosis(diagnosisId: string): Promise<{ message: string }> {
    const response = await this.request(`/api/history/${diagnosisId}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    return data;
  }

  async exportDiagnosisPDF(diagnosisId: string): Promise<any> {
    const response = await this.request(`/api/history/${diagnosisId}/export`);
    const data = await response.json();
    return data;
  }

  async searchHistory(params: {
    query?: string;
    disease?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    diagnoses: DiagnosisHistory[];
    search_params: Record<string, any>;
    pagination: Record<string, any>;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const response = await this.request(`/api/history/search?${queryParams}`);
    const data = await response.json();
    return data;
  }

  async getHistoryStats(): Promise<{
    total_diagnoses: number;
    recent_diagnoses_30_days: number;
    disease_frequency: Record<string, number>;
    method_usage: Record<string, number>;
    average_confidence: number;
    feedback_stats: {
      total_feedback: number;
      average_accuracy: number;
      average_helpfulness: number;
    };
    account_created?: string;
  }> {
    const response = await this.request('/api/history/stats');
    const data = await response.json();
    return data;
  }

  // Feedback
  async submitFeedback(
    diagnosisId: string,
    accuracy: number,
    helpfulness: number,
    comments?: string,
    actualDisease?: string
  ): Promise<{ message: string; feedback: any }> {
    const response = await this.request(`/api/diagnosis/${diagnosisId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({
        accuracy,
        helpfulness,
        comments,
        actual_disease: actualDisease,
      }),
    });

    const data = await response.json();
    return data;
  }

  // Utility methods
  async diagnoseWithFlow(symptoms: string[]): Promise<DiagnosisResult> {
    // Step 1: Validate symptoms
    const validation = await this.validateSymptoms(symptoms);
    if (!validation.valid) {
      throw new Error('Invalid symptoms selected');
    }

    // Step 2: Perform diagnosis
    const result = await this.diagnose(symptoms);

    // Step 3: If certainty factors are required, we'll need to handle that flow
    return result;
  }

  // Bulk operations
  async bulkDeleteDiagnoses(diagnosisIds: string[]): Promise<{ message: string; deleted_count: number }> {
    const response = await this.request('/api/history/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ diagnosis_ids: diagnosisIds }),
    });

    const data = await response.json();
    return data;
  }
}

// Export singleton instance
export const diagnosisClient = new DiagnosisClient();

// React hook for diagnosis
import { useState, useCallback } from 'react';

export function useDiagnosis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const diagnose = useCallback(async (symptoms: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const result = await diagnosisClient.diagnoseWithFlow(symptoms);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Diagnosis failed';
      setError(errorMessage);
      throw err;
    } finally {
        setLoading(false);
      }
  }, []);

  const submitCertainty = useCallback(async (
    symptoms: string[],
    certaintyFactors: Record<string, number>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await diagnosisClient.calculateCertainty(symptoms, certaintyFactors);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Certainty calculation failed';
      setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    }, []);

  const getHistory = useCallback(async (page = 1, perPage = 20) => {
    setLoading(true);
    setError(null);

    try {
      const result = await diagnosisClient.getHistory(page, perPage);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch history';
      setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    }, []);

  return {
    loading,
    error,
    diagnose,
    submitCertainty,
    getHistory,
    clearError: () => setError(null),
  };
}