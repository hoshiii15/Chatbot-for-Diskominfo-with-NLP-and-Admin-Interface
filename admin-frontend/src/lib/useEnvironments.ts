'use client';

import { useEffect, useState } from 'react';

export default function useEnvironments() {
  const [envs, setEnvs] = useState<string[]>(['stunting', 'ppid']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/api/environments');
        if (!resp.ok) return;
        const json = await resp.json();
        if (mounted && Array.isArray(json.data)) {
          setEnvs(json.data as string[]);
        }
      } catch (e) {
        // ignore and keep defaults
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { envs, loading, refresh: async () => {
    try {
      const resp = await fetch('/api/environments');
      if (!resp.ok) return;
      const json = await resp.json();
      if (Array.isArray(json.data)) setEnvs(json.data as string[]);
    } catch (_) {}
  } };
}
