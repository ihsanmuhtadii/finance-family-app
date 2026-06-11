// ============================================================
// Database Types — sesuai schema Supabase
// ============================================================

export type UserRole = 'owner' | 'spouse'
export type CategoryType = 'income' | 'expense'
export type DebtType = 'payable' | 'receivable'
export type DebtStatus = 'active' | 'paid' | 'overdue'
export type AssetCategory = 'property' | 'vehicle' | 'electronics' | 'jewelry' | 'other'
export type InvestmentType = 'stocks' | 'bonds' | 'mutual_fund' | 'crypto' | 'gold' | 'other'
export type InvestmentStatus = 'active' | 'sold'
export type InvestmentAction = 'buy' | 'sell' | 'dividend'
export type SavingsStatus = 'active' | 'achieved' | 'cancelled'
export type NotificationType = 'debt_due' | 'goal_near' | 'over_budget' | 'general'

export interface User {
  id: string
  name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon: string | null
  is_default: boolean
  created_at: string
}

export interface Income {
  id: string
  user_id: string
  category_id: string | null
  title: string
  amount: number
  date: string
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  user?: User
  category?: Category
}

export interface Expense {
  id: string
  user_id: string
  category_id: string | null
  title: string
  amount: number
  date: string
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  user?: User
  category?: Category
}

export interface BudgetPlan {
  id: string
  user_id: string
  category_id: string
  month: number
  year: number
  planned_amount: number
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  category?: Category
}

export interface BudgetSummary {
  budget_plan_id: string
  category_id: string
  category_name: string
  category_icon: string | null
  month: number
  year: number
  planned_amount: number
  actual_amount: number
  difference: number
  usage_pct: number
}

export interface Debt {
  id: string
  user_id: string
  type: DebtType
  creditor_debtor_name: string
  principal_amount: number
  remaining_amount: number
  interest_rate: number
  due_date: string | null
  status: DebtStatus
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  user?: User
}

export interface DebtPayment {
  id: string
  debt_id: string
  amount: number
  payment_date: string
  notes: string | null
  created_at: string
}

export interface Asset {
  id: string
  user_id: string
  name: string
  category: AssetCategory
  purchase_price: number
  current_value: number
  purchase_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AssetValuation {
  id: string
  asset_id: string
  value: number
  valuation_date: string
  source: string | null
  created_at: string
}

export interface Investment {
  id: string
  user_id: string
  name: string
  type: InvestmentType
  total_invested: number
  current_value: number
  units_owned: number
  avg_buy_price: number
  start_date: string | null
  status: InvestmentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InvestmentTxn {
  id: string
  investment_id: string
  action: InvestmentAction
  amount: number
  units: number
  price_per_unit: number
  date: string
  notes: string | null
  created_at: string
}

export interface Savings {
  id: string
  user_id: string
  goal_name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  status: SavingsStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SavingsDeposit {
  id: string
  savings_id: string
  amount: number
  deposit_date: string
  notes: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  message: string
  type: NotificationType
  is_read: boolean
  created_at: string
}

// ============================================================
// Helper types untuk form inputs
// ============================================================

export type NewIncome = Omit<Income, 'id' | 'created_at' | 'updated_at' | 'user' | 'category'>
export type NewExpense = Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'user' | 'category'>
export type NewBudgetPlan = Omit<BudgetPlan, 'id' | 'created_at' | 'updated_at' | 'category'>
export type NewDebt = Omit<Debt, 'id' | 'created_at' | 'updated_at' | 'user'>
export type NewDebtPayment = Omit<DebtPayment, 'id' | 'created_at'>
export type NewAsset = Omit<Asset, 'id' | 'created_at' | 'updated_at'>
export type NewInvestment = Omit<Investment, 'id' | 'created_at' | 'updated_at'>
export type NewInvestmentTxn = Omit<InvestmentTxn, 'id' | 'created_at'>
export type NewSavings = Omit<Savings, 'id' | 'created_at' | 'updated_at'>
export type NewSavingsDeposit = Omit<SavingsDeposit, 'id' | 'created_at'>
