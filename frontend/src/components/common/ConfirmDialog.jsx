import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

/**
 * Controlled confirmation dialog – replaces window.confirm().
 *   const [confirm, setConfirm] = useState(null);
 *   <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}
 *     title="Delete event?" description="This cannot be undone." confirmLabel="Delete"
 *     onConfirm={() => handleDelete(confirm.id)} />
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            {destructive && (
              <div className="bg-destructive/10 text-destructive flex size-10 shrink-0 items-center justify-center rounded-full">
                <AlertTriangle className="size-5" />
              </div>
            )}
            <div className="space-y-1.5 text-left">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? 'destructive' : 'default'} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
