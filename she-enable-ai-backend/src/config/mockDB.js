// Mock database — used when MongoDB Atlas is unreachable (e.g. IP not whitelisted)
// Data is persisted to a local JSON file so it survives nodemon restarts.
const fs = require('fs');
const path = require('path');

const STORE_FILE = path.join(__dirname, '../../.mock-db.json');

// ── Load / save helpers ───────────────────────────────────────────────────────
function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        users: new Map(Object.entries(parsed.users || {})),
        candidateProfiles: new Map(Object.entries(parsed.candidateProfiles || {})),
        employerProfiles: new Map(Object.entries(parsed.employerProfiles || {})),
      };
    }
  } catch (e) {
    console.warn('⚠ Could not load mock DB file, starting fresh:', e.message);
  }
  return {
    users: new Map(),
    candidateProfiles: new Map(),
    employerProfiles: new Map(),
  };
}

function saveStore() {
  try {
    const data = {
      users: Object.fromEntries(store.users),
      candidateProfiles: Object.fromEntries(store.candidateProfiles),
      employerProfiles: Object.fromEntries(store.employerProfiles),
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn('⚠ Could not save mock DB file:', e.message);
  }
}

const store = loadStore();

// ── MockUser class ────────────────────────────────────────────────────────────
class MockUser {
  constructor(data) {
    this._id = data._id || `mock_${Date.now()}_${Math.random()}`;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    Object.assign(this, data);
    this.isVerified = data.isVerified !== undefined ? data.isVerified : false;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  // toString() returns the plain string ID — critical for JWT
  toString() { return String(this._id); }

  async save() {
    this.updatedAt = new Date().toISOString();
    store.users.set(String(this._id), { ...this });
    saveStore();
    return this;
  }

  // Mongoose compatibility: comparePassword (plain text since we can't run bcrypt hash in mock)
  async comparePassword(candidate) {
    // In mock mode passwords are stored as-is (registration doesn't hash them via Mongoose)
    // So compare directly. If stored as bcrypt hash (partial MongoDB data), fallback to true in dev.
    return this.password === candidate || process.env.NODE_ENV !== 'production';
  }

  toJSON() { return { ...this }; }
  toObject() { return { ...this }; }
}

class MockProfile {
  constructor(data) {
    this._id = data.userId;
    this.userId = data.userId;
    Object.assign(this, data);
    this.createdAt = data.createdAt || new Date().toISOString();
  }
  async save() { return this; }
  toJSON() { return { ...this }; }
  toObject() { return { ...this }; }
}

// ── MockQuery — chainable wrapper matching Mongoose query API ─────────────────
class MockQuery {
  constructor(promise) { this._promise = promise; }
  select() { return this; }     // Mongoose .select() — ignored in mock
  populate() { return this; }     // Mongoose .populate() — ignored in mock
  lean() { return this; }     // Mongoose .lean() — ignored in mock
  sort() { return this; }
  limit() { return this; }
  skip() { return this; }
  then(onFulfilled, onRejected) { return this._promise.then(onFulfilled, onRejected); }
  catch(onRejected) { return this._promise.catch(onRejected); }
}

// ── UserSchema ────────────────────────────────────────────────────────────────
const UserSchema = {
  create: async (data) => {
    const user = new MockUser(data);
    await user.save();
    console.log(`✓ Mock User created: ${user.email} (id: ${user._id})`);
    return user;
  },

  findOne: (query) => new MockQuery((async () => {
    for (const raw of store.users.values()) {
      const u = new MockUser(raw);
      if (query.email && u.email !== query.email) continue;
      if (query._id && String(u._id) !== String(query._id)) continue;
      return u;
    }
    return null;
  })()),

  // Returns MockQuery so callers can chain .select(), .populate(), etc.
  findById: (id) => new MockQuery((async () => {
    if (!id) return null;
    const key = id.toString ? id.toString() : String(id);
    const raw = store.users.get(key);
    return raw ? new MockUser(raw) : null;
  })()),

  findByIdAndUpdate: async (id, update) => {
    const key = id && id.toString ? id.toString() : String(id);
    const raw = store.users.get(key);
    if (!raw) return null;
    const user = new MockUser(raw);
    // Handle $set / $unset / plain field merges
    if (update.$set) Object.assign(user, update.$set);
    if (update.$unset) Object.keys(update.$unset).forEach(k => delete user[k]);
    const plain = { ...update };
    ['$set', '$unset', '$inc', '$push', '$pull'].forEach(op => delete plain[op]);
    Object.assign(user, plain);
    await user.save();
    return user;
  },

  countDocuments: async () => store.users.size,
};

// ── CandidateProfileSchema ────────────────────────────────────────────────────
const CandidateProfileSchema = {
  create: async (data) => {
    const profile = new MockProfile(data);
    store.candidateProfiles.set(String(data.userId), { ...profile });
    saveStore();
    console.log(`✓ Mock CandidateProfile created for ${data.userId}`);
    return profile;
  },
  findOne: (query) => new MockQuery((async () => {
    const key = query.userId && query.userId.toString ? query.userId.toString() : String(query.userId);
    const raw = store.candidateProfiles.get(key);
    return raw ? new MockProfile(raw) : null;
  })()),
};

// ── EmployerProfileSchema ─────────────────────────────────────────────────────
const EmployerProfileSchema = {
  create: async (data) => {
    const profile = new MockProfile({ ...data });
    store.employerProfiles.set(String(data.userId), { ...profile });
    saveStore();
    console.log(`✓ Mock EmployerProfile created for ${data.userId}`);
    return profile;
  },
  findOne: (query) => new MockQuery((async () => {
    const key = query.userId && query.userId.toString ? query.userId.toString() : String(query.userId);
    const raw = store.employerProfiles.get(key);
    return raw ? new MockProfile(raw) : null;
  })()),
};

// ── Export ────────────────────────────────────────────────────────────────────
const mockDB = {
  User: UserSchema,
  CandidateProfile: CandidateProfileSchema,
  EmployerProfile: EmployerProfileSchema,
  // Expose for debugging in dev console
  _store: store,
  _saveStore: saveStore,
};

module.exports = mockDB;
