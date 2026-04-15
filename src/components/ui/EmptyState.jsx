import { HiOutlineInbox } from 'react-icons/hi';

export default function EmptyState({
  icon: Icon = HiOutlineInbox,
  title = 'Sin resultados',
  description = '',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-primary-50 rounded-2xl p-4 mb-4">
        <Icon className="w-16 h-16 text-primary-200" />
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-1 font-display">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4 max-w-md leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  );
}
