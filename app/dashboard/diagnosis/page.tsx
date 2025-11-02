/**
 * Diagnosis Page - Main diagnosis workflow
 * Handles symptom selection, certainty factors, and results display
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-backend';
import { useDiagnosis } from '@/lib/diagnosis-client';
import { SymptomSelector } from '@/components/diagnosis/symptom-selector';
import { CertaintyInput } from '@/components/diagnosis/certainty-input';
import { DiagnosisResult } from '@/components/diagnosis/diagnosis-result';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { DiagnosisResult as DiagnosisResultType } from '@/lib/diagnosis-client';

type DiagnosisStep = 'select-symptoms' | 'certainty-factors' | 'results';

export default function DiagnosisPage() {
  const { user, isAuthenticated } = useAuth();
  const { loading, error, diagnose, submitCertainty, clearError } = useDiagnosis();

  const [currentStep, setCurrentStep] = useState<DiagnosisStep>('select-symptoms');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResultType | null>(null);
  const [isValid, setIsValid] = useState(false);

  // Handle symptom selection validation
  const handleSymptomsValidate = (valid: boolean, message?: string) => {
    setIsValid(valid);
  };

  // Handle initial diagnosis
  const handleDiagnose = async () => {
    if (!isValid || selectedSymptoms.length === 0) return;

    try {
      clearError();
      const result = await diagnose(selectedSymptoms);

      if (result.requires_certainty_factors) {
        setCurrentStep('certainty-factors');
      } else {
        setDiagnosisResult(result);
        setCurrentStep('results');
      }
    } catch (err) {
      console.error('Diagnosis failed:', err);
    }
  };

  // Handle certainty factor submission
  const handleCertaintySubmit = async (certaintyFactors: Record<string, number>) => {
    try {
      clearError();
      const result = await submitCertainty(selectedSymptoms, certaintyFactors);
      setDiagnosisResult(result);
      setCurrentStep('results');
    } catch (err) {
      console.error('Certainty calculation failed:', err);
    }
  };

  // Handle new diagnosis
  const handleNewDiagnosis = () => {
    setSelectedSymptoms([]);
    setDiagnosisResult(null);
    setIsValid(false);
    setCurrentStep('select-symptoms');
    clearError();
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep === 'certainty-factors') {
      setCurrentStep('select-symptoms');
    } else if (currentStep === 'results') {
      if (diagnosisResult?.requires_certainty_factors) {
        setCurrentStep('certainty-factors');
      } else {
        setCurrentStep('select-symptoms');
      }
    }
  };

  // Save to history (handled by backend automatically)
  const handleSaveHistory = async () => {
    // Diagnosis is automatically saved to history in the backend
    // This function can be used for additional client-side actions if needed
    console.log('Diagnosis saved to history');
  };

  // Export PDF
  const handleExportPDF = async () => {
    if (!diagnosisResult?.diagnosis_id) return;

    try {
      // Open PDF in new tab or download
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        // Create a simple printable version
        const content = `
          <html>
            <head>
              <title>Rice Disease Diagnosis Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                .disease { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .confidence { font-size: 24px; font-weight: bold; color: #059669; }
                ul { margin: 10px 0; }
                li { margin: 5px 0; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Rice Disease Diagnosis Report</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
                <p>Patient: ${user?.name || 'Unknown'}</p>
              </div>

              ${diagnosisResult.disease ? `
                <div class="disease">
                  <h2>${diagnosisResult.disease.name}</h2>
                  <p><strong>Confidence:</strong> <span class="confidence">${((diagnosisResult.confidence || 0) * 100).toFixed(1)}%</span></p>
                  <p>${diagnosisResult.disease.description}</p>
                </div>
              ` : ''}

              <div class="section">
                <h3>Selected Symptoms:</h3>
                <ul>
                  ${selectedSymptoms.map(symptom => `<li>${symptom}</li>`).join('')}
                </ul>
              </div>

              ${diagnosisResult.message ? `
                <div class="section">
                  <h3>Notes:</h3>
                  <p>${diagnosisResult.message}</p>
                </div>
              ` : ''}

              <div class="section">
                <p><small>This is an AI-generated diagnosis. Please consult with a local agricultural expert for confirmation.</small></p>
              </div>
            </body>
          </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to access the diagnosis feature.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Step indicator
  const steps = [
    { id: 'select-symptoms', label: 'Select Symptoms', icon: '🌿' },
    { id: 'certainty-factors', label: 'Confidence Levels', icon: '🎯' },
    { id: 'results', label: 'Results', icon: '📊' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Rice Disease Diagnosis</h1>
        <p className="text-muted-foreground">
          Expert system for diagnosing rice plant diseases using AI and rule-based analysis
        </p>
      </div>

      {/* Step Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium text-sm
                  ${index <= currentStepIndex
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-muted text-muted-foreground'
                  }
                `}>
                  {step.icon}
                </div>
                <span className={`
                  ml-2 text-sm font-medium
                  ${index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'}
                `}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`
                    w-12 h-0.5 mx-4
                    ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Step Content */}
      {currentStep === 'select-symptoms' && (
        <div className="space-y-6">
          <SymptomSelector
            selectedSymptoms={selectedSymptoms}
            onSymptomsChange={setSelectedSymptoms}
            onValidate={handleSymptomsValidate}
          />

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedSymptoms.length} symptom(s) selected
                  {isValid && (
                    <Badge variant="secondary" className="ml-2">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Valid
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={handleDiagnose}
                  disabled={!isValid || selectedSymptoms.length === 0 || loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Diagnose
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'certainty-factors' && (
        <div className="space-y-6">
          <CertaintyInput
            selectedSymptoms={selectedSymptoms}
            onSubmit={handleCertaintySubmit}
            onCancel={handleBack}
          />
        </div>
      )}

      {currentStep === 'results' && diagnosisResult && (
        <div className="space-y-6">
          <DiagnosisResult
            result={diagnosisResult}
            onNewDiagnosis={handleNewDiagnosis}
            onSaveHistory={handleSaveHistory}
            onExportPDF={handleExportPDF}
          />
        </div>
      )}

      {/* Navigation Buttons */}
      {currentStep !== 'select-symptoms' && (
        <Card>
          <CardContent className="pt-6">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}