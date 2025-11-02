/**
 * Database cleanup utilities
 * Functions for maintaining database performance and data retention policies
 */

import { db } from '../index';
import { diagnosisHistory } from '../schema/diagnosis';
import { eq, lt, and } from 'drizzle-orm';

/**
 * Clean up expired diagnosis history records (older than 30 days)
 * This should be run daily to maintain database performance
 */
export async function cleanupExpiredDiagnosisHistory() {
  try {
    console.log('🧹 Starting cleanup of expired diagnosis history records...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db
      .delete(diagnosisHistory)
      .where(
        and(
          lt(diagnosisHistory.expiresAt, new Date()),
          eq(diagnosisHistory.status, 'completed')
        )
      );

    console.log(`✅ Cleaned up ${result.rowCount} expired diagnosis records`);
    return result.rowCount;
  } catch (error) {
    console.error('❌ Error cleaning up expired diagnosis history:', error);
    throw error;
  }
}

/**
 * Get statistics about database size and cleanup opportunities
 */
export async function getDatabaseCleanupStats() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalRecords = await db.select().from(diagnosisHistory);
    const expiredRecords = await db
      .select()
      .from(diagnosisHistory)
      .where(
        and(
          lt(diagnosisHistory.expiresAt, new Date()),
          eq(diagnosisHistory.status, 'completed')
        )
      );

    const upcomingExpirations = await db
      .select()
      .from(diagnosisHistory)
      .where(
        and(
          lt(diagnosisHistory.expiresAt, thirtyDaysAgo),
          eq(diagnosisHistory.status, 'completed')
        )
      );

    return {
      totalRecords: totalRecords.length,
      expiredRecords: expiredRecords.length,
      upcomingExpirations: upcomingExpirations.length,
      nextCleanupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  } catch (error) {
    console.error('❌ Error getting cleanup stats:', error);
    throw error;
  }
}

/**
 * Archive old diagnosis records (move to archive table instead of deleting)
 * This can be implemented later if long-term data retention is needed
 */
export async function archiveOldDiagnosisHistory() {
  console.log('📦 Archive functionality not implemented yet');
  console.log('💡 Consider implementing an archive table for long-term data storage');
  return 0;
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanupExpiredDiagnosisHistory()
    .then((rowCount) => {
      console.log(`🎉 Cleanup completed. Removed ${rowCount} expired records.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    });
}