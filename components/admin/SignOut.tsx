'use client';

import { useRouter } from 'next/navigation';

export default function SignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch('/api/admin/session', { method: 'DELETE' });
        router.refresh();
      }}
      className="text-sm text-mist transition-colors hover:text-ink"
    >
      Sign out
    </button>
  );
}
