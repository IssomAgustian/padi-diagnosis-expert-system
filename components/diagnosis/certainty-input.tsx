/**
 * Certainty Factor Input Component
 * Allows users to input their confidence levels for selected symptoms
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info, CheckCircle } from 'lucide-react';
import { diagnosisClient, Symptom } from '@/lib/diagnosis-client';
import { cn } from '@/lib/utils';

interface CertaintyInputProps {
  selectedSymptoms: string[];
  onSubmit: (certaintyFactors: Record<string, number>) => void;
  onCancel: () => void;
  className?: string;
}

export function CertaintyInput({
  selectedSymptoms,
  onSubmit,
  onCancel,
  className
}: CertaintyInputProps) {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [certaintyFactors, setCertaintyFactors] = useState<Record<string, number>>({});
  const [allFilled, setAllFilled] = useState(false);

  // Load symptoms details
  React.useEffect(() => {
    const loadSymptoms = async () => {
      try {
        setLoading(true);
        const allSymptoms = await diagnosisClient.getSymptoms();
        const selectedSymptomDetails = allSymptoms.filter(s => selectedSymptoms.includes(s.id));
        setSymptoms(selectedSymptomDetails);

        // Initialize certainty factors with default values (70%)
        const initialFactors: Record<string, number> = {};
        selectedSymptomDetails.forEach(symptom => {
          initialFactors[symptom.id] = 70;
        });
        setCertaintyFactors(initialFactors);
      } catch (error) {
        console.error('Failed to load symptoms:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSymptoms();
  }, [selectedSymptoms]);

  // Check if all certainty factors are filled
  React.useEffect(() => {
    const filled = selectedSymptoms.length > 0 &&
      selectedSymptoms.every(symptomId => certaintyFactors[symptomId] !== undefined);
    setAllFilled(filled);
  }, [certaintyFactors, selectedSymptoms]);

  // Handle certainty factor change
  const handleCertaintyChange = (symptomId: string, value: number[]) => {
    setCertaintyFactors(prev => ({
      ...prev,
      [symptomId]: value[0]
    }));
  };

  // Auto-fill all with default values
  const autoFill = () => {
    const factors: Record<string, number> = {};
    symptoms.forEach(symptom => {
      factors[symptom.id] = 70; // Default 70% certainty
    });
    setCertaintyFactors(factors);
  };

  // Submit certainty factors
  const handleSubmit = async () => {
    if (!allFilled) return;

    try {
      setSubmitting(true);
      await onSubmit(certaintyFactors);
    } catch (error) {
      console.error('Failed to submit certainty factors:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Certainty Factors</CardTitle>
          <CardDescription>Set your confidence level for each symptom</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading symptoms...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          <CardTitle>Certainty Factors</CardTitle>
        </div>
        <CardDescription>
          Since the exact symptom combination doesn't match our database patterns,
          please indicate your confidence level for each selected symptom (0-100%).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Adjust the sliders to indicate how confident you are about each symptom.
            0% = Not confident, 100% = Very confident. This helps improve diagnosis accuracy.
          </Alert>
        </Alert>

        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {symptoms.filter(s => certaintyFactors[s.id] !== undefined).length} of {symptoms.length} set
          </span>
          <Button variant="outline" size="sm" onClick={autoFill}>
            Auto-fill (70%)
          </Button>
        </div>

        {/* Certainty Sliders */}
        <div className="space-y-6">
          {symptoms.map(symptom => {
            const value = certaintyFactors[symptom.id] || 70;
            const confidenceColor = value >= 80 ? 'text-green-600' :
                                   value >= 60 ? 'text-yellow-600' :
                                   value >= 40 ? 'text-orange-600' : 'text-red-600';

            return (
              <div key={symptom.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="font-medium">{symptom.name}</Label>
                    {symptom.description && (
                      <p className="text-xs text-muted-foreground">
                        {symptom.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {symptom.category}
                    </Badge>
                    <div className={cn("text-lg font-semibold", confidenceColor)}>
                      {value}%
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Slider
                    value={[value]}
                    onValueChange={(newValue) => handleCertaintyChange(symptom.id, newValue)}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Not confident</span>
                    <span>Somewhat confident</span>
                    <span>Very confident</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status */}
        {allFilled && (
          <Alert className="border-green-500">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              All certainty factors have been set. You can now submit for diagnosis.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!allFilled || submitting}
            className="flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              'Submit for Diagnosis'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}