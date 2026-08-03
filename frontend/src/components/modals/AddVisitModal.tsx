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
import type { VisitCreate, VisitData } from '@/hooks/useVisits';

const schema = z.object({
  bp_systolic: z.coerce.number().min(50).max(300).optional().or(z.literal('')),
  bp_diastolic: z.coerce.number().min(30).max(200).optional().or(z.literal('')),
  blood_sugar: z.coerce.number().min(20).max(800).optional().or(z.literal('')),
  cholesterol: z.coerce.number().min(50).max(600).optional().or(z.literal('')),
  hba1c: z.coerce.number().min(3).max(20).optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface AddVisitModalProps {
  open: boolean;
  patientId: string;
  onClose: () => void;
  onSave: (data: VisitCreate) => Promise<VisitData | null>;
}

export function AddVisitModal({ open, patientId, onClose, onSave }: AddVisitModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) as any });

  const onSubmit = async (raw: Record<string, any>) => {
    const data = raw as FormData;
    const payload: VisitCreate = {
      patient_id: patientId,
      bp_systolic: data.bp_systolic !== '' ? Number(data.bp_systolic) : undefined,
      bp_diastolic: data.bp_diastolic !== '' ? Number(data.bp_diastolic) : undefined,
      blood_sugar: data.blood_sugar !== '' ? Number(data.blood_sugar) : undefined,
      cholesterol: data.cholesterol !== '' ? Number(data.cholesterol) : undefined,
      hba1c: data.hba1c !== '' ? Number(data.hba1c) : undefined,
    };
    const result = await onSave(payload);
    if (result) {
      onClose();
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Clinical Visit</DialogTitle>
          <DialogDescription>
            Record today's clinical measurements. All fields are optional but provide better risk assessment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bp_systolic">Systolic BP (mmHg)</Label>
              <Input
                id="bp_systolic"
                type="number"
                placeholder="120"
                {...register('bp_systolic')}
              />
              {errors.bp_systolic && <p className="text-red-500 text-xs">{errors.bp_systolic.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bp_diastolic">Diastolic BP (mmHg)</Label>
              <Input
                id="bp_diastolic"
                type="number"
                placeholder="80"
                {...register('bp_diastolic')}
              />
              {errors.bp_diastolic && <p className="text-red-500 text-xs">{errors.bp_diastolic.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="blood_sugar">Blood Sugar (mg/dL)</Label>
              <Input
                id="blood_sugar"
                type="number"
                placeholder="100"
                {...register('blood_sugar')}
              />
              {errors.blood_sugar && <p className="text-red-500 text-xs">{errors.blood_sugar.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cholesterol">Cholesterol (mg/dL)</Label>
              <Input
                id="cholesterol"
                type="number"
                placeholder="180"
                {...register('cholesterol')}
              />
              {errors.cholesterol && <p className="text-red-500 text-xs">{errors.cholesterol.message}</p>}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="hba1c">HbA1c (%)</Label>
              <Input
                id="hba1c"
                type="number"
                step="0.1"
                placeholder="5.7"
                {...register('hba1c')}
              />
              {errors.hba1c && <p className="text-red-500 text-xs">{errors.hba1c.message}</p>}
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-100">
            <strong>Tip:</strong> These values are used by the AI risk engine. For highest accuracy, enter
            all available measurements.
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Visit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
