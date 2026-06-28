interface Column<T> { header: string; accessor: keyof T | ((row: T) => React.ReactNode); }
interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
}

export default function Table<T>({ columns, data, keyField, emptyMessage = 'No records found.' }: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10
      bg-white dark:bg-[#1e1e1e] transition-colors duration-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 dark:bg-[#252525] border-b border-gray-200 dark:border-white/10">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-semibold
                text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}
                className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : data.map(row => (
            <tr key={String(row[keyField])}
              className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-100">
              {columns.map((col, i) => (
                <td key={i} className="px-4 py-3 text-gray-700 dark:text-gray-300">
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
  );
}
