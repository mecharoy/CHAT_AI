import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.join(__dirname, '../data/users.json');

// Initialize users file if it doesn't exist
async function initializeUsersFile() {
  try {
    await fs.access(usersFilePath);
  } catch {
    // File doesn't exist, create it
    const dataDir = path.join(__dirname, '../data');
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }
    await fs.writeFile(usersFilePath, JSON.stringify([], null, 2));
  }
}

// Get all users
export async function getAllUsers() {
  await initializeUsersFile();
  const data = await fs.readFile(usersFilePath, 'utf8');
  return JSON.parse(data);
}

// Find user by email
export async function findUserByEmail(email) {
  const users = await getAllUsers();
  return users.find(user => user.email === email);
}

// Find user by ID
export async function findUserById(id) {
  const users = await getAllUsers();
  return users.find(user => user.id === id);
}

// Create new user
export async function createUser(userData) {
  const users = await getAllUsers();
  const newUser = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    ...userData,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
  return newUser;
}

// Update user
export async function updateUser(id, updates) {
  const users = await getAllUsers();
  const index = users.findIndex(user => user.id === id);
  if (index === -1) return null;

  users[index] = { ...users[index], ...updates };
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
  return users[index];
}
