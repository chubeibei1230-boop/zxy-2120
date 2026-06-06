<template>
  <div class="settlement-panel">
    <div class="panel-header">
      <span class="panel-icon">📊</span>
      <h3>结算员 - 本轮结果</h3>
    </div>

    <div v-if="!roundResult" class="no-result">
      <p>等待本轮结算...</p>
    </div>

    <div v-else class="settlement-content">
      <div class="summary-section">
        <h4>📈 财务概览</h4>
        <div class="summary-grid">
          <div class="summary-card positive">
            <span class="summary-label">总营收</span>
            <span class="summary-value">¥{{ roundResult.totalRevenue }}</span>
          </div>
          <div class="summary-card negative">
            <span class="summary-label">总成本</span>
            <span class="summary-value">¥{{ roundResult.totalCost }}</span>
          </div>
          <div class="summary-card" :class="{ positive: roundResult.netProfit >= 0, negative: roundResult.netProfit < 0 }">
            <span class="summary-label">净利润</span>
            <span class="summary-value">
              {{ roundResult.netProfit >= 0 ? '+' : '' }}¥{{ roundResult.netProfit }}
            </span>
          </div>
        </div>
      </div>

      <div class="events-section">
        <h4>🎲 发生的事件</h4>
        <div v-if="occurredEvents.length === 0" class="no-events">
          ✨ 本轮风平浪静，没有突发事件！
        </div>
        <div v-else class="events-list">
          <div
            v-for="event in occurredEvents"
            :key="event.type"
            class="event-item"
            :class="event.type"
          >
            <span class="event-icon">{{ getEventIcon(event.type) }}</span>
            <div class="event-info">
              <span class="event-name">{{ event.name }}</span>
              <span class="event-desc">{{ event.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="controls-section">
        <button class="btn btn-secondary" @click="$emit('undo')" :disabled="!canUndo">
          ↩️ 撤销上一轮
        </button>
        <button class="btn btn-primary" @click="$emit('next')" :disabled="!canNextRound">
          下一轮 ➡️
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RoundResult, EventType } from '@/types/game'

const props = defineProps<{
  roundResult: RoundResult | null
  canUndo: boolean
  canNextRound: boolean
}>()

defineEmits<{
  undo: []
  next: []
}>()

const occurredEvents = computed(() => {
  return props.roundResult?.events.filter(e => e.occurred) || []
})

function getEventIcon(type: EventType): string {
  const icons: Record<EventType, string> = {
    surge: '👥',
    shortage: '📦',
    detour: '🔄',
    fatigue: '😴'
  }
  return icons[type]
}
</script>
