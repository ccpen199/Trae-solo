function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div>
          <div className="footer-logo">自由行</div>
          <p>发现世界的美好</p>
        </div>
        <div>
          <p style={{ marginBottom: '12px', color: '#fff' }}>关于我们</p>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>公司介绍</p>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>联系我们</p>
          <p style={{ fontSize: '14px' }}>加入我们</p>
        </div>
        <div>
          <p style={{ marginBottom: '12px', color: '#fff' }}>服务</p>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>酒店预订</p>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>攻略社区</p>
          <p style={{ fontSize: '14px' }}>客服中心</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
