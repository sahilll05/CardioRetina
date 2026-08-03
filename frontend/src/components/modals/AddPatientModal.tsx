import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PatientCreate, PatientData } from '@/hooks/usePatients';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.coerce.number().int().min(1).max(150),
  gender: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  diabetes_history: z.boolean(),
  hypertension: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface AddPatientModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: PatientCreate) => Promise<PatientData | null>;
  editPatient?: PatientData | null;
}

export function AddPatientModal({ open, onClose, onSave, editPatient }: AddPatientModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      diabetes_history: false,
      hypertension: false,
    },
  });

  useEffect(() => {
    if (editPatient) {
      reset({
        name: editPatient.name,
        age: editPatient.age,
        gender: editPatient.gender || '',
        phone: editPatient.phone || '',
        email: editPatient.email || '',
        diabetes_history: editPatient.diabetes_history,
        hypertension: editPatient.hypertension,
      });
    } else {
      reset({ diabetes_history: false, hypertension: false });
    }
  }, [editPatient, reset, open]);

  const onSubmit = async (data: Record<string, any>) => {
    const typed = data as FormData;
    const payload: PatientCreate = {
      name: typed.name,
      age: typed.age,
      diabetes_history: typed.diabetes_history,
      hypertension: typed.hypertension,
      email: typed.email || undefined,
      gender: typed.gender || undefined,
      phone: typed.phone || undefined,
    };
    const result = await onSave(payload);
    if (result) {
      onClose();
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{editPatient ? 'Edit Patient' : 'Register New Patient'}</DialogTitle>
          <DialogDescription>
            {editPatient
              ? 'Update the patient information below.'
              : 'Enter patient details to create a new record in the system.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" placeholder="John Doe" {...register('name')} />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="age">Age *</Label>
              <Input id="age" type="number" placeholder="55" {...register('age')} />
              {errors.age && <p className="text-red-500 text-xs">{errors.age.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={watch('gender') || ''}
                onValueChange={(v) => setValue('gender', v)}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+1-234-567-8900" {...register('phone')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="patient@email.com" {...register('email')} />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-slate-700 mb-3">Medical History</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" className="w-4 h-4" {...register('diabetes_history')} />
                <span className="text-sm font-medium">Diabetes History</span>
              </label>
              <label className="flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" className="w-4 h-4" {...register('hypertension')} />
                <span className="text-sm font-medium">Hypertension</span>
              </label>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editPatient ? 'Save Changes' : 'Register Patient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
