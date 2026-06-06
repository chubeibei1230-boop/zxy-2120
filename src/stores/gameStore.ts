import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Booth, GameEvent, RoundStrategy, RoundResult, EventProbability, EventType } from '@/types/game'

const createInitialBooths = (): Booth[] => [
  { id: 'booth1', name: '科技产品摊位', product: '智能手环', basePopularity: 80, stock: 50, maxStock: 100, staff: 2, maxStaff: 5, revenue: 0 },
  { id: 'booth2', name: '美食体验摊位', product: '特色小吃', basePopularity: 100, stock: 80, maxStock: 150, staff: 3, maxStaff: 6, revenue: 0 },
  { id: 'booth3', name: '文创周边摊位', product: '纪念T恤', basePopularity: 70, stock: 60, maxStock: 120, staff: 2, maxStaff: 4, revenue: 0 },
  { id: 'booth4', name: '互动游戏摊位', product: '游戏体验', basePopularity: 90, stock: 100, maxStock: 100, staff: 3, maxStaff: 5, revenue: 0 }
]

const createInitialProbabilities = (): EventProbability => ({
  surge: 0.3,
  shortage: 0.25,
  detour: 0.2,
  fatigue: 0.35
})

export const useGameStore = defineStore('game', () => {
  const round = ref(1)
  const maxRounds = ref(10)
  const totalMoney = ref(1000)
  const booths = ref<Booth[]>(createInitialBooths())
  const currentProbabilities = ref<EventProbability>(createInitialProbabilities())
  const currentStrategy = ref<RoundStrategy | null>(null)
  const history = ref<RoundResult[]>([])
  const historyIndex = ref(-1)
  const gamePhase = ref<'planning' | 'resolving' | 'settled'>('planning')
  const gameOver = ref(false)

  const historySnapshot = ref<RoundResult[]>([])
  const redoStack = ref<RoundResult[]>([])

  const currentRoundResult = computed(() => {
    if (historyIndex.value >= 0 && historyIndex.value < history.value.length) {
      return history.value[historyIndex.value]
    }
    return null
  })

  const canUndo = computed(() => historyIndex.value >= 0)
  const canRedo = computed(() => redoStack.value.length > 0)
  const totalScore = computed(() => totalMoney.value - 1000)

  function initStrategy() {
    currentStrategy.value = {
      boothAllocations: booths.value.map(b => ({
        boothId: b.id,
        staff: b.staff,
        restock: 0
      }))
    }
  }

  function updateStrategy(boothId: string, staff: number, restock: number) {
    if (!currentStrategy.value) return
    const alloc = currentStrategy.value.boothAllocations.find(a => a.boothId === boothId)
    if (alloc) {
      alloc.staff = staff
      alloc.restock = restock
    }
  }

  function getTotalStaffCost(): number {
    if (!currentStrategy.value) return 0
    return currentStrategy.value.boothAllocations.reduce((sum, a) => {
      const booth = booths.value.find(b => b.id === a.boothId)
      const extraStaff = Math.max(0, a.staff - (booth?.staff || 0))
      return sum + extraStaff * 50
    }, 0)
  }

  function getTotalRestockCost(): number {
    if (!currentStrategy.value) return 0
    return currentStrategy.value.boothAllocations.reduce((sum, a) => sum + a.restock * 5, 0)
  }

  function generateEvents(): GameEvent[] {
    const events: GameEvent[] = []
    const eventConfigs: { type: EventType; name: string; description: string }[] = [
      { type: 'surge', name: '客流突增', description: '附近展会人流暴增，需要更多人手应对！' },
      { type: 'shortage', name: '热门品缺货', description: '热门商品库存告急！' },
      { type: 'detour', name: '临时改道', description: '参观路线临时调整，部分摊位客流减少' },
      { type: 'fatigue', name: '人员疲劳', description: '工作人员疲劳，效率下降' }
    ]

    eventConfigs.forEach(config => {
      const prob = currentProbabilities.value[config.type]
      const occurred = Math.random() < prob
      events.push({
        ...config,
        probability: prob,
        occurred,
        impact: {}
      })
    })

    return events
  }

  function resolveRound() {
    if (!currentStrategy.value) return

    gamePhase.value = 'resolving'

    const events = generateEvents()
    const boothResults: RoundResult['boothResults'] = []
    let totalRevenue = 0
    let totalCost = 0

    const staffCost = getTotalStaffCost()
    const restockCost = getTotalRestockCost()
    totalCost = staffCost + restockCost

    booths.value.forEach((booth, idx) => {
      const alloc = currentStrategy.value!.boothAllocations[idx]
      
      let customers = Math.floor(booth.basePopularity * (0.8 + Math.random() * 0.4))
      let stockLeft = booth.stock + alloc.restock
      let staffEfficiency = 1
      let sales = 0

      events.forEach(event => {
        if (!event.occurred) return
        switch (event.type) {
          case 'surge':
            customers = Math.floor(customers * 1.8)
            break
          case 'shortage':
            stockLeft = Math.floor(stockLeft * 0.6)
            break
          case 'detour':
            customers = Math.floor(customers * 0.6)
            break
          case 'fatigue':
            staffEfficiency = 0.7
            break
        }
      })

      const effectiveStaff = alloc.staff * staffEfficiency
      const servedCustomers = Math.min(customers, effectiveStaff * 20)
      sales = Math.min(servedCustomers * 15, stockLeft * 15)
      stockLeft = Math.max(0, stockLeft - Math.ceil(sales / 15))

      booth.stock = stockLeft
      booth.staff = alloc.staff
      booth.revenue += sales

      totalRevenue += sales

      boothResults.push({
        boothId: booth.id,
        customers,
        sales,
        stockLeft,
        staffEfficiency
      })
    })

    const netProfit = totalRevenue - totalCost
    totalMoney.value += netProfit

    const result: RoundResult = {
      round: round.value,
      strategy: JSON.parse(JSON.stringify(currentStrategy.value)),
      events,
      boothResults,
      totalRevenue,
      totalCost,
      netProfit
    }

    history.value.push(result)
    historySnapshot.value = JSON.parse(JSON.stringify(history.value))
    historyIndex.value = history.value.length - 1
    redoStack.value = []

    gamePhase.value = 'settled'

    updateProbabilities()
  }

  function updateProbabilities() {
    currentProbabilities.value = {
      surge: Math.max(0.1, Math.min(0.5, currentProbabilities.value.surge + (Math.random() - 0.5) * 0.1)),
      shortage: Math.max(0.1, Math.min(0.5, currentProbabilities.value.shortage + (Math.random() - 0.5) * 0.1)),
      detour: Math.max(0.1, Math.min(0.5, currentProbabilities.value.detour + (Math.random() - 0.5) * 0.1)),
      fatigue: Math.max(0.1, Math.min(0.5, currentProbabilities.value.fatigue + (Math.random() - 0.5) * 0.1))
    }
  }

  function nextRound() {
    if (round.value >= maxRounds.value) {
      gameOver.value = true
      return
    }
    round.value++
    gamePhase.value = 'planning'
    initStrategy()
  }

  function undo() {
    if (!canUndo.value) return
    redoStack.value.push(history.value.pop()!)
    historyIndex.value--
    
    if (historyIndex.value >= 0) {
      const prevResult = history.value[historyIndex.value]
      totalMoney.value -= prevResult.netProfit
      prevResult.boothResults.forEach(br => {
        const booth = booths.value.find(b => b.id === br.boothId)
        if (booth) {
          booth.stock = br.stockLeft
          booth.revenue -= br.sales
        }
      })
    }
    
    round.value = Math.max(1, round.value - 1)
    gamePhase.value = 'planning'
    initStrategy()
  }

  function redo() {
    if (!canRedo.value) return
    const result = redoStack.value.pop()!
    history.value.push(result)
    historyIndex.value++
    
    totalMoney.value += result.netProfit
    result.boothResults.forEach(br => {
      const booth = booths.value.find(b => b.id === br.boothId)
      if (booth) {
        booth.stock = br.stockLeft
        booth.revenue += br.sales
      }
    })
    
    round.value++
    gamePhase.value = 'settled'
  }

  function resetGame() {
    round.value = 1
    totalMoney.value = 1000
    booths.value = createInitialBooths()
    currentProbabilities.value = createInitialProbabilities()
    currentStrategy.value = null
    history.value = []
    historySnapshot.value = []
    historyIndex.value = -1
    redoStack.value = []
    gamePhase.value = 'planning'
    gameOver.value = false
    initStrategy()
  }

  initStrategy()

  return {
    round,
    maxRounds,
    totalMoney,
    booths,
    currentProbabilities,
    currentStrategy,
    history,
    historyIndex,
    gamePhase,
    gameOver,
    currentRoundResult,
    canUndo,
    canRedo,
    totalScore,
    initStrategy,
    updateStrategy,
    getTotalStaffCost,
    getTotalRestockCost,
    resolveRound,
    nextRound,
    undo,
    redo,
    resetGame
  }
})
