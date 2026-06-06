import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Booth, GameEvent, RoundStrategy, RoundResult, EventProbability, EventType,
  Objective, ObjectiveType, ObjectiveProgress, ActiveBuff
} from '@/types/game'

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

interface GameSnapshot {
  totalMoney: number
  booths: Booth[]
  currentObjectives: Objective[]
  activeBuffs: ActiveBuff[]
  consecutiveNoStockoutRounds: number
  totalObjectivesCompleted: number
}

function cloneBooths(booths: Booth[]): Booth[] {
  return JSON.parse(JSON.stringify(booths))
}

function generateObjectiveId(): string {
  return 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

export const useGameStore = defineStore('game', () => {
  const round = ref(1)
  const maxRounds = ref(10)
  const totalMoney = ref(1000)
  const booths = ref<Booth[]>(createInitialBooths())
  const currentProbabilities = ref<EventProbability>(createInitialProbabilities())
  const currentStrategy = ref<RoundStrategy | null>(null)
  const history = ref<RoundResult[]>([])
  const redoStack = ref<RoundResult[]>([])
  const gamePhase = ref<'planning' | 'resolving' | 'settled'>('planning')
  const gameOver = ref(false)
  const currentObjectives = ref<Objective[]>([])
  const activeBuffs = ref<ActiveBuff[]>([])
  const consecutiveNoStockoutRounds = ref(0)
  const totalObjectivesCompleted = ref(0)

  const initialSnapshot: GameSnapshot = {
    totalMoney: 1000,
    booths: createInitialBooths(),
    currentObjectives: [],
    activeBuffs: [],
    consecutiveNoStockoutRounds: 0,
    totalObjectivesCompleted: 0
  }

  const currentRoundResult = computed(() => {
    if (gamePhase.value === 'settled' && history.value.length > 0) {
      return history.value[history.value.length - 1]
    }
    return null
  })

  const completedRounds = computed(() => history.value.length)
  const canUndo = computed(() => history.value.length > 0 && gamePhase.value === 'settled')
  const canRedo = computed(() => redoStack.value.length > 0 && gamePhase.value === 'planning')
  const canNextRound = computed(() => gamePhase.value === 'settled')
  const totalScore = computed(() => totalMoney.value - 1000)
  const bestObjectiveStreak = computed(() => {
    let maxStreak = 0
    let currentStreak = 0
    history.value.forEach(h => {
      const completedThisRound = h.objectives.filter(o => o.completed).length
      if (completedThisRound > 0) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    })
    return maxStreak
  })

  const activeRestockBonus = computed(() => {
    return activeBuffs.value
      .filter(b => b.type === 'restock_bonus')
      .reduce((sum, b) => sum + b.value, 0)
  })

  const activeStaffBonus = computed(() => {
    return activeBuffs.value
      .filter(b => b.type === 'staff_bonus')
      .reduce((sum, b) => sum + b.value, 0)
  })

  const activeRiskReduction = computed(() => {
    return activeBuffs.value
      .filter(b => b.type === 'risk_reduction')
      .reduce((sum, b) => sum + b.value, 0)
  })

  function generateObjectives() {
    const objectives: Objective[] = []
    const boothList = booths.value
    const currentRound = round.value
    const baseDifficulty = Math.min(1 + (currentRound - 1) * 0.1, 2)

    const objectiveTemplates: Array<{
      type: ObjectiveType
      tier: 'normal' | 'milestone'
      generate: () => Omit<Objective, 'id' | 'completed' | 'currentValue'>
    }> = [
      {
        type: 'net_profit',
        tier: 'normal',
        generate: () => {
          const target = Math.floor(150 * baseDifficulty)
          return {
            type: 'net_profit',
            tier: 'normal',
            title: '盈利达标',
            description: `本轮净利润达到 ¥${target}`,
            targetValue: target,
            reward: {
              type: 'money',
              value: 100,
              description: '奖励资金 ¥100'
            }
          }
        }
      },
      {
        type: 'net_profit',
        tier: 'milestone',
        generate: () => {
          const target = Math.floor(300 * baseDifficulty)
          return {
            type: 'net_profit',
            tier: 'milestone',
            title: '高额盈利',
            description: `本轮净利润达到 ¥${target}`,
            targetValue: target,
            reward: {
              type: 'money',
              value: 250,
              description: '奖励资金 ¥250'
            }
          }
        }
      },
      {
        type: 'booth_sales',
        tier: 'normal',
        generate: () => {
          const booth = boothList[Math.floor(Math.random() * boothList.length)]
          const target = Math.floor(200 * baseDifficulty)
          return {
            type: 'booth_sales',
            tier: 'normal',
            title: `${booth.name}销售目标`,
            description: `${booth.name}本轮销售额达到 ¥${target}`,
            targetValue: target,
            targetBoothId: booth.id,
            targetBoothName: booth.name,
            reward: {
              type: 'restock_bonus',
              value: 20,
              description: '下轮额外补货额度 +20'
            }
          }
        }
      },
      {
        type: 'no_stockout',
        tier: 'normal',
        generate: () => ({
          type: 'no_stockout',
          tier: 'normal',
          title: '库存管理大师',
          description: '本轮所有摊位不出现缺货情况',
          targetValue: 1,
          reward: {
            type: 'staff_bonus',
            value: 1,
            description: '下轮临时人手 +1'
          }
        })
      },
      {
        type: 'total_money',
        tier: 'milestone',
        generate: () => {
          const target = Math.floor(1500 + (currentRound - 1) * 200)
          return {
            type: 'total_money',
            tier: 'milestone',
            title: '资金里程碑',
            description: `结算后总资金达到 ¥${target}`,
            targetValue: target,
            reward: {
              type: 'money',
              value: 200,
              description: '奖励资金 ¥200'
            }
          }
        }
      },
      {
        type: 'min_cost',
        tier: 'normal',
        generate: () => {
          const target = Math.floor(80 * baseDifficulty)
          return {
            type: 'min_cost',
            tier: 'normal',
            title: '成本控制',
            description: `本轮总成本控制在 ¥${target} 以下`,
            targetValue: target,
            reward: {
              type: 'risk_reduction',
              value: 0.05,
              description: '下轮负面事件概率 -5%'
            }
          }
        }
      },
      {
        type: 'max_revenue',
        tier: 'milestone',
        generate: () => {
          const target = Math.floor(600 * baseDifficulty)
          return {
            type: 'max_revenue',
            tier: 'milestone',
            title: '营收突破',
            description: `本轮总营收达到 ¥${target}`,
            targetValue: target,
            reward: {
              type: 'money',
              value: 300,
              description: '奖励资金 ¥300'
            }
          }
        }
      }
    ]

    const normalTemplates = objectiveTemplates.filter(t => t.tier === 'normal')
    const milestoneTemplates = objectiveTemplates.filter(t => t.tier === 'milestone')
    
    const shuffledNormal = [...normalTemplates].sort(() => Math.random() - 0.5)
    const normalCount = Math.min(2, shuffledNormal.length)
    for (let i = 0; i < normalCount; i++) {
      const template = shuffledNormal[i]
      const objData = template.generate()
      objectives.push({
        ...objData,
        id: generateObjectiveId(),
        completed: false,
        currentValue: 0
      })
    }

    const shuffledMilestone = [...milestoneTemplates].sort(() => Math.random() - 0.5)
    if (shuffledMilestone.length > 0) {
      const template = shuffledMilestone[0]
      const objData = template.generate()
      objectives.push({
        ...objData,
        id: generateObjectiveId(),
        completed: false,
        currentValue: 0
      })
    }

    currentObjectives.value = objectives
  }

  function evaluateObjectives(result: RoundResult): ObjectiveProgress[] {
    const progress: ObjectiveProgress[] = []
    const boothResultsMap = new Map(
      result.boothResults.map(br => [br.boothId, br])
    )

    currentObjectives.value.forEach(obj => {
      let currentValue = 0
      let completed = false
      let failedReason: string | undefined

      switch (obj.type) {
        case 'net_profit':
          currentValue = result.netProfit
          completed = result.netProfit >= obj.targetValue
          if (!completed) failedReason = `净利润不足 (当前: ¥${result.netProfit}, 目标: ¥${obj.targetValue})`
          break

        case 'booth_sales':
          const boothResult = boothResultsMap.get(obj.targetBoothId!)
          currentValue = boothResult?.sales || 0
          completed = (boothResult?.sales || 0) >= obj.targetValue
          if (!completed) failedReason = `${obj.targetBoothName}销售额不足 (当前: ¥${currentValue}, 目标: ¥${obj.targetValue})`
          break

        case 'no_stockout':
          const anyStockout = result.boothResults.some(br => br.hadStockout)
          currentValue = anyStockout ? 0 : 1
          completed = !anyStockout
          if (!completed) failedReason = '有摊位出现了缺货情况'
          break

        case 'total_money':
          currentValue = totalMoney.value
          completed = totalMoney.value >= obj.targetValue
          if (!completed) failedReason = `总资金不足 (当前: ¥${totalMoney.value}, 目标: ¥${obj.targetValue})`
          break

        case 'min_cost':
          currentValue = result.totalCost
          completed = result.totalCost <= obj.targetValue
          if (!completed) failedReason = `成本过高 (当前: ¥${result.totalCost}, 上限: ¥${obj.targetValue})`
          break

        case 'max_revenue':
          currentValue = result.totalRevenue
          completed = result.totalRevenue >= obj.targetValue
          if (!completed) failedReason = `营收不足 (当前: ¥${result.totalRevenue}, 目标: ¥${obj.targetValue})`
          break
      }

      progress.push({
        objectiveId: obj.id,
        completed,
        currentValue,
        targetValue: obj.targetValue,
        failedReason: completed ? undefined : failedReason
      })
    })

    return progress
  }

  function applyRewards(progress: ObjectiveProgress[]) {
    progress.forEach((p, idx) => {
      if (p.completed) {
        const obj = currentObjectives.value[idx]
        totalObjectivesCompleted.value++
        
        switch (obj.reward.type) {
          case 'money':
            totalMoney.value += obj.reward.value
            break

          case 'restock_bonus':
            activeBuffs.value.push({
              type: 'restock_bonus',
              value: obj.reward.value,
              remainingRounds: 1,
              description: obj.reward.description
            })
            break

          case 'staff_bonus':
            activeBuffs.value.push({
              type: 'staff_bonus',
              value: obj.reward.value,
              remainingRounds: 1,
              description: obj.reward.description
            })
            break

          case 'risk_reduction':
            activeBuffs.value.push({
              type: 'risk_reduction',
              value: obj.reward.value,
              remainingRounds: 1,
              description: obj.reward.description
            })
            break
        }
      }
    })
  }

  function updateBuffs() {
    activeBuffs.value = activeBuffs.value
      .map(b => ({ ...b, remainingRounds: b.remainingRounds - 1 }))
      .filter(b => b.remainingRounds > 0)
  }

  function getAdjustedProbabilities(): EventProbability {
    const base = { ...currentProbabilities.value }
    const reduction = activeRiskReduction.value
    
    if (reduction > 0) {
      base.shortage = Math.max(0.05, base.shortage - reduction)
      base.detour = Math.max(0.05, base.detour - reduction)
      base.fatigue = Math.max(0.05, base.fatigue - reduction)
    }
    
    return base
  }

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

    const adjustedProbs = getAdjustedProbabilities()

    eventConfigs.forEach(config => {
      const prob = adjustedProbs[config.type]
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
    if (!currentStrategy.value || gamePhase.value !== 'planning') return

    gamePhase.value = 'resolving'

    const events = generateEvents()
    const boothResults: RoundResult['boothResults'] = []
    let totalRevenue = 0
    let totalCost = 0

    const staffCost = getTotalStaffCost()
    const restockCost = getTotalRestockCost()
    totalCost = staffCost + restockCost

    let hadAnyStockout = false

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

      const effectiveStaff = (alloc.staff + activeStaffBonus.value) * staffEfficiency
      const servedCustomers = Math.min(customers, effectiveStaff * 20)
      const maxSalesFromStock = stockLeft * 15
      sales = Math.min(servedCustomers * 15, maxSalesFromStock)
      const hadStockout = servedCustomers * 15 > maxSalesFromStock
      if (hadStockout) hadAnyStockout = true
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
        staffEfficiency,
        hadStockout
      })
    })

    if (hadAnyStockout) {
      consecutiveNoStockoutRounds.value = 0
    } else {
      consecutiveNoStockoutRounds.value++
    }

    const netProfit = totalRevenue - totalCost
    totalMoney.value += netProfit

    const result: RoundResult = {
      round: round.value,
      strategy: JSON.parse(JSON.stringify(currentStrategy.value)),
      events,
      boothResults,
      totalRevenue,
      totalCost,
      netProfit,
      objectives: []
    }

    const objectiveProgress = evaluateObjectives(result)
    result.objectives = objectiveProgress
    applyRewards(objectiveProgress)

    history.value.push(result)
    redoStack.value = []

    gamePhase.value = 'settled'

    if (history.value.length >= maxRounds.value) {
      gameOver.value = true
    }

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
    if (!canNextRound.value) return
    if (history.value.length >= maxRounds.value) {
      gameOver.value = true
      return
    }
    updateBuffs()
    round.value++
    gamePhase.value = 'planning'
    generateObjectives()
    initStrategy()
  }

  function undo() {
    if (!canUndo.value) return
    
    const undoneResult = history.value.pop()!
    redoStack.value.push(undoneResult)

    const undoneCompletedCount = undoneResult.objectives.filter(o => o.completed).length
    totalObjectivesCompleted.value = Math.max(0, totalObjectivesCompleted.value - undoneCompletedCount)

    if (history.value.length === 0) {
      totalMoney.value = initialSnapshot.totalMoney
      booths.value = cloneBooths(initialSnapshot.booths)
      activeBuffs.value = []
      consecutiveNoStockoutRounds.value = 0
      currentObjectives.value = []
    } else {
      totalMoney.value -= undoneResult.netProfit

      undoneResult.boothResults.forEach(br => {
        const booth = booths.value.find(b => b.id === br.boothId)
        if (booth) {
          booth.revenue -= br.sales
        }
      })

      undoneResult.objectives.forEach((p, idx) => {
        if (p.completed) {
          const obj = currentObjectives.value[idx]
          if (obj?.reward.type === 'money') {
            totalMoney.value -= obj.reward.value
          }
        }
      })

      const prevResult = history.value[history.value.length - 1]
      prevResult.boothResults.forEach(br => {
        const booth = booths.value.find(b => b.id === br.boothId)
        if (booth) {
          booth.stock = br.stockLeft
        }
      })
      prevResult.strategy.boothAllocations.forEach(alloc => {
        const booth = booths.value.find(b => b.id === alloc.boothId)
        if (booth) {
          booth.staff = alloc.staff
        }
      })

      const anyStockout = undoneResult.boothResults.some(br => br.hadStockout)
      if (!anyStockout) {
        consecutiveNoStockoutRounds.value = Math.max(0, consecutiveNoStockoutRounds.value - 1)
      }
    }

    round.value = Math.max(1, round.value - 1)
    gamePhase.value = 'planning'
    generateObjectives()
    initStrategy()
  }

  function redo() {
    if (!canRedo.value) return
    
    const result = redoStack.value.pop()!
    history.value.push(result)

    totalMoney.value += result.netProfit

    const completedCount = result.objectives.filter(o => o.completed).length
    totalObjectivesCompleted.value += completedCount

    result.objectives.forEach((p, idx) => {
      if (p.completed) {
        const obj = currentObjectives.value[idx]
        if (obj?.reward.type === 'money') {
          totalMoney.value += obj.reward.value
        }
      }
    })

    result.boothResults.forEach(br => {
      const booth = booths.value.find(b => b.id === br.boothId)
      if (booth) {
        booth.stock = br.stockLeft
        booth.staff = result.strategy.boothAllocations.find(a => a.boothId === br.boothId)?.staff ?? booth.staff
        booth.revenue += br.sales
      }
    })

    const anyStockout = result.boothResults.some(br => br.hadStockout)
    if (anyStockout) {
      consecutiveNoStockoutRounds.value = 0
    } else {
      consecutiveNoStockoutRounds.value++
    }

    round.value++
    gamePhase.value = 'settled'

    if (history.value.length >= maxRounds.value) {
      gameOver.value = true
    }
  }

  function resetGame() {
    round.value = 1
    totalMoney.value = initialSnapshot.totalMoney
    booths.value = cloneBooths(initialSnapshot.booths)
    currentProbabilities.value = createInitialProbabilities()
    currentStrategy.value = null
    history.value = []
    redoStack.value = []
    gamePhase.value = 'planning'
    gameOver.value = false
    currentObjectives.value = []
    activeBuffs.value = []
    consecutiveNoStockoutRounds.value = 0
    totalObjectivesCompleted.value = 0
    generateObjectives()
    initStrategy()
  }

  generateObjectives()
  initStrategy()

  return {
    round,
    maxRounds,
    totalMoney,
    booths,
    currentProbabilities,
    currentStrategy,
    history,
    completedRounds,
    gamePhase,
    gameOver,
    currentRoundResult,
    canUndo,
    canRedo,
    canNextRound,
    totalScore,
    currentObjectives,
    activeBuffs,
    totalObjectivesCompleted,
    bestObjectiveStreak,
    activeRestockBonus,
    activeStaffBonus,
    activeRiskReduction,
    initStrategy,
    updateStrategy,
    getTotalStaffCost,
    getTotalRestockCost,
    resolveRound,
    nextRound,
    undo,
    redo,
    resetGame,
    generateObjectives
  }
})
