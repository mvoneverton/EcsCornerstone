import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { PageHeader } from '../../../components/admin/PageHeader';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import api from '../../../lib/api';

const schema = z.object({
  title: z.string().min(1, 'Position title is required').max(120, 'Maximum 120 characters'),
});

type FormData = z.infer<typeof schema>;

export default function PositionNew() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post<{ position: { id: string } }>('/admin/positions', data).then((r) => r.data),
    onSuccess: (data) => {
      navigate(`/admin/positions/${data.position.id}`);
    },
  });

  return (
    <div className="px-8 py-8">
      <PageHeader title="New Position" />

      <div className="max-w-lg">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="mb-6 text-sm text-gray-500">
            A position defines a job role for a Job Analysis (JA) assessment. Once created, you can
            invite multiple assessors to complete JA assessments and build a consensus behavioral
            benchmark.
          </p>

          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} noValidate>
            <FormField
              label="Position title"
              htmlFor="title"
              error={errors.title?.message}
              hint="E.g. Senior Account Executive, Operations Manager"
            >
              <Input
                id="title"
                placeholder="Enter position title"
                {...register('title')}
                error={!!errors.title}
              />
            </FormField>

            {mutation.isError && (
              <p className="mt-4 text-sm text-red-600">
                {(mutation.error as { response?: { data?: { error?: { message?: string } } } })
                  ?.response?.data?.error?.message ?? 'Failed to create position. Please try again.'}
              </p>
            )}

            <div className="mt-6 flex items-center gap-3">
              <Button type="submit" size="md" loading={mutation.isPending}>
                Create position
              </Button>
              <Link to="/admin/positions">
                <Button type="button" variant="ghost" size="md">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
