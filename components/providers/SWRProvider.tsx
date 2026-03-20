/**
 * Client-side SWR configuration provider.
 * Extracted so the root layout can remain a Server Component.
 */

'use client';

import { SWRConfig } from 'swr';

export default function SWRProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <SWRConfig value={{ revalidateOnFocus: false }}>
      {children}
    </SWRConfig>
  );
}
