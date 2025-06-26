import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

export async function backupDatabase() {
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      users: await prisma.user.findMany(),
      products: await prisma.productInventory.findMany(),
      rawMaterials: await prisma.rawMaterial.findMany(),
      billOfMaterials: await prisma.billOfMaterial.findMany(),
      productionRequests: await prisma.productionRequest.findMany({
        include: { materials: true }
      })
    };

    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filename = `backup-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(backupDir, filename),
      JSON.stringify(backup, null, 2)
    );

    // Keep only last 5 backups
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-'))
      .sort()
      .reverse();
    
    files.slice(5).forEach(f => {
      fs.unlinkSync(path.join(backupDir, f));
    });

    console.log(`✅ Database backed up to ${filename}`);
    return filename;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

// Schedule automatic backups
export function scheduleBackups() {
  // Backup every 6 hours
  setInterval(() => {
    backupDatabase().catch(console.error);
  }, 6 * 60 * 60 * 1000);
  
  // Initial backup on startup
  backupDatabase().catch(console.error);
}