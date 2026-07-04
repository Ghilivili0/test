const Highrise = require('highrise');

// Import persistent admin store from Project B (adapted for compatibility)
const { adminStore, OWNER_ID: PERSISTENT_OWNER_ID, OWNER_USERNAME } = require('./adminStore'); // We'll create this file below

// Initialize the bot
const bot = new Highrise.Bot();

// Use persistent OWNER_ID from Project B (more reliable)
const OWNER_ID = PERSISTENT_OWNER_ID || '18.16.89';

// Configuration - DANCES kept exactly as in Project A
const DANCES = {
  '0': 'idle',
  '1': 'dance_0',
  '2': 'dance_1',
  '3': 'dance_2',
  '4': 'dance_3',
  '5': 'dance_4',
  '6': 'dance_5',
  '7': 'dance_6',
  '8': 'dance_7',
  'wave': 'wave',
  'clap': 'clap',
  'kiss': 'kiss',
  'laugh': 'laugh',
  'jump': 'jump',
};

// Greeted users (kept unchanged)
const greetedUsers = new Set();

// Teleport location - will be synced with persistent store
let teleportLocation = { x: 0, y: 0, z: 0 };

// ==================== UTILITY FUNCTIONS (mostly unchanged) ====================

function isAdmin(userId) {
  return adminStore.isAdmin(userId); // Now uses persistent store from B
}

function getDanceAnimation(danceInput) {
  const input = danceInput.toLowerCase().trim();
  return DANCES[input] || null;
}

async function sendMessage(message) {
  try {
    await bot.send_message(message);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function danceBot(animation) {
  try {
    await bot.emote(animation);
  } catch (error) {
    console.error('Error executing dance:', error);
  }
}

async function teleportBot(x, y, z) {
  try {
    await bot.teleport(x, y, z);
  } catch (error) {
    console.error('Error teleporting bot:', error);
  }
}

function promoteToAdmin(userId) {
  return adminStore.addAdmin(userId);
}

function demoteAdmin(userId) {
  return adminStore.removeAdmin(userId);
}

// New helper for improved dance commands
function getAvailableDances() {
  return Object.keys(DANCES).join(', ');
}

// ==================== EVENT HANDLERS (kept structure) ====================

bot.on('user_joined', async (user) => {
  if (!greetedUsers.has(user.id)) {
    greetedUsers.add(user.id);
    const greeting = `سلام ${user.username}،خیلی خوش اومدی به روم ما!`;
    await sendMessage(greeting);
  }
});

bot.on('user_left', (user) => {
  greetedUsers.delete(user.id);
});

bot.on('chat_message', async (message) => {
  const userId = message.user.id;
  const userName = message.user.username;
  const content = message.content.trim();

  console.log(`[${userName}] ${content}`);

  // Dance number command (0-8) - unchanged, available to everyone
  if (/^\d$/.test(content) && content >= '0' && content <= '8') {
    const danceAnimation = getDanceAnimation(content);
    if (danceAnimation) {
      await danceBot(danceAnimation);
    }
    return;
  }

  const parts = content.split(' ');
  const command = parts[0].toLowerCase();

  // ==================== ADMIN-ONLY COMMANDS ====================
  if (isAdmin(userId)) {

    // === Improved Dance Commands (from Project B influence) ===
    if (command === 'dancebot' && parts.length > 1) {
      const danceInput = parts.slice(1).join(' ');
      const danceAnimation = getDanceAnimation(danceInput);

      if (danceAnimation) {
        await danceBot(danceAnimation);
        await sendMessage(`✨ Bot is now performing: ${danceInput}`);
      } else {
        await sendMessage(`❌ Unknown dance: ${danceInput}. Available: ${getAvailableDances()}`);
      }
      return;
    }

    // Teleport command - unchanged
    if (command === '!tp') {
      const loc = adminStore.getTpLocation() || teleportLocation;
      await teleportBot(loc.x, loc.y, loc.z);
      await sendMessage(`🌍 Bot teleported to [${loc.x}, ${loc.y}, ${loc.z}]`);
      return;
    }

    // botadmin (owner only) - unchanged logic
    if (command === 'botadmin' && parts.length > 1 && userId === OWNER_ID) {
      const targetUserId = parts[1];
      if (promoteToAdmin(targetUserId)) {
        await sendMessage(`✅ User ${targetUserId} has been promoted to admin!`);
      } else {
        await sendMessage(`⚠️ User is already admin or invalid.`);
      }
      return;
    }

    // removeadmin (owner only) - unchanged
    if (command === 'removeadmin' && parts.length > 1 && userId === OWNER_ID) {
      const targetUserId = parts[1];
      if (demoteAdmin(targetUserId)) {
        await sendMessage(`✅ User ${targetUserId} has been demoted from admin.`);
      } else {
        await sendMessage(`❌ Cannot demote the owner!`);
      }
      return;
    }

    // setteleport (owner only) - now persists via B's store
    if (command === 'setteleport' && parts.length > 3 && userId === OWNER_ID) {
      const x = parseFloat(parts[1]);
      const y = parseFloat(parts[2]);
      const z = parseFloat(parts[3]);

      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        await sendMessage(`❌ Invalid coordinates. Usage: setteleport {x} {y} {z}`);
        return;
      }

      const newLoc = { x, y, z };
      teleportLocation = newLoc;
      adminStore.setTpLocation(newLoc);

      await sendMessage(`📍 Teleport location set to [${x}, ${y}, ${z}]`);
      return;
    }

    // === Admin List Command (from Project B) ===
    if (command === 'listadmins') {
      const adminList = [OWNER_ID, ...adminStore.listAdmins()].join(', ');
      await sendMessage(`👥 Current admins: ${adminList}`);
      return;
    }

    // === Help Command (improved from Project B influence) ===
    if (command === 'help') {
      const helpMessage = `📋 Bot Commands:

🎉 Everyone:
• Type 0-8 for quick dances

👑 Admins & Owner:
• dancebot {number/name} - Bot performs a dance (improved)
• !tp - Teleport bot to saved location
• listadmins - Show all admins
• help - Show this message

🔐 Owner Only:
• botadmin {user_id} - Promote user to admin
• removeadmin {user_id} - Remove admin status
• setteleport {x} {y} {z} - Set teleport location`;

      await sendMessage(helpMessage);
      return;
    }
  }
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

async function startBot() {
  try {
    console.log('🤖 Highrise Bot Starting...');
    console.log(`👑 Owner ID: ${OWNER_ID}`);
    console.log(`📊 Current Admins: ${[OWNER_ID, ...adminStore.listAdmins()].join(', ')}`);

    await bot.connect();
    console.log('✅ Bot connected successfully!');
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

startBot();

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down bot...');
  await bot.disconnect();
  process.exit(0);
});

module.exports = { bot, isAdmin, getDanceAnimation };
