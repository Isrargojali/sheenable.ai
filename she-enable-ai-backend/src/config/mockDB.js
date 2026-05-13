const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(process.cwd(), '.mock-db.json');

// JavaScript Map objects for each collection
const collections = {
  users: new Map(),
  candidateProfiles: new Map(),
  employerProfiles: new Map(),
  jobs: new Map(),
  applications: new Map(),
  savedJobs: new Map(),
  messageThreads: new Map(),
  messages: new Map(),
  interviews: new Map(),
  notifications: new Map(),
  auditLogs: new Map(),
};

function initMockDB() {
  // Load persisted data from .mock-db.json
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      Object.entries(data).forEach(([key, records]) => {
        if (collections[key]) {
          records.forEach((r) => collections[key].set(r._id.toString(), r));
        }
      });
      console.log('📂 MockDB loaded from .mock-db.json');
    }
  } catch (err) {
    console.error('Error loading mock database:', err.message);
  }

  // Auto-save every 30 seconds
  setInterval(persistMockDB, 30000);
}

function persistMockDB() {
  try {
    const data = {};
    Object.entries(collections).forEach(([key, map]) => {
      data[key] = Array.from(map.values());
    });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving mock database:', err.message);
  }
}

// Simple helpers to mimic Mongoose
const getModel = (collectionName) => {
  const map = collections[collectionName];
  if (!map) throw new Error(`Collection ${collectionName} not found in MockDB`);

  return {
    findById: async (id) => map.get(id?.toString()) || null,
    findOne: async (query) => {
      for (const doc of map.values()) {
        let match = true;
        for (const [k, v] of Object.entries(query)) {
          if (doc[k] !== v) {
            match = false;
            break;
          }
        }
        if (match) return doc;
      }
      return null;
    },
    find: async (query = {}) => {
      const results = [];
      for (const doc of map.values()) {
        let match = true;
        for (const [k, v] of Object.entries(query)) {
          if (doc[k] !== v) {
            match = false;
            break;
          }
        }
        if (match) results.push(doc);
      }
      return results;
    },
    create: async (data) => {
      const _id = data._id || require('crypto').randomBytes(12).toString('hex');
      const doc = { _id, ...data, createdAt: new Date(), updatedAt: new Date() };
      map.set(_id.toString(), doc);
      persistMockDB();
      return doc;
    },
    findByIdAndUpdate: async (id, update, options) => {
      let doc = map.get(id?.toString());
      if (!doc) return null;
      doc = { ...doc, ...update, updatedAt: new Date() };
      map.set(id?.toString(), doc);
      persistMockDB();
      return doc;
    },
    findByIdAndDelete: async (id) => {
      const doc = map.get(id?.toString());
      if (doc) {
        map.delete(id?.toString());
        persistMockDB();
      }
      return doc;
    },
    countDocuments: async (query = {}) => {
      let count = 0;
      for (const doc of map.values()) {
        let match = true;
        for (const [k, v] of Object.entries(query)) {
          if (doc[k] !== v) {
            match = false;
            break;
          }
        }
        if (match) count++;
      }
      return count;
    }
  };
};

module.exports = { collections, initMockDB, persistMockDB, getModel };
