import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';
import type { Person } from '../../types/admin';

type PathOption = 'agents' | 'fcaio';

interface UnlockResponse {
  success:   boolean;
  token:     string;
  expiresAt: string;
}

interface Props {
  client:   Person;
  onUnlock?: (paths: PathOption[]) => void;
}

export function PathUnlockPanel({ client, onUnlock }: Props) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<PathOption[]>([]);
  const [lastSent, setLastSent]  = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (paths: PathOption[]) =>
      api.post<UnlockResponse>(`/admin/clients/${client.id}/unlock-path`, { paths })
        .then((r) => r.data),
    onSuccess: (data) => {
      setLastSent(new Date(data.expiresAt).toISOString());
      setSelected([]);
      void queryClient.invalidateQueries({ queryKey: ['person', client.id] });
      onUnlock?.(selected);
    },
  });

  function togglePath(path: PathOption) {
    setSelected((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  }

  const unlockedPaths: string[] = (client as unknown as { unlockedPaths?: string[] }).unlockedPaths ?? [];
  const emailSentAt: string | null = (client as unknown as { pathEmailSentAt?: string }).pathEmailSentAt ?? null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Client Path</h2>

      {/* Current status */}
      <dl className="space-y-2 mb-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">ECS AI Scan completed</dt>
          <dd className="text-gray-700">
            {unlockedPaths.includes('scan_complete') ? (
              <span className="inline-flex items-center gap-1 text-green-600">
                <Check size={13} /> Completed
              </span>
            ) : '—'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">ECS AI Assessment completed</dt>
          <dd className="text-gray-700">
            {unlockedPaths.includes('assessment_complete') ? (
              <span className="inline-flex items-center gap-1 text-green-600">
                <Check size={13} /> Completed
              </span>
            ) : '—'}
          </dd>
        </div>
      </dl>

      {/* Path selector */}
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Unlock next step
        </p>
        <div className="flex gap-4">
          {(['agents', 'fcaio'] as const).map((path) => (
            <label key={path} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(path)}
                onChange={() => togglePath(path)}
                className="rounded border-gray-300 text-navy focus:ring-navy"
              />
              <span className="text-sm text-gray-700 capitalize">
                {path === 'agents' ? 'Agent Placement' : 'FCAIO'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {mutation.isError && (
        <p className="text-xs text-red-600 mb-3">Failed to send. Please try again.</p>
      )}

      <Button
        size="sm"
        disabled={selected.length === 0}
        loading={mutation.isPending}
        onClick={() => mutation.mutate(selected)}
      >
        Send Path Email
      </Button>

      <p className="mt-3 text-xs text-gray-400">
        Last email sent:{' '}
        {emailSentAt ? formatDate(emailSentAt) : lastSent ? formatDate(lastSent) : '—'}
      </p>
    </div>
  );
}
