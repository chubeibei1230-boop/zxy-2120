<template>
  <div class="game-header">
    <div class="header-left">
      <h1>🎪 展会摊位经营大师</h1>
      <div class="round-info">
        <span class="round-badge">第 {{ round }} / {{ maxRounds }} 轮</span>
        <span class="phase-badge" :class="gamePhase">
          {{ phaseText }}
        </span>
      </div>
    </div>
    
    <div class="header-center">
      <div class="money-display">
        <span class="money-label">💰 当前资金</span>
        <span class="money-value">¥{{ totalMoney }}</span>
        <span class="money-change" :class="{ positive: totalScore >= 0, negative: totalScore < 0 }">
          ({{ totalScore >= 0 ? '+' : '' }}¥{{ totalScore }})
        </span>
      </div>
    </div>

    <div class="header-right">
      <div class="cost-preview" v-if="gamePhase === 'planning'">
        <div class="cost-item">
          <span>👥 人员成本:</span>
          <span>¥{{ staffCost }}</span>
        </div>
        <div class="cost-item">
          <span>📦 补货成本:</span>
          <span>¥{{ restockCost }}</span>
        </div>
        <div class="cost-item total">
          <span>预计总成本:</span>
          <span>¥{{ staffCost + restockCost }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'

const gameStore = useGameStore()
const { round, maxRounds, totalMoney, totalScore, gamePhase } = storeToRefs(gameStore)

const staffCost = computed(() => gameStore.getTotalStaffCost())
const restockCost = computed(() => gameStore.getTotalRestockCost())

const phaseText = computed(() => {
  const texts: Record<string, string> = {
    planning: '📋 规划阶段',
    resolving: '⏳ 结算中...',
    settled: '✅ 已结算'
  }
  return texts[gamePhase.value] || ''
})
</script>
