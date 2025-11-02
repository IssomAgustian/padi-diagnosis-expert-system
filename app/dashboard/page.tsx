/**
 * Dashboard Page - Main landing page for authenticated users
 * Shows overview of rice disease diagnosis system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-backend';
import { diagnosisClient } from '@/lib/diagnosis-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3,
  Microscope,
  History,
  Activity,
  TrendingUp,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  Leaf,
  Droplets,
  Sun
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!isAuthenticated) return;

      try {
        setError(null);
        const userStats = await diagnosisClient.getHistoryStats();
        setStats(userStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to access your dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.name || 'User'}! 🌾
          </h1>
          <p className="text-muted-foreground">
            Your intelligent rice disease diagnosis system is ready to help.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Diagnosis</CardTitle>
              <Microscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/diagnosis">
                <Button className="w-full">
                  <Microscope className="w-4 h-4 mr-2" />
                  Start Diagnosis
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">View History</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/history">
                <Button variant="outline" className="w-full">
                  <History className="w-4 h-4 mr-2" />
                  My History
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Statistics</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                <BarChart3 className="w-4 h-4 mr-2" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Help Center</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                <Info className="w-4 h-4 mr-2" />
                Get Help
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Section */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Alert className="border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Diagnoses</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_diagnoses}</div>
                <p className="text-xs text-muted-foreground">
                  Lifetime diagnoses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recent_diagnoses_30_days}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.average_confidence}%</div>
                <p className="text-xs text-muted-foreground">
                  Diagnosis accuracy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Feedback</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.feedback_stats?.total_feedback || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Feedback submissions
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Disease Frequency */}
        {stats?.disease_frequency && Object.keys(stats.disease_frequency).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Most Diagnosed Diseases</CardTitle>
              <CardDescription>
                Your most frequently diagnosed rice diseases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.disease_frequency).slice(0, 5).map(([disease, count], index) => (
                  <div key={disease} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{disease}</div>
                        <div className="text-sm text-muted-foreground">
                          Diagnosed {count} time{count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Method Usage */}
        {stats?.method_usage && Object.keys(stats.method_usage).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Diagnosis Methods</CardTitle>
              <CardDescription>
                Breakdown of diagnosis methods used
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(stats.method_usage).map(([method, count]) => (
                  <div key={method} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {method.replace('_', ' ')}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / stats.total_diagnoses) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium text-green-600">Operational</div>
              <p className="text-xs text-muted-foreground">
                All systems are running normally
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Model</CardTitle>
              <Microscope className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">Active</div>
              <p className="text-xs text-muted-foreground">
                AI treatment generation is available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Retention</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">30 Days</div>
              <p className="text-xs text-muted-foreground">
                Your data is automatically deleted after 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tips and Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-500" />
              Rice Disease Diagnosis Tips
            </CardTitle>
            <CardDescription>
              Best practices for accurate diagnosis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Sun className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Good Lighting</h4>
                  <p className="text-sm text-muted-foreground">
                    Examine plants in natural daylight for best symptom visibility
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Droplets className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Check Moisture</h4>
                  <p className="text-sm text-muted-foreground">
                    Consider recent weather and irrigation patterns
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Microscope className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium">Multiple Symptoms</h4>
                  <p className="text-sm text-muted-foreground">
                    Select all relevant symptoms for better accuracy
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>About this system:</strong> This AI-powered rice disease diagnosis expert system combines
            forward chaining rule-based analysis with certainty factor calculations to provide accurate
            disease identification and treatment recommendations. Always consult with local agricultural
            experts for confirmation and guidance.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}