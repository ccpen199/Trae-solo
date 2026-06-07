import { BaseRepository } from './BaseRepository.js';
import type { Building, Unit, Resident } from '../types/index.js';

export class BuildingRepository extends BaseRepository<Building> {
  protected tableName = 'buildings';
  protected columns = [
    'id',
    'name',
    'address',
    'total_floors',
    'total_units',
    'description',
    'created_at',
    'updated_at',
  ];

  public getBuildingWithStats(buildingId: number) {
    const building = this.findById(buildingId);
    if (!building) return null;

    const unitSql = `
      SELECT 
        COUNT(*) as total_units,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_units,
        SUM(CASE WHEN status = 'vacant' THEN 1 ELSE 0 END) as vacant_units,
        SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END) as rented_units
      FROM units 
      WHERE building_id = ?
    `;

    const residentSql = `
      SELECT COUNT(*) as total_residents 
      FROM residents r
      INNER JOIN units u ON r.unit_id = u.id
      WHERE u.building_id = ?
    `;

    const stats = this.executeGet(unitSql, [buildingId]);
    const residentCount = this.executeGet<{ total_residents: number }>(residentSql, [buildingId]);

    return {
      ...building,
      unit_stats: stats,
      resident_count: residentCount?.total_residents || 0,
    };
  }

  public getUnitsByBuilding(buildingId: number, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;
    
    const countSql = `SELECT COUNT(*) as total FROM units WHERE building_id = ?`;
    const dataSql = `
      SELECT u.*, b.name as building_name
      FROM units u
      LEFT JOIN buildings b ON u.building_id = b.id
      WHERE u.building_id = ?
      ORDER BY u.floor, u.unit_number
      LIMIT ? OFFSET ?
    `;
    
    const countStmt = this.db.prepare(countSql);
    const dataStmt = this.db.prepare(dataSql);
    
    const { total } = countStmt.get(buildingId) as { total: number };
    const items = dataStmt.all(buildingId, pageSize, offset) as Unit[];
    
    return {
      items,
      total,
      page,
      page_size: pageSize,
    };
  }

  public getResidentsByBuilding(buildingId: number, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM residents r
      INNER JOIN units u ON r.unit_id = u.id
      WHERE u.building_id = ?
    `;
    
    const dataSql = `
      SELECT r.*, u.unit_number, u.floor, b.name as building_name
      FROM residents r
      INNER JOIN units u ON r.unit_id = u.id
      INNER JOIN buildings b ON u.building_id = b.id
      WHERE b.id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const countStmt = this.db.prepare(countSql);
    const dataStmt = this.db.prepare(dataSql);
    
    const { total } = countStmt.get(buildingId) as { total: number };
    const items = dataStmt.all(buildingId, pageSize, offset) as Resident[];
    
    return {
      items,
      total,
      page,
      page_size: pageSize,
    };
  }

  public getAllBuildingsWithStats() {
    const sql = `
      SELECT 
        b.*,
        COUNT(DISTINCT u.id) as actual_units,
        COUNT(DISTINCT CASE WHEN u.status = 'occupied' THEN u.id END) as occupied_units,
        COUNT(DISTINCT r.id) as total_residents
      FROM buildings b
      LEFT JOIN units u ON b.id = u.building_id
      LEFT JOIN residents r ON u.id = r.unit_id
      GROUP BY b.id
      ORDER BY b.id ASC
    `;
    return this.executeQuery(sql);
  }
}

export default BuildingRepository;
