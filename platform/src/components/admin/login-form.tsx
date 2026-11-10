'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      // Mensaje genérico a propósito: distinguir "correo no existe" de
      // "contraseña incorrecta" le confirma cuentas válidas a un atacante.
      setError('Correo o contraseña incorrectos.');
      setLoading(false);
      return;
    }

    // refresh() para que el middleware y los Server Components vean la cookie.
    const next = params.get('next') ?? '/admin';
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="label">Correo electrónico</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
          placeholder="tu@negocio.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">Contraseña</label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p role="alert" className="border-l-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-ink w-full py-3.5">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando…</> : 'Entrar'}
      </button>
    </form>
  );
}
