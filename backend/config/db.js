require("dotenv").config();
const dns = require("dns");
const mongoose = require("mongoose");

/**
 * Configure DNS servers for Node.js c-ares library.
 * On Windows, c-ares often defaults to ['127.0.0.1'] when DHCP does not populate
 * IPv4 DNS servers (common on mobile hotspots and certain Wi-Fi adapters).
 * This causes querySrv ECONNREFUSED when resolving mongodb+srv:// records.
 */
const configureDns = () => {
  try {
    // 1. Check if user specified custom DNS servers in environment
    if (process.env.DNS_SERVERS) {
      const servers = process.env.DNS_SERVERS.split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (servers.length > 0) {
        dns.setServers(servers);
        console.log(`[DNS] Configured custom DNS resolvers: ${servers.join(", ")}`);
        return;
      }
    }

    // 2. Inspect active DNS servers in Node.js
    const currentServers = dns.getServers();
    const isLoopbackOnly =
      !currentServers ||
      currentServers.length === 0 ||
      currentServers.every((s) => s === "127.0.0.1" || s === "::1");

    // 3. If only loopback is detected, configure reliable public DNS servers
    if (isLoopbackOnly) {
      const fallbackServers = ["8.8.8.8", "1.1.1.1", "8.8.4.4"];
      dns.setServers(fallbackServers);
      console.log(
        `[DNS] Loopback resolver detected (${currentServers.join(", ")}). Configured public DNS: ${fallbackServers.join(", ")}`
      );
    }
  } catch (err) {
    console.warn(`[DNS] Warning: Could not adjust DNS servers: ${err.message}`);
  }
};

/**
 * Connect to MongoDB with timeout safeguards, connection pooling, and live ping validation.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MongoDB Connection Error: MONGO_URI is not defined in environment variables.");
    process.exit(1);
  }

  // Pre-configure DNS if using an SRV connection string
  if (uri.startsWith("mongodb+srv://")) {
    configureDns();
  }

  const connectionOptions = {
    serverSelectionTimeoutMS: 10000, // 10-second timeout for server selection
    connectTimeoutMS: 10000,         // 10-second timeout for initial connection
    socketTimeoutMS: 45000,          // 45-second socket timeout
    family: 4                        // Force IPv4 to avoid broken IPv6 routes on Windows
  };

  try {
    console.log("Connecting to MongoDB Atlas...");
    const conn = await mongoose.connect(uri, connectionOptions);

    // Verify connection with real MongoDB admin ping command
    const pingResult = await conn.connection.db.admin().ping();
    if (!pingResult || pingResult.ok !== 1) {
      throw new Error(`MongoDB ping verification failed: ${JSON.stringify(pingResult)}`);
    }

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`MongoDB Ping Status: { ok: ${pingResult.ok} } (Cluster Verified)`);

    return conn;
  } catch (error) {
    console.error("\n==================================================");
    console.error("  MongoDB Connection Failure Diagnostics          ");
    console.error("==================================================");
    console.error(`Error Name:    ${error.name}`);
    console.error(`Error Message: ${error.message}`);
    if (error.code) console.error(`Error Code:    ${error.code}`);

    if (error.message.includes("querySrv ECONNREFUSED")) {
      console.error("\n[ROOT CAUSE: Node.js DNS Resolution Failure]");
      console.error("- The Node.js c-ares resolver attempted to query DNS on 127.0.0.1:53 and was refused.");
      console.error("- Solution A: Add DNS_SERVERS=8.8.8.8,1.1.1.1 to your backend/.env file.");
      console.error("- Solution B: Set Windows Wi-Fi adapter IPv4 DNS to 8.8.8.8 / 1.1.1.1.");
      console.error("- Solution C: Use standard seed-list mongodb:// connection string instead of mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/vendora?retryWrites=true&w=majority");
    } else if (
      error.message.includes("bad auth") ||
      error.message.includes("Authentication failed")
    ) {
      console.error("\n[ROOT CAUSE: Database Authentication Failure]");
      console.error("- The credentials (username/password) in MONGO_URI were rejected by Atlas.");
      console.error("- Verify user credentials in MongoDB Atlas > Database Access.");
    } else if (
      error.message.includes("Could not connect to any servers") ||
      error.message.includes("Server selection timed out")
    ) {
      console.error("\n[ROOT CAUSE: Network Timeout / IP Whitelist]");
      console.error("- Atlas cluster nodes did not respond within the 10000ms timeout window.");
      console.error("- Ensure your current public IP address is whitelisted in MongoDB Atlas > Network Access (or 0.0.0.0/0).");
    }
    console.error("==================================================\n");

    process.exit(1);
  }
};

module.exports = connectDB;
