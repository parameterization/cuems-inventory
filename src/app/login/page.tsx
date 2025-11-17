'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/take-remove');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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
        <div className="glass-effect shadow-2xl p-10 border-0">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-6">
              <img
                src="/cuems-logo.png"
                alt="CUEMS Logo"
                width="120"
                height="120"
                className="drop-shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-bold text-columbia-navy mb-2 tracking-tight">
              CUEMS Inventory
            </h1>
            <p className="text-gray-600 text-lg">Welcome back</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-columbia-navy font-medium text-base mb-2">
                Columbia Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@columbia.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 h-14 text-base border-gray-200 focus:border-blue-400 transition-colors"
                autoComplete="email"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-columbia-navy font-medium text-base mb-2">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 h-14 text-base border-gray-200 focus:border-blue-400 transition-colors"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-600 text-red-700 px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-lg font-semibold bg-columbia-navy hover:bg-blue-900 shadow-lg hover:shadow-xl transition-all text-white"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Link
              href="/forgot-password"
              className="block text-center text-sm text-columbia-navy hover:underline font-medium mt-3"
            >
              Forgot password?
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}


