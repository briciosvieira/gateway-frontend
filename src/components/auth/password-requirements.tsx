import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

interface PasswordRequirementsProps {
  password: string;
  confirmPassword?: string;
}

export function PasswordRequirements({ password, confirmPassword }: PasswordRequirementsProps) {
  const { t } = useTranslation();

  const requirements = [
    { key: 'length', labelKey: 'auth.passwordRequirements.length', met: password.length >= 12 },
    {
      key: 'uppercase',
      labelKey: 'auth.passwordRequirements.uppercase',
      met: /[A-Z]/.test(password),
    },
    {
      key: 'lowercase',
      labelKey: 'auth.passwordRequirements.lowercase',
      met: /[a-z]/.test(password),
    },
    { key: 'number', labelKey: 'auth.passwordRequirements.number', met: /[0-9]/.test(password) },
    {
      key: 'special',
      labelKey: 'auth.passwordRequirements.special',
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  if (confirmPassword !== undefined) {
    requirements.push({
      key: 'match',
      labelKey: 'auth.passwordRequirements.match',
      met: password.length > 0 && password === confirmPassword,
    });
  }

  return (
    <ul className="space-y-1 text-sm">
      {requirements.map((requirement) => (
        <li
          key={requirement.key}
          className={cn('flex items-center gap-2', requirement.met ? 'text-primary' : 'text-muted')}
        >
          {requirement.met ? (
            <Check className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <X className="size-4 shrink-0" aria-hidden="true" />
          )}
          {t(requirement.labelKey)}
        </li>
      ))}
    </ul>
  );
}
