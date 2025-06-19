import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import { Notification } from "../models/Notification.js";
import { closePool } from "../config/database.js";

const seedData = async () => {
  console.log("🌱 Seeding database with sample data...");

  try {
    // Create admin user
    const admin = await User.create({
      name: "Admin User",
      email: "admin@amc-portal.com",
      password: "admin123",
      role: "admin",
      post: "System Administrator",
      department: "IT Department",
    });

    console.log("✅ Created admin user:", admin.email);

    // Create regular user
    const user = await User.create({
      name: "John Doe",
      email: "user@amc-portal.com",
      password: "user123",
      role: "user",
      post: "Maintenance Technician",
      department: "Operations",
    });

    console.log("✅ Created regular user:", user.email);

    // Create sample tasks
    const task1 = await Task.create({
      title: "Daily Equipment Inspection",
      description:
        "Inspect all critical equipment for any signs of wear or damage",
      category: "daily",
      priority: "high",
      assignedTo: user.id,
      assignedBy: admin.id,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due tomorrow
      estimatedTime: 60, // 60 minutes
    });

    const task2 = await Task.create({
      title: "Weekly Safety Check",
      description: "Conduct comprehensive safety inspection of the facility",
      category: "weekly",
      priority: "medium",
      assignedTo: user.id,
      assignedBy: admin.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due next week
      estimatedTime: 120, // 120 minutes
    });

    const task3 = await Task.create({
      title: "Monthly Preventive Maintenance",
      description: "Perform scheduled preventive maintenance on all machinery",
      category: "monthly",
      priority: "high",
      assignedTo: user.id,
      assignedBy: admin.id,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due next month
      estimatedTime: 240, // 240 minutes
    });

    console.log("✅ Created sample tasks");

    // Create sample notifications
    await Notification.create({
      title: "Welcome to AMC Portal",
      message:
        "Welcome to the Asset Management & Maintenance Portal. Start by reviewing your assigned tasks.",
      type: "system-alert",
      priority: "medium",
      userId: user.id,
    });

    await Notification.create({
      title: "New Task Assigned",
      message: `You have been assigned a new task: ${task1.title}`,
      type: "task-assigned",
      priority: "high",
      userId: user.id,
      metadata: {
        taskId: task1.id,
        taskTitle: task1.title,
      },
    });

    console.log("✅ Created sample notifications");

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📋 Test Accounts Created:");
    console.log("┌─────────────────────────────────────────────┐");
    console.log("│ ADMIN ACCOUNT                               │");
    console.log("├─────────────────────────────────────────────┤");
    console.log("│ Email:    admin@amc-portal.com              │");
    console.log("│ Password: admin123                          │");
    console.log("│ Role:     admin                             │");
    console.log("├─────────────────────────────────────────────┤");
    console.log("│ USER ACCOUNT                                │");
    console.log("├─────────────────────────────────────────────┤");
    console.log("│ Email:    user@amc-portal.com               │");
    console.log("│ Password: user123                           │");
    console.log("│ Role:     user                              │");
    console.log("└─────────────────────────────────────────────┘");
    console.log("\n📊 Sample data includes:");
    console.log("- 3 sample tasks (daily, weekly, monthly)");
    console.log("- 2 sample notifications");
    console.log("- Pre-configured user roles and permissions");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await closePool();
  }
};

seedData();
