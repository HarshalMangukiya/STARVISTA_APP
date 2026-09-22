import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export class AuditService {
  async log(data: {
    actorId?: string;
    action: string;
    entity: string;
    entityId: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actor_id: data.actorId || null,
          action: data.action,
          entity: data.entity,
          entity_id: data.entityId,
          metadata: data.metadata || {},
          ip_address: data.ipAddress || null,
        },
      });
    } catch (error: any) {
      // Audit logging should not break the request flow
      logger.error(`Audit log creation failed: ${error?.message || error}`);
    }
  }
}

export const auditService = new AuditService();
