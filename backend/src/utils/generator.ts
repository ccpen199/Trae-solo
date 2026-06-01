import db from '../db';

export function generateTransferNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;
  
  const result = db.prepare(`
    SELECT MAX(transfer_no) as max_no 
    FROM transfers 
    WHERE transfer_no LIKE ?
  `).get(`TR${datePart}%`) as { max_no: string | null };
  
  let sequence = 1;
  if (result.max_no) {
    const seqPart = result.max_no.slice(-6);
    sequence = parseInt(seqPart, 10) + 1;
  }
  
  const sequenceStr = String(sequence).padStart(6, '0');
  return `TR${datePart}${sequenceStr}`;
}
