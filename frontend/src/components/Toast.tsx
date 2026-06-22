import { useAppStore } from '../store/appStore';

export default function Toast() {
  const { toast } = useAppStore();
  if (!toast) return null;
  return (
    <div className={`toast-container toast-${toast.type}`}>
      {toast.message}
    </div>
  );
}
