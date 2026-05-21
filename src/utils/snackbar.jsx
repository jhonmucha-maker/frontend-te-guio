import toast from 'react-hot-toast';
import { HiCheckCircle } from 'react-icons/hi';

// Contador local — garantiza id único por invocación. Sin esto, dos llamadas
// rapid-fire podrían colapsar en un solo toast (react-hot-toast deduplica por id
// y aunque genere uno por defecto, fechas/colisiones pueden ocurrir).
let snackbarCounter = 0;

export function showSuccessSnackbar(message = 'Producto agregado a la lista') {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-up' : 'opacity-0 translate-y-4'
        } flex items-center gap-3 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg min-w-[280px] max-w-[90vw] transition-all duration-300`}
      >
        <HiCheckCircle className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-sm font-bold px-2 py-0.5 rounded-md hover:bg-white/20 transition-colors flex-shrink-0"
        >
          OK
        </button>
      </div>
    ),
    {
      id: `snackbar-${++snackbarCounter}`,
      position: 'bottom-center',
      duration: 2000,
    },
  );
}
