/**
 * Diagnosis Result Component
 * Displays the diagnosis results with AI-generated treatment plans
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  RefreshCw,
  Save,
  Share,
  FlaskRound,
  Clock,
  Target
} from 'lucide-react';
import { DiagnosisResult } from '@/lib/diagnosis-client';
import { cn } from '@/lib/utils';

interface DiagnosisResultProps {
  result: DiagnosisResult;
  onNewDiagnosis: () => void;
  onSaveHistory: () => void;
  onExportPDF: () => void;
  className?: string;
}

export function DiagnosisResult({
  result,
  onNewDiagnosis,
  onSaveHistory,
  onExportPDF,
  className
}: DiagnosisResultProps) {
  const [saving, setSaving] = useState(false);

  const getStatusIcon = () => {
    switch (result.diagnosis) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'uncertain':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unknown':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <FlaskRound className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (result.diagnosis) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'uncertain':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unknown':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    if (confidence >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleSaveHistory = async () => {
    try {
      setSaving(true);
      await onSaveHistory();
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Diagnosis Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="flex items-center gap-2">
                Diagnosis Result
                {result.diagnosis_id && (
                  <Badge variant="outline" className="text-xs">
                    ID: {result.diagnosis_id}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {result.diagnosis === 'completed' && 'Diagnosis completed successfully'}
                {result.diagnosis === 'uncertain' && 'Diagnosis with low confidence - please consult an expert'}
                {result.diagnosis === 'unknown' && 'Unable to determine the disease with confidence'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Disease Information */}
          {result.disease && (
            <div className={cn("p-4 rounded-lg border", getStatusColor())}>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{result.disease.name}</h3>
                  {result.disease.scientific_name && (
                    <p className="text-sm italic">{result.disease.scientific_name}</p>
                  )}
                  {result.disease.description && (
                    <p className="text-sm">{result.disease.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className={cn("text-2xl font-bold", getConfidenceColor(result.confidence))}>
                    {result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">Confidence</div>
                </div>
              </div>
            </div>
          )}

          {/* Diagnosis Method */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>Method: {result.method?.replace('_', ' ') || 'Unknown'}</span>
            </div>
            {result.rule_id && (
              <div className="flex items-center gap-1">
                <FlaskRound className="h-4 w-4" />
                <span>Rule: {result.rule_id}</span>
              </div>
            )}
          </div>

          {/* Message */}
          {result.message && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Recommendations:</h4>
              <ul className="space-y-1">
                {result.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Treatment Plan */}
      {result.treatment_plan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskRound className="h-5 w-5 text-blue-500" />
              AI-Generated Treatment Plan
            </CardTitle>
            <CardDescription>
              Personalized treatment recommendations generated by AI
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-6 pr-4">
                {/* Immediate Actions */}
                {result.treatment_plan.immediate_actions && (
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">Immediate Actions</h4>
                    <ul className="space-y-1">
                      {result.treatment_plan.immediate_actions.map((action: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-medium mt-0.5">
                            {index + 1}
                          </div>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Chemical Treatment */}
                {result.treatment_plan.chemical_treatment && (
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-600">Chemical Treatment</h4>
                    <div className="space-y-2 text-sm">
                      {result.treatment_plan.chemical_treatment.recommended_products && (
                        <div>
                          <span className="font-medium">Recommended Products:</span>
                          <ul className="mt-1 space-y-1">
                            {result.treatment_plan.chemical_treatment.recommended_products.map((product: string, index: number) => (
                              <li key={index} className="ml-4">• {product}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.treatment_plan.chemical_treatment.dosage && (
                        <div>
                          <span className="font-medium">Dosage:</span> {result.treatment_plan.chemical_treatment.dosage}
                        </div>
                      )}
                      {result.treatment_plan.chemical_treatment.application_method && (
                        <div>
                          <span className="font-medium">Application Method:</span> {result.treatment_plan.chemical_treatment.application_method}
                        </div>
                      )}
                      {result.treatment_plan.chemical_treatment.frequency && (
                        <div>
                          <span className="font-medium">Frequency:</span> {result.treatment_plan.chemical_treatment.frequency}
                        </div>
                      )}
                      {result.treatment_plan.chemical_treatment.precautions && (
                        <div>
                          <span className="font-medium">Precautions:</span> {result.treatment_plan.chemical_treatment.precautions}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cultural Practices */}
                {result.treatment_plan.cultural_practices && result.treatment_plan.cultural_practices.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">Cultural Practices</h4>
                    <ul className="space-y-1">
                      {result.treatment_plan.cultural_practices.map((practice: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{practice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Monitoring */}
                {result.treatment_plan.monitoring && result.treatment_plan.monitoring.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-orange-600">Monitoring</h4>
                    <ul className="space-y-1">
                      {result.treatment_plan.monitoring.map((monitor: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>{monitor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prevention */}
                {result.treatment_plan.prevention && result.treatment_plan.prevention.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-600">Prevention</h4>
                    <ul className="space-y-1">
                      {result.treatment_plan.prevention.map((prevention: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{prevention}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Timeline */}
                {result.treatment_plan.timeline && (
                  <div>
                    <h4 className="font-semibold mb-2 text-purple-600">Expected Timeline</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-purple-500" />
                      <span>{result.treatment_plan.timeline}</span>
                    </div>
                  </div>
                )}

                {/* Success Rate */}
                {result.treatment_plan.success_rate && (
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">Success Rate</h4>
                    <div className="text-lg font-semibold text-green-600">
                      {result.treatment_plan.success_rate}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* CF Scores (if available) */}
      {result.symptom_cf_scores && Object.keys(result.symptom_cf_scores).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Certainty Factor Analysis</CardTitle>
            <CardDescription>
              Breakdown of certainty scores for each symptom
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(result.symptom_cf_scores).map(([symptomId, cfScore]) => (
                <div key={symptomId} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{symptomId}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.abs(cfScore * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {(cfScore * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Error */}
      {result.ai_error && (
        <Alert className="border-yellow-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>AI Service Notice:</strong> {result.ai_error}
            <br />
            Alternative treatment options have been provided.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSaveHistory} disabled={saving}>
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save to History
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={onNewDiagnosis}>
              <RefreshCw className="w-4 h-4 mr-2" />
              New Diagnosis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}