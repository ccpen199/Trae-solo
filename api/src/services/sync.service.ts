import { taskRepository } from '../repositories/task.repository';
import { db } from '../database/connection';
import type { PickupTask } from '../../../shared/types';

interface SyncOperation {
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: string;
}

export const syncService = {
  getUnsyncedTasks(courierId?: string) {
    return taskRepository.findUnsynced(courierId);
  },

  syncTasks(operations: SyncOperation[]): { success: number; failed: number; errors: string[] } {
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    const transaction = db.transaction(() => {
      for (const op of operations) {
        try {
          if (op.entity === 'task') {
            if (op.type === 'update') {
              taskRepository.update(op.data.id, { ...op.data, synced: true });
            }
            success++;
          }
        } catch (error: any) {
          failed++;
          errors.push(`Failed to sync ${op.type} ${op.entity} ${op.data?.id}: ${error.message}`);
        }
      }
    });

    try {
      transaction();
    } catch (error: any) {
      errors.push(`Transaction failed: ${error.message}`);
    }

    return { success, failed, errors };
  },

  bulkSyncTasks(tasks: Partial<PickupTask>[]): { success: number; failed: number; errors: string[] } {
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (const task of tasks) {
      try {
        if (!task.id) {
          throw new Error('Task ID is required');
        }
        taskRepository.update(task.id, { ...task, synced: true });
        success++;
      } catch (error: any) {
        failed++;
        errors.push(`Failed to sync task ${task.id}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  },

  markAsSynced(taskIds: string[]) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const stmt = db.prepare('UPDATE pickup_tasks SET synced = 1, updated_at = ? WHERE id = ?');
    
    const transaction = db.transaction((ids: string[]) => {
      for (const id of ids) {
        stmt.run(now, id);
      }
    });

    transaction(taskIds);
    return taskIds.length;
  },
};

