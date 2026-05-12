// Database abstraction layer with fallback to mock
const mongoose = require('mongoose');
const mockDB = require('./mockDB');

let isMongoConnected = false;

// Track MongoDB connection status
mongoose.connection.on('connected', () => {
  isMongoConnected = true;
  console.log('✓ Using MongoDB');
});

mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
  console.log('⚠ MongoDB disconnected, falling back to mock data');
});

mongoose.connection.on('error', () => {
  isMongoConnected = false;
});

const getDatabase = () => {
  if (isMongoConnected) {
    return {
      User: require('../models/User'),
      CandidateProfile: require('../models/CandidateProfile'),
      EmployerProfile: require('../models/EmployerProfile'),
    };
  }
  return mockDB;
};

module.exports = {
  getDatabase,
  isMongoConnected: () => isMongoConnected,
};

