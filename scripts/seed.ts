import bcrypt from 'bcryptjs'
import { db } from '../src/lib/db'

async function main() {
  console.log('🔄 Seeding Bangla Bazar database...')

  // Clean existing data
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.cart.deleteMany()
  await db.review.deleteMany()
  await db.userLog.deleteMany()
  await db.adminSession.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.user.deleteMany()
  console.log('  🧹 Cleaned existing data')

  // ─── Seed Users ──────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10)
  const customerPassword = await bcrypt.hash('demo123', 10)

  const admin = await db.user.create({
    data: {
      email: 'admin@banglabazar.com',
      name: 'Admin',
      role: 'admin',
      password: adminPassword,
      phone: '+8801710000000',
      address: 'Gulshan-2, Dhaka, Bangladesh',
    },
  })

  const customer = await db.user.create({
    data: {
      email: 'customer@demo.com',
      name: 'Rahim Uddin',
      role: 'customer',
      password: customerPassword,
      phone: '+8801812345678',
      address: 'Dhanmondi-27, Dhaka, Bangladesh',
    },
  })

  console.log(`  ✅ Created 2 users (admin + customer)`)

  // ─── Seed Categories ─────────────────────────────────────────────────────
  const categoriesData = [
    {
      name: 'Sharee',
      nameBN: 'শাড়ি',
      slug: 'sharee',
      icon: 'sharee',
      sortOrder: 1,
      active: true,
    },
    {
      name: 'Punjabi',
      nameBN: 'পাঞ্জাবি',
      slug: 'punjabi',
      icon: 'punjabi',
      sortOrder: 2,
      active: true,
    },
    {
      name: 'Shoes',
      nameBN: 'জুতা',
      slug: 'shoes',
      icon: 'shoes',
      sortOrder: 3,
      active: true,
    },
    {
      name: 'Accessories',
      nameBN: 'এক্সেসরিজ',
      slug: 'accessories',
      icon: 'accessories',
      sortOrder: 4,
      active: true,
    },
    {
      name: 'Combo Offers',
      nameBN: 'কম্বো অফার',
      slug: 'combo',
      icon: 'combo',
      sortOrder: 5,
      active: true,
    },
  ]

  const categories: Record<string, Awaited<ReturnType<typeof db.category.create>>> = {}
  for (const cat of categoriesData) {
    categories[cat.slug] = await db.category.create({ data: cat })
  }

  console.log(`  ✅ Created ${categoriesData.length} categories`)

  // ─── Seed Products ───────────────────────────────────────────────────────

  const productsData = [
    // ── Sharee (6) ──
    {
      name: 'Jamdani Sharee',
      nameBN: 'জামদানি শাড়ি',
      description: 'Handwoven Jamdani sharee from Dhaka, known for its intricate muslin pattern. A timeless piece of Bangladeshi heritage perfect for festive occasions.',
      descriptionBN: 'ঢাকার হাতে বোনা জামদানি শাড়ি, যার মসলিন প্যাটার্ন বিখ্যাত। উৎসবের জন্য একটি চিরকালীন ঐতিহ্যবাহী পোশাক।',
      price: 4500,
      salePrice: 3800,
      category: categories.sharee.id,
      stock: 15,
      featured: true,
      unit: 'piece',
      tags: JSON.stringify(['sharee', 'jamdani', 'traditional', 'handwoven']),
    },
    {
      name: 'Katan Silk Sharee',
      nameBN: 'কাতান সিল্ক শাড়ি',
      description: 'Luxurious Katan silk sharee with rich golden zari work. Ideal for weddings and grand celebrations. Soft texture with a regal shine.',
      descriptionBN: 'সমৃদ্ধ সোনালি জরির কাজসহ বিলাসবহুল কাতান সিল্ক শাড়ি। বিয়ে ও বড় অনুষ্ঠানের জন্য আদর্শ।',
      price: 8500,
      salePrice: null,
      category: categories.sharee.id,
      stock: 10,
      featured: true,
      unit: 'piece',
      tags: JSON.stringify(['sharee', 'katan', 'silk', 'wedding']),
    },
    {
      name: 'Tangail Sharee',
      nameBN: 'টাঙ্গাইল শাড়ি',
      description: 'Traditional Tangail sharee with beautiful butidar design. Lightweight and comfortable for everyday wear. Handwoven by skilled artisans of Tangail.',
      descriptionBN: 'সুন্দর বুটিদার ডিজাইনের ঐতিহ্যবাহী টাঙ্গাইল শাড়ি। দৈনন্দিন পরিধানের জন্য হালকা ও আরামদায়ক।',
      price: 2200,
      salePrice: 1800,
      category: categories.sharee.id,
      stock: 25,
      featured: false,
      unit: 'piece',
      tags: JSON.stringify(['sharee', 'tangail', 'cotton', 'traditional']),
    },
    {
      name: 'Muslin Sharee',
      nameBN: 'মসলিন শাড়ি',
      description: 'Legendary Dhaka Muslin sharee, revived from ancient traditions. Incredibly soft and sheer fabric that drapes beautifully. A collector\'s masterpiece.',
      descriptionBN: 'প্রাচীন ঐতিহ্য থেকে পুনরুজ্জীবিত কিংবদন্তি ঢাকাই মসলিন শাড়ি। অবিশ্বাস্য নরম ও স্বচ্ছ কাপড়।',
      price: 12000,
      salePrice: null,
      category: categories.sharee.id,
      stock: 5,
      featured: true,
      unit: 'piece',
      tags: JSON.stringify(['sharee', 'muslin', 'luxury', 'heritage']),
    },
    {
      name: 'Cotton Sharee',
      nameBN: 'কটন শাড়ি',
      description: 'Comfortable cotton sharee for daily wear. Breathable fabric with simple elegant designs. Easy to maintain and perfect for Bangladesh\'s warm climate.',
      descriptionBN: 'দৈনন্দিন পরিধানের জন্য আরামদায়ক কটন শাড়ি। শ্বাসপ্রশ্বাসযোগ্য কাপড় সহ সহজ মার্জিত ডিজাইন।',
      price: 1500,
      salePrice: null,
      category: categories.sharee.id,
      stock: 50,
      featured: false,
      unit: 'piece',
      tags: JSON.stringify(['sharee', 'cotton', 'daily', 'comfortable']),
    },
    {
      name: 'Banarasi Sharee',
      nameBN: 'বেনারসি শাড়ি',
      description: 'Stunning Banarasi sharee with elaborate zari embroidery. Rich colors and intricate patterns make it perfect for special occasions and eid celebrations.',
      descriptionBN: 'বিস্তৃত জরি এমব্রয়ডারি সহ অসাধারণ বেনারসি শাড়ি। বিশেষ অনুষ্ঠান ও ঈদের জন্য উপযুক্ত।',
      price: 6500,
      salePrice: 5500,
      category: categories.sharee.id,
      stock: 12,
      featured: true,
      unit: 'piece',
      tags: JSON.stringify(['sharee', 'banarasi', 'zari', 'wedding']),
    },

    // ── Punjabi (6) ──
    {
      name: 'Panjabi Cotton',
      nameBN: 'পাঞ্জাবি কটন',
      description: 'Classic cotton panjabi for everyday comfort. Clean stitching and breathable fabric make it ideal for regular use and casual outings.',
      descriptionBN: 'প্রতিদিনের আরামের জন্য ক্লাসিক কটন পাঞ্জাবি। পরিষ্কার সেলাই ও শ্বাসপ্রশ্বাসযোগ্য কাপড়।',
      price: 1200,
      salePrice: null,
      category: categories.punjabi.id,
      stock: 30,
      featured: false,
      unit: 'piece',
      tags: JSON.stringify(['punjabi', 'cotton', 'casual', 'daily']),
    },
    {
      name: 'Panjabi Silk',
      nameBN: 'পাঞ্জাবি সিল্ক',
      description: 'Elegant silk panjabi with subtle sheen and premium finish. Perfect for eid, jumma prayers, and semi-formal gatherings. Smooth texture with a luxurious feel.',
      descriptionBN: 'সূক্ষ্ম চকচকে ও প্রিমিয়াম ফিনিসসহ মার্জিত সিল্ক পাঞ্জাবি। ঈদ, জুমার নামাজ ও আধা-আনুষ্ঠানিক সমাবেশের জন্য।',
      price: 3500,
      salePrice: 2900,
      category: categories.punjabi.id,
      stock: 20,
      featured: true,
      unit: 'piece',
      tags: JSON.stringify(['punjabi', 'silk', 'eid', 'premium']),
    },
    {
      name: 'Panjabi Fatua',
      nameBN: 'পাঞ্জাবি ফতুয়া',
      description: 'Stylish fatua-style panjabi with a modern twist. Shorter length and relaxed fit for casual everyday wear. Great for college and hangouts.',
      descriptionBN: 'আধুনিক টুইস্ট সহ স্টাইলিশ ফতুয়া-স্টাইল পাঞ্জাবি। ক্যাজুয়াল পরিধানের জন্য ছোট ও আরামদায়ক।',
      price: 800,
      salePrice: null,
      category: categories.punjabi.id,
      stock: 40,
      featured: false,
      unit: 'piece',
      tags: JSON.stringify(['punjabi', 'fatua', 'casual', 'modern']),
    },
    {
      name: 'Wedding Panjabi',
      nameBN: 'ওয়েডিং পাঞ্জাবি',
      description: 'Premium wedding panjabi with heavy embroidery and zari work. Designed for grooms and special ceremonies. Comes with matching accessories.',
      descriptionBN: 'ভারী এমব্রয়ডারি ও জরির কাজসহ প্রিমিয়াম ওয়েডিং পাঞ্জাবি। বর ও বিশেষ অনুষ্ঠানের জন্য ডিজাইন করা।',
      price: 7500,
      salePrice: null,
      category: categories.punjabi.id,
      stock: 8,
      featured: true,
      unit: 'piece',
      tags: JSON.stringify(['punjabi', 'wedding', 'embroidered', 'premium']),
    },
    {
      name: 'Casual Panjabi',
      nameBN: 'ক্যাজুয়াল পাঞ্জাবি',
      description: 'Comfortable casual panjabi for regular wear. Simple design with soft fabric. Perfect for home and light outdoor activities.',
      descriptionBN: 'নিয়মিত পরিধানের জন্য আরামদায়ক ক্যাজুয়াল পাঞ্জাবি। সহজ ডিজাইন ও নরম কাপড়।',
      price: 1500,
      salePrice: 1200,
      category: categories.punjabi.id,
      stock: 35,
      featured: false,
      unit: 'piece',
      tags: JSON.stringify(['punjabi', 'casual', 'comfortable', 'affordable']),
    },
    {
      name: 'Formal Panjabi',
      nameBN: 'ফর্মাল পাঞ্জাবি',
      description: 'Sophisticated formal panjabi for office and official events. Clean cuts and structured fit. Pairs well with churidar pajama.',
      descriptionBN: 'অফিস ও অফিসিয়াল ইভেন্টের জন্য মার্জিত ফর্মাল পাঞ্জাবি। পরিষ্কার কাট ও স্ট্রাকচার্ড ফিট।',
      price: 4200,
      salePrice: null,
      category: categories.punjabi.id,
      stock: 15,
      featured: false,
      unit: 'piece',
      tags: JSON.stringify(['punjabi', 'formal', 'office', 'structured']),
    },

    // ── Shoes (4) ──
    {
      name: 'Traditional Khussa',
      nameBN: 'ট্র্যাডিশনাল খুসা',
      description: 'Handcrafted traditional khussa shoes with intricate embroidery and mirror work. Comfortable flat sole perfect for cultural events and festive wear.',
      descriptionBN: 'জটিল এমব্রয়ডারি ও আয়নার কাজসহ হস্তনির্মিত ঐতিহ্যবাহী খুসা জুতা। সাংস্কৃতিক অনুষ্ঠানের জন্য আরামদায়ক।',
      price: 1800,
      salePrice: 1400,
      category: categories.shoes.id,
      stock: 20,
      featured: true,
      unit: 'piece',
      tags: JSON.stringify(['shoes', 'khussa', 'traditional', 'embroidered']),
    },
    {
      name: 'Leather Sandal',
      nameBN: 'লেদার স্যান্ডেল',
      description: 'Premium leather sandal crafted from genuine Bangladesh leather. Durable sole with comfortable padding. Perfect for both casual and semi-formal wear.',
      descriptionBN: 'আসল বাংলাদেশি চামড়া থেকে তৈরি প্রিমিয়াম লেদার স্যান্ডেল। টেকসই সোল ও আরামদায়ক প্যাডিং।',
      price: 2200,
      salePrice: null,
      category: categories.shoes.id,
      stock: 18,
      featured: false,
      unit: 'piece',
      tags: JSON.stringify(['shoes', 'leather', 'sandal', 'premium']),
    },
    {
      name: 'Palki Shoe',
      nameBN: 'পালকি শু',
      description: 'Traditional palki shoe with a modern twist. Classic design with cushioned insole for all-day comfort. Great for cultural programs and traditional outfits.',
      descriptionBN: 'আধুনিক টুইস্ট সহ ঐতিহ্যবাহী পালকি জুতা। সারাদিনের আরামের জন্য কুশনযুক্ত ইনসোল।',
      price: 1500,
      salePrice: null,
      category: categories.shoes.id,
      stock: 22,
      featured: false,
      unit: 'piece',
      tags: JSON.stringify(['shoes', 'palki', 'traditional', 'cushioned']),
    },
    {
      name: 'Nashik Shoe',
      nameBN: 'নাসিক শু',
      description: 'Affordable nashik-style shoe with durable construction. Lightweight and comfortable for daily use. Available in multiple colors.',
      descriptionBN: 'টেকসই নির্মাণসহ সাশ্রয়ী নাসিক-স্টাইল জুতা। দৈনন্দিন ব্যবহারের জন্য হালকা ও আরামদায়ক।',
      price: 980,
      salePrice: 750,
      category: categories.shoes.id,
      stock: 30,
      featured: false,
      unit: 'piece',
      tags: JSON.stringify(['shoes', 'nashik', 'affordable', 'daily']),
    },

    // ── Accessories (2) ──
    {
      name: 'Orna/Scarf',
      nameBN: 'ওরনা/স্কার্ফ',
      description: 'Beautiful orna scarf with delicate embroidery. Pairs perfectly with any sharee or salwar kameez. Soft chiffon fabric with elegant border design.',
      descriptionBN: 'সূক্ষ্ম এমব্রয়ডারি সহ সুন্দর ওরনা। যেকোনো শাড়ি বা সালোয়ার কামিজের সাথে মানানসই।',
      price: 450,
      salePrice: null,
      category: categories.accessories.id,
      stock: 45,
      featured: false,
      unit: 'piece',
      tags: JSON.stringify(['accessories', 'orna', 'scarf', 'embroidered']),
    },
    {
      name: 'Topi/Cap',
      nameBN: 'টুপি/ক্যাপ',
      description: 'Traditional Muslim prayer cap (topi) with comfortable fit. Handcrafted with quality cotton fabric. Suitable for daily prayers and religious occasions.',
      descriptionBN: 'আরামদায়ক ফিটসহ ঐতিহ্যবাহী মুসলিম নামাজ টুপি। মানসম্মত কটন কাপড় দিয়ে তৈরি।',
      price: 350,
      salePrice: null,
      category: categories.accessories.id,
      stock: 50,
      featured: false,
      unit: 'piece',
      tags: JSON.stringify(['accessories', 'topi', 'cap', 'prayer']),
    },

    // ── Combo Offers (2) ──
    {
      name: 'Sharee + Orna Combo',
      nameBN: 'শাড়ি + ওরনা কম্বো',
      description: 'Perfect combo of a beautiful Tangail sharee with matching orna. Save more when you buy together. Ideal gift for any occasion.',
      descriptionBN: 'সুন্দর টাঙ্গাইল শাড়ি ও ম্যাচিং ওরনার পারফেক্ট কম্বো। একসাথে কিনলে বেশি সাশ্রয়।',
      price: 4800,
      salePrice: 3999,
      category: categories.combo.id,
      stock: 10,
      featured: true,
      unit: 'piece',
      tags: JSON.stringify(['combo', 'sharee', 'orna', 'gift', 'save']),
    },
    {
      name: 'Panjabi + Topi Combo',
      nameBN: 'পাঞ্জাবি + টুপি কম্বো',
      description: 'Complete your eid look with this Panjabi and Topi combo. Premium cotton panjabi paired with a matching prayer cap. Great value bundle.',
      descriptionBN: 'এই পাঞ্জাবি ও টুপি কম্বো দিয়ে ঈদের লুক সম্পূর্ণ করুন। প্রিমিয়াম কটন পাঞ্জাবি ও ম্যাচিং টুপি।',
      price: 1800,
      salePrice: 1499,
      category: categories.combo.id,
      stock: 15,
      featured: true,
      unit: 'piece',
      tags: JSON.stringify(['combo', 'punjabi', 'topi', 'eid', 'bundle']),
    },
  ]

  let productCount = 0
  for (const product of productsData) {
    await db.product.create({ data: product })
    productCount++
  }

  console.log(`  ✅ Created ${productCount} products`)

  // ─── Seed Sample Orders ──────────────────────────────────────────────────
  const order1 = await db.order.create({
    data: {
      userId: customer.id,
      total: 3920,
      status: 'delivered',
      address: 'Dhanmondi-27, Dhaka, Bangladesh',
      phone: '+8801812345678',
      paymentMethod: 'bkash',
      transactionId: 'BKASH8A3F2D',
      note: 'Please deliver before 5pm',
      items: '[]',
    },
  })

  await db.orderItem.createMany({
    data: [
      {
        orderId: order1.id,
        productId: (await db.product.findFirst({ where: { name: 'Tangail Sharee' } }))!.id,
        quantity: 1,
        price: 1800,
        name: 'Tangail Sharee',
      },
      {
        orderId: order1.id,
        productId: (await db.product.findFirst({ where: { name: 'Orna/Scarf' } }))!.id,
        quantity: 2,
        price: 450,
        name: 'Orna/Scarf',
      },
      {
        orderId: order1.id,
        productId: (await db.product.findFirst({ where: { name: 'Nashik Shoe' } }))!.id,
        quantity: 1,
        price: 750,
        name: 'Nashik Shoe',
      },
    ],
  })

  const order2 = await db.order.create({
    data: {
      userId: customer.id,
      total: 4200,
      status: 'pending',
      address: 'Dhanmondi-27, Dhaka, Bangladesh',
      phone: '+8801812345678',
      paymentMethod: 'nagad',
      transactionId: 'NGD7B1K9M2',
      items: '[]',
    },
  })

  await db.orderItem.createMany({
    data: [
      {
        orderId: order2.id,
        productId: (await db.product.findFirst({ where: { name: 'Panjabi Silk' } }))!.id,
        quantity: 1,
        price: 2900,
        name: 'Panjabi Silk',
      },
      {
        orderId: order2.id,
        productId: (await db.product.findFirst({ where: { name: 'Topi/Cap' } }))!.id,
        quantity: 2,
        price: 350,
        name: 'Topi/Cap',
      },
    ],
  })

  console.log(`  ✅ Created 2 sample orders`)

  // ─── Seed Reviews ────────────────────────────────────────────────────────
  const jamdani = await db.product.findFirst({ where: { name: 'Jamdani Sharee' } })
  const khussa = await db.product.findFirst({ where: { name: 'Traditional Khussa' } })
  const silkPanjabi = await db.product.findFirst({ where: { name: 'Panjabi Silk' } })

  if (jamdani) {
    await db.review.create({
      data: {
        userId: customer.id,
        productId: jamdani.id,
        rating: 5,
        comment: 'Beautiful handwoven sharee! The quality is amazing.',
      },
    })
  }
  if (khussa) {
    await db.review.create({
      data: {
        userId: customer.id,
        productId: khussa.id,
        rating: 4,
        comment: 'Very comfortable and well-crafted. Love the embroidery.',
      },
    })
  }
  if (silkPanjabi) {
    await db.review.create({
      data: {
        userId: customer.id,
        productId: silkPanjabi.id,
        rating: 5,
        comment: 'Premium quality silk. Perfect for eid!',
      },
    })
  }

  console.log(`  ✅ Created 3 reviews`)

  // ─── Seed User Logs ──────────────────────────────────────────────────────
  await db.userLog.createMany({
    data: [
      {
        userId: customer.id,
        action: 'login',
        details: 'Customer logged in',
      },
      {
        userId: admin.id,
        action: 'login',
        details: 'Admin logged in',
      },
    ],
  })

  console.log(`  ✅ Created 2 user logs`)

  console.log('\n🎉 Bangla Bazar seeding complete!')
  console.log('  📧 Admin: admin@banglabazar.com / admin123')
  console.log('  📧 Customer: customer@demo.com / demo123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
