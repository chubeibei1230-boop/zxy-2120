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
  }[]
  totalRevenue: number
  totalCost: number
  netProfit: number
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

export interface ScoreRecord {
  id?: number
  playerName: string
  score: number
  rounds: number
  date: string
  timestamp: number
}
