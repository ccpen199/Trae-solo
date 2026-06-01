import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';

function Optometry() {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecords();
  }, [page]);

  const loadRecords = async () => {
    const res = await api.get('/optometry', { params: { page } });
    setRecords(res.data.data);
    setTotal(res.data.total);
  };

  const handleDelete = async (id) => {
    if (confirm('确定删除该验光记录吗？所有版本都将被删除。')) {
      await api.delete(`/optometry/${id}`);
      loadRecords();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>验光记录</h2>
        <Link to="/optometry/new" className="btn btn-primary">+ 新建验光</Link>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>客户</th>
              <th>验光师</th>
              <th>球镜 OD/OS</th>
              <th>柱镜 OD/OS</th>
              <th>轴位 OD/OS</th>
              <th>瞳距</th>
              <th>版本</th>
              <th>验光时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td>
                  <a href="#" onClick={e => { e.preventDefault(); navigate(`/customers/${r.customer_id}`); }} style={{ color: '#1890ff' }}>
                    {r.customer_name}
                  </a>
                </td>
                <td>{r.optometrist}</td>
                <td>{r.sphere_od || '-'}/{r.sphere_os || '-'}</td>
                <td>{r.cylinder_od || '-'}/{r.cylinder_os || '-'}</td>
                <td>{r.axis_od || '-'}/{r.axis_os || '-'}</td>
                <td>{r.pd || '-'}</td>
                <td><span className="badge badge-info">v{r.version}</span></td>
                <td>{r.created_at?.split('T')[0]}</td>
                <td>
                  <Link to={`/optometry/${r.id}/edit`} className="btn btn-sm btn-default" style={{ marginRight: 8 }}>修改</Link>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <span>共 {total} 条</span>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一页</button>
          <span>第 {page} 页</span>
          <button onClick={() => setPage(p => p + 1)} disabled={records.length < 20}>下一页</button>
        </div>
      </div>
    </div>
  );
}

export default Optometry;
