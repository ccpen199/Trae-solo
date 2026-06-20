import { AdminLevel, AdminDivision } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface DivisionSeed {
  code: string;
  name: string;
  level: AdminLevel;
  parentCode?: string;
  counties?: {
    code: string;
    name: string;
    towns?: { code: string; name: string }[];
  }[];
}

const province: DivisionSeed = {
  code: '530000',
  name: '云南省',
  level: AdminLevel.PROVINCE,
};

const cities: DivisionSeed[] = [
  {
    code: '530100', name: '昆明市', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '530102', name: '五华区', towns: [{ code: '530102001', name: '华山街道' }, { code: '530102002', name: '护国街道' }, { code: '530102003', name: '大观街道' }] },
      { code: '530103', name: '盘龙区', towns: [{ code: '530103001', name: '拓东街道' }, { code: '530103002', name: '鼓楼街道' }] },
      { code: '530111', name: '官渡区', towns: [{ code: '530111001', name: '关上街道' }, { code: '530111002', name: '太和街道' }] },
      { code: '530112', name: '西山区', towns: [{ code: '530112001', name: '马街街道' }, { code: '530112002', name: '金碧街道' }] },
      { code: '530113', name: '东川区', towns: [{ code: '530113001', name: '铜都街道' }] },
      { code: '530114', name: '呈贡区', towns: [{ code: '530114001', name: '龙城街道' }] },
      { code: '530124', name: '富民县', towns: [{ code: '530124101', name: '永定镇' }] },
      { code: '530125', name: '宜良县', towns: [{ code: '530125101', name: '匡远镇' }] },
      { code: '530126', name: '石林彝族自治县', towns: [{ code: '530126101', name: '鹿阜镇' }] },
      { code: '530127', name: '嵩明县', towns: [{ code: '530127101', name: '嵩阳镇' }] },
      { code: '530128', name: '禄劝彝族苗族自治县', towns: [{ code: '530128101', name: '屏山镇' }] },
      { code: '530129', name: '寻甸回族彝族自治县', towns: [{ code: '530129101', name: '仁德镇' }] },
      { code: '530181', name: '安宁市', towns: [{ code: '530181001', name: '连然街道' }] },
    ],
  },
  {
    code: '530300', name: '曲靖市', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '530302', name: '麒麟区', towns: [{ code: '530302001', name: '南宁街道' }] },
      { code: '530303', name: '沾益区', towns: [{ code: '530303001', name: '西平街道' }] },
      { code: '530304', name: '马龙区', towns: [{ code: '530304001', name: '通泉街道' }] },
      { code: '530321', name: '陆良县', towns: [{ code: '530321101', name: '中枢镇' }] },
      { code: '530322', name: '师宗县', towns: [{ code: '530322101', name: '丹凤镇' }] },
      { code: '530323', name: '罗平县', towns: [{ code: '530323101', name: '罗雄镇' }] },
      { code: '530324', name: '富源县', towns: [{ code: '530324101', name: '中安镇' }] },
      { code: '530325', name: '会泽县', towns: [{ code: '530325101', name: '金钟镇' }] },
      { code: '530381', name: '宣威市', towns: [{ code: '530381001', name: '宛水街道' }] },
    ],
  },
  {
    code: '530400', name: '玉溪市', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '530402', name: '红塔区', towns: [{ code: '530402001', name: '玉兴街道' }] },
      { code: '530403', name: '江川区', towns: [{ code: '530403001', name: '大街街道' }] },
      { code: '530422', name: '澄江市', towns: [{ code: '530422001', name: '凤麓街道' }] },
      { code: '530423', name: '通海县', towns: [{ code: '530423101', name: '秀山镇' }] },
      { code: '530424', name: '华宁县', towns: [{ code: '530424101', name: '宁州镇' }] },
      { code: '530425', name: '易门县', towns: [{ code: '530425101', name: '龙泉镇' }] },
      { code: '530426', name: '峨山彝族自治县', towns: [{ code: '530426101', name: '双江镇' }] },
      { code: '530427', name: '新平彝族傣族自治县', towns: [{ code: '530427101', name: '桂山镇' }] },
      { code: '530428', name: '元江哈尼族彝族傣族自治县', towns: [{ code: '530428101', name: '澧江镇' }] },
    ],
  },
  {
    code: '530500', name: '保山市', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '530502', name: '隆阳区', towns: [{ code: '530502001', name: '永昌街道' }] },
      { code: '530521', name: '施甸县', towns: [{ code: '530521101', name: '甸阳镇' }] },
      { code: '530522', name: '腾冲市', towns: [{ code: '530522001', name: '腾越镇' }] },
      { code: '530523', name: '龙陵县', towns: [{ code: '530523101', name: '龙山镇' }] },
      { code: '530524', name: '昌宁县', towns: [{ code: '530524101', name: '田园镇' }] },
    ],
  },
  {
    code: '530600', name: '昭通市', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '530602', name: '昭阳区', towns: [{ code: '530602001', name: '凤凰街道' }] },
      { code: '530621', name: '鲁甸县', towns: [{ code: '530621101', name: '文屏镇' }] },
      { code: '530622', name: '巧家县', towns: [{ code: '530622101', name: '白鹤滩镇' }] },
      { code: '530623', name: '盐津县', towns: [{ code: '530623101', name: '盐井镇' }] },
      { code: '530624', name: '大关县', towns: [{ code: '530624101', name: '翠华镇' }] },
      { code: '530625', name: '永善县', towns: [{ code: '530625101', name: '溪洛渡镇' }] },
      { code: '530626', name: '绥江县', towns: [{ code: '530626101', name: '中城镇' }] },
      { code: '530627', name: '镇雄县', towns: [{ code: '530627101', name: '乌峰镇' }] },
      { code: '530628', name: '彝良县', towns: [{ code: '530628101', name: '角奎镇' }] },
      { code: '530629', name: '威信县', towns: [{ code: '530629101', name: '扎西镇' }] },
      { code: '530630', name: '水富市', towns: [{ code: '530630001', name: '云富街道' }] },
    ],
  },
  {
    code: '530700', name: '丽江市', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '530702', name: '古城区', towns: [{ code: '530702001', name: '大研街道' }] },
      { code: '530721', name: '玉龙纳西族自治县', towns: [{ code: '530721101', name: '黄山镇' }] },
      { code: '530722', name: '永胜县', towns: [{ code: '530722101', name: '永北镇' }] },
      { code: '530723', name: '华坪县', towns: [{ code: '530723101', name: '中心镇' }] },
      { code: '530724', name: '宁蒗彝族自治县', towns: [{ code: '530724101', name: '大兴镇' }] },
    ],
  },
  {
    code: '530800', name: '普洱市', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '530802', name: '思茅区', towns: [{ code: '530802001', name: '思茅街道' }] },
      { code: '530821', name: '宁洱哈尼族彝族自治县', towns: [{ code: '530821101', name: '宁洱镇' }] },
      { code: '530822', name: '墨江哈尼族自治县', towns: [{ code: '530822101', name: '联珠镇' }] },
      { code: '530823', name: '景东彝族自治县', towns: [{ code: '530823101', name: '锦屏镇' }] },
      { code: '530824', name: '景谷傣族彝族自治县', towns: [{ code: '530824101', name: '威远镇' }] },
      { code: '530825', name: '镇沅彝族哈尼族拉祜族自治县', towns: [{ code: '530825101', name: '恩乐镇' }] },
      { code: '530826', name: '江城哈尼族彝族自治县', towns: [{ code: '530826101', name: '勐烈镇' }] },
      { code: '530827', name: '孟连傣族拉祜族佤族自治县', towns: [{ code: '530827101', name: '娜允镇' }] },
      { code: '530828', name: '澜沧拉祜族自治县', towns: [{ code: '530828101', name: '勐朗镇' }] },
      { code: '530829', name: '西盟佤族自治县', towns: [{ code: '530829101', name: '勐梭镇' }] },
    ],
  },
  {
    code: '530900', name: '临沧市', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '530902', name: '临翔区', towns: [{ code: '530902001', name: '凤翔街道' }] },
      { code: '530921', name: '凤庆县', towns: [{ code: '530921101', name: '凤山镇' }] },
      { code: '530922', name: '云县', towns: [{ code: '530922101', name: '爱华镇' }] },
      { code: '530923', name: '永德县', towns: [{ code: '530923101', name: '德党镇' }] },
      { code: '530924', name: '镇康县', towns: [{ code: '530924101', name: '南伞镇' }] },
      { code: '530925', name: '双江拉祜族佤族布朗族傣族自治县', towns: [{ code: '530925101', name: '勐勐镇' }] },
      { code: '530926', name: '耿马傣族佤族自治县', towns: [{ code: '530926101', name: '耿马镇' }] },
      { code: '530927', name: '沧源佤族自治县', towns: [{ code: '530927101', name: '勐董镇' }] },
    ],
  },
  {
    code: '532300', name: '楚雄彝族自治州', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '532301', name: '楚雄市', towns: [{ code: '532301001', name: '鹿城镇' }] },
      { code: '532322', name: '双柏县', towns: [{ code: '532322101', name: '妥甸镇' }] },
      { code: '532323', name: '牟定县', towns: [{ code: '532323101', name: '共和镇' }] },
      { code: '532324', name: '南华县', towns: [{ code: '532324101', name: '龙川镇' }] },
      { code: '532325', name: '姚安县', towns: [{ code: '532325101', name: '栋川镇' }] },
      { code: '532326', name: '大姚县', towns: [{ code: '532326101', name: '金碧镇' }] },
      { code: '532327', name: '永仁县', towns: [{ code: '532327101', name: '永定镇' }] },
      { code: '532328', name: '元谋县', towns: [{ code: '532328101', name: '元马镇' }] },
      { code: '532329', name: '武定县', towns: [{ code: '532329101', name: '狮山镇' }] },
      { code: '532331', name: '禄丰市', towns: [{ code: '532331001', name: '金山镇' }] },
    ],
  },
  {
    code: '532500', name: '红河哈尼族彝族自治州', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '532501', name: '个旧市', towns: [{ code: '532501001', name: '城区街道' }] },
      { code: '532502', name: '开远市', towns: [{ code: '532502001', name: '乐白道街道' }] },
      { code: '532503', name: '蒙自市', towns: [{ code: '532503001', name: '文澜街道' }] },
      { code: '532504', name: '弥勒市', towns: [{ code: '532504001', name: '弥阳街道' }] },
      { code: '532523', name: '屏边苗族自治县', towns: [{ code: '532523101', name: '玉屏镇' }] },
      { code: '532524', name: '建水县', towns: [{ code: '532524101', name: '临安镇' }] },
      { code: '532525', name: '石屏县', towns: [{ code: '532525101', name: '异龙镇' }] },
      { code: '532526', name: '泸西县', towns: [{ code: '532526101', name: '中枢镇' }] },
      { code: '532527', name: '元阳县', towns: [{ code: '532527101', name: '南沙镇' }] },
      { code: '532528', name: '红河县', towns: [{ code: '532528101', name: '迤萨镇' }] },
      { code: '532529', name: '金平苗族瑶族傣族自治县', towns: [{ code: '532529101', name: '金河镇' }] },
      { code: '532530', name: '绿春县', towns: [{ code: '532530101', name: '大兴镇' }] },
      { code: '532531', name: '河口瑶族自治县', towns: [{ code: '532531101', name: '河口镇' }] },
    ],
  },
  {
    code: '532600', name: '文山壮族苗族自治州', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '532601', name: '文山市', towns: [{ code: '532601001', name: '开化街道' }] },
      { code: '532622', name: '砚山县', towns: [{ code: '532622101', name: '江那镇' }] },
      { code: '532623', name: '西畴县', towns: [{ code: '532623101', name: '西洒镇' }] },
      { code: '532624', name: '麻栗坡县', towns: [{ code: '532624101', name: '麻栗镇' }] },
      { code: '532625', name: '马关县', towns: [{ code: '532625101', name: '马白镇' }] },
      { code: '532626', name: '丘北县', towns: [{ code: '532626101', name: '锦屏镇' }] },
      { code: '532627', name: '广南县', towns: [{ code: '532627101', name: '莲城镇' }] },
      { code: '532628', name: '富宁县', towns: [{ code: '532628101', name: '新华镇' }] },
    ],
  },
  {
    code: '532800', name: '西双版纳傣族自治州', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '532801', name: '景洪市', towns: [{ code: '532801001', name: '允景洪街道' }] },
      { code: '532822', name: '勐海县', towns: [{ code: '532822101', name: '勐海镇' }] },
      { code: '532823', name: '勐腊县', towns: [{ code: '532823101', name: '勐腊镇' }] },
    ],
  },
  {
    code: '532900', name: '大理白族自治州', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '532901', name: '大理市', towns: [{ code: '532901001', name: '下关街道' }] },
      { code: '532922', name: '漾濞彝族自治县', towns: [{ code: '532922101', name: '苍山西镇' }] },
      { code: '532923', name: '祥云县', towns: [{ code: '532923101', name: '祥城镇' }] },
      { code: '532924', name: '宾川县', towns: [{ code: '532924101', name: '金牛镇' }] },
      { code: '532925', name: '弥渡县', towns: [{ code: '532925101', name: '弥城镇' }] },
      { code: '532926', name: '南涧彝族自治县', towns: [{ code: '532926101', name: '南涧镇' }] },
      { code: '532927', name: '巍山彝族回族自治县', towns: [{ code: '532927101', name: '南诏镇' }] },
      { code: '532928', name: '永平县', towns: [{ code: '532928101', name: '博南镇' }] },
      { code: '532929', name: '云龙县', towns: [{ code: '532929101', name: '诺邓镇' }] },
      { code: '532930', name: '洱源县', towns: [{ code: '532930101', name: '茈碧湖镇' }] },
      { code: '532931', name: '剑川县', towns: [{ code: '532931101', name: '金华镇' }] },
      { code: '532932', name: '鹤庆县', towns: [{ code: '532932101', name: '云鹤镇' }] },
    ],
  },
  {
    code: '533100', name: '德宏傣族景颇族自治州', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '533102', name: '瑞丽市', towns: [{ code: '533102001', name: '勐卯街道' }] },
      { code: '533103', name: '芒市', towns: [{ code: '533103001', name: '勐焕街道' }] },
      { code: '533122', name: '梁河县', towns: [{ code: '533122101', name: '遮岛镇' }] },
      { code: '533123', name: '盈江县', towns: [{ code: '533123101', name: '平原镇' }] },
      { code: '533124', name: '陇川县', towns: [{ code: '533124101', name: '章凤镇' }] },
    ],
  },
  {
    code: '533300', name: '怒江傈僳族自治州', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '533301', name: '泸水市', towns: [{ code: '533301001', name: '六库街道' }] },
      { code: '533323', name: '福贡县', towns: [{ code: '533323101', name: '上帕镇' }] },
      { code: '533324', name: '贡山独龙族怒族自治县', towns: [{ code: '533324101', name: '茨开镇' }] },
      { code: '533325', name: '兰坪白族普米族自治县', towns: [{ code: '533325101', name: '金顶镇' }] },
    ],
  },
  {
    code: '533400', name: '迪庆藏族自治州', level: AdminLevel.CITY, parentCode: '530000',
    counties: [
      { code: '533401', name: '香格里拉市', towns: [{ code: '533401001', name: '建塘镇' }] },
      { code: '533422', name: '德钦县', towns: [{ code: '533422101', name: '升平镇' }] },
      { code: '533423', name: '维西傈僳族自治县', towns: [{ code: '533423101', name: '保和镇' }] },
    ],
  },
];

