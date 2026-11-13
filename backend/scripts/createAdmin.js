
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const User = require("../models/User");

const createAdmin = async () => {
  try {
    await connectDB();

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password || password.length < 12) {
      throw new Error(
        "Set ADMIN_EMAIL and a strong ADMIN_PASSWORD (at least 12 characters)"
      );
    }

    const existingAdmin = await User.findOne({
      email: email.toLowerCase()
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name: "Vendora Admin",
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
      isApproved: true,
      isActive: true
    });

    console.log("Admin account created successfully!");

  } catch (error) {
    console.error("Admin Creation Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
