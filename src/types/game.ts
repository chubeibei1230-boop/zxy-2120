export type EventType = 'surge' | 'shortage' | 'detour' | 'fatigue'

export interface EventProbability {
  surge: number
  shortage: number
  detour: number
  fatigue: number
}

export interface Booth {
  id: string
  name: string
  product: string
  basePopularity: number
  stock: number
  maxStock: number
  staff: number
  maxStaff: number
  revenue: number
}

export interface GameEvent {
  type: EventType
  name: string
  description: string
  affectedBooths?: string[]
  impact: {
    customers?: number
    stock?: number
    staff?: number
    revenue?: number
  }
  probability: number
  occurred: boolean
}

export interface RoundStrategy {
  boothAllocations: {
    boothId: string
    staff: number
    restock: number
  }[]
}

export interface GameState {
  round: number
  maxRounds: number
  totalMoney: number
  booths: Booth[]
  currentProbabilities: EventProbability
  currentStrategy: RoundStrategy | null
  history: RoundResult[]
  historyIndex: number
  gamePhase: 'planning' | 'resolving' | 'settled'
  gameOver: boolean
}

export type ObjectiveType = 'net_profit' | 'booth_sales' | 'no_stockout' | 'total_money' | 'min_cost' | 'max_revenue'
export type ObjectiveTier = 'normal' | 'milestone'
export type RewardType = 'money' | 'restock_bonus' | 'staff_bonus' | 'risk_reduction'

export interface Objective {
  id: string
  type: ObjectiveType
  tier: ObjectiveTier
  title: string
  description: string
  targetValue: number
  targetBoothId?: string
  targetBoothName?: string
  reward: {
    type: RewardType
    value: number
    description: string
  }
  completed: boolean
  currentValue: number
  failedReason?: string
}

export interface ObjectiveProgress {
  objectiveId: string
  completed: boolean
  currentValue: number
  targetValue: number
  failedReason?: string
}

export interface RoundResult {
  round: number
  strategy: RoundStrategy
  events: GameEvent[]
  boothResults: {
    boothId: string
    customers: number
    sales: number
    stockLeft: number
    staffEfficiency: number
    hadStockout: boolean
  }[]
  totalRevenue: number
  totalCost: number
  netProfit: number
  objectives: ObjectiveProgress[]
}

export interface ActiveBuff {
  type: RewardType
  value: number
  remainingRounds: number
  description: string
}

export interface ScoreRecord {
  id?: number
  playerName: string
  score: number
  rounds: number
  objectivesCompleted: number
  date: string
  timestamp: number
}
