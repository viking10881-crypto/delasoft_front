export default function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
          {value}
        </p>
      </div>

      <div className="text-blue-600">
        {icon}
      </div>
    </div>
  );
}
