import express, { Application } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import colors from 'colors';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
import auth from './routes/authRoutes';

import { createServer } from 'http';
import { initSocket } from './socket';

const app: Application = express();
const httpServer = createServer(app);

// Mount Socket.io
export const io = initSocket(httpServer);

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Set security headers
app.use(helmet());

// Enable CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Mount routers
app.use('/api/auth', auth);
import aiRoutes from './routes/aiRoutes';
import requestRoutes from './routes/requestRoutes';
import adminRoutes from './routes/adminRoutes';
import hospitalRoutes from './routes/hospitalRoutes';
import hospitalCatalogRoutes from './routes/hospitalCatalogRoutes';
import messageRoutes from './routes/messageRoutes';
import matchRoutes from './routes/matchRoutes';

import notificationRoutes from './routes/notificationRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import connectionRoutes from './routes/connectionRoutes';

app.use('/api/ai', aiRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/hospitals', hospitalCatalogRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/connections', connectionRoutes);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    // server.close(() => process.exit(1));
});