const codeToIdMap = new Map<string, string>();

export function generateDivisions(): AdminDivision[] {
  const divisions: AdminDivision[] = [];

  const provinceId = uuidv4();
  codeToIdMap.set(province.code, provinceId);
  divisions.push({
    id: provinceId,
    code: province.code,
    name: province.name,
    level: province.level,
    parent_id: null,
    full_path: province.name,
    sort_order: 0,
  });

  cities.forEach((city, cityIndex) => {
    const cityId = uuidv4();
    codeToIdMap.set(city.code, cityId);
    divisions.push({
      id: cityId,
      code: city.code,
      name: city.name,
      level: city.level,
      parent_id: provinceId,
      full_path: `${province.name}/${city.name}`,
      sort_order: cityIndex,
    });

    city.counties?.forEach((county, countyIndex) => {
      const countyId = uuidv4();
      codeToIdMap.set(county.code, countyId);
      divisions.push({
        id: countyId,
        code: county.code,
        name: county.name,
        level: AdminLevel.COUNTY,
        parent_id: cityId,
        full_path: `${province.name}/${city.name}/${county.name}`,
        sort_order: countyIndex,
      });

      county.towns?.forEach((town, townIndex) => {
        const townId = uuidv4();
        codeToIdMap.set(town.code, townId);
        divisions.push({
          id: townId,
          code: town.code,
          name: town.name,
          level: AdminLevel.TOWN,
          parent_id: countyId,
          full_path: `${province.name}/${city.name}/${county.name}/${town.name}`,
          sort_order: townIndex,
        });
      });
    });
  });

  return divisions;
}

export function getDivisionIdByCode(code: string): string | undefined {
  return codeToIdMap.get(code);
}

export function getYunnanProvinceId(): string {
  return codeToIdMap.get('530000')!;
}
