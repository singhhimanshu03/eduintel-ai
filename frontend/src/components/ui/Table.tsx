import { useState, useMemo } from 'react';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
}
interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
  emptyIcon?: string;
  emptyAction?: { label: string; onClick: () => void };
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
}

/* ═════════════════════════════════════════════════════════════════════════
   ENHANCED TABLE — Search, sort, pagination, beautiful empty states
═════════════════════════════════════════════════════════════════════════ */
export default function Table<T>({
  columns, data, keyField, emptyMessage = 'No records found.',
  emptyIcon = '📭', emptyAction, searchable = false,
  searchPlaceholder = 'Search…', pageSize = 10,
}: Props<T>) {
  const [search, setSearch]       = useState('');
  const [sortCol, setSortCol]     = useState<number | null>(null);
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc');
  const [page, setPage]           = useState(0);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        if (typeof col.accessor === 'function') return false;
        const val = String(row[col.accessor] ?? '').toLowerCase();
        return val.includes(q);
      })
    );
  }, [data, search, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (sortCol === null) return filtered;
    const col = columns[sortCol];
    if (!col || typeof col.accessor === 'function') return filtered;
    const key = col.accessor as keyof T;
    return [...filtered].sort((a, b) => {
      const av = String(a[key] ?? '');
      const bv = String(b[key] ?? '');
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir, columns]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  // Reset page when search changes
  const handleSearch = (v: string) => { setSearch(v); setPage(0); };

  const handleSort = (i: number) => {
    const col = columns[i];
    const sortable = col.sortable !== false && typeof col.accessor !== 'function';
    if (!sortable) return;
    if (sortCol === i) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(i);
      setSortDir('asc');
    }
  };

  return (
    <div className="card overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>

      {/* Search bar */}
      {searchable && (
        <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none"
              stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              style={{ color: 'var(--color-text-faint)' }}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text" value={search} onChange={e => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="input-base pl-10 py-2"
            />
          </div>
          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-elevated)', borderBottom: '1px solid var(--color-border)' }}>
              {columns.map((col, i) => {
                const isSortable = col.sortable !== false && typeof col.accessor !== 'function';
                const isActive = sortCol === i;
                return (
                  <th key={i} scope="col"
                    className={`px-5 py-3 text-left font-semibold uppercase tracking-wider select-none
                      ${isSortable ? 'cursor-pointer group' : ''}`}
                    style={{ fontSize: '0.6875rem', color: 'var(--color-text-faint)' }}
                    onClick={() => isSortable && handleSort(i)}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.header}
                      {isSortable && (
                        <span className={`inline-flex flex-col transition-opacity duration-150 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                          <svg className="w-2.5 h-2.5 -mb-px" viewBox="0 0 10 5" fill={isActive && sortDir === 'asc' ? 'var(--color-primary)' : 'currentColor'}>
                            <path d="M5 0l5 5H0z" />
                          </svg>
                          <svg className="w-2.5 h-2.5 -mt-px" viewBox="0 0 10 5" fill={isActive && sortDir === 'desc' ? 'var(--color-primary)' : 'currentColor'}>
                            <path d="M5 5L0 0h10z" />
                          </svg>
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 animate-fade-in">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                      style={{ backgroundColor: 'var(--color-elevated)' }}>
                      {emptyIcon}
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      {emptyMessage}
                    </p>
                    {emptyAction && (
                      <button onClick={emptyAction.onClick} className="btn-primary text-xs py-2 px-4 mt-1">
                        {emptyAction.label}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : paged.map((row, rowIdx) => (
              <tr key={String(row[keyField])}
                className="group transition-colors duration-100"
                style={{
                  backgroundColor: rowIdx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-elevated)',
                  borderBottom: '1px solid var(--color-border)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--color-primary-muted)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                    rowIdx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-elevated)';
                }}>
                {columns.map((col, i) => (
                  <td key={i} className="px-5 py-3.5" style={{ color: 'var(--color-text-base)' }}>
                    {typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : String(row[col.accessor] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-elevated)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ width: '1.75rem', height: '1.75rem' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i}
                onClick={() => setPage(i)}
                className="w-7 h-7 rounded-lg text-xs font-semibold transition-all duration-150"
                style={{
                  backgroundColor: page === i ? 'var(--color-primary)' : 'transparent',
                  color: page === i ? '#fff' : 'var(--color-text-muted)',
                }}
              >
                {i + 1}
              </button>
            )).slice(Math.max(0, page - 2), page + 3)}

            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ width: '1.75rem', height: '1.75rem' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
