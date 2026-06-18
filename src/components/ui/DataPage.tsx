
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface DataPageProps {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  loading: boolean;
  error: string;
  children: ReactNode;
}

function DataPage({ title, eyebrow, icon, loading, error, children }: DataPageProps) {
  return (
    <motion.section
      className="page-space"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="section-title floating">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {icon}
      </div>
      <StatusLine loading={loading} error={error} />
      {children}
    </motion.section>
  );
}

function StatusLine({ loading, error }: { loading: boolean; error: string }) {
  if (loading) {
    return <div className="status-line">数据加载中</div>;
  }
  if (error) {
    return <div className="status-line error">接口异常：{error}</div>;
  }
  return null;
}

export default DataPage;
export { StatusLine };
