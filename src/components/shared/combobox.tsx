import { Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ComboboxOptionsResult<T> {
  data?: T[];
  isLoading: boolean;
}

interface ComboboxProps<T> {
  label: string;
  placeholder: string;
  emptyMessage: string;
  value: T | null;
  onChange: (value: T | null) => void;
  useOptions: (search: string, enabled: boolean) => ComboboxOptionsResult<T>;
  getOptionLabel: (option: T) => string;
  getOptionId: (option: T) => string;
}

/**
 * Debounced, searchable single-select combobox with no extra dependency
 * (no `cmdk`/Popover in the project yet) — a plain input + absolutely
 * positioned listbox, closed on blur/Escape/selection. Originally built for
 * the Dashboard filter bar, now shared across features (e.g. the API Keys
 * client picker) — genuinely generic, no dashboard-specific behavior.
 */
export function Combobox<T>({
  label,
  placeholder,
  emptyMessage,
  value,
  onChange,
  useOptions,
  getOptionLabel,
  getOptionId,
}: ComboboxProps<T>) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data: options, isLoading } = useOptions(debouncedQuery, open);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(option: T) {
    onChange(option);
    setQuery('');
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    setQuery('');
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label htmlFor={listboxId} className="text-xs font-medium text-muted">
        {label}
      </label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <Input
          id={listboxId}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${listboxId}-listbox`}
          autoComplete="off"
          className="pr-8 pl-8"
          placeholder={placeholder}
          value={open ? query : value ? getOptionLabel(value) : ''}
          onFocus={() => setOpen(true)}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
        />
        {value && (
          <button
            type="button"
            aria-label={emptyMessage}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted hover:text-foreground"
            onClick={handleClear}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {open && (
        <ul
          id={`${listboxId}-listbox`}
          role="listbox"
          className="absolute top-full left-0 z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover py-1 text-sm shadow-md"
        >
          {isLoading && <li className="px-3 py-2 text-muted">…</li>}
          {!isLoading && !options?.length && (
            <li className="px-3 py-2 text-muted">{emptyMessage}</li>
          )}
          {!isLoading &&
            options?.map((option) => (
              <li key={getOptionId(option)} role="option" aria-selected={false}>
                <button
                  type="button"
                  className={cn(
                    'block w-full truncate px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground',
                  )}
                  onClick={() => handleSelect(option)}
                >
                  {getOptionLabel(option)}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
