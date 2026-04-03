import AdminActivity from '@/lib/db/models/AdminActivity'
import { connectDB } from '@/lib/db/connect'

type ActionType = 
  | 'LISTING_AI_FLAGGED' 
  | 'LISTING_AI_UNAVAILABLE_FLAGGED'
  | 'LISTING_APPROVED'
  | 'LISTING_REJECTED'
  | 'USER_BANNED'
  | 'USER_UNBANNED'
  | 'CATEGORY_CREATED'
  | 'CATEGORY_DELETED'
  | 'CATEGORY_REASSIGNED'
  | 'REPORT_DISMISSED'
  | 'REPORT_REVIEWED'
  | 'CONTACT_RESOLVED'
  | 'MAINTENANCE_TOGGLED'
  | 'NEW_LISTINGS_TOGGLED'
  | 'CONFIG_UPDATED'
  | 'USER_CASCADE_DELETE'
  | 'LISTING_SOLD'
  | 'LISTING_DELETED';

/**
 * Standardised audit logging for AdminActivity.
 */
export async function logAction(
  action: ActionType,
  data: {
    actor?: any;
    actorType?: 'admin' | 'user' | 'system' | 'deleted_user';
    target?: any;
    targetModel?: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    await connectDB()
    await AdminActivity.create({
      actor: data.actor,
      actorType: data.actorType || 'admin',
      target: data.target,
      targetModel: data.targetModel || 'System',
      action,
      metadata: data.metadata || {},
    })
  } catch (error) {
    console.error('[Logging Fault]', error)
  }
}
