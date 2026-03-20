const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

const sequelize = require('./config/db');
const User = require('./models/User');
const Admin = require('./models/Admin');
const DistrictManager = require('./models/DistrictManager');
const Supervisor = require('./models/Supervisor');
const Operator = require('./models/Operator');
const MPCSofficer = require('./models/MPCSofficer');
const Farmer = require('./models/Farmer');
const MilkProcurement = require('./models/MilkProcurement');
const FarmerMilkLog = require('./models/FarmerMilkLog');
const DairyInfrastructure = require('./models/DairyInfrastructure');
const WorkAssignment = require('./models/WorkAssignment');
const OperatorLog = require('./models/OperatorLog');
const Batch = require('./models/Batch');
const TransportManager = require('./models/TransportManager');
const Driver = require('./models/Driver');
const MotorVehicle = require('./models/MotorVehicle');
const Trip = require('./models/Trip');
const Machine = require('./models/Machine');
const ChillerTank = require('./models/ChillerTank');
const DeliveryRequest = require('./models/DeliveryRequest');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const hierarchyRoutes = require('./routes/hierarchyRoutes');
const mpcsOfficerRoutes = require('./routes/mpcsOfficerRoutes');
const supervisorRoutes = require('./routes/supervisorRoutes');
const operatorRoutes = require('./routes/operatorRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const transportManagerRoutes = require('./routes/transportManagerRoutes');
const driverRoutes = require('./routes/driverRoutes');

dotenv.config();

const path = require('path');
const fs = require('fs');

const app = express();

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hierarchy', hierarchyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mpcs-officer', mpcsOfficerRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/tm', transportManagerRoutes);
app.use('/api/driver', driverRoutes);

/**
 * 🔐 Auto-create Super Admin
 * Equivalent to Spring Boot CommandLineRunner
 */
const createSuperAdmin = async () => {
  try {
    const exists = await User.findOne({
      where: { role: 'SUPER_ADMIN' },
    });

    if (!exists) {
      const hash = await bcrypt.hash('admin123', 10);

      await User.create({
        fullName: 'System Super Admin',
        email: 'superadmin@dairyportal.com',
        passwordHash: hash,
        role: 'SUPER_ADMIN',
        status: 'APPROVED',
      });

      console.log('✅ Super admin created successfully');
    } else {
      console.log('ℹ️ Super admin already exists');
    }
  } catch (err) {
    console.error('❌ Error creating super admin:', err);
  }
};

(async () => {
  try {
    // 1️⃣ Connect DB
    await sequelize.authenticate();
    console.log('✅ MySQL connected');

    // 2️⃣ Hibernate-style schema update (auto-add missing columns without dropping data)
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Tables synced (with alter)');

    // 3️⃣ Ensure Super Admin
    await createSuperAdmin();

    // 4️⃣ Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  } catch (error) {
    console.error('❌ Server startup error:', error);
  }
})();
