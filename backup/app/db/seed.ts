import { getDb } from "../api/queries/connection";
import { foodItems, canteenSettings } from "./schema";

async function seed() {
  const db = getDb();

  // Check if food items already exist
  const existing = await db.select().from(foodItems);
  if (existing.length > 0) {
    console.log("Food items already seeded.");
    return;
  }

  // Seed food items
  const foods = [
    {
      name: "Veg Sandwich",
      description: "Fresh vegetables with cheese in toasted bread",
      price: 3.50,
      stock: 50,
      servingTime: "All Day",
      category: "veg" as const,
      imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Chicken Wrap",
      description: "Grilled chicken with fresh veggies and sauce",
      price: 4.50,
      stock: 30,
      servingTime: "Lunch & Dinner",
      category: "non_veg" as const,
      imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Cold Coffee",
      description: "Iced coffee with chocolate syrup and cream",
      price: 2.50,
      stock: 100,
      servingTime: "All Day",
      category: "beverage" as const,
      imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Maggi Noodles",
      description: "Classic instant noodles with veggies",
      price: 2.00,
      stock: 80,
      servingTime: "All Day",
      category: "veg" as const,
      imageUrl: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Cheese Burger",
      description: "Juicy patty with melted cheese and fresh buns",
      price: 5.00,
      stock: 25,
      servingTime: "Lunch & Dinner",
      category: "non_veg" as const,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "French Fries",
      description: "Crispy golden fries with ketchup",
      price: 2.00,
      stock: 100,
      servingTime: "All Day",
      category: "snack" as const,
      imageUrl: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Samosa",
      description: "Crispy pastry filled with spiced potatoes",
      price: 1.50,
      stock: 60,
      servingTime: "Evening",
      category: "veg" as const,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Chicken Nuggets",
      description: "Crispy fried chicken nuggets with dip",
      price: 4.00,
      stock: 40,
      servingTime: "Lunch & Dinner",
      category: "non_veg" as const,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Fresh Juice",
      description: "Freshly squeezed orange juice",
      price: 2.00,
      stock: 50,
      servingTime: "Morning & Afternoon",
      category: "beverage" as const,
      imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Gulab Jamun",
      description: "Sweet fried dumplings in sugar syrup",
      price: 2.50,
      stock: 30,
      servingTime: "All Day",
      category: "dessert" as const,
      imageUrl: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd1?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Paneer Tikka",
      description: "Grilled cottage cheese with spices",
      price: 5.50,
      stock: 20,
      servingTime: "Lunch & Dinner",
      category: "veg" as const,
      imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Chai",
      description: "Indian masala tea with ginger",
      price: 1.00,
      stock: 200,
      servingTime: "All Day",
      category: "beverage" as const,
      imageUrl: "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Biryani",
      description: "Fragrant basmati rice with spiced chicken and herbs",
      price: 6.50,
      stock: 25,
      servingTime: "Lunch & Dinner",
      category: "non_veg" as const,
      imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Veg Thali",
      description: "Complete meal with dal, rice, roti, sabzi, salad & dessert",
      price: 4.50,
      stock: 30,
      servingTime: "Lunch & Dinner",
      category: "veg" as const,
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Masala Dosa",
      description: "Crispy rice crepe filled with spiced potato filling",
      price: 3.00,
      stock: 40,
      servingTime: "Morning & All Day",
      category: "veg" as const,
      imageUrl: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Butter Chicken",
      description: "Creamy tomato-based curry with tender chicken pieces",
      price: 7.00,
      stock: 20,
      servingTime: "Lunch & Dinner",
      category: "non_veg" as const,
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Idli Sambar",
      description: "Steamed rice cakes served with lentil soup and chutney",
      price: 2.50,
      stock: 50,
      servingTime: "Morning & All Day",
      category: "veg" as const,
      imageUrl: "https://images.unsplash.com/photo-1589301761024-b8e5db2e6ed2?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Chicken Fried Rice",
      description: "Wok-tossed rice with chicken, veggies and soy sauce",
      price: 5.00,
      stock: 35,
      servingTime: "Lunch & Dinner",
      category: "non_veg" as const,
      imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=400&fit=crop",
      isAvailable: true,
    },
    {
      name: "Mango Lassi",
      description: "Refreshing yogurt drink blended with sweet mango",
      price: 2.00,
      stock: 60,
      servingTime: "All Day",
      category: "beverage" as const,
      imageUrl: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&h=400&fit=crop",
      isAvailable: true,
    },
  ];

  for (const food of foods) {
    await db.insert(foodItems).values(food);
  }

  console.log(`Seeded ${foods.length} food items.`);

  // Seed canteen settings
  const settingsExist = await db.select().from(canteenSettings);
  if (settingsExist.length === 0) {
    await db.insert(canteenSettings).values({
      openingTime: "08:00",
      closingTime: "20:00",
      isOpen: true,
      currentToken: 0,
      lastTokenNumber: 100,
    });
    console.log("Seeded canteen settings.");
  }
}

seed().catch(console.error);
