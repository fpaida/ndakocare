"use client";

import Link from "next/link";

export default function NotificationsPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Notifications
        </h1>

        <p className="mt-2 text-gray-500">
          Stay informed about your transfers, payments, and account activity.
        </p>

        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <div className="mb-4 text-5xl">🔔</div>

          <h2 className="text-lg font-semibold">
            No notifications yet
          </h2>

          <p className="mt-2 text-gray-500">
            When you send money, receive payments, or important account events
            occur, they will appear here.
          </p>
        </div>

        <div className="mt-8 flex justify-end">
          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}