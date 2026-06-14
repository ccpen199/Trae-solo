import getDatabase from '../config/database.js'
import { toCamelCase } from './utils.js'
import type { CollaborationSpace, CollaborationMember, DiscussionMessage } from '../../shared/types/index.js'

interface SpaceWithDetails extends CollaborationSpace {
  members: CollaborationMember[]
}

const collaborationRepository = {
  findSpaceById(id: number): CollaborationSpace | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM collaboration_spaces WHERE id = ?')
    const row = stmt.get(id)
    return row ? toCamelCase<CollaborationSpace>(row) : null
  },

  findSpaceByIdWithMembers(id: number): SpaceWithDetails | null {
    const db = getDatabase()
    const spaceStmt = db.prepare('SELECT * FROM collaboration_spaces WHERE id = ?')
    const spaceRow = spaceStmt.get(id)
    if (!spaceRow) return null

    const membersStmt = db.prepare('SELECT * FROM collaboration_members WHERE space_id = ? ORDER BY id')
    const memberRows = membersStmt.all(id)

    const space = toCamelCase<CollaborationSpace>(spaceRow)
    const members = toCamelCase<CollaborationMember[]>(memberRows)

    return {
      ...space,
      members
    }
  },

  findSpacesByUserId(userId: number): CollaborationSpace[] {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT cs.* FROM collaboration_spaces cs
      INNER JOIN collaboration_members cm ON cs.id = cm.space_id
      WHERE cm.user_id = ?
      ORDER BY cs.id DESC
    `)
    const rows = stmt.all(userId)
    return toCamelCase<CollaborationSpace[]>(rows)
  },

  findSpacesByOwnerId(ownerId: number): CollaborationSpace[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM collaboration_spaces WHERE owner_id = ? ORDER BY id DESC')
    const rows = stmt.all(ownerId)
    return toCamelCase<CollaborationSpace[]>(rows)
  },

  findAllSpaces(): CollaborationSpace[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM collaboration_spaces ORDER BY id')
    const rows = stmt.all()
    return toCamelCase<CollaborationSpace[]>(rows)
  },

  createSpace(data: Omit<CollaborationSpace, 'id' | 'createdAt'>): number {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO collaboration_spaces (owner_id, name, plan_id)
      VALUES (@ownerId, @name, @planId)
    `)
    const result = stmt.run(data)
    const spaceId = Number(result.lastInsertRowid)

    const addMemberStmt = db.prepare(`
      INSERT INTO collaboration_members (space_id, user_id, role)
      VALUES (?, ?, 'owner')
    `)
    addMemberStmt.run(spaceId, data.ownerId)

    return spaceId
  },

  updateSpace(id: number, data: Partial<Omit<CollaborationSpace, 'id' | 'createdAt' | 'ownerId'>>): boolean {
    const db = getDatabase()
    const fields: string[] = []
    const params: Record<string, unknown> = { id }

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        fields.push(`${snakeKey} = @${key}`)
        params[key] = value
      }
    }

    if (fields.length === 0) return false

    const stmt = db.prepare(`UPDATE collaboration_spaces SET ${fields.join(', ')} WHERE id = @id`)
    const result = stmt.run(params)
    return result.changes > 0
  },

  deleteSpace(id: number): boolean {
    const db = getDatabase()
    const deleteMessages = db.prepare('DELETE FROM discussion_messages WHERE space_id = ?')
    const deleteMembers = db.prepare('DELETE FROM collaboration_members WHERE space_id = ?')
    const deleteSpace = db.prepare('DELETE FROM collaboration_spaces WHERE id = ?')

    const deleteTransaction = db.transaction((spaceId: number) => {
      deleteMessages.run(spaceId)
      deleteMembers.run(spaceId)
      deleteSpace.run(spaceId)
    })

    deleteTransaction(id)
    return true
  },

  addMember(spaceId: number, userId: number, role: 'owner' | 'editor' | 'viewer'): number {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO collaboration_members (space_id, user_id, role)
      VALUES (?, ?, ?)
    `)
    const result = stmt.run(spaceId, userId, role)
    return Number(result.lastInsertRowid)
  },

  removeMember(spaceId: number, userId: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM collaboration_members WHERE space_id = ? AND user_id = ?')
    const result = stmt.run(spaceId, userId)
    return result.changes > 0
  },

  updateMemberRole(spaceId: number, userId: number, role: 'owner' | 'editor' | 'viewer'): boolean {
    const db = getDatabase()
    const stmt = db.prepare('UPDATE collaboration_members SET role = ? WHERE space_id = ? AND user_id = ?')
    const result = stmt.run(role, spaceId, userId)
    return result.changes > 0
  },

  findMembersBySpaceId(spaceId: number): CollaborationMember[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM collaboration_members WHERE space_id = ? ORDER BY id')
    const rows = stmt.all(spaceId)
    return toCamelCase<CollaborationMember[]>(rows)
  },

  addMessage(data: Omit<DiscussionMessage, 'id' | 'createdAt'>): number {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO discussion_messages (space_id, user_id, content, item_id)
      VALUES (@spaceId, @userId, @content, @itemId)
    `)
    const result = stmt.run(data)
    return Number(result.lastInsertRowid)
  },

  findMessagesBySpaceId(spaceId: number, limit: number = 100): DiscussionMessage[] {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT * FROM discussion_messages 
      WHERE space_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `)
    const rows = stmt.all(spaceId, limit)
    return toCamelCase<DiscussionMessage[]>(rows).reverse()
  },

  findMessagesByItemId(itemId: number): DiscussionMessage[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM discussion_messages WHERE item_id = ? ORDER BY created_at')
    const rows = stmt.all(itemId)
    return toCamelCase<DiscussionMessage[]>(rows)
  },

  deleteMessage(id: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM discussion_messages WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }
}

export default collaborationRepository
