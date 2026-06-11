const characters = [
  { char: '伟', pinyin: 'wěi', tone: 3, strokes: 6, wuxing: '土', meaning: '高大、卓越', level: 1 },
  { char: '芳', pinyin: 'fāng', tone: 1, strokes: 7, wuxing: '木', meaning: '芳香、美好', level: 1 },
  { char: '娜', pinyin: 'nà', tone: 4, strokes: 9, wuxing: '火', meaning: '婀娜、美丽', level: 1 },
  { char: '俊', pinyin: 'jùn', tone: 4, strokes: 9, wuxing: '火', meaning: '英俊、才智出众', level: 1 },
  { char: '婷', pinyin: 'tíng', tone: 2, strokes: 12, wuxing: '火', meaning: '美好、优美', level: 1 },
  { char: '鹏', pinyin: 'péng', tone: 2, strokes: 13, wuxing: '水', meaning: '鹏程万里', level: 1 },
  { char: '华', pinyin: 'huá', tone: 2, strokes: 6, wuxing: '水', meaning: '华丽、精华', level: 1 },
  { char: '明', pinyin: 'míng', tone: 2, strokes: 8, wuxing: '水', meaning: '光明、明智', level: 1 },
  { char: '静', pinyin: 'jìng', tone: 4, strokes: 14, wuxing: '金', meaning: '安静、纯净', level: 1 },
  { char: '磊', pinyin: 'lěi', tone: 3, strokes: 15, wuxing: '土', meaning: '光明磊落', level: 1 },
  { char: '洋', pinyin: 'yáng', tone: 2, strokes: 9, wuxing: '水', meaning: '海洋、广阔', level: 1 },
  { char: '勇', pinyin: 'yǒng', tone: 3, strokes: 9, wuxing: '土', meaning: '勇敢、英勇', level: 1 },
  { char: '艳', pinyin: 'yàn', tone: 4, strokes: 10, wuxing: '土', meaning: '鲜艳、美丽', level: 1 },
  { char: '杰', pinyin: 'jié', tone: 2, strokes: 8, wuxing: '木', meaning: '杰出、豪杰', level: 1 },
  { char: '娟', pinyin: 'juān', tone: 1, strokes: 10, wuxing: '木', meaning: '娟秀、美好', level: 1 },
  { char: '涛', pinyin: 'tāo', tone: 1, strokes: 10, wuxing: '水', meaning: '波涛、大浪', level: 1 },
  { char: '敏', pinyin: 'mǐn', tone: 3, strokes: 11, wuxing: '水', meaning: '敏捷、聪慧', level: 1 },
  { char: '军', pinyin: 'jūn', tone: 1, strokes: 6, wuxing: '木', meaning: '军人、军队', level: 1 },
  { char: '丽', pinyin: 'lì', tone: 4, strokes: 7, wuxing: '火', meaning: '美丽、华丽', level: 1 },
  { char: '强', pinyin: 'qiáng', tone: 2, strokes: 11, wuxing: '木', meaning: '强大、强壮', level: 1 },
  { char: '平', pinyin: 'píng', tone: 2, strokes: 5, wuxing: '水', meaning: '平安、平稳', level: 1 },
  { char: '刚', pinyin: 'gāng', tone: 1, strokes: 6, wuxing: '金', meaning: '刚强、刚正', level: 1 },
  { char: '桂', pinyin: 'guì', tone: 4, strokes: 10, wuxing: '木', meaning: '桂花、富贵', level: 1 },
  { char: '英', pinyin: 'yīng', tone: 1, strokes: 8, wuxing: '木', meaning: '英雄、精英', level: 1 },
  { char: '慧', pinyin: 'huì', tone: 4, strokes: 15, wuxing: '水', meaning: '智慧、聪慧', level: 1 },
  { char: '亮', pinyin: 'liàng', tone: 4, strokes: 9, wuxing: '火', meaning: '明亮、光亮', level: 1 },
  { char: '红', pinyin: 'hóng', tone: 2, strokes: 6, wuxing: '水', meaning: '红色、喜庆', level: 1 },
  { char: '宇', pinyin: 'yǔ', tone: 3, strokes: 6, wuxing: '土', meaning: '宇宙、风度', level: 1 },
  { char: '欣', pinyin: 'xīn', tone: 1, strokes: 8, wuxing: '木', meaning: '欣喜、欣欣向荣', level: 1 },
  { char: '晨', pinyin: 'chén', tone: 2, strokes: 11, wuxing: '金', meaning: '早晨、晨光', level: 1 },
  { char: '睿', pinyin: 'ruì', tone: 4, strokes: 14, wuxing: '金', meaning: '睿智、通达', level: 1 },
  { char: '思', pinyin: 'sī', tone: 1, strokes: 9, wuxing: '金', meaning: '思考、思念', level: 1 },
  { char: '涵', pinyin: 'hán', tone: 2, strokes: 11, wuxing: '水', meaning: '涵养、包容', level: 1 },
  { char: '博', pinyin: 'bó', tone: 2, strokes: 12, wuxing: '水', meaning: '博学、博大', level: 1 },
  { char: '嘉', pinyin: 'jiā', tone: 1, strokes: 14, wuxing: '木', meaning: '美好、赞许', level: 1 },
  { char: '子', pinyin: 'zǐ', tone: 3, strokes: 3, wuxing: '水', meaning: '君子、子嗣', level: 1 },
  { char: '轩', pinyin: 'xuān', tone: 1, strokes: 7, wuxing: '土', meaning: '轩昂、气度不凡', level: 1 },
  { char: '雨', pinyin: 'yǔ', tone: 3, strokes: 8, wuxing: '水', meaning: '雨水、滋润', level: 1 },
  { char: '萱', pinyin: 'xuān', tone: 1, strokes: 12, wuxing: '木', meaning: '萱草、忘忧', level: 1 },
  { char: '辰', pinyin: 'chén', tone: 2, strokes: 7, wuxing: '土', meaning: '星辰、时光', level: 1 },
  { char: '安', pinyin: 'ān', tone: 1, strokes: 6, wuxing: '土', meaning: '平安、安定', level: 1 },
  { char: '若', pinyin: 'ruò', tone: 4, strokes: 8, wuxing: '木', meaning: '如同、杜若', level: 1 },
  { char: '彤', pinyin: 'tóng', tone: 2, strokes: 7, wuxing: '火', meaning: '红色、彤云', level: 1 },
  { char: '承', pinyin: 'chéng', tone: 2, strokes: 8, wuxing: '金', meaning: '承担、继承', level: 1 },
  { char: '谦', pinyin: 'qiān', tone: 1, strokes: 12, wuxing: '木', meaning: '谦虚、谦逊', level: 1 },
  { char: '恒', pinyin: 'héng', tone: 2, strokes: 9, wuxing: '水', meaning: '永恒、恒心', level: 1 },
  { char: '悦', pinyin: 'yuè', tone: 4, strokes: 10, wuxing: '金', meaning: '喜悦、愉悦', level: 1 },
  { char: '瑞', pinyin: 'ruì', tone: 4, strokes: 13, wuxing: '金', meaning: '吉祥、祥瑞', level: 1 },
  { char: '航', pinyin: 'háng', tone: 2, strokes: 10, wuxing: '水', meaning: '航行、远航', level: 1 },
  { char: '瑶', pinyin: 'yáo', tone: 2, strokes: 14, wuxing: '火', meaning: '美玉、美好', level: 1 },
  { char: '瑾', pinyin: 'jǐn', tone: 3, strokes: 15, wuxing: '火', meaning: '美玉、美德', level: 1 },
  { char: '婉', pinyin: 'wǎn', tone: 3, strokes: 11, wuxing: '土', meaning: '婉约、柔顺', level: 1 },
  { char: '诗', pinyin: 'shī', tone: 1, strokes: 8, wuxing: '金', meaning: '诗歌、文雅', level: 1 },
  { char: '雅', pinyin: 'yǎ', tone: 3, strokes: 12, wuxing: '木', meaning: '优雅、高尚', level: 1 },
  { char: '逸', pinyin: 'yì', tone: 4, strokes: 11, wuxing: '土', meaning: '飘逸、安闲', level: 1 },
  { char: '铭', pinyin: 'míng', tone: 2, strokes: 11, wuxing: '金', meaning: '铭记、刻铭', level: 1 },
  { char: '泽', pinyin: 'zé', tone: 2, strokes: 8, wuxing: '水', meaning: '恩泽、润泽', level: 1 },
  { char: '浩', pinyin: 'hào', tone: 4, strokes: 10, wuxing: '水', meaning: '浩大、浩瀚', level: 1 },
  { char: '昊', pinyin: 'hào', tone: 4, strokes: 8, wuxing: '火', meaning: '广阔的天', level: 1 },
  { char: '然', pinyin: 'rán', tone: 2, strokes: 12, wuxing: '金', meaning: '信守、自然', level: 1 },
  { char: '汐', pinyin: 'xī', tone: 1, strokes: 6, wuxing: '水', meaning: '晚潮、潮汐', level: 1 },
  { char: '玥', pinyin: 'yuè', tone: 4, strokes: 8, wuxing: '土', meaning: '神珠、美玉', level: 1 },
  { char: '怡', pinyin: 'yí', tone: 2, strokes: 8, wuxing: '土', meaning: '和悦、愉快', level: 1 },
  { char: '沐', pinyin: 'mù', tone: 4, strokes: 7, wuxing: '水', meaning: '沐浴、润泽', level: 1 },
  { char: '可', pinyin: 'kě', tone: 3, strokes: 5, wuxing: '木', meaning: '可爱、认可', level: 1 },
  { char: '昕', pinyin: 'xīn', tone: 1, strokes: 8, wuxing: '火', meaning: '黎明、明亮', level: 1 },
  { char: '暄', pinyin: 'xuān', tone: 1, strokes: 13, wuxing: '金', meaning: '温暖、松软', level: 1 },
  { char: '翊', pinyin: 'yì', tone: 4, strokes: 11, wuxing: '木', meaning: '辅佐、飞翔', level: 1 },
  { char: '言', pinyin: 'yán', tone: 2, strokes: 7, wuxing: '木', meaning: '言语、诚信', level: 1 },
  { char: '诺', pinyin: 'nuò', tone: 4, strokes: 10, wuxing: '火', meaning: '承诺、应允', level: 1 },
  { char: '钰', pinyin: 'yù', tone: 4, strokes: 10, wuxing: '金', meaning: '宝物、坚金', level: 1 },
  { char: '锦', pinyin: 'jǐn', tone: 3, strokes: 13, wuxing: '金', meaning: '锦绣、美好', level: 1 },
  { char: '雯', pinyin: 'wén', tone: 2, strokes: 12, wuxing: '水', meaning: '云纹、彩云', level: 1 },
  { char: '霖', pinyin: 'lín', tone: 2, strokes: 16, wuxing: '水', meaning: '甘霖、久雨', level: 1 },
  { char: '柏', pinyin: 'bǎi', tone: 3, strokes: 9, wuxing: '木', meaning: '柏树、坚贞', level: 1 },
  { char: '柯', pinyin: 'kē', tone: 1, strokes: 9, wuxing: '木', meaning: '草木枝茎', level: 1 },
  { char: '柠', pinyin: 'níng', tone: 2, strokes: 9, wuxing: '木', meaning: '柠檬、清新', level: 1 },
  { char: '梵', pinyin: 'fàn', tone: 4, strokes: 11, wuxing: '木', meaning: '清净、梵行', level: 1 },
  { char: '森', pinyin: 'sēn', tone: 1, strokes: 12, wuxing: '木', meaning: '森林、茂盛', level: 1 },
  { char: '焱', pinyin: 'yàn', tone: 4, strokes: 12, wuxing: '火', meaning: '光华、火焰', level: 1 },
  { char: '煊', pinyin: 'xuān', tone: 1, strokes: 13, wuxing: '火', meaning: '光明、温暖', level: 1 },
  { char: '煜', pinyin: 'yù', tone: 4, strokes: 13, wuxing: '火', meaning: '照耀、明亮', level: 1 },
  { char: '熙', pinyin: 'xī', tone: 1, strokes: 14, wuxing: '水', meaning: '光明、兴盛', level: 1 },
  { char: '然', pinyin: 'rán', tone: 2, strokes: 12, wuxing: '金', meaning: '信守、自然', level: 1 },
  { char: '烨', pinyin: 'yè', tone: 4, strokes: 10, wuxing: '火', meaning: '火光、日光', level: 1 },
  { char: '垚', pinyin: 'yáo', tone: 2, strokes: 9, wuxing: '土', meaning: '山高、高远', level: 1 },
  { char: '垠', pinyin: 'yín', tone: 2, strokes: 9, wuxing: '土', meaning: '边际、界限', level: 1 },
  { char: '城', pinyin: 'chéng', tone: 2, strokes: 9, wuxing: '土', meaning: '城市、城墙', level: 1 },
  { char: '培', pinyin: 'péi', tone: 2, strokes: 11, wuxing: '土', meaning: '培养、根基', level: 1 },
  { char: '钦', pinyin: 'qīn', tone: 1, strokes: 9, wuxing: '金', meaning: '敬佩、钦仰', level: 1 },
  { char: '钧', pinyin: 'jūn', tone: 1, strokes: 9, wuxing: '金', meaning: '重量、尊贵', level: 1 },
  { char: '锋', pinyin: 'fēng', tone: 1, strokes: 12, wuxing: '金', meaning: '锋利、先锋', level: 1 },
  { char: '鑫', pinyin: 'xīn', tone: 1, strokes: 24, wuxing: '金', meaning: '金多、兴盛', level: 1 },
  { char: '淼', pinyin: 'miǎo', tone: 3, strokes: 12, wuxing: '水', meaning: '水大、广阔', level: 1 },
  { char: '渊', pinyin: 'yuān', tone: 1, strokes: 11, wuxing: '水', meaning: '深渊、渊博', level: 1 },
  { char: '淳', pinyin: 'chún', tone: 2, strokes: 11, wuxing: '水', meaning: '淳朴、淳厚', level: 1 },
  { char: '瀚', pinyin: 'hàn', tone: 4, strokes: 19, wuxing: '水', meaning: '浩瀚、广大', level: 1 },
  { char: '杉', pinyin: 'shān', tone: 1, strokes: 7, wuxing: '木', meaning: '杉木、常绿', level: 1 },
  { char: '棋', pinyin: 'qí', tone: 2, strokes: 12, wuxing: '木', meaning: '棋艺、文雅', level: 1 },
  { char: '媛', pinyin: 'yuàn', tone: 4, strokes: 12, wuxing: '火', meaning: '美女、美好', level: 1 },
  { char: '嫣', pinyin: 'yān', tone: 1, strokes: 14, wuxing: '土', meaning: '美好、嫣然', level: 1 },
  { char: '娴', pinyin: 'xián', tone: 2, strokes: 10, wuxing: '土', meaning: '文雅、熟练', level: 1 },
  { char: '李', pinyin: 'lǐ', tone: 3, strokes: 7, wuxing: '木', meaning: '李树、姓氏', level: 1 },
  { char: '王', pinyin: 'wáng', tone: 2, strokes: 4, wuxing: '土', meaning: '君王、姓氏', level: 1 },
  { char: '张', pinyin: 'zhāng', tone: 1, strokes: 11, wuxing: '火', meaning: '张开、姓氏', level: 1 },
  { char: '刘', pinyin: 'liú', tone: 2, strokes: 6, wuxing: '金', meaning: '姓氏', level: 1 },
  { char: '陈', pinyin: 'chén', tone: 2, strokes: 7, wuxing: '火', meaning: '陈列、姓氏', level: 1 },
  { char: '杨', pinyin: 'yáng', tone: 2, strokes: 7, wuxing: '木', meaning: '杨树、姓氏', level: 1 },
  { char: '黄', pinyin: 'huáng', tone: 2, strokes: 11, wuxing: '土', meaning: '黄色、姓氏', level: 1 },
  { char: '赵', pinyin: 'zhào', tone: 4, strokes: 9, wuxing: '火', meaning: '姓氏', level: 1 },
  { char: '周', pinyin: 'zhōu', tone: 1, strokes: 8, wuxing: '金', meaning: '周围、姓氏', level: 1 },
  { char: '吴', pinyin: 'wú', tone: 2, strokes: 7, wuxing: '木', meaning: '姓氏', level: 1 },
  { char: '徐', pinyin: 'xú', tone: 2, strokes: 10, wuxing: '金', meaning: '缓慢、姓氏', level: 1 },
  { char: '孙', pinyin: 'sūn', tone: 1, strokes: 6, wuxing: '金', meaning: '子孙、姓氏', level: 1 },
  { char: '胡', pinyin: 'hú', tone: 2, strokes: 9, wuxing: '土', meaning: '姓氏', level: 1 },
  { char: '朱', pinyin: 'zhū', tone: 1, strokes: 6, wuxing: '木', meaning: '红色、姓氏', level: 1 },
  { char: '高', pinyin: 'gāo', tone: 1, strokes: 10, wuxing: '木', meaning: '高大、姓氏', level: 1 },
  { char: '林', pinyin: 'lín', tone: 2, strokes: 8, wuxing: '木', meaning: '森林、姓氏', level: 1 },
  { char: '何', pinyin: 'hé', tone: 2, strokes: 7, wuxing: '木', meaning: '姓氏', level: 1 },
  { char: '郭', pinyin: 'guō', tone: 1, strokes: 10, wuxing: '木', meaning: '城郭、姓氏', level: 1 },
  { char: '马', pinyin: 'mǎ', tone: 3, strokes: 3, wuxing: '水', meaning: '马匹、姓氏', level: 1 },
  { char: '罗', pinyin: 'luó', tone: 2, strokes: 8, wuxing: '火', meaning: '姓氏', level: 1 },
  { char: '梁', pinyin: 'liáng', tone: 2, strokes: 11, wuxing: '火', meaning: '房梁、姓氏', level: 1 },
  { char: '宋', pinyin: 'sòng', tone: 4, strokes: 7, wuxing: '金', meaning: '姓氏', level: 1 },
  { char: '郑', pinyin: 'zhèng', tone: 4, strokes: 8, wuxing: '火', meaning: '姓氏', level: 1 },
  { char: '谢', pinyin: 'xiè', tone: 4, strokes: 12, wuxing: '金', meaning: '感谢、姓氏', level: 1 },
  { char: '韩', pinyin: 'hán', tone: 2, strokes: 12, wuxing: '水', meaning: '姓氏', level: 1 },
  { char: '唐', pinyin: 'táng', tone: 2, strokes: 10, wuxing: '火', meaning: '朝代、姓氏', level: 1 },
  { char: '冯', pinyin: 'féng', tone: 2, strokes: 5, wuxing: '水', meaning: '姓氏', level: 1 },
  { char: '于', pinyin: 'yú', tone: 2, strokes: 3, wuxing: '土', meaning: '姓氏', level: 1 },
  { char: '董', pinyin: 'dǒng', tone: 3, strokes: 12, wuxing: '火', meaning: '监督、姓氏', level: 1 },
  { char: '萧', pinyin: 'xiāo', tone: 1, strokes: 11, wuxing: '木', meaning: '蒿草、姓氏', level: 1 },
  { char: '程', pinyin: 'chéng', tone: 2, strokes: 12, wuxing: '火', meaning: '路程、姓氏', level: 1 },
  { char: '曹', pinyin: 'cáo', tone: 2, strokes: 11, wuxing: '金', meaning: '姓氏', level: 1 },
  { char: '袁', pinyin: 'yuán', tone: 2, strokes: 10, wuxing: '土', meaning: '姓氏', level: 1 },
  { char: '邓', pinyin: 'dèng', tone: 4, strokes: 4, wuxing: '火', meaning: '姓氏', level: 1 },
  { char: '许', pinyin: 'xǔ', tone: 3, strokes: 6, wuxing: '木', meaning: '允许、姓氏', level: 1 },
  { char: '傅', pinyin: 'fù', tone: 4, strokes: 12, wuxing: '水', meaning: '师傅、姓氏', level: 1 },
  { char: '沈', pinyin: 'shěn', tone: 3, strokes: 7, wuxing: '水', meaning: '姓氏', level: 1 },
  { char: '曾', pinyin: 'zēng', tone: 1, strokes: 12, wuxing: '金', meaning: '曾经、姓氏', level: 1 },
  { char: '彭', pinyin: 'péng', tone: 2, strokes: 12, wuxing: '水', meaning: '姓氏', level: 1 },
  { char: '吕', pinyin: 'lǚ', tone: 3, strokes: 6, wuxing: '火', meaning: '姓氏', level: 1 },
  { char: '苏', pinyin: 'sū', tone: 1, strokes: 7, wuxing: '木', meaning: '苏醒、姓氏', level: 1 },
  { char: '卢', pinyin: 'lú', tone: 2, strokes: 5, wuxing: '火', meaning: '姓氏', level: 1 },
  { char: '蒋', pinyin: 'jiǎng', tone: 3, strokes: 12, wuxing: '木', meaning: '姓氏', level: 1 },
  { char: '蔡', pinyin: 'cài', tone: 4, strokes: 14, wuxing: '木', meaning: '姓氏', level: 1 },
  { char: '贾', pinyin: 'jiǎ', tone: 3, strokes: 10, wuxing: '水', meaning: '商贾、姓氏', level: 1 },
  { char: '丁', pinyin: 'dīng', tone: 1, strokes: 2, wuxing: '火', meaning: '姓氏', level: 1 },
  { char: '魏', pinyin: 'wèi', tone: 4, strokes: 17, wuxing: '木', meaning: '姓氏', level: 1 },
  { char: '薛', pinyin: 'xuē', tone: 1, strokes: 16, wuxing: '木', meaning: '姓氏', level: 1 },
  { char: '叶', pinyin: 'yè', tone: 4, strokes: 5, wuxing: '土', meaning: '树叶、姓氏', level: 1 },
  { char: '阎', pinyin: 'yán', tone: 2, strokes: 11, wuxing: '木', meaning: '姓氏', level: 1 },
  { char: '余', pinyin: 'yú', tone: 2, strokes: 7, wuxing: '土', meaning: '剩余、姓氏', level: 1 },
  { char: '潘', pinyin: 'pān', tone: 1, strokes: 15, wuxing: '水', meaning: '姓氏', level: 1 },
  { char: '杜', pinyin: 'dù', tone: 4, strokes: 7, wuxing: '木', meaning: '杜绝、姓氏', level: 1 },
  { char: '戴', pinyin: 'dài', tone: 4, strokes: 17, wuxing: '火', meaning: '穿戴、姓氏', level: 1 },
  { char: '夏', pinyin: 'xià', tone: 4, strokes: 10, wuxing: '火', meaning: '夏天、姓氏', level: 1 },
  { char: '钟', pinyin: 'zhōng', tone: 1, strokes: 9, wuxing: '金', meaning: '钟表、姓氏', level: 1 },
  { char: '汪', pinyin: 'wāng', tone: 1, strokes: 7, wuxing: '水', meaning: '水深广、姓氏', level: 1 },
  { char: '田', pinyin: 'tián', tone: 2, strokes: 5, wuxing: '火', meaning: '田地、姓氏', level: 1 },
  { char: '任', pinyin: 'rén', tone: 2, strokes: 6, wuxing: '金', meaning: '任务、姓氏', level: 1 },
  { char: '姜', pinyin: 'jiāng', tone: 1, strokes: 9, wuxing: '木', meaning: '生姜、姓氏', level: 1 },
  { char: '范', pinyin: 'fàn', tone: 4, strokes: 8, wuxing: '水', meaning: '模范、姓氏', level: 1 },
  { char: '方', pinyin: 'fāng', tone: 1, strokes: 4, wuxing: '水', meaning: '方向、姓氏', level: 1 },
  { char: '石', pinyin: 'shí', tone: 2, strokes: 5, wuxing: '金', meaning: '石头、姓氏', level: 1 },
  { char: '姚', pinyin: 'yáo', tone: 2, strokes: 9, wuxing: '土', meaning: '姓氏', level: 1 },
  { char: '谭', pinyin: 'tán', tone: 2, strokes: 14, wuxing: '火', meaning: '姓氏', level: 1 },
  { char: '廖', pinyin: 'liào', tone: 4, strokes: 14, wuxing: '火', meaning: '姓氏', level: 1 },
  { char: '邹', pinyin: 'zōu', tone: 1, strokes: 7, wuxing: '金', meaning: '姓氏', level: 1 },
  { char: '熊', pinyin: 'xióng', tone: 2, strokes: 14, wuxing: '水', meaning: '动物、姓氏', level: 1 },
  { char: '金', pinyin: 'jīn', tone: 1, strokes: 8, wuxing: '金', meaning: '黄金、姓氏', level: 1 },
  { char: '陆', pinyin: 'lù', tone: 4, strokes: 7, wuxing: '火', meaning: '陆地、姓氏', level: 1 },
  { char: '郝', pinyin: 'hǎo', tone: 3, strokes: 9, wuxing: '金', meaning: '姓氏', level: 1 },
  { char: '孔', pinyin: 'kǒng', tone: 3, strokes: 4, wuxing: '木', meaning: '孔子、姓氏', level: 1 },
  { char: '白', pinyin: 'bái', tone: 2, strokes: 5, wuxing: '水', meaning: '白色、姓氏', level: 1 },
  { char: '崔', pinyin: 'cuī', tone: 1, strokes: 11, wuxing: '木', meaning: '高大、姓氏', level: 1 },
  { char: '康', pinyin: 'kāng', tone: 1, strokes: 11, wuxing: '木', meaning: '健康、姓氏', level: 1 },
  { char: '毛', pinyin: 'máo', tone: 2, strokes: 4, wuxing: '水', meaning: '毛发、姓氏', level: 1 },
  { char: '邱', pinyin: 'qiū', tone: 1, strokes: 7, wuxing: '木', meaning: '山丘、姓氏', level: 1 },
  { char: '秦', pinyin: 'qín', tone: 2, strokes: 10, wuxing: '火', meaning: '朝代、姓氏', level: 1 },
  { char: '江', pinyin: 'jiāng', tone: 1, strokes: 6, wuxing: '水', meaning: '江河、姓氏', level: 1 },
  { char: '史', pinyin: 'shǐ', tone: 3, strokes: 5, wuxing: '金', meaning: '历史、姓氏', level: 1 },
  { char: '顾', pinyin: 'gù', tone: 4, strokes: 10, wuxing: '木', meaning: '照顾、姓氏', level: 1 },
  { char: '侯', pinyin: 'hóu', tone: 2, strokes: 9, wuxing: '水', meaning: '侯爵、姓氏', level: 1 },
  { char: '邵', pinyin: 'shào', tone: 4, strokes: 7, wuxing: '金', meaning: '姓氏', level: 1 },
  { char: '孟', pinyin: 'mèng', tone: 4, strokes: 8, wuxing: '水', meaning: '孟子、姓氏', level: 1 },
  { char: '龙', pinyin: 'lóng', tone: 2, strokes: 5, wuxing: '火', meaning: '龙、姓氏', level: 1 },
  { char: '万', pinyin: 'wàn', tone: 4, strokes: 3, wuxing: '水', meaning: '千万、姓氏', level: 1 },
  { char: '段', pinyin: 'duàn', tone: 4, strokes: 9, wuxing: '火', meaning: '段落、姓氏', level: 1 },
  { char: '雷', pinyin: 'léi', tone: 2, strokes: 13, wuxing: '水', meaning: '雷电、姓氏', level: 1 },
  { char: '钱', pinyin: 'qián', tone: 2, strokes: 10, wuxing: '金', meaning: '金钱、姓氏', level: 1 },
  { char: '汤', pinyin: 'tāng', tone: 1, strokes: 6, wuxing: '水', meaning: '热水、姓氏', level: 1 },
  { char: '尹', pinyin: 'yǐn', tone: 3, strokes: 4, wuxing: '土', meaning: '治理、姓氏', level: 1 },
  { char: '易', pinyin: 'yì', tone: 4, strokes: 8, wuxing: '火', meaning: '容易、姓氏', level: 1 },
  { char: '常', pinyin: 'cháng', tone: 2, strokes: 11, wuxing: '金', meaning: '经常、姓氏', level: 1 },
  { char: '武', pinyin: 'wǔ', tone: 3, strokes: 8, wuxing: '水', meaning: '武力、姓氏', level: 1 },
  { char: '乔', pinyin: 'qiáo', tone: 2, strokes: 6, wuxing: '木', meaning: '高大、姓氏', level: 1 },
  { char: '贺', pinyin: 'hè', tone: 4, strokes: 9, wuxing: '水', meaning: '祝贺、姓氏', level: 1 },
  { char: '赖', pinyin: 'lài', tone: 4, strokes: 13, wuxing: '火', meaning: '依赖、姓氏', level: 1 },
  { char: '龚', pinyin: 'gōng', tone: 1, strokes: 11, wuxing: '木', meaning: '恭敬、姓氏', level: 1 },
  { char: '文', pinyin: 'wén', tone: 2, strokes: 4, wuxing: '水', meaning: '文化、姓氏', level: 1 }
];

