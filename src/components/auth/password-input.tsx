import { Eye, EyeOff } from 'lucide-react';
import { useState, type ComponentProps, type Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends Omit<ComponentProps<'input'>, 'type'> {
  ref?: Ref<HTMLInputElement>;
}

export function PasswordInput({ className, ref, ...props }: PasswordInputProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        data-slot="input"
        className={cn(
          'flex h-9 w-full rounded-md border border-border bg-card px-3 py-2 pr-10 text-sm outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 size-9"
        aria-label={t(visible ? 'auth.login.hidePassword' : 'auth.login.showPassword')}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}
