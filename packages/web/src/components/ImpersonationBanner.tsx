import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import api from '../lib/api';

interface CompanyInfo {
  name: string;
}

export function ImpersonationBanner() {
  const { isImpersonating, endImpersonation } = useAuth();
  const navigate = useNavigate();

  const { data: company } = useQuery<CompanyInfo>({
    queryKey: ['company'],
    queryFn: () => api.get<CompanyInfo>('/admin/company').then((r) => r.data),
    enabled: isImpersonating,
  });

  const exitMutation = useMutation({
    mutationFn: () => api.get('/superadmin/exit-impersonation').then((r) => r.data),
    onSettled: () => {
      endImpersonation();
      navigate('/superadmin/companies', { replace: true });
    },
  });

  if (!isImpersonating) return null;

  return (
    <div className="flex items-center justify-between bg-gold px-6 py-2 text-sm font-medium text-navy">
      <span>
        Viewing as {company?.name ?? '…'}
      </span>
      <button
        onClick={() => exitMutation.mutate()}
        disabled={exitMutation.isPending}
        className="rounded-md bg-navy px-3 py-1 text-xs font-semibold text-white hover:bg-navy-600 transition-colors disabled:opacity-50"
      >
        Exit impersonation
      </button>
    </div>
  );
}
