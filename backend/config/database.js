import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-chatbot';

    const conn = await mongoose.connect(mongoURI, {
      // Mongoose 6+ doesn't need these options anymore, but keeping for compatibility
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Don't exit process, just log the error
    // If MongoDB is not available, the app will fall back to JSON storage
    console.log('Falling back to JSON file storage for users');
    return null;
  }
};

export default connectDB;
