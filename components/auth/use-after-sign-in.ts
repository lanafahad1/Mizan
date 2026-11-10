'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { startPageFor } from './nav';

type SignedInUser = { role?: string | null; status?: string | null } | null | undefined;

/** Role start page on the client, including the member space (mirrors homeFor() in lib/server/session.ts). */
function startPage(user: SignedInUser): string {
  if (user?.role === 'member' && user.status === 'active') return '/home';
  return startPageFor(user);
}

/** After a successful sign-in or sign-up: go to the safe `next` path or the role start page, then refresh server components. */
export function useAfterSignIn(next: string | null) {
  const router = useRouter();
  return React.useCallback((user: SignedInUser) => {
    router.replace(next ?? startPage(user));
    router.refresh();
  }, [router, next]);
}
