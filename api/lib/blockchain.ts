import crypto from 'crypto'
import { getDatabase } from './database.js'

export interface BlockRecord {
  hash: string
  previousHash: string | null
  blockHeight: number
}

export interface BlockchainRecord {
  id: number
  refType: string
  refId: string
  dataDigest: string
  hash: string
  previousHash: string | null
  blockHeight: number
  createdAt: string
}

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

export function createRecord(refType: string, refId: string, dataDigest: string): BlockRecord {
  const db = getDatabase()

  const existing = db.prepare(
    'SELECT hash FROM blockchain_records WHERE ref_type = ? AND ref_id = ?'
  ).get(refType, refId) as { hash?: string } | undefined

  if (existing) {
    throw new Error(`Record already exists for ${refType}:${refId}`)
  }

  const lastBlock = db.prepare(
    'SELECT hash, block_height FROM blockchain_records ORDER BY block_height DESC LIMIT 1'
  ).get() as { hash: string; block_height: number } | undefined

  const previousHash = lastBlock ? lastBlock.hash : null
  const blockHeight = lastBlock ? lastBlock.block_height + 1 : 1

  const hashInput = `${blockHeight}:${previousHash || '0'}:${refType}:${refId}:${dataDigest}:${Date.now()}`
  const hash = sha256(hashInput)

  db.prepare(`
    INSERT INTO blockchain_records (ref_type, ref_id, data_digest, hash, previous_hash, block_height)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(refType, refId, dataDigest, hash, previousHash, blockHeight)

  return {
    hash,
    previousHash,
    blockHeight
  }
}

export function verifyRecord(hash: string): boolean {
  const db = getDatabase()

  const record = db.prepare(
    'SELECT * FROM blockchain_records WHERE hash = ?'
  ).get() as BlockchainRecord | undefined

  if (!record) {
    return false
  }

  if (record.previousHash) {
    const prevRecord = db.prepare(
      'SELECT hash FROM blockchain_records WHERE hash = ?'
    ).get(record.previousHash) as { hash: string } | undefined

    if (!prevRecord) {
      return false
    }
  }

  const nextRecord = db.prepare(
    'SELECT previous_hash FROM blockchain_records WHERE previous_hash = ?'
  ).get(hash) as { previous_hash: string } | undefined

  if (nextRecord) {
    return nextRecord.previous_hash === hash
  }

  return true
}

export function getRecordByRef(refType: string, refId: string): BlockchainRecord | null {
  const db = getDatabase()

  const record = db.prepare(
    'SELECT * FROM blockchain_records WHERE ref_type = ? AND ref_id = ?'
  ).get(refType, refId) as BlockchainRecord | undefined

  return record || null
}

export default {
  createRecord,
  verifyRecord,
  getRecordByRef
}
