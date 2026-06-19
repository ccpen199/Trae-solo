import { Request, Response } from 'express';
import db from '@/db/index.js';
import type {
  DatingProfileResponse,
  DatingProfile,
  MaskedProfile,
} from '@shared/types';

const getAgeRange = (age: number): string => {
  if (age <= 25) return '20-25岁';
  if (age <= 30) return '26-30岁';
  if (age <= 35) return '31-35岁';
  if (age <= 40) return '36-40岁';
  return '40岁以上';
};

const getHeightRange = (height: number): string => {
  if (height <= 160) return '160cm以下';
  if (height <= 165) return '161-165cm';
  if (height <= 170) return '166-170cm';
  if (height <= 175) return '171-175cm';
  if (height <= 180) return '176-180cm';
  return '180cm以上';
};

const getMaskedLabel = (id: number, occupation: string): string => {
  const labels = ['温柔的', '阳光的', '稳重的', '活泼的', '知性的', '帅气的', '可爱的', '优雅的'];
  return `${labels[id % labels.length]}${occupation}`;
};

const calculateCompatibility = (profile1: any, profile2: any): number => {
  let score = 60;

  if (profile1.city === profile2.city) score += 15;

  const tags1 = JSON.parse(profile1.tags || '[]');
  const tags2 = JSON.parse(profile2.tags || '[]');
  const commonTags = tags1.filter((t: string) => tags2.includes(t));
  score += commonTags.length * 5;

  const hobbies1 = JSON.parse(profile1.hobbies || '[]');
  const hobbies2 = JSON.parse(profile2.hobbies || '[]');
  const commonHobbies = hobbies1.filter((h: string) => hobbies2.includes(h));
  score += commonHobbies.length * 3;

  const ageDiff = Math.abs(profile1.age - profile2.age);
  if (ageDiff <= 3) score += 10;
  else if (ageDiff <= 5) score += 5;

  return Math.min(99, score);
};

export const getProfiles = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const userProfile = db
      .prepare('SELECT * FROM dating_profiles WHERE user_id = ?')
      .get(userId) as any;

    if (!userProfile) {
      res.status(404).json({ success: false, message: '请先完善个人资料' });
      return;
    }

    const { city, minAge, maxAge } = req.query;

    let sql = 'SELECT * FROM dating_profiles WHERE user_id != ? AND privacy_mode = 1';
    const params: any[] = [userId];

    if (city) {
      sql += ' AND city = ?';
      params.push(city);
    }

    if (minAge) {
      sql += ' AND age >= ?';
      params.push(parseInt(minAge as string));
    }

    if (maxAge) {
      sql += ' AND age <= ?';
      params.push(parseInt(maxAge as string));
    }

    sql += ' ORDER BY RANDOM() LIMIT 20';

    const profilesRaw = db.prepare(sql).all(...params) as any[];

    const profiles: DatingProfile[] = profilesRaw.map((p) => {
      const compatibility = calculateCompatibility(userProfile, p);
      return {
        id: p.id,
        maskedLabel: getMaskedLabel(p.id, p.occupation),
        ageRange: getAgeRange(p.age),
        city: p.city,
        occupation: p.occupation,
        tags: JSON.parse(p.tags || '[]'),
        compatibilityScore: compatibility,
      };
    });

    profiles.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    const data: DatingProfileResponse = { profiles };

    res.status(200).json({ success: true, data, message: '获取匹配列表成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取匹配列表失败，服务器错误' });
  }
};

export const getMaskedProfile = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { profileId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const profile = db.prepare('SELECT * FROM dating_profiles WHERE id = ?').get(profileId) as any;

    if (!profile) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    const data: MaskedProfile = {
      maskedLabel: getMaskedLabel(profile.id, profile.occupation),
      ageRange: getAgeRange(profile.age),
      city: profile.city,
      occupation: profile.occupation,
      heightRange: getHeightRange(profile.height),
      tags: JSON.parse(profile.tags || '[]'),
      hobbies: JSON.parse(profile.hobbies || '[]'),
    };

    res.status(200).json({ success: true, data, message: '获取脱敏资料成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取脱敏资料失败，服务器错误' });
  }
};

export const updateProfile = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const { age, city, occupation, height, tags, hobbies, privacyMode } = req.body;

    if (!age || !city || !occupation || !height) {
      res.status(400).json({ success: false, message: '请填写完整的个人资料' });
      return;
    }

    const existingProfile = db
      .prepare('SELECT * FROM dating_profiles WHERE user_id = ?')
      .get(userId) as any;

    if (existingProfile) {
      db.prepare(
        'UPDATE dating_profiles SET age = ?, city = ?, occupation = ?, height = ?, tags = ?, hobbies = ?, privacy_mode = ? WHERE user_id = ?'
      ).run(
        age,
        city,
        occupation,
        height,
        JSON.stringify(tags || []),
        JSON.stringify(hobbies || []),
        privacyMode !== undefined ? privacyMode : true,
        userId
      );
    } else {
      db.prepare(
        'INSERT INTO dating_profiles (user_id, age, city, occupation, height, tags, hobbies, privacy_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        userId,
        age,
        city,
        occupation,
        height,
        JSON.stringify(tags || []),
        JSON.stringify(hobbies || []),
        privacyMode !== undefined ? privacyMode : true
      );
    }

    res.status(200).json({ success: true, message: '个人资料更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新个人资料失败，服务器错误' });
  }
};
