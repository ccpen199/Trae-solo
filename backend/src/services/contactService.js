import { db } from '../database/init.js';
import { MAX_CONTACTS, RELATION_SOURCES } from '../utils/constants.js';
import { messageCenterService } from './messageCenterService.js';

class ContactService {
  getContactCount(userId) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE user_id = ?');
    const result = stmt.get(userId);
    return result.count;
  }

  isContact(userId, contactId) {
    const stmt = db.prepare('SELECT id FROM contacts WHERE user_id = ? AND contact_id = ?');
    const result = stmt.get(userId, contactId);
    return !!result;
  }

  checkCapacity(userId) {
    const count = this.getContactCount(userId);
    return {
      current: count,
      max: MAX_CONTACTS,
      isFull: count >= MAX_CONTACTS,
      isNearFull: count >= MAX_CONTACTS * 0.9
    };
  }

  addContact(userId, contactId, source = RELATION_SOURCES.MANUAL, autoAdd = false) {
    const capacity = this.checkCapacity(userId);
    
    if (capacity.isFull) {
      return {
        success: false,
        message: '您的联系人已达上限（500人），无法添加新联系人',
        code: 'CONTACTS_FULL'
      };
    }

    if (this.isContact(userId, contactId)) {
      return {
        success: false,
        message: '该用户已是您的联系人',
        code: 'ALREADY_CONTACT'
      };
    }

    if (userId === contactId) {
      return {
        success: false,
        message: '不能添加自己为联系人',
        code: 'CANNOT_ADD_SELF'
      };
    }

    const contactUser = db.prepare('SELECT id, cid, username, avatar FROM accounts WHERE id = ?').get(contactId);
    if (!contactUser) {
      return {
        success: false,
        message: '目标用户不存在',
        code: 'USER_NOT_FOUND'
      };
    }

    const insertStmt = db.prepare(`
      INSERT INTO contacts (user_id, contact_id, relation_source, is_recent, last_interaction_at)
      VALUES (?, ?, ?, 1, datetime('now'))
    `);
    
    insertStmt.run(userId, contactId, source);

    const contactName = contactUser.username || contactUser.cid;
    messageCenterService.addContactChangeNotification(
      userId, 
      autoAdd ? 'auto_added' : 'added', 
      contactName
    );

    if (capacity.isNearFull) {
      messageCenterService.addCapacityAlert(userId, 'contacts', capacity.current + 1, MAX_CONTACTS);
    }

    return {
      success: true,
      message: autoAdd ? '已自动添加为联系人' : '添加成功',
      data: {
        id: contactUser.id,
        cid: contactUser.cid,
        username: contactUser.username,
        avatar: contactUser.avatar
      }
    };
  }

  tryAutoAddContact(userId, contactId, source) {
    if (this.isContact(userId, contactId)) {
      this.updateLastInteraction(userId, contactId);
      return { success: true, alreadyContact: true };
    }

    const capacity = this.checkCapacity(userId);
    
    if (capacity.isFull) {
      return {
        success: false,
        message: '您的联系人已达上限，无法自动添加。建议清理后重试。',
        code: 'CONTACTS_FULL'
      };
    }

    return this.addContact(userId, contactId, source, true);
  }

  updateLastInteraction(userId, contactId) {
    db.prepare(`
      UPDATE contacts 
      SET last_interaction_at = datetime('now'), is_recent = 1
      WHERE user_id = ? AND contact_id = ?
    `).run(userId, contactId);
  }

  removeContact(userId, contactId) {
    if (!this.isContact(userId, contactId)) {
      return {
        success: false,
        message: '该用户不是您的联系人',
        code: 'NOT_CONTACT'
      };
    }

    const contactUser = db.prepare('SELECT id, username, cid FROM accounts WHERE id = ?').get(contactId);

    db.prepare('DELETE FROM contacts WHERE user_id = ? AND contact_id = ?').run(userId, contactId);

    if (contactUser) {
      const contactName = contactUser.username || contactUser.cid;
      messageCenterService.addContactChangeNotification(userId, 'removed', contactName);
    }

    return {
      success: true,
      message: '已删除联系人'
    };
  }

  getContactList(userId, options = {}) {
    const { isFavorite, isRecent, search } = options;

    let query = `
      SELECT 
        c.id,
        c.contact_id,
        c.is_favorite,
        c.is_recent,
        c.last_interaction_at,
        c.relation_source,
        a.cid,
        a.username,
        a.avatar,
        a.status
      FROM contacts c
      JOIN accounts a ON c.contact_id = a.id
      WHERE c.user_id = ?
    `;
    const params = [userId];

    if (isFavorite === true) {
      query += ' AND c.is_favorite = 1';
    }
    if (isRecent === true) {
      query += ' AND c.is_recent = 1';
    }
    if (search) {
      query += ' AND (a.cid LIKE ? OR a.username LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY c.is_favorite DESC, c.last_interaction_at DESC';

    const contacts = db.prepare(query).all(...params);

    const capacity = this.checkCapacity(userId);

    return {
      success: true,
      data: {
        contacts,
        capacity: {
          current: capacity.current,
          max: capacity.max,
          isFull: capacity.isFull
        }
      }
    };
  }

  getContactDetail(userId, contactId) {
    const contact = db.prepare(`
      SELECT 
        c.id,
        c.contact_id,
        c.is_favorite,
        c.is_recent,
        c.last_interaction_at,
        c.relation_source,
        a.cid,
        a.username,
        a.avatar,
        a.status,
        a.email,
        a.phone
      FROM contacts c
      JOIN accounts a ON c.contact_id = a.id
      WHERE c.user_id = ? AND c.contact_id = ?
    `).get(userId, contactId);

    if (!contact) {
      return { success: false, message: '联系人不存在' };
    }

    return { success: true, data: contact };
  }

  toggleFavorite(userId, contactId) {
    const contact = db.prepare('SELECT is_favorite FROM contacts WHERE user_id = ? AND contact_id = ?')
      .get(userId, contactId);

    if (!contact) {
      return { success: false, message: '联系人不存在' };
    }

    const newFavorite = contact.is_favorite ? 0 : 1;
    db.prepare('UPDATE contacts SET is_favorite = ? WHERE user_id = ? AND contact_id = ?')
      .run(newFavorite, userId, contactId);

    return {
      success: true,
      data: { isFavorite: !!newFavorite }
    };
  }

  checkCanCall(userId, targetId) {
    const isContact = this.isContact(userId, targetId);
    const myCapacity = this.checkCapacity(userId);
    const targetCapacity = this.checkCapacity(targetId);

    let canCall = true;
    let reason = '';
    let autoAddStrategy = null;

    if (!isContact) {
      if (myCapacity.isFull && targetCapacity.isFull) {
        canCall = false;
        reason = '您和对方的联系人都已满，无法发起通话。请先清理联系人。';
      } else if (myCapacity.isFull) {
        canCall = true;
        reason = '您的联系人已满，但仍可发起通话。通话后对方可添加您为联系人。';
        autoAddStrategy = 'target_only';
      } else if (targetCapacity.isFull) {
        canCall = true;
        reason = '对方联系人已满，您可发起通话。通话后将自动添加对方为您的联系人。';
        autoAddStrategy = 'caller_only';
      } else {
        canCall = true;
        autoAddStrategy = 'both';
      }
    }

    return {
      canCall,
      reason,
      isContact,
      autoAddStrategy,
      myCapacity: { current: myCapacity.current, max: myCapacity.max },
      targetCapacity: { current: targetCapacity.current, max: targetCapacity.max }
    };
  }

  checkCanSendMessage(userId, receiverIds) {
    const results = receiverIds.map(receiverId => {
      const isContact = this.isContact(userId, receiverId);
      const myCapacity = this.checkCapacity(userId);
      const targetCapacity = this.checkCapacity(receiverId);

      let canSend = true;
      let reason = '';
      let autoAddStrategy = null;

      if (!isContact) {
        if (myCapacity.isFull && targetCapacity.isFull) {
          canSend = false;
          reason = '您和对方的联系人都已满，无法发送留言。';
        } else if (myCapacity.isFull) {
          canSend = true;
          reason = '您的联系人已满，但仍可发送留言。';
          autoAddStrategy = 'target_only';
        } else if (targetCapacity.isFull) {
          canSend = true;
          reason = '对方联系人已满，您仍可发送留言。';
          autoAddStrategy = 'caller_only';
        } else {
          canSend = true;
          autoAddStrategy = 'both';
        }
      }

      return {
        receiverId,
        canSend,
        reason,
        isContact,
        autoAddStrategy
      };
    });

    const allCanSend = results.every(r => r.canSend);

    return {
      allCanSend,
      results,
      myCapacity: this.checkCapacity(userId)
    };
  }
}

export const contactService = new ContactService();
