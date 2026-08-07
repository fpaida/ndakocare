type PageHeaderProps = {
  title: string;
  description?: string;
};

export default function PageHeader({
  title,
  description,
}: PageHeaderProps) {
  return (
    <div className="mb-10">
      <h1 className="text-4xl font-bold text-green-700">
        {title}
      </h1>

      {description && (
        <p className="text-gray-600 mt-2 text-lg">
          {description}
        </p>
      )}
    </div>
  );
}