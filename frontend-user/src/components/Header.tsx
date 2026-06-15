import { useNavigate } from 'react-router-dom';

export default function Header({ title, showBack = true, right }: { title: string; showBack?: boolean; right?: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="page-header">
      <div style={{ width: 32 }}>
        {showBack && (
          <button className="back-btn" onClick={() => navigate(-1)}>‹</button>
        )}
      </div>
      <h1>{title}</h1>
      <div style={{ width: 32, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}
