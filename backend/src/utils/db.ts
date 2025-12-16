import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/sistema_gestion';
  await mongoose.connect(uri, {
    // options can be added if needed
  } as mongoose.ConnectOptions);
  console.log('MongoDB connected');
}

export default mongoose;
