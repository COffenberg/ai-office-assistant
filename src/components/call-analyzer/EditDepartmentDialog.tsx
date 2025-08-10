import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Local Department type kept minimal to avoid coupling; accepts optional fields
export interface EditDialogDepartment {
  id: string;
  name: string;
  description?: string;
  [key: string]: any; // allows optional fields like `active`, `ownerId` if present in schema
}

interface EditDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: EditDialogDepartment | null;
  onSave: (updated: EditDialogDepartment) => void;
}

export default function EditDepartmentDialog({
  open,
  onOpenChange,
  department,
  onSave,
}: EditDepartmentDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optional fields
  const hasActiveField = useMemo(
    () => Boolean(department && Object.prototype.hasOwnProperty.call(department, "active")),
    [department]
  );
  const [active, setActive] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (open && department) {
      setName(department.name ?? "");
      setDescription(department.description ?? "");
      setActive(hasActiveField ? Boolean(department.active) : undefined);
      setError(null);
    }
  }, [open, department, hasActiveField]);

  const isDirty = useMemo(() => {
    if (!department) return false;
    const baseChanged = name !== (department.name ?? "") || description !== (department.description ?? "");
    const activeChanged = hasActiveField ? active !== Boolean(department.active) : false;
    return baseChanged || activeChanged;
  }, [department, name, description, active, hasActiveField]);

  const attemptClose = () => {
    if (isDirty) {
      setShowConfirm(true);
      setPendingClose(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirmDiscard = () => {
    setShowConfirm(false);
    setPendingClose(false);
    onOpenChange(false);
  };

  const handleCancelDiscard = () => {
    setShowConfirm(false);
    setPendingClose(false);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!department) return;
    const updated: EditDialogDepartment = {
      ...department,
      name: name.trim(),
      description: description.trim(),
    };
    if (hasActiveField) {
      updated.active = active;
    }
    onSave(updated);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            attemptClose();
          } else {
            onOpenChange(o);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg" aria-modal="true" role="dialog">
          <DialogHeader>
            <DialogTitle id="edit-department-title">Edit department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dept-name">Name</Label>
              <Input
                id="dept-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-required
              />
              {error && (
                <p className="mt-1 text-sm text-destructive">{error}</p>
              )}
            </div>
            <div>
              <Label htmlFor="dept-description">Description</Label>
              <Textarea
                id="dept-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
            {hasActiveField && (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-1">
                  <Label htmlFor="dept-active">Active</Label>
                  <p className="text-sm text-muted-foreground">Toggle department availability</p>
                </div>
                {/* Using a checkbox for broad compatibility; swap to Switch if project uses it consistently */}
                <input
                  id="dept-active"
                  type="checkbox"
                  checked={Boolean(active)}
                  onChange={(e) => setActive(e.target.checked)}
                  aria-label="Active"
                />
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={attemptClose} className="sm:w-auto">Cancel</Button>
            <Button onClick={handleSave} className="sm:w-auto">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDiscard}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard} className="bg-destructive hover:bg-destructive/90">
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
