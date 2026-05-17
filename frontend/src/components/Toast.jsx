import useToastStore from '../store/toastStore';

export default function Toast() {
  const { visible, message } = useToastStore();

  if (!visible) return null;

  return (
    <div className="toast">
      {message}
    </div>
  );
}
