const User = require("../models/User");
const bcrypt = require("bcryptjs");

async function createAdmin() {
  const adminEmail = "admin@apexplay.com";

  const exists = await User.findOne({ email: adminEmail });
  if (exists) {
    console.log("Admin already exists.");
    return;
  }

  const hashed = await bcrypt.hash("#@rp!C", 10);

  await User.create({
    name: "Admin",
    email: adminEmail,
    password: hashed,
    role: "ADMIN",
  });

  console.log("Admin account created successfully!");
}

module.exports = createAdmin;