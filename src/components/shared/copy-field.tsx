import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CopyFieldProps {
  value: string;
  displayValue?: string;
  label?: string;
  /** Truncates the displayed text with an ellipsis (e.g. inside a table cell) — the full value is still copied. */
  truncate?: boolean;
}

const COPIED_FEEDBACK_MS = 2000;

/** Text feedback ("Copiado!"), not just an icon swap — screen readers get it too via aria-live. */
export function CopyField({ value, displayValue, label, truncate }: CopyFieldProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs font-medium text-muted">{label}</span>}
      <div className="flex items-center gap-2">
        <code
          className={cn(
            'min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm',
            truncate ? 'truncate' : 'break-all',
          )}
          title={truncate ? value : undefined}
        >
          {displayValue ?? value}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="size-4 text-primary" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {t(copied ? 'shared.copy.copied' : 'shared.copy.copy')}
        </Button>
        <span role="status" className="sr-only">
          {copied ? t('shared.copy.copied') : ''}
        </span>
      </div>
    </div>
  );
}
