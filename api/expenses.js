// In-memory storage (resets on serverless function cold start)
let expenses = [
  { id: 1, description: 'Groceries', amount: 75.50, category: 'Food', date: '2024-01-15' },
  { id: 2, description: 'Gasoline', amount: 45.00, category: 'Transport', date: '2024-01-14' },
  { id: 3, description: 'Netflix Subscription', amount: 15.99, category: 'Entertainment', date: '2024-01-10' }
];

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  switch (req.method) {
    case 'GET':
      handleGet(req, res);
      break;
    
    case 'POST':
      handlePost(req, res);
      break;
    
    case 'DELETE':
      handleDelete(req, res);
      break;
    
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}

function handleGet(req, res) {
  try {
    // Get optional query parameters for filtering
    const { category, minAmount, maxAmount } = req.query;
    let filteredExpenses = [...expenses];

    // Filter by category if provided
    if (category) {
      filteredExpenses = filteredExpenses.filter(
        expense => expense.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by minimum amount if provided
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) {
        filteredExpenses = filteredExpenses.filter(
          expense => expense.amount >= min
        );
      }
    }

    // Filter by maximum amount if provided
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) {
        filteredExpenses = filteredExpenses.filter(
          expense => expense.amount <= max
        );
      }
    }

    // Calculate total
    const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    res.status(200).json({
      success: true,
      data: filteredExpenses,
      total: parseFloat(total.toFixed(2)),
      count: filteredExpenses.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch expenses' 
    });
  }
}

function handlePost(req, res) {
  try {
    const { description, amount, category } = req.body;

    // Validate required fields
    if (!description || !amount || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: description, amount, category'
      });
    }

    // Validate amount is a number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Create new expense
    const newExpense = {
      id: expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1,
      description: description.trim(),
      amount: parseFloat(amountNum.toFixed(2)),
      category: category.trim(),
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    };

    expenses.push(newExpense);

    res.status(201).json({
      success: true,
      data: newExpense,
      message: 'Expense added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add expense'
    });
  }
}

function handleDelete(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Expense ID is required'
      });
    }

    const expenseId = parseInt(id);
    const initialLength = expenses.length;
    
    expenses = expenses.filter(expense => expense.id !== expenseId);

    if (expenses.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete expense'
    });
  }
}
