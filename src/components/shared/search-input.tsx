import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  /** Debounce delay before `onChange` fires, in ms. */
  debounceMs?: number;
  className?: string;
}

/**
 * Debounced text input — keeps a local draft so keystrokes feel instant,
 * only calling `onChange` (and therefore triggering a re-filter) after the
 * user pauses typing.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  id,
  debounceMs = 400,
  className,
}: SearchInputProps) {
  const [draft, setDraft] = useState(value);
  const [lastSyncedValue, setLastSyncedValue] = useState(value);

  // Resync the draft when the controlled value changes externally (e.g.
  // "clear filters") — derived-during-render instead of an effect so it
  // can't trigger an extra cascading render.
  if (value !== lastSyncedValue) {
    setLastSyncedValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return;
    const timeout = setTimeout(() => onChange(draft), debounceMs);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, debounceMs]);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <Input
          id={id}
          type="search"
          className="pl-8"
          placeholder={placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </div>
    </div>
  );
}
