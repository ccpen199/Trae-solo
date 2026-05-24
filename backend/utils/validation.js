const db = require('../config/db');

const checkVaccineValidity = (petId) => {
  const today = new Date().toISOString().split('T')[0];
  const vaccines = db.prepare(`
    SELECT * FROM vaccines 
    WHERE pet_id = ? AND status = 'valid' AND expire_date >= ?
  `).all(petId, today);
  
  const hasRabies = vaccines.some(v => v.vaccine_name.includes('狂犬'));
  const hasCoreVaccine = vaccines.some(v => v.vaccine_name.includes('联') || v.vaccine_name.includes('核心'));
  
  return {
    valid: hasRabies && vaccines.length > 0,
    hasRabies,
    hasCoreVaccine,
    validVaccines: vaccines,
    message: hasRabies && vaccines.length > 0 ? '疫苗有效' : '疫苗无效或过期'
  };
};

const checkPetSize = (petId, serviceId) => {
  const pet = db.prepare('SELECT weight, size FROM pets WHERE id = ?').get(petId);
  const service = db.prepare('SELECT min_weight, max_weight FROM services WHERE id = ?').get(serviceId);
  
  if (!pet || !service) {
    return { valid: false, message: '宠物或服务不存在' };
  }
  
  const weightValid = pet.weight >= service.min_weight && pet.weight <= service.max_weight;
  
  return {
    valid: weightValid,
    petWeight: pet.weight,
    petSize: pet.size,
    minWeight: service.min_weight,
    maxWeight: service.max_weight,
    message: weightValid ? '体型符合要求' : `体重${pet.weight}kg超出服务范围(${service.min_weight}-${service.max_weight}kg)`
  };
};

const checkAggression = (petId, serviceId) => {
  const pet = db.prepare('SELECT is_aggressive, aggression_notes FROM pets WHERE id = ?').get(petId);
  const service = db.prepare('SELECT allow_aggressive FROM services WHERE id = ?').get(serviceId);
  
  if (!pet || !service) {
    return { valid: false, message: '宠物或服务不存在' };
  }
  
  const valid = !pet.is_aggressive || service.allow_aggressive;
  
  return {
    valid,
    isAggressive: !!pet.is_aggressive,
    allowAggressive: !!service.allow_aggressive,
    aggressionNotes: pet.aggression_notes,
    message: valid ? '攻击性检查通过' : (pet.is_aggressive ? '该宠物有攻击性标记，此服务不接收攻击性宠物' : '攻击性检查通过')
  };
};

const checkServiceCapacity = (slotId) => {
  const slot = db.prepare(`
    SELECT ss.*, s.capacity_per_slot 
    FROM service_slots ss 
    JOIN services s ON ss.service_id = s.id 
    WHERE ss.id = ?
  `).get(slotId);
  
  if (!slot) {
    return { valid: false, message: '时段不存在' };
  }
  
  const maxCapacity = slot.max_capacity || slot.capacity_per_slot;
  const valid = slot.current_booked < maxCapacity;
  
  return {
    valid,
    currentBooked: slot.current_booked,
    maxCapacity,
    available: maxCapacity - slot.current_booked,
    message: valid ? '容量充足' : '该时段已满'
  };
};

const checkBoardingCapacity = (storeId, checkInDate, checkOutDate) => {
  const occupiedRooms = db.prepare(`
    SELECT DISTINCT bs.room_id 
    FROM boarding_stays bs
    WHERE bs.status = 'active'
    AND bs.check_in_date <= ?
    AND (bs.actual_check_out IS NULL OR bs.actual_check_out >= ?)
  `).all(checkOutDate, checkInDate).map(r => r.room_id);
  
  const availableRooms = db.prepare(`
    SELECT * FROM boarding_rooms 
    WHERE store_id = ? AND status = 'available'
    AND id NOT IN (${occupiedRooms.length > 0 ? occupiedRooms.join(',') : '0'})
  `).all(storeId);
  
  return {
    valid: availableRooms.length > 0,
    availableRooms,
    occupiedCount: occupiedRooms.length,
    message: availableRooms.length > 0 ? `有${availableRooms.length}间房可用` : '该时段无可用房间'
  };
};

const validateAppointment = (petId, serviceId, slotId = null) => {
  const vaccineCheck = checkVaccineValidity(petId);
  const sizeCheck = checkPetSize(petId, serviceId);
  const aggressionCheck = checkAggression(petId, serviceId);
  
  let capacityCheck = { valid: true, message: '无需容量检查' };
  if (slotId) {
    capacityCheck = checkServiceCapacity(slotId);
  }
  
  const allValid = vaccineCheck.valid && sizeCheck.valid && aggressionCheck.valid && capacityCheck.valid;
  
  return {
    valid: allValid,
    vaccineCheck,
    sizeCheck,
    aggressionCheck,
    capacityCheck,
    errors: [
      !vaccineCheck.valid && vaccineCheck.message,
      !sizeCheck.valid && sizeCheck.message,
      !aggressionCheck.valid && aggressionCheck.message,
      !capacityCheck.valid && capacityCheck.message
    ].filter(Boolean)
  };
};

const calculateBoardingFee = (dailyRate, checkInDate, checkOutDate, extendedDays = 0) => {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const totalDays = diffDays + extendedDays;
  const totalAmount = totalDays * dailyRate;
  
  return {
    days: diffDays,
    extendedDays,
    totalDays,
    dailyRate,
    totalAmount
  };
};

const generateOrderNo = (prefix = 'AP') => {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

module.exports = {
  checkVaccineValidity,
  checkPetSize,
  checkAggression,
  checkServiceCapacity,
  checkBoardingCapacity,
  validateAppointment,
  calculateBoardingFee,
  generateOrderNo
};
