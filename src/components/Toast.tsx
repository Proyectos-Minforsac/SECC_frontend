import { useEffect } from 'react';

interface ToastProps {
  show: boolean,
  type?: 'success' | 'error',
  message: string,
  onClose: () => void,
  duration?: number,
}

export default function Toast({ show, type = 'success', message, onClose, duration = 3500 }: ToastProps) {
	useEffect(() => {
		if (!show) return;
		const timer = setTimeout(() => onClose(), duration);
		return () => clearTimeout(timer);
	}, [show, duration, onClose]);

	if (!show) return null;

	const isSuccess = type === 'success';

	return (
		<div className="fixed top-6 right-6 z-50 animate-[fadeIn_0.2s_ease-out]">
			<div
				className={`flex items-start gap-3 min-w-[300px] max-w-sm p-4 rounded-xl shadow-lg border ${isSuccess
					? 'bg-green-50 border-green-300 text-green-800'
					: 'bg-red-50 border-red-300 text-red-800'
					}`}
			>
				<div
					className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${isSuccess ? 'bg-green-500' : 'bg-red-500'
						}`}
				>
					{isSuccess ? '✓' : '!'}
				</div>
				<div className="flex-1">
					<p className="text-sm font-semibold">
						{isSuccess ? 'Registro exitoso' : 'Ocurrió un error'}
					</p>
					<p className="text-xs mt-0.5 opacity-90">{message}</p>
				</div>
				<button
					onClick={onClose}
					className="text-slate-400 hover:text-slate-600 text-sm leading-none cursor-pointer"
				>
					✕
				</button>
			</div>
		</div>
	);
}