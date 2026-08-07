import Link from "next/link";

type QuickActionCardProps = {
  href: string;
  title: string;
  description: string;
  icon: string;
  color?: string;
};

export default function QuickActionCard({
  href,
  title,
  description,
  icon,
  color = "text-green-700",
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-white p-6 shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className={`mb-4 text-4xl ${color}`}>
        {icon}
      </div>

      <h2 className={`text-2xl font-bold ${color}`}>
        {title}
      </h2>

      <p className="mt-3 text-gray-600">
        {description}
      </p>
    </Link>
  );
}