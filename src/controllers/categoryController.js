const Category = require('../models/Category');

const defaultCategories = [
  { name: 'Plumbing', icon: 'water', description: 'Fix leaks, install pipes, unclog drains', basePrice: 300, popular: true },
  { name: 'Electrical', icon: 'flash', description: 'Wiring, switches, fans, AC repair', basePrice: 400, popular: true },
  { name: 'Carpentry', icon: 'hammer', description: 'Furniture repair, woodwork, polishing', basePrice: 350, popular: false },
  { name: 'Painting', icon: 'brush', description: 'Interior/exterior painting, textures', basePrice: 500, popular: false },
  { name: 'Cleaning', icon: 'sparkles', description: 'Deep cleaning, sanitization', basePrice: 250, popular: true },
  { name: 'AC Repair', icon: 'snow', description: 'AC installation, repair, gas refill', basePrice: 450, popular: true },
  { name: 'Appliance Repair', icon: 'tools', description: 'Refrigerator, washing machine, TV', basePrice: 350, popular: false },
  { name: 'Pest Control', icon: 'bug', description: 'Termite, cockroach, bedbug treatment', basePrice: 600, popular: false },
  { name: 'Gardening', icon: 'leaf', description: 'Lawn care, plant maintenance', basePrice: 300, popular: false },
  { name: 'Moving', icon: 'truck', description: 'Packers & movers, shifting', basePrice: 800, popular: false }
];

exports.getCategories = async (req, res) => {
  try {
    let categories = await Category.find({ active: true }).sort({ popular: -1, name: 1 });
    
    if (categories.length === 0) {
      await Category.insertMany(defaultCategories);
      categories = await Category.find({ active: true }).sort({ popular: -1, name: 1 });
    }
    
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.seedCategories = async (req, res) => {
  try {
    await Category.deleteMany({});
    await Category.insertMany(defaultCategories);
    res.json({ success: true, message: 'Categories seeded', count: defaultCategories.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
