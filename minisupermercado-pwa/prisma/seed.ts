import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@minisupermercado.com' },
    update: {},
    create: {
      email: 'admin@minisupermercado.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 12)
  const manager = await prisma.user.upsert({
    where: { email: 'gerente@minisupermercado.com' },
    update: {},
    create: {
      email: 'gerente@minisupermercado.com',
      name: 'Gerente Principal',
      password: managerPassword,
      role: 'MANAGER',
    },
  })

  // Create cashier user
  const cashierPassword = await bcrypt.hash('cajero123', 12)
  const cashier = await prisma.user.upsert({
    where: { email: 'cajero@minisupermercado.com' },
    update: {},
    create: {
      email: 'cajero@minisupermercado.com',
      name: 'Cajero Principal',
      password: cashierPassword,
      role: 'CASHIER',
    },
  })

  console.log('✅ Users created')

  // Sample products
  const products = [
    // Bebidas
    {
      name: 'Coca Cola 500ml',
      code: 'BEB001',
      barcode: '7501055363057',
      price: 2.50,
      cost: 1.80,
      stock: 45,
      minStock: 20,
      category: 'Bebidas',
      brand: 'Coca Cola',
      description: 'Refresco de cola 500ml',
      unit: 'unidad',
    },
    {
      name: 'Pepsi 500ml',
      code: 'BEB002',
      barcode: '7501055363058',
      price: 2.40,
      cost: 1.70,
      stock: 30,
      minStock: 15,
      category: 'Bebidas',
      brand: 'Pepsi',
      description: 'Refresco de cola 500ml',
      unit: 'unidad',
    },
    {
      name: 'Agua Mineral 1L',
      code: 'BEB003',
      barcode: '7501055363059',
      price: 1.50,
      cost: 0.80,
      stock: 60,
      minStock: 25,
      category: 'Bebidas',
      brand: 'Bonafont',
      description: 'Agua purificada 1 litro',
      unit: 'unidad',
    },
    {
      name: 'Jugo de Naranja 1L',
      code: 'BEB004',
      barcode: '7501055363060',
      price: 3.20,
      cost: 2.10,
      stock: 20,
      minStock: 10,
      category: 'Bebidas',
      brand: 'Del Valle',
      description: 'Jugo natural de naranja',
      unit: 'unidad',
    },

    // Panadería
    {
      name: 'Pan Integral',
      code: 'PAN001',
      barcode: '7501234567890',
      price: 4.00,
      cost: 2.50,
      stock: 15,
      minStock: 8,
      category: 'Panadería',
      brand: 'Bimbo',
      description: 'Pan integral rebanado',
      unit: 'unidad',
    },
    {
      name: 'Pan Blanco',
      code: 'PAN002',
      barcode: '7501234567891',
      price: 3.50,
      cost: 2.20,
      stock: 20,
      minStock: 10,
      category: 'Panadería',
      brand: 'Bimbo',
      description: 'Pan blanco rebanado',
      unit: 'unidad',
    },
    {
      name: 'Tortillas de Maíz',
      code: 'PAN003',
      barcode: '7501234567892',
      price: 2.80,
      cost: 1.50,
      stock: 25,
      minStock: 12,
      category: 'Panadería',
      brand: 'Local',
      description: 'Tortillas de maíz frescas',
      unit: 'kg',
    },

    // Lácteos
    {
      name: 'Leche Entera 1L',
      code: 'LAC001',
      barcode: '7501055123456',
      price: 5.25,
      cost: 3.80,
      stock: 28,
      minStock: 15,
      category: 'Lácteos',
      brand: 'Lala',
      description: 'Leche entera pasteurizada 1 litro',
      unit: 'unidad',
    },
    {
      name: 'Yogurt Natural 1kg',
      code: 'LAC002',
      barcode: '7501055123457',
      price: 6.50,
      cost: 4.20,
      stock: 12,
      minStock: 8,
      category: 'Lácteos',
      brand: 'Danone',
      description: 'Yogurt natural sin azúcar',
      unit: 'unidad',
    },
    {
      name: 'Queso Panela 400g',
      code: 'LAC003',
      barcode: '7501055123458',
      price: 8.90,
      cost: 6.50,
      stock: 10,
      minStock: 5,
      category: 'Lácteos',
      brand: 'Lala',
      description: 'Queso panela fresco',
      unit: 'unidad',
    },

    // Granos y Cereales
    {
      name: 'Arroz Blanco 1kg',
      code: 'GRA001',
      barcode: '7501234567893',
      price: 3.75,
      cost: 2.40,
      stock: 8,
      minStock: 15,
      category: 'Granos',
      brand: 'Verde Valle',
      description: 'Arroz blanco grano largo 1kg',
      unit: 'unidad',
    },
    {
      name: 'Frijoles Negros 1kg',
      code: 'GRA002',
      barcode: '7501234567894',
      price: 4.20,
      cost: 2.80,
      stock: 12,
      minStock: 10,
      category: 'Granos',
      brand: 'La Costeña',
      description: 'Frijoles negros secos',
      unit: 'unidad',
    },
    {
      name: 'Avena 500g',
      code: 'GRA003',
      barcode: '7501234567895',
      price: 2.90,
      cost: 1.80,
      stock: 18,
      minStock: 8,
      category: 'Granos',
      brand: 'Quaker',
      description: 'Avena integral',
      unit: 'unidad',
    },

    // Limpieza
    {
      name: 'Detergente en Polvo 1kg',
      code: 'LIM001',
      barcode: '7501234567896',
      price: 12.00,
      cost: 8.50,
      stock: 6,
      minStock: 10,
      category: 'Limpieza',
      brand: 'Ariel',
      description: 'Detergente para ropa',
      unit: 'unidad',
    },
    {
      name: 'Jabón de Baño 90g',
      code: 'LIM002',
      barcode: '7501234567897',
      price: 1.80,
      cost: 1.20,
      stock: 35,
      minStock: 20,
      category: 'Limpieza',
      brand: 'Palmolive',
      description: 'Jabón de tocador',
      unit: 'unidad',
    },
    {
      name: 'Cloro 1L',
      code: 'LIM003',
      barcode: '7501234567898',
      price: 3.50,
      cost: 2.20,
      stock: 15,
      minStock: 8,
      category: 'Limpieza',
      brand: 'Cloralex',
      description: 'Blanqueador líquido',
      unit: 'unidad',
    },

    // Snacks
    {
      name: 'Papas Fritas 150g',
      code: 'SNK001',
      barcode: '7501234567899',
      price: 4.50,
      cost: 2.80,
      stock: 22,
      minStock: 15,
      category: 'Snacks',
      brand: 'Sabritas',
      description: 'Papas fritas clásicas',
      unit: 'unidad',
    },
    {
      name: 'Galletas Oreo 154g',
      code: 'SNK002',
      barcode: '7501234567900',
      price: 3.20,
      cost: 2.10,
      stock: 18,
      minStock: 10,
      category: 'Snacks',
      brand: 'Oreo',
      description: 'Galletas de chocolate',
      unit: 'unidad',
    },
    {
      name: 'Chicles Trident',
      code: 'SNK003',
      barcode: '7501234567901',
      price: 1.50,
      cost: 0.90,
      stock: 40,
      minStock: 20,
      category: 'Snacks',
      brand: 'Trident',
      description: 'Chicles sin azúcar',
      unit: 'unidad',
    },
  ]

  // Create products and store their IDs
  const createdProducts: { [key: string]: string } = {}
  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { code: productData.code },
      update: {},
      create: productData,
    })
    createdProducts[productData.code] = product.id
  }

  console.log('✅ Products created')

  // Create sample customers
  const customers = [
    {
      name: 'Cliente Frecuente',
      email: 'cliente@email.com',
      phone: '5551234567',
      address: 'Calle Principal 123',
      document: 'RFC123456789',
    },
    {
      name: 'María González',
      phone: '5559876543',
      address: 'Avenida Central 456',
    },
    {
      name: 'Juan Pérez',
      email: 'juan.perez@email.com',
      phone: '5555555555',
    },
  ]

  const createdCustomers = []
  for (const customerData of customers) {
    const customer = await prisma.customer.create({
      data: customerData,
    })
    createdCustomers.push(customer)
  }

  console.log('✅ Customers created')

  // Create sample sales with items
  const salesData = [
    {
      sale: {
        saleNumber: '20241215001',
        date: new Date('2024-12-15T10:30:00'),
        subtotal: 15.75,
        tax: 1.89,
        discount: 0,
        total: 17.64,
        paymentMethod: 'cash',
        userId: cashier.id,
        status: 'COMPLETED',
      },
      items: [
        {
          productCode: 'BEB001', // Coca Cola
          quantity: 3,
          unitPrice: 2.50,
          discount: 0,
          subtotal: 7.50,
        },
        {
          productCode: 'PAN001', // Pan Integral
          quantity: 2,
          unitPrice: 4.00,
          discount: 0,
          subtotal: 8.00,
        },
      ],
    },
    {
      sale: {
        saleNumber: '20241215002',
        date: new Date('2024-12-15T14:15:00'),
        subtotal: 28.40,
        tax: 3.41,
        discount: 2.00,
        total: 29.81,
        paymentMethod: 'card',
        userId: cashier.id,
        status: 'COMPLETED',
        customerId: createdCustomers[0].id,
      },
      items: [
        {
          productCode: 'LAC001', // Leche
          quantity: 2,
          unitPrice: 5.25,
          discount: 0,
          subtotal: 10.50,
        },
        {
          productCode: 'LAC002', // Yogurt
          quantity: 1,
          unitPrice: 6.50,
          discount: 0,
          subtotal: 6.50,
        },
        {
          productCode: 'SNK001', // Papas
          quantity: 2,
          unitPrice: 4.50,
          discount: 2.00,
          subtotal: 7.00,
        },
        {
          productCode: 'BEB003', // Agua
          quantity: 3,
          unitPrice: 1.50,
          discount: 0,
          subtotal: 4.50,
        },
      ],
    },
    {
      sale: {
        saleNumber: '20241216001',
        date: new Date('2024-12-16T09:45:00'),
        subtotal: 42.15,
        tax: 5.06,
        discount: 0,
        total: 47.21,
        paymentMethod: 'cash',
        userId: manager.id,
        status: 'COMPLETED',
      },
      items: [
        {
          productCode: 'LIM001', // Detergente
          quantity: 1,
          unitPrice: 12.00,
          discount: 0,
          subtotal: 12.00,
        },
        {
          productCode: 'GRA001', // Arroz
          quantity: 3,
          unitPrice: 3.75,
          discount: 0,
          subtotal: 11.25,
        },
        {
          productCode: 'GRA002', // Frijoles
          quantity: 2,
          unitPrice: 4.20,
          discount: 0,
          subtotal: 8.40,
        },
        {
          productCode: 'LAC003', // Queso
          quantity: 1,
          unitPrice: 8.90,
          discount: 0,
          subtotal: 8.90,
        },
        {
          productCode: 'LIM002', // Jabón
          quantity: 1,
          unitPrice: 1.80,
          discount: 0,
          subtotal: 1.80,
        },
      ],
    },
  ]

  // Create sales and their items
  for (const saleData of salesData) {
    const sale = await prisma.sale.create({
      data: saleData.sale,
    })

    // Create sale items
    for (const itemData of saleData.items) {
      await prisma.saleItem.create({
        data: {
          saleId: sale.id,
          productId: createdProducts[itemData.productCode],
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          discount: itemData.discount,
          subtotal: itemData.subtotal,
        },
      })

      // Create stock movement for each sale item
      const product = await prisma.product.findUnique({
        where: { id: createdProducts[itemData.productCode] }
      })

      if (product) {
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            type: 'SALE',
            quantity: -itemData.quantity, // Negative for sale (stock reduction)
            previousStock: product.stock + itemData.quantity,
            newStock: product.stock,
            reason: `Venta ${sale.saleNumber}`,
            reference: sale.id,
            userId: sale.userId,
          },
        })

        // Update product stock
        await prisma.product.update({
          where: { id: product.id },
          data: {
            stock: product.stock - itemData.quantity,
          },
        })
      }
    }
  }

  console.log('✅ Sales and sale items created')

  // Create stock movements for initial inventory
  for (const productData of products) {
    const product = await prisma.product.findUnique({
      where: { code: productData.code }
    })

    if (product) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'PURCHASE',
          quantity: productData.stock,
          previousStock: 0,
          newStock: productData.stock,
          reason: 'Inventario inicial',
          reference: 'INITIAL_STOCK',
          userId: admin.id,
        },
      })
    }
  }

  console.log('✅ Stock movements created')

  // Create cash register entries
  const cashRegisters = [
    {
      date: new Date('2024-12-15T08:00:00'),
      openAmount: 500.00,
      closeAmount: 612.85,
      expectedAmount: 612.85,
      totalSales: 47.45,
      totalCash: 47.45,
      totalCard: 29.81,
      difference: 0.00,
      notes: 'Apertura normal del día',
      userId: cashier.id,
      closed: true,
    },
    {
      date: new Date('2024-12-16T08:00:00'),
      openAmount: 500.00,
      closeAmount: 547.21,
      expectedAmount: 547.21,
      totalSales: 47.21,
      totalCash: 47.21,
      totalCard: 0.00,
      difference: 0.00,
      notes: 'Día normal de operaciones',
      userId: manager.id,
      closed: true,
    },
    {
      date: new Date('2024-12-17T08:00:00'),
      openAmount: 500.00,
      closeAmount: null,
      expectedAmount: null,
      totalSales: null,
      totalCash: null,
      totalCard: null,
      difference: null,
      notes: 'Caja abierta del día actual',
      userId: cashier.id,
      closed: false,
    },
  ]

  for (const registerData of cashRegisters) {
    await prisma.cashRegister.create({
      data: registerData,
    })
  }

  console.log('✅ Cash registers created')

  // Create app settings
  const appSettings = [
    {
      key: 'store_name',
      value: 'Minisupermercado El Buen Precio',
      type: 'string',
    },
    {
      key: 'store_address',
      value: 'Calle Principal 123, Col. Centro',
      type: 'string',
    },
    {
      key: 'store_phone',
      value: '555-123-4567',
      type: 'string',
    },
    {
      key: 'tax_rate',
      value: '0.12',
      type: 'number',
    },
    {
      key: 'currency',
      value: 'MXN',
      type: 'string',
    },
    {
      key: 'auto_backup',
      value: 'true',
      type: 'boolean',
    },
    {
      key: 'low_stock_alert',
      value: 'true',
      type: 'boolean',
    },
    {
      key: 'ai_assistant_enabled',
      value: 'true',
      type: 'boolean',
    },
    {
      key: 'receipt_footer',
      value: '¡Gracias por su compra! Vuelva pronto',
      type: 'string',
    },
    {
      key: 'max_discount_percentage',
      value: '20',
      type: 'number',
    },
  ]

  for (const setting of appSettings) {
    await prisma.appSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }

  console.log('✅ App settings created')

  // Create some AI logs (example interactions)
  const aiLogs = [
    {
      type: 'prediction',
      prompt: 'Predice las ventas para mañana basado en el histórico',
      response: 'Basándome en el análisis de ventas, preveo un incremento del 15% en bebidas y lácteos para mañana.',
      tokens: 145,
      provider: 'groq',
      userId: manager.id,
      success: true,
    },
    {
      type: 'insight',
      prompt: 'Analiza los productos con bajo stock',
      response: 'Detecté 3 productos críticos: Arroz (8 unidades), Detergente (6 unidades) y Queso Panela (10 unidades). Se recomienda reposición urgente.',
      tokens: 98,
      provider: 'groq',
      userId: admin.id,
      success: true,
    },
    {
      type: 'assistant',
      prompt: '¿Cuál es el producto más vendido esta semana?',
      response: 'El producto más vendido esta semana es Coca Cola 500ml con 5 unidades vendidas, seguido de Pan Integral con 4 unidades.',
      tokens: 67,
      provider: 'groq',
      userId: cashier.id,
      success: true,
    },
  ]

  for (const logData of aiLogs) {
    await prisma.aILog.create({
      data: logData,
    })
  }

  console.log('✅ AI logs created')

  console.log('🎉 Database seeded successfully!')
  console.log('\n📊 Summary:')
  console.log(`👥 Users: ${3}`)
  console.log(`📦 Products: ${products.length}`)
  console.log(`👥 Customers: ${customers.length}`)
  console.log(`🛒 Sales: ${salesData.length}`)
  console.log(`💰 Cash Registers: ${cashRegisters.length}`)
  console.log(`⚙️  App Settings: ${appSettings.length}`)
  console.log(`🤖 AI Logs: ${aiLogs.length}`)
  console.log('\n🔐 Default users:')
  console.log('👑 Admin: admin@minisupermercado.com / admin123')
  console.log('👨‍💼 Manager: gerente@minisupermercado.com / manager123')
  console.log('👨‍💻 Cashier: cajero@minisupermercado.com / cajero123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })