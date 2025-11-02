'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Chrome, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await login();
      // Login will redirect automatically
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">🌾</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Padi Diagnosis</h1>
          <p className="text-gray-600">
            Rice Disease Diagnosis Expert System
          </p>
        </div>

        {/* Sign In Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your diagnosis dashboard and history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Chrome className="mr-2 h-4 w-4" />
                  Sign in with Google
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                By signing in, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What you get access to:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600">🔬</span>
                </div>
                <div>
                  <div className="font-medium">AI-Powered Diagnosis</div>
                  <div className="text-sm text-gray-600">
                    Expert system for rice plant diseases
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600">📊</span>
                </div>
                <div>
                  <div className="font-medium">Treatment Recommendations</div>
                  <div className="text-sm text-gray-600">
                    Personalized treatment plans with AI
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600">📚</span>
                </div>
                <div>
                  <div className="font-medium">Diagnosis History</div>
                  <div className="text-sm text-gray-600">
                    Track your diagnosis results over time
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link href="/help" className="text-blue-600 hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}