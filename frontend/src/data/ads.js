export const adsData = [
  {
    id: 'vip-premium',
    title: '👑 VIP会员限时特惠',
    description: '年卡立减50元，畅享海量好书，再送100书币',
    bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    position: 'explore'
  },
  {
    id: 'summer-reading',
    title: '☀️ 夏日阅读计划',
    description: '连续打卡7天，免费兑换VIP周卡，还有限量书签等你拿',
    bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    position: 'explore'
  },
  {
    id: 'new-book',
    title: '📚 新书上架',
    description: '《2024年度畅销榜TOP10》重磅上线，限时免费借阅3天',
    bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    position: 'bookshelf'
  },
  {
    id: 'share-reward',
    title: '🎁 邀请好友有礼',
    description: '每邀请1位好友注册，双方各得VIP月卡，多邀多得',
    bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    position: 'reader'
  },
  {
    id: 'audio-book',
    title: '🎧 有声书上线',
    description: '解放双眼，听书更轻松，新用户免费试听5本',
    bgColor: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    position: 'reader'
  },
  {
    id: 'birthday-gift',
    title: '🎂 生日专属福利',
    description: '本月生日用户可领取30天VIP + 定制电子藏书票',
    bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    position: 'profile'
  }
];

export const getAdsByPosition = (position) => {
  return adsData.filter(ad => ad.position === position);
};

export const getRandomAd = (position) => {
  const positionAds = getAdsByPosition(position);
  if (positionAds.length === 0) return null;
  return positionAds[Math.floor(Math.random() * positionAds.length)];
};
