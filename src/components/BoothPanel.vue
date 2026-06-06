<template>
  <div class="booth-panel">
    <h3>🎪 摊位管理</h3>
    <div class="booths-grid">
      <div
        v-for="booth in booths"
        :key="booth.id"
        class="booth-card"
        :class="{ 'disabled': gamePhase !== 'planning' }"
      >
        <div class="booth-header">
          <span class="booth-name">{{ booth.name }}</span>
          <span class="booth-product">主营: {{ booth.product }}</span>
        </div>
        
        <div class="booth-stats">
          <div class="stat-item">
            <span class="stat-label">📦 库存</span>
            <span class="stat-value">{{ booth.stock }} / {{ booth.maxStock }}</span>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: (booth.stock / booth.maxStock * 100) + '%' }"
                :class="{ low: booth.stock < booth.maxStock * 0.3 }"
              ></div>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-label">👥 人员</span>
            <span class="stat-value">{{ getStrategy(booth.id)?.staff || booth.staff }} / {{ booth.maxStaff }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">💰 累计营收</span>
            <span class="stat-value revenue">¥{{ booth.revenue }}</span>
          </div>
        </div>

        <div v-if="gamePhase === 'planning'" class="booth-controls">
          <div class="control-group">
            <label>安排人员:</label>
            <div class="counter">
              <button
                @click="adjustStaff(booth.id, -1)"
                :disabled="(getStrategy(booth.id)?.staff || booth.staff) <= 0"
              >-</button>
              <span>{{ getStrategy(booth.id)?.staff || booth.staff }}</span>
              <button
                @click="adjustStaff(booth.id, 1)"
                :disabled="(getStrategy(booth.id)?.staff || booth.staff) >= booth.maxStaff"
              >+</button>
            </div>
            <span class="cost-hint">
              额外人员花费: ¥{{ Math.max(0, ((getStrategy(booth.id)?.staff || booth.staff) - booth.staff) * 50) }}
            </span>
          </div>
          
          <div class="control-group">
            <label>补货数量:</label>
            <div class="counter">
              <button
                @click="adjustRestock(booth.id, -10)"
                :disabled="(getStrategy(booth.id)?.restock || 0) <= 0"
              >-</button>
              <span>{{ getStrategy(booth.id)?.restock || 0 }}</span>
              <button
                @click="adjustRestock(booth.id, 10)"
                :disabled="booth.stock + (getStrategy(booth.id)?.restock || 0) + 10 > booth.maxStock"
              >+</button>
            </div>
            <span class="cost-hint">
              补货花费: ¥{{ (getStrategy(booth.id)?.restock || 0) * 5 }}
            </span>
          </div>
        </div>

        <div v-if="roundResult" class="round-result">
          <div class="result-item">
            <span>👥 到店客户:</span>
            <span>{{ getBoothResult(booth.id)?.customers || 0 }}</span>
          </div>
          <div class="result-item">
            <span>💰 销售额:</span>
            <span class="revenue">¥{{ getBoothResult(booth.id)?.sales || 0 }}</span>
          </div>
          <div class="result-item">
            <span>⚡ 人员效率:</span>
            <span>{{ Math.round((getBoothResult(booth.id)?.staffEfficiency || 1) * 100) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'
import type { RoundResult } from '@/types/game'

const props = defineProps<{
  roundResult?: RoundResult | null
}>()

const gameStore = useGameStore()
const { booths, currentStrategy, gamePhase } = storeToRefs(gameStore)

function getStrategy(boothId: string) {
  return currentStrategy.value?.boothAllocations.find(a => a.boothId === boothId)
}

function getBoothResult(boothId: string) {
  return props.roundResult?.boothResults.find(r => r.boothId === boothId)
}

function adjustStaff(boothId: string, delta: number) {
  const strategy = getStrategy(boothId)
  const booth = booths.value.find(b => b.id === boothId)
  if (!strategy || !booth) return
  const newStaff = Math.max(0, Math.min(booth.maxStaff, strategy.staff + delta))
  gameStore.updateStrategy(boothId, newStaff, strategy.restock)
}

function adjustRestock(boothId: string, delta: number) {
  const strategy = getStrategy(boothId)
  const booth = booths.value.find(b => b.id === boothId)
  if (!strategy || !booth) return
  const newRestock = Math.max(0, Math.min(booth.maxStock - booth.stock, strategy.restock + delta))
  gameStore.updateStrategy(boothId, strategy.staff, newRestock)
}
</script>