const wuxingMap = {
  '金': { color: '#C0C0C0', direction: '西', season: '秋', organ: '肺' },
  '木': { color: '#228B22', direction: '东', season: '春', organ: '肝' },
  '水': { color: '#1E90FF', direction: '北', season: '冬', organ: '肾' },
  '火': { color: '#DC143C', direction: '南', season: '夏', organ: '心' },
  '土': { color: '#DAA520', direction: '中', season: '长夏', organ: '脾' }
};

const shengke = {
  相生: { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' },
  相克: { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
};

function getCharacter(char) {
  return characters.find(c => c.char === char);
}

function getWuxingInfo(wuxing) {
  return wuxingMap[wuxing];
}

function getCharactersByWuxing(wuxing) {
  return characters.filter(c => c.wuxing === wuxing);
}

function getRandomByWuxing(wuxing, count = 10) {
  const chars = getCharactersByWuxing(wuxing);
  const shuffled = chars.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getStrokes(char) {
  const c = getCharacter(char);
  return c ? c.strokes : 0;
}

function getWuxing(char) {
  const c = getCharacter(char);
  return c ? c.wuxing : null;
}

function calculateWuxingBalance(chars) {
  const count = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  chars.forEach(char => {
    const wx = getWuxing(char);
    if (wx) count[wx]++;
  });
  
  const total = chars.length || 1;
  const balance = {};
  Object.keys(count).forEach(k => {
    balance[k] = count[k] / total;
  });
  
  const ideal = 0.2;
  let score = 0;
  Object.keys(balance).forEach(k => {
    const diff = Math.abs(balance[k] - ideal);
    score += diff;
  });
  
  const balanceScore = Math.max(0, 100 - score * 100);
  
  return {
    counts: count,
    balance,
    score: Math.round(balanceScore)
  };
}

module.exports = {
  characters,
  wuxingMap,
  shengke,
  getCharacter,
  getWuxingInfo,
  getCharactersByWuxing,
  getRandomByWuxing,
  getStrokes,
  getWuxing,
  calculateWuxingBalance
};
