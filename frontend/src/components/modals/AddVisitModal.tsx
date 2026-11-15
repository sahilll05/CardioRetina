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
      <DialogContent className="sm:max-w-[480px] bg-surface border-border-strong text-foreground">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">Log Clinical Visit</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Record clinical measurements for today’s consultation. Values feed directly into the cardiovascular risk stratification engine.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="bp_systolic" className="text-xs text-muted-foreground">Systolic BP (mmHg)</Label>
              <Input
                id="bp_systolic"
                type="number"
                placeholder="120"
                className="h-8 text-xs bg-surface-deep border-border font-mono"
                {...register('bp_systolic')}
              />
              {errors.bp_systolic && <p className="text-destructive text-[11px]">{errors.bp_systolic.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bp_diastolic" className="text-xs text-muted-foreground">Diastolic BP (mmHg)</Label>
              <Input
                id="bp_diastolic"
                type="number"
                placeholder="80"
                className="h-8 text-xs bg-surface-deep border-border font-mono"
                {...register('bp_diastolic')}
              />
              {errors.bp_diastolic && <p className="text-destructive text-[11px]">{errors.bp_diastolic.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="blood_sugar" className="text-xs text-muted-foreground">Fasting glucose (mg/dL)</Label>
              <Input
                id="blood_sugar"
                type="number"
                placeholder="100"
                className="h-8 text-xs bg-surface-deep border-border font-mono"
                {...register('blood_sugar')}
              />
              {errors.blood_sugar && <p className="text-destructive text-[11px]">{errors.blood_sugar.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cholesterol" className="text-xs text-muted-foreground">Total cholesterol (mg/dL)</Label>
              <Input
                id="cholesterol"
                type="number"
                placeholder="180"
                className="h-8 text-xs bg-surface-deep border-border font-mono"
                {...register('cholesterol')}
              />
              {errors.cholesterol && <p className="text-destructive text-[11px]">{errors.cholesterol.message}</p>}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="hba1c" className="text-xs text-muted-foreground">Glycated hemoglobin HbA1c (%)</Label>
              <Input
                id="hba1c"
                type="number"
                step="0.1"
                placeholder="5.7"
                className="h-8 text-xs bg-surface-deep border-border font-mono"
                {...register('hba1c')}
              />
              {errors.hba1c && <p className="text-destructive text-[11px]">{errors.hba1c.message}</p>}
            </div>
          </div>

          <div className="p-3 bg-surface-deep rounded text-xs text-muted-foreground border border-border">
            <span className="font-medium text-foreground">Clinical Note:</span> These quantitative measurements are integrated with retinal microvascular biomarkers during risk fusion.
          </div>

          <DialogFooter className="pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} size="sm" className="h-8 text-xs">
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Save Clinical Visit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
