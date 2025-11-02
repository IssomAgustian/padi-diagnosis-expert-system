/**
 * Diagnosis History Page
 * Displays user's diagnosis history with search, filters, and pagination
 */

'use client';

import React, { useState } from 'react';
import { HistoryTable } from '@/components/history/history-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3,
  Download,
  Calendar,
  Clock,
  TrendingUp,
  User,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Diagnosis History</h1>
        <p className="text-muted-foreground">
          View and manage your past rice disease diagnoses
        </p>
      </div>

      {/* Main History Table */}
      <HistoryTable />

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Data Retention Notice */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Retention</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30 Days</div>
            <p className="text-xs text-muted-foreground">
              Your diagnosis history is automatically deleted after 30 days for privacy
            </p>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Export Options</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export All as CSV
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Help?</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">View detailed diagnosis information</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Export diagnosis reports as PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Delete records you no longer need</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tips:</strong> Use the search and filter options above to quickly find specific diagnoses.
          You can select multiple records for bulk deletion using the checkboxes.
        </AlertDescription>
      </Alert>
    </div>
  );
}