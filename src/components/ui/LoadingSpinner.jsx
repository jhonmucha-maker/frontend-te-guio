export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-primary-100 border-t-primary-600 ${sizes[size]}`}
      />
    </div>
  );
}
