import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../../components/admin/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { formatDate, fullName } from '../../../lib/utils';
import type { Person, Pagination } from '../../../types/admin';
import api from '../../../lib/api';

interface PeopleResponse {
  people:     Person[];
  pagination: Pagination;
}

function roleVariant(role: string): 'blue' | 'teal' | 'gray' {
  if (role === 'company_admin') return 'blue';
  if (role === 'facilitator')   return 'teal';
  return 'gray';
}

function roleLabel(role: string): string {
  if (role === 'company_admin') return 'Admin';
  if (role === 'facilitator')   return 'Facilitator';
  return 'Respondent';
}

export default function PeopleList() {
  const navigate        = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // simple debounce without external lib
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debounceTimer, setDebounceTimer]     = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(val: string) {
    setSearch(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
    setDebounceTimer(t);
  }

  const { data, isLoading } = useQuery<PeopleResponse>({
    queryKey: ['people', page, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      return api.get<PeopleResponse>(`/admin/people?${params}`).then((r) => r.data);
    },
    placeholderData: (prev) => prev,
  });

  const people     = data?.people     ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 };

  return (
    <div className="px-8 py-8">
      <PageHeader
        title="People"
        subtitle={pagination.total > 0 ? `${pagination.total} total` : undefined}
        actions={
          <Link to="/admin/people/invite">
            <Button size="md">
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Invite someone
            </Button>
          </Link>
        }
      />

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <Input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessments</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: j === 0 ? '120px' : j === 1 ? '160px' : '80px' }} />
                    </td>
                  ))}
                </tr>
              ))
            )}
            {!isLoading && people.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                  {debouncedSearch ? 'No people match that search.' : 'No people yet. Invite someone to get started.'}
                </td>
              </tr>
            )}
            {!isLoading && people.map((person) => (
              <tr
                key={person.id}
                onClick={() => navigate(`/admin/people/${person.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium text-navy">
                  {fullName(person)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{person.email}</td>
                <td className="px-6 py-4">
                  <Badge variant={roleVariant(person.role)}>{roleLabel(person.role)}</Badge>
                </td>
                <td className="px-6 py-4">
                  {person.completedAssessments > 0 ? (
                    <Badge variant="green">
                      {person.completedAssessments} completed
                    </Badge>
                  ) : (
                    <Badge variant="gray">None</Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">{formatDate(person.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 bg-gray-50">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} people
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
