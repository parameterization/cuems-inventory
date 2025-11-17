'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link');
    }
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.1),transparent_50%)]" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="glass-effect shadow-2xl p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6">
              <img
                src="/cuems-logo.png"
                alt="CUEMS Logo"
                width="100"
                height="100"
                className="drop-shadow-lg"
              />
            </div>
            <h1 className="text-3xl font-bold text-columbia-navy mb-2 tracking-tight">
              Set New Password
            </h1>
          </div>

          {success ? (
            <div className="text-center">
              <div className="bg-green-50 border-2 border-green-600 text-green-700 px-4 py-4 mb-4">
                <p className="font-semibold">Password updated!</p>
                <p className="text-sm mt-2">Redirecting to login...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="newPassword" className="text-columbia-navy font-medium text-base mb-2">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="mt-2 h-14 text-base border-gray-200"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-columbia-navy font-medium text-base mb-2">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-2 h-14 text-base border-gray-200"
                />
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-600 text-red-700 px-4 py-3 text-sm font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !token}
                className="w-full h-14 text-lg font-semibold bg-columbia-navy hover:bg-blue-900"
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

