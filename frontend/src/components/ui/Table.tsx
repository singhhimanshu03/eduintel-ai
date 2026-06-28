interface Column<T> { header: string; accessor: keyof T | ((row: T) => React.ReactNode); }
interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
}

export default function Table<T>({ columns, data, keyField, emptyMessage = 'No records found.' }: Props<T>) {
  return (
    <div className="card overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">

          {/* Sticky header */}
          <thead style={{ backgroundColor: 'var(--color-elevated)', borderBottom: '1px solid var(--color-border)' }}>
            <tr>
              {columns.map((col, i) => (
                <th key={i}
                  className="px-5 py-3 text-left font-semibold uppercase tracking-wider"
                  style={{ fontSize: '0.6875rem', color: 'var(--color-text-faint)' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}
                  className="px-5 py-12 text-center"
                  style={{ color: 'var(--color-text-faint)', fontSize: '0.875rem' }}>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl opacity-40">📭</span>
                    {emptyMessage}
                  </div>
                </td>
              </tr>
            ) : data.map((row, rowIdx) => (
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
    </div>
  );
}
