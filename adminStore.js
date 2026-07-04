const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("node:fs");
const { dirname, join } = require("node:path");

const __dirname = dirname(require.main.filename); // Compatible fallback for CommonJS
const DATA_DIR = join(__dirname, "..", "data");
const STATE_FILE = join(DATA_DIR, "state.json");

const OWNER_ID = "673890dd0073692fdb33130d";
const OWNER_USERNAME = "18.16.89";

function defaultState() {
  return {
    admins: [],
    tpLocation: null,
  };
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load() {
  ensureDataDir();
  if (!existsSync(STATE_FILE)) {
    const initial = defaultState();
    writeFileSync(STATE_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const raw = readFileSync(STATE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

function save(state) {
  ensureDataDir();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

class AdminStore {
  constructor() {
    this.state = load();
  }

  isOwner(userId) {
    return userId === OWNER_ID;
  }

  isAdmin(userId) {
    return this.isOwner(userId) || this.state.admins.includes(userId);
  }

  addAdmin(userId) {
    if (this.isAdmin(userId)) return false;
    this.state.admins.push(userId);
    save(this.state);
    return true;
  }

  removeAdmin(userId) {
    if (this.isOwner(userId)) return false;
    const before = this.state.admins.length;
    this.state.admins = this.state.admins.filter((id) => id !== userId);
    const changed = this.state.admins.length !== before;
    if (changed) save(this.state);
    return changed;
  }

  listAdmins() {
    return [...this.state.admins];
  }

  setTpLocation(position) {
    this.state.tpLocation = position;
    save(this.state);
  }

  getTpLocation() {
    return this.state.tpLocation;
  }
}

const adminStore = new AdminStore();

module.exports = { adminStore, OWNER_ID, OWNER_USERNAME };
