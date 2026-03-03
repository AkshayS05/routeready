// prisma/seed.ts
import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const db = new PrismaClient()

async function main() {
  console.log("Seeding RouteReady database...")

  // Wipe existing seed data so re-running is safe
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.routeStop.deleteMany()
  await db.route.deleteMany()
  await db.inventoryItem.deleteMany()
  await db.client.deleteMany()
  await db.driver.deleteMany()
  await db.session.deleteMany()
  await db.account.deleteMany()
  await db.user.deleteMany()
  await db.business.deleteMany()

  // Business
  const business = await db.business.create({
    data: {
      name: "Patel Foods Distribution",
      slug: "patel-foods",
      phone: "905-555-0100",
      address: "123 Steeles Ave W",
      city: "Brampton",
      province: "ON",
      plan: "PRO",
    },
  })
  console.log(`Business: ${business.name}`)

  // Demo user (email: demo@routeready.app / password: demo123)
  const hashedPassword = await bcrypt.hash("demo123", 10)
  const demoUser = await db.user.create({
    data: {
      name: "Akshay Sharma",
      email: "demo@routeready.app",
      password: hashedPassword,
      role: "OWNER",
      businessId: business.id,
      emailVerified: new Date(),
    },
  })
  console.log(`Demo user: ${demoUser.email} / password: demo123`)

  // Drivers
  const [driver1, driver2, driver3] = await Promise.all([
    db.driver.create({ data: { businessId: business.id, name: "Harpreet Singh", phone: "905-555-0201", vehicleType: "Cargo Van", licensePlate: "BRPT 001", capacityKg: 600 } }),
    db.driver.create({ data: { businessId: business.id, name: "Miguel Santos", phone: "905-555-0202", vehicleType: "Box Truck", licensePlate: "MSNT 002", capacityKg: 1200 } }),
    db.driver.create({ data: { businessId: business.id, name: "Priya Mehta", phone: "905-555-0203", vehicleType: "Cargo Van", licensePlate: "PMHT 003", capacityKg: 600 } }),
  ])
  console.log(`Drivers: 3 created`)

  // Clients
  const [client1, client2, client3, client4] = await Promise.all([
    db.client.create({ data: { businessId: business.id, name: "Himalaya Grocery", contactName: "Ram Patel", phone: "905-555-0301", address: "456 Queen St W", city: "Brampton", lat: 43.7315, lng: -79.7624 } }),
    db.client.create({ data: { businessId: business.id, name: "Caribbean Spice Market", contactName: "Maria Brown", phone: "416-555-0302", address: "789 Dundas St W", city: "Mississauga", lat: 43.589, lng: -79.6441 } }),
    db.client.create({ data: { businessId: business.id, name: "Punjab Palace Restaurant", contactName: "Gurdev Singh", phone: "905-555-0303", address: "321 Hurontario St", city: "Mississauga", lat: 43.5935, lng: -79.6398 } }),
    db.client.create({ data: { businessId: business.id, name: "Fresh Taste Catering", contactName: "Anita Sharma", phone: "905-555-0304", address: "654 Steeles Ave E", city: "Brampton", lat: 43.7189, lng: -79.7572 } }),
  ])
  console.log(`Clients: 4 created`)

  // Inventory
  const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const [rice, oil, lentils, cumin, flour] = await Promise.all([
    db.inventoryItem.create({ data: { businessId: business.id, sku: "RICE-001", name: "Basmati Rice 20kg", category: "Grains", unit: "bag", unitPrice: 28.99, quantity: 45, reorderThreshold: 20 } }),
    db.inventoryItem.create({ data: { businessId: business.id, sku: "OIL-001", name: "Canola Oil 20L", category: "Oils", unit: "jug", unitPrice: 42.50, quantity: 8, reorderThreshold: 15 } }),
    db.inventoryItem.create({ data: { businessId: business.id, sku: "LENT-001", name: "Red Lentils 10kg", category: "Legumes", unit: "bag", unitPrice: 19.99, quantity: 3, reorderThreshold: 10 } }),
    db.inventoryItem.create({ data: { businessId: business.id, sku: "SPICE-001", name: "Cumin 1kg", category: "Spices", unit: "bag", unitPrice: 12.99, quantity: 25, reorderThreshold: 10, expiryDate: threeDays } }),
    db.inventoryItem.create({ data: { businessId: business.id, sku: "FLOUR-001", name: "Atta Flour 20kg", category: "Grains", unit: "bag", unitPrice: 22.99, quantity: 30, reorderThreshold: 15 } }),
  ])
  console.log(`Inventory: 5 items (2 low stock, 1 expiring soon)`)

  // Orders
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

  await Promise.all([
    db.order.create({ data: { orderNumber: "ORD-2024-0001", businessId: business.id, clientId: client1.id, driverId: driver1.id, status: "ASSIGNED", priority: "NORMAL", scheduledDate: tomorrow, deliveryAddress: client1.address, subtotal: 115.96, tax: 15.07, total: 131.03, items: { create: [{ inventoryId: rice.id, name: "Basmati Rice 20kg", sku: "RICE-001", quantity: 4, unit: "bag", unitPrice: 28.99, totalPrice: 115.96 }] } } }),
    db.order.create({ data: { orderNumber: "ORD-2024-0002", businessId: business.id, clientId: client2.id, driverId: driver2.id, status: "IN_TRANSIT", priority: "HIGH", scheduledDate: new Date(), deliveryAddress: client2.address, subtotal: 255.0, tax: 33.15, total: 288.15, items: { create: [{ inventoryId: oil.id, name: "Canola Oil 20L", sku: "OIL-001", quantity: 6, unit: "jug", unitPrice: 42.50, totalPrice: 255.0 }] } } }),
    db.order.create({ data: { orderNumber: "ORD-2024-0003", businessId: business.id, clientId: client3.id, status: "PENDING", priority: "NORMAL", scheduledDate: dayAfter, deliveryAddress: client3.address, subtotal: 159.92, tax: 20.79, total: 180.71, items: { create: [{ inventoryId: flour.id, name: "Atta Flour 20kg", sku: "FLOUR-001", quantity: 4, unit: "bag", unitPrice: 22.99, totalPrice: 91.96 }, { inventoryId: lentils.id, name: "Red Lentils 10kg", sku: "LENT-001", quantity: 2, unit: "bag", unitPrice: 19.99, totalPrice: 39.98 }] } } }),
    db.order.create({ data: { orderNumber: "ORD-2024-0004", businessId: business.id, clientId: client4.id, driverId: driver3.id, status: "DELIVERED", priority: "NORMAL", scheduledDate: yesterday, deliveredAt: new Date(Date.now() - 20 * 60 * 60 * 1000), deliveryAddress: client4.address, subtotal: 77.97, tax: 10.14, total: 88.11, items: { create: [{ inventoryId: cumin.id, name: "Cumin 1kg", sku: "SPICE-001", quantity: 6, unit: "bag", unitPrice: 12.99, totalPrice: 77.97 }] } } }),
  ])
  console.log(`Orders: 4 created (delivered, in-transit, assigned, pending)`)

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Seed complete!

Business:  Patel Foods Distribution
Demo Login: demo@routeready.app / demo123
Drivers:   Harpreet Singh, Miguel Santos, Priya Mehta
Clients:   4 GTA businesses
Inventory: 5 items (OIL + LENTILS below threshold)
Orders:    4 across all statuses
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `)
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1) })
  .finally(() => db.$disconnect())
