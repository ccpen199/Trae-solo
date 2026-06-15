/**
 * @deprecated 此文件已废弃，请使用 src/mock/townships.ts 作为唯一数据源
 * 本文件保留仅用于向后兼容，所有新代码应从 townships.ts 导入
 */

import { TOWNSHIPS } from './townships';

export {
  TOWNSHIPS as TOWNSHIP_DATA,
  TOWNSHIPS,
  TownshipData,
  getTownshipByCode,
  TOWNSHIP_NAMES,
  getTownshipStats,
  HotTownshipStat,
} from './townships';

export default TOWNSHIPS;
