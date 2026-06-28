interface Props { risk: string; }

const map: Record<string, string> = {
  Low:    'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-300  border-green-200  dark:border-green-700/40',
  Medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/40',
  High:   'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-300    border-red-200    dark:border-red-700/40',
};

export default function RiskBadge({ risk }: Props) {
  return (
    <span className={`inline-block border rounded-full px-2.5 py-0.5 text-xs font-semibold
      transition-colors duration-200 ${map[risk] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
      {risk}
    </span>
  );
}
