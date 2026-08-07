type StatCardProps = {
  title: string;
  value: string | number;
  color?: string;
  icon?: React.ReactNode;
};

export default function StatCard({
  title,
  value,
  color = "text-green-700",
  icon,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 font-medium">
          {title}
        </h3>

        {icon && (
          <div className="text-2xl text-gray-400">
            {icon}
          </div>
        )}
      </div>

      <p className={`text-3xl font-bold ${color}`}>
        {value}
      </p>
    </div>
  );
}