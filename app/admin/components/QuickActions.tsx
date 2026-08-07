"use client";

import Link from "next/link";

type QuickActionCardProps = {
  href: string;
  title: string;
  description: string;
  icon: string;
  color?: string;
  badge?: string | number;
};

export default function QuickActionCard({
  href,
  title,
  description,
  icon,
  color = "text-green-700",
  badge,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group relative bg-white rounded-2xl shadow-md border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-green-200"
    >
      {badge !== undefined && (
        <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
          {badge}
        </span>
      )}

      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-gray-50 mb-5 ${color} group-hover:scale-110 transition-transform duration-300`}
      >
        {icon}
      </div>

      <h2
        className={`text-xl font-bold ${color} group-hover:text-green-600 transition-colors`}
      >
        {title}
      </h2>

      <p className="mt-3 text-gray-600 text-sm leading-6">
        {description}
      </p>

      <div className="mt-5 flex items-center text-sm font-medium text-green-700 group-hover:translate-x-1 transition-transform">
        Open Module
        <span className="ml-2">→</span>
      </div>
    </Link>
  );
}