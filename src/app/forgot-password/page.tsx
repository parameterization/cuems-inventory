'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error:', error);
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
              Reset Password
            </h1>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-columbia-navy font-medium text-base mb-2">
                  Columbia Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.uni@columbia.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 h-14 text-base border-gray-200"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 text-lg font-semibold bg-columbia-navy hover:bg-blue-900"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Link
                href="/login"
                className="block text-center text-sm text-columbia-navy hover:underline mt-4"
              >
                Back to Login
              </Link>
            </form>
          ) : (
            <div className="text-center">
              <div className="bg-green-50 border-2 border-green-600 text-green-700 px-4 py-4 mb-4">
                <p className="font-semibold">Check your email!</p>
                <p className="text-sm mt-2">
                  If an account exists with {email}, you will receive a password reset link.
                </p>
              </div>
              <Link
                href="/login"
                className="text-columbia-navy hover:underline font-medium"
              >
                Return to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

