'use client';

import { signInWithEmail, signInWithGoogle, useAuthContext } from '@iliad/auth';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@iliad/ui';
import { RadioTower } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, Suspense, useEffect, useState } from 'react';

function safeNextPath(value: string | null): string {
  // Only same-origin relative paths; never redirect off-site.
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) {
    return '/';
  }
  return value;
}

function describeError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Sign-in was cancelled.';
  }
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-email'
  ) {
    return 'Email or password is incorrect.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Try again later.';
  }
  return error instanceof Error ? error.message : 'Sign-in failed.';
}

function LoginForm() {
  const { status } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === 'signedIn') {
      router.replace(nextPath);
    }
  }, [status, nextPath, router]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusy(false);
    }
  }

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(() => signInWithEmail(email.trim(), password));
  }

  const disabled = busy || status === 'misconfigured' || status === 'loading';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-700">
            <RadioTower className="h-5 w-5 text-white" />
          </div>
          <CardTitle>Sign in to OdysseyCast</CardTitle>
          <CardDescription>Use your Iliad account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'misconfigured' ? (
            <p className="text-sm text-red-500">
              Sign-in is not configured. Set the NEXT_PUBLIC_FIREBASE_* variables for the iig-core
              project.
            </p>
          ) : null}

          <Button
            type="button"
            className="w-full"
            disabled={disabled}
            onClick={() => void run(signInWithGoogle)}
          >
            Continue with Google
          </Button>

          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-3" onSubmit={handleEmailSubmit}>
            <Input
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={disabled}
            />
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={disabled}
            />
            <Button type="submit" variant="outline" className="w-full" disabled={disabled}>
              Sign in with email
            </Button>
          </form>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
