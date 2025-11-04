import { ReactNode } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldWrapperProps {
  children: ReactNode;
  isValid?: boolean;
  isInvalid?: boolean;
  showValidation?: boolean;
}

export function FormFieldWrapper({
  children,
  isValid = false,
  isInvalid = false,
  showValidation = false,
}: FormFieldWrapperProps) {
  return (
    <div className="relative">
      {children}
      {showValidation && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isValid && (
            <CheckCircle2 className="h-5 w-5 text-success animate-scale-in" />
          )}
          {isInvalid && (
            <AlertCircle className="h-5 w-5 text-destructive animate-scale-in" />
          )}
        </div>
      )}
    </div>
  );
}
