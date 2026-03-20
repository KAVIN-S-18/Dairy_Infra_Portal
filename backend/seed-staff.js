const Supervisor = require('./models/Supervisor');
const Operator = require('./models/Operator');
const DistrictManager = require('./models/DistrictManager');
const bcrypt = require('bcrypt');

async function run() {
  try {
    const dm = await DistrictManager.findOne() || { id: 1, adminId: 1, adminNumber: 'A1', dmId: 'A1-DM1' };
    const passwordHash = await bcrypt.hash('password', 10);
    
    const supData = [
      { 
        supId: 'S-COL-1', 
        fullName: 'Kumarsamy (Collection)', 
        email: 'coll1@dairy.com', 
        passwordHash, 
        specialization: 'COLLECTION', 
        dmId: dm.id, 
        dmNumber: dm.dmId,
        adminId: dm.adminId,
        adminNumber: dm.adminNumber,
        status: 'ACTIVE' 
      },
      { 
        supId: 'S-PRO-1', 
        fullName: 'Ravichandran (Production)', 
        email: 'prod1@dairy.com', 
        passwordHash, 
        specialization: 'PRODUCTION', 
        dmId: dm.id, 
        dmNumber: dm.dmId,
        adminId: dm.adminId,
        adminNumber: dm.adminNumber,
        status: 'ACTIVE' 
      },
      { 
        supId: 'S-PRO-2', 
        fullName: 'Arumugam (Production)', 
        email: 'prod2@dairy.com', 
        passwordHash, 
        specialization: 'PRODUCTION', 
        dmId: dm.id, 
        dmNumber: dm.dmId,
        adminId: dm.adminId,
        adminNumber: dm.adminNumber,
        status: 'ACTIVE' 
      }
    ];

    for (const s of supData) {
      const [sup] = await Supervisor.upsert(s);
      
      const opData = [
        { 
          opId: `OP-${sup.supId}-1`, 
          fullName: `Operator 1 for ${sup.fullName}`, 
          email: `op-${sup.supId}-1@test.com`,
          passwordHash,
          supervisorId: sup.id, 
          dmId: dm.id,
          dmNumber: dm.dmId,
          adminId: dm.adminId,
          adminNumber: dm.adminNumber,
          status: 'ACTIVE' 
        },
        { 
          opId: `OP-${sup.supId}-2`, 
          fullName: `Operator 2 for ${sup.fullName}`, 
          email: `op-${sup.supId}-2@test.com`,
          passwordHash,
          supervisorId: sup.id, 
          dmId: dm.id,
          dmNumber: dm.dmId,
          adminId: dm.adminId,
          adminNumber: dm.adminNumber,
          status: 'ACTIVE' 
        }
      ];

      for (const o of opData) {
        await Operator.upsert(o);
      }
    }
    console.log('Sample Staff Populated with hashed passwords');
  } catch (err) {
    console.error(err);
  }
  process.exit();
}
run();
