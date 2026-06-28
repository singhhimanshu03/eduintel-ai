interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: 'indigo' | 'green' | 'yellow' | 'red';
  subtitle?: string;
}

const colorMap = {
  indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/40 text-indigo-700 dark:text-indigo-300',
  green:  'bg-green-50  dark:bg-green-900/20  border-green-200  dark:border-green-700/40  text-green-700  dark:text-green-300',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/40 text-yellow-700 dark:text-yellow-300',
  red:    'bg-red-50    dark:bg-red-900/20    border-red-200    dark:border-red-700/40    text-red-700    dark:text-red-300',
};

export default function StatCard({ title, value, icon, color = 'indigo', subtitle }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 flex items-start gap-4 transition-colors duration-200 ${colorMap[color]}`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {subtitle && <p className="text-xs opacity-70 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
