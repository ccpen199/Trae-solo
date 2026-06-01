function MatchesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">比赛赛程</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold">曼城</span>
          <div className="text-center">
            <span className="text-3xl font-bold text-green-600">3 - 1</span>
            <p className="text-sm text-gray-500">已结束</p>
          </div>
          <span className="font-bold">阿森纳</span>
        </div>
      </div>
    </div>
  );
}

export default MatchesPage;
