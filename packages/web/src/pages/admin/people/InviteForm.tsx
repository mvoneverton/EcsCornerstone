import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { PageHeader } from '../../../components/admin/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { FormField } from '../../../components/ui/FormField';
import api from '../../../lib/api';

const schema = z
  .object({
    firstName:       z.string().min(1, 'Required').max(50),
    lastName:        z.string().min(1, 'Required').max(50),
    email:           z.string().email('Enter a valid email'),
    assessmentType:  z.enum(['pca', 'wsa', 'ja'], { required_error: 'Select an assessment type' }),
    positionId:      z.string().uuid().optional(),
    currentPosition: z.string().max(100).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.assessmentType === 'ja' && !d.positionId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['positionId'], message: 'Select a position for Job Assessment' });
    }
  });

type FormValues = z.infer<typeof schema>;

interface Position { id: string; title: string; }
interface PositionsResponse { positions: Position[]; }

const assessmentTypes = [
  { value: 'pca', label: 'PCA — Personal Communication Assessment', description: 'Reveals communication style across three perspectives' },
  { value: 'wsa', label: 'WSA — Work Style Assessment', description: 'Reveals how someone operates in a work environment' },
  { value: 'ja',  label: 'JA — Job Assessment', description: 'Benchmarks a candidate against a defined job position' },
] as const;

export default function InviteForm() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { assessmentType: 'pca' },
  });

  const selectedType = watch('assessmentType');

  // Fetch positions for JA selector
  const { data: positionsData } = useQuery<PositionsResponse>({
    queryKey: ['positions'],
    queryFn: () => api.get<PositionsResponse>('/admin/positions?limit=100').then((r) => r.data),
    enabled: selectedType === 'ja',
  });
  const positions = positionsData?.positions ?? [];

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.post('/admin/invitations', data).then((r) => r.data),
    onSuccess: () => {
      navigate('/admin/people', { state: { invited: true } });
    },
    onError: (err: AxiosError<{ error: { message: string; code?: string } }>) => {
      const { message, code } = err.response?.data?.error ?? {};
      if (code === 'LIMIT_REACHED') {
        setError('root', { message });
      } else {
        setError('root', { message: message ?? 'Failed to send invitation. Please try again.' });
      }
    },
  });

  return (
    <div className="px-8 py-8 max-w-2xl">
      <PageHeader
        title="Invite someone"
        subtitle="Send an assessment invitation by email. The link expires in 7 days."
      />

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate>
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First name" htmlFor="firstName" error={errors.firstName?.message} required>
              <Input id="firstName" type="text" autoFocus {...register('firstName')} error={!!errors.firstName} />
            </FormField>
            <FormField label="Last name" htmlFor="lastName" error={errors.lastName?.message} required>
              <Input id="lastName" type="text" {...register('lastName')} error={!!errors.lastName} />
            </FormField>
          </div>

          <FormField label="Email address" htmlFor="email" error={errors.email?.message} required>
            <Input id="email" type="email" autoComplete="off" {...register('email')} error={!!errors.email} />
          </FormField>

          <FormField label="Current job title" htmlFor="currentPosition" hint="Optional — helps contextualize results">
            <Input id="currentPosition" type="text" {...register('currentPosition')} />
          </FormField>

          {/* Assessment type */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">
              Assessment type <span className="text-red-500 ml-0.5">*</span>
            </div>
            <Controller
              name="assessmentType"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  {assessmentTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                        field.value === type.value
                          ? 'border-accent bg-accent-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={type.value}
                        checked={field.value === type.value}
                        onChange={() => field.onChange(type.value)}
                        className="mt-0.5 text-accent focus:ring-accent"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{type.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Position selector — only for JA */}
          {selectedType === 'ja' && (
            <FormField
              label="Job position"
              htmlFor="positionId"
              error={errors.positionId?.message}
              required
            >
              {positions.length === 0 ? (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                  No positions have been created yet.{' '}
                  <Link to="/admin/positions/new" className="font-medium underline">
                    Create a position first
                  </Link>
                  {' '}before sending a Job Assessment.
                </div>
              ) : (
                <Select id="positionId" {...register('positionId')} error={!!errors.positionId}>
                  <option value="">Select a position…</option>
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>{pos.title}</option>
                  ))}
                </Select>
              )}
            </FormField>
          )}

          {errors.root && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{errors.root.message}</p>
              {errors.root.message?.includes('Upgrade') && (
                <Link to="/admin/billing" className="mt-1 block text-sm font-medium text-red-700 underline">
                  View billing →
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button type="submit" size="lg" loading={mutation.isPending}>
            Send invitation
          </Button>
          <Link to="/admin/people">
            <Button type="button" variant="ghost" size="lg">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
