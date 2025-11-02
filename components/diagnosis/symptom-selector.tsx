/**
 * Symptom Selector Component
 * Allows users to select symptoms for diagnosis
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Filter, CheckCircle, AlertCircle } from 'lucide-react';
import { diagnosisClient, Symptom } from '@/lib/diagnosis-client';
import { cn } from '@/lib/utils';

interface SymptomSelectorProps {
  selectedSymptoms: string[];
  onSymptomsChange: (symptoms: string[]) => void;
  onValidate?: (isValid: boolean, message?: string) => void;
  className?: string;
}

export function SymptomSelector({
  selectedSymptoms,
  onSymptomsChange,
  onValidate,
  className
}: SymptomSelectorProps) {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [validating, setValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  // Load symptoms and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [symptomsData, categoriesData] = await Promise.all([
          diagnosisClient.getSymptoms(),
          diagnosisClient.getSymptomCategories()
        ]);

        setSymptoms(symptomsData);
        setCategories(['all', ...categoriesData]);
      } catch (error) {
        console.error('Failed to load symptoms:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter symptoms based on search and category
  const filteredSymptoms = symptoms.filter(symptom => {
    const matchesSearch = !searchQuery ||
      symptom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      symptom.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || symptom.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group symptoms by category
  const symptomsByCategory = filteredSymptoms.reduce((groups, symptom) => {
    const category = symptom.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(symptom);
    return groups;
  }, {} as Record<string, Symptom[]>);

  // Handle symptom selection
  const handleSymptomToggle = (symptomId: string, checked: boolean) => {
    if (checked) {
      onSymptomsChange([...selectedSymptoms, symptomId]);
    } else {
      onSymptomsChange(selectedSymptoms.filter(id => id !== symptomId));
    }
  };

  // Validate selected symptoms
  const validateSymptoms = async () => {
    if (selectedSymptoms.length === 0) {
      setValidationMessage('Please select at least one symptom');
      setIsValid(false);
      onValidate?.(false, 'Please select at least one symptom');
      return;
    }

    try {
      setValidating(true);
      const validation = await diagnosisClient.validateSymptoms(selectedSymptoms);

      setIsValid(validation.valid);
      setValidationMessage(validation.message ||
        (validation.valid ? 'Valid symptom selection' : 'Invalid symptom selection'));

      onValidate?.(validation.valid, validation.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validation failed';
      setValidationMessage(message);
      setIsValid(false);
      onValidate?.(false, message);
    } finally {
      setValidating(false);
    }
  };

  // Auto-validate when selection changes
  useEffect(() => {
    if (selectedSymptoms.length > 0) {
      const timer = setTimeout(() => {
        validateSymptoms();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setIsValid(null);
      setValidationMessage(null);
      onValidate?.(false, 'Please select at least one symptom');
    }
  }, [selectedSymptoms]);

  // Clear selection
  const clearSelection = () => {
    onSymptomsChange([]);
    setIsValid(null);
    setValidationMessage(null);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Select Symptoms</CardTitle>
          <CardDescription>Choose the symptoms you observe on your rice plants</CardDescription>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Select Symptoms</CardTitle>
            <CardDescription>
              Choose the symptoms you observe on your rice plants
              {selectedSymptoms.length > 0 && (
                <span className="ml-2 text-primary">
                  ({selectedSymptoms.length} selected)
                </span>
              )}
            </CardDescription>
          </div>
          {selectedSymptoms.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search symptoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>

        {/* Validation Status */}
        {validationMessage && (
          <Alert className={cn(
            isValid === false ? "border-destructive" :
            isValid === true ? "border-green-500" : ""
          )}>
            <div className="flex items-center gap-2">
              {isValid === false && <AlertCircle className="h-4 w-4 text-destructive" />}
              {isValid === true && <CheckCircle className="h-4 w-4 text-green-500" />}
              {validating && <Loader2 className="h-4 w-4 animate-spin" />}
              <AlertDescription>
                {validationMessage}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Symptom List */}
        <ScrollArea className="h-96 border rounded-md">
          <div className="p-4 space-y-6">
            {Object.entries(symptomsByCategory).map(([category, categorySymptoms]) => (
              <div key={category}>
                <h4 className="font-medium text-sm text-muted-foreground mb-3">
                  {category}
                </h4>
                <div className="space-y-3">
                  {categorySymptoms.map(symptom => (
                    <div key={symptom.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={symptom.id}
                        checked={selectedSymptoms.includes(symptom.id)}
                        onCheckedChange={(checked) =>
                          handleSymptomToggle(symptom.id, checked as boolean)
                        }
                      />
                      <div className="flex-1 space-y-1">
                        <label
                          htmlFor={symptom.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {symptom.name}
                        </label>
                        {symptom.description && (
                          <p className="text-xs text-muted-foreground">
                            {symptom.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {symptom.severity}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            CF: {((symptom.mb_value - symptom.md_value) * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filteredSymptoms.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No symptoms found matching your search criteria.
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Selected Symptoms Summary */}
        {selectedSymptoms.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-2">Selected Symptoms:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedSymptoms.map(symptomId => {
                const symptom = symptoms.find(s => s.id === symptomId);
                return symptom ? (
                  <Badge key={symptomId} variant="default" className="text-xs">
                    {symptom.name}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}