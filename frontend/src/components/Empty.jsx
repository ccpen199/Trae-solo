export default function Empty({ message = '暂无数据' }) {
  return (
    <div className="empty-container">
      <p>{message}</p>
    </div>
  )
}
