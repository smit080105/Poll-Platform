import { prisma } from '../database.js';
import { logger } from './logger.js';

export const recordAuditLog = async (req, entry) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        metadata: entry.metadata ?? undefined,
        ipAddress: req.ip || null,
        userAgent: req.get?.('user-agent') || null
      }
    });
  } catch (error) {
    logger.error({ err: error, action: entry.action, targetId: entry.targetId }, 'Audit log write failed');
  }
};
