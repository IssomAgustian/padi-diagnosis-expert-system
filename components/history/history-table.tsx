/**
 * History Table Component
 * Displays user diagnosis history with pagination and actions
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { diagnosisClient, DiagnosisHistory } from '@/lib/diagnosis-client';
import { cn } from '@/lib/utils';

interface HistoryTableProps {
  className?: string;
}

export function HistoryTable({ className }: HistoryTableProps) {
  const [diagnoses, setDiagnoses] = useState<DiagnosisHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0,
    has_prev: false,
    has_next: false,
  });

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');
  const [diseaseFilter, setDiseaseFilter] = useState('all');

  // Selected items for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewingDiagnosis, setViewingDiagnosis] = useState<DiagnosisHistory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load history
  const loadHistory = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params: any = { page, per_page: pagination.per_page };

      // Add filters
      if (searchQuery) params.query = searchQuery;
      if (diseaseFilter !== 'all') params.disease = diseaseFilter;

      // Add date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let fromDate = new Date();

        switch (dateFilter) {
          case '7days':
            fromDate.setDate(now.getDate() - 7);
            break;
          case '30days':
            fromDate.setDate(now.getDate() - 30);
            break;
          case '90days':
            fromDate.setDate(now.getDate() - 90);
            break;
        }

        params.date_from = fromDate.toISOString().split('T')[0];
      }

      const result = await diagnosisClient.searchHistory(params);
      setDiagnoses(result.diagnoses);
      setPagination(prev => ({
        ...prev,
        ...result.pagination,
        page,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and refresh on filter changes
  useEffect(() => {
    loadHistory(1);
  }, [searchQuery, dateFilter, diseaseFilter]);

  // Handle page changes
  const handlePageChange = (page: number) => {
    loadHistory(page);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await diagnosisClient.deleteDiagnosis(id);
      await loadHistory(pagination.page); // Reload current page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete diagnosis');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      await diagnosisClient.bulkDeleteDiagnoses(selectedIds);
      setSelectedIds([]);
      await loadHistory(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete diagnoses');
    }
  };

  // Handle export PDF
  const handleExportPDF = async (id: string) => {
    try {
      const data = await diagnosisClient.exportDiagnosisPDF(id);

      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const content = generatePrintContent(data);
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export PDF');
    }
  };

  // Generate print content
  const generatePrintContent = (data: any) => {
    return `
      <html>
        <head>
          <title>Rice Disease Diagnosis Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .disease { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .confidence { font-size: 24px; font-weight: bold; color: #059669; }
            .symptom { background: #fef3c7; padding: 8px 12px; border-radius: 4px; margin: 4px 0; display: inline-block; }
            .treatment { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; }
            ul { margin: 10px 0; padding-left: 20px; }
            li { margin: 8px 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .label { font-weight: bold; color: #374151; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌾 Rice Disease Diagnosis Report</h1>
            <p><strong>Report ID:</strong> ${data.patient_info?.diagnosis_id}</p>
            <p><strong>Date:</strong> ${new Date(data.generated_at).toLocaleDateString()}</p>
            <p><strong>Patient:</strong> ${data.patient_info?.name || 'Unknown'}</p>
            <p><strong>Email:</strong> ${data.patient_info?.email || 'Unknown'}</p>
          </div>

          ${data.diagnosis?.disease ? `
            <div class="disease">
              <h2>🦠 Diagnosed Disease: ${data.diagnosis.disease}</h2>
              <div class="confidence">Confidence: ${data.diagnosis.confidence ? (data.diagnosis.confidence * 100).toFixed(1) : 'N/A'}%</div>
              <p><strong>Method:</strong> ${data.diagnosis.method?.replace('_', ' ') || 'Unknown'}</p>
              <p><strong>Rule:</strong> ${data.diagnosis.rule_id || 'N/A'}</p>
            </div>
          ` : ''}

          <div class="section">
            <h3>🌿 Selected Symptoms:</h3>
            <div>
              ${(data.symptoms?.selected || []).map((symptom: string) =>
                `<span class="symptom">${symptom}</span>`
              ).join(' ')}
            </div>
          </div>

          ${data.treatment_plan && (
            <div class="treatment">
              <h3>💊 Treatment Plan</h3>

              ${data.treatment_plan.immediate_actions ? `
                <div class="section">
                  <h4>🚨 Immediate Actions:</h4>
                  <ul>
                    ${data.treatment_plan.immediate_actions.map((action: string) => `<li>${action}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              ${data.treatment_plan.chemical_treatment ? `
                <div class="section">
                  <h4>🧪 Chemical Treatment:</h4>
                  <div class="grid">
                    ${data.treatment_plan.chemical_treatment.recommended_products ? `
                      <div>
                        <span class="label">Recommended Products:</span>
                        <ul>
                          ${data.treatment_plan.chemical_treatment.recommended_products.map((product: string) => `<li>${product}</li>`).join('')}
                        </ul>
                      </div>
                    ` : ''}
                    ${data.treatment_plan.chemical_treatment.dosage ? `
                      <div><span class="label">Dosage:</span> ${data.treatment_plan.chemical_treatment.dosage}</div>
                    ` : ''}
                    ${data.treatment_plan.chemical_treatment.application_method ? `
                      <div><span class="label">Application:</span> ${data.treatment_plan.chemical_treatment.application_method}</div>
                    ` : ''}
                    ${data.treatment_plan.chemical_treatment.frequency ? `
                      <div><span class="label">Frequency:</span> ${data.treatment_plan.chemical_treatment.frequency}</div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}

              ${data.treatment_plan.cultural_practices && data.treatment_plan.cultural_practices.length > 0 ? `
                <div class="section">
                  <h4>🌱 Cultural Practices:</h4>
                  <ul>
                    ${data.treatment_plan.cultural_practices.map((practice: string) => `<li>${practice}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              ${data.treatment_plan.monitoring && data.treatment_plan.monitoring.length > 0 ? `
                <div class="section">
                  <h4>👀 Monitoring:</h4>
                  <ul>
                    ${data.treatment_plan.monitoring.map((monitor: string) => `<li>${monitor}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          )}

          <div class="footer">
            <p><em>This is an AI-generated diagnosis. Please consult with a local agricultural expert for confirmation and treatment guidance.</em></p>
            <p>Generated by Rice Disease Diagnosis Expert System</p>
          </div>
        </body>
      </html>
    `;
  };

  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' };
      case 'pending':
        return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' };
      default:
        return { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Diagnosis History</CardTitle>
            <CardDescription>
              Your previous diagnosis results (last 30 days)
            </CardDescription>
          </div>
          {selectedIds.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedIds.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Selected Diagnoses?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedIds.length} diagnosis record(s). This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search diagnoses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={diseaseFilter} onValueChange={setDiseaseFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by disease" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Diseases</SelectItem>
              {/* This would be populated with actual diseases from API */}
            </SelectContent>
          </Select>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Count */}
        {!loading && (
          <div className="text-sm text-muted-foreground">
            Showing {diagnoses.length} of {pagination.total} results
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : diagnoses.length > 0 ? (
          <>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === diagnoses.length && diagnoses.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(diagnoses.map(d => d.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Disease</TableHead>
                    <TableHead>Symptoms</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diagnoses.map((diagnosis) => {
                    const StatusIcon = getStatusInfo(diagnosis.status).icon;
                    return (
                      <TableRow key={diagnosis.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(diagnosis.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds([...selectedIds, diagnosis.id]);
                              } else {
                                setSelectedIds(selectedIds.filter(id => id !== diagnosis.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(diagnosis.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <div className="font-medium">{diagnosis.disease_name || 'Unknown'}</div>
                            {diagnosis.final_certainty_score && (
                              <div className="text-xs text-muted-foreground">
                                {(diagnosis.final_certainty_score * 100).toFixed(1)}% confidence
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[150px]">
                            <div className="text-xs">
                              {diagnosis.symptoms_selected.slice(0, 2).join(', ')}
                              {diagnosis.symptoms_selected.length > 2 && (
                                <span className="text-muted-foreground">
                                  +{diagnosis.symptoms_selected.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {diagnosis.diagnosis_method.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {diagnosis.final_certainty_score ? (
                            <span className={cn(
                              "font-medium",
                              diagnosis.final_certainty_score >= 0.8 ? "text-green-600" :
                              diagnosis.final_certainty_score >= 0.6 ? "text-yellow-600" :
                              "text-red-600"
                            )}>
                              {(diagnosis.final_certainty_score * 100).toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                            getStatusInfo(diagnosis.status).bg
                          )}>
                            <StatusIcon className={cn("w-3 h-3", getStatusInfo(diagnosis.status).color)} />
                            {diagnosis.status}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setViewingDiagnosis(diagnosis)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle>Diagnosis Details</DialogTitle>
                                  <DialogDescription>
                                    Full diagnosis information and treatment plan
                                  </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="max-h-[60vh]">
                                  {viewingDiagnosis && (
                                    <div className="space-y-6">
                                      {/* Diagnosis content would go here */}
                                      <div className="text-sm">
                                        <p><strong>ID:</strong> {viewingDiagnosis.id}</p>
                                        <p><strong>Date:</strong> {formatDate(viewingDiagnosis.created_at)}</p>
                                        <p><strong>Disease:</strong> {viewingDiagnosis.disease_name || 'Unknown'}</p>
                                        <p><strong>Method:</strong> {viewingDiagnosis.diagnosis_method}</p>
                                        <p><strong>Status:</strong> {viewingDiagnosis.status}</p>
                                      </div>
                                    </div>
                                  )}
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportPDF(diagnosis.id)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Diagnosis?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete this diagnosis record. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(diagnosis.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.has_prev}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={pagination.page === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.has_next}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No diagnosis history found.
          </div>
        )}
      </CardContent>
    </Card>
  );
}