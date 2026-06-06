<template>
  <div class="history-panel">
    <div class="panel-header">
      <span class="panel-icon">📜</span>
      <h3>历史记录 & 复盘</h3>
    </div>

    <div class="history-controls">
      <button
        class="btn btn-small"
        @click="$emit('undo')"
        :disabled="!canUndo"
      >
        ↩️ 撤销
      </button>
      <button
        class="btn btn-small"
        @click="$emit('redo')"
        :disabled="!canRedo"
      >
        ↪️ 重做
      </button>
    </div>

    <div class="history-list" v-if="history.length > 0">
      <div
        v-for="(item, index) in history"
        :key="index"
        class="history-item"
        :class="{ active: index === historyIndex }"
        @click="$emit('viewRound', index)"
      >
        <div class="history-round">第 {{ item.round }} 轮</div>
        <div class="history-profit" :class="{ positive: item.netProfit >= 0, negative: item.netProfit < 0 }">
          {{ item.netProfit >= 0 ? '+' : '' }}¥{{ item.netProfit }}
        </div>
        <div class="history-events">
          <span v-for="e in item.events.filter(x => x.occurred)" :key="e.type" class="event-tag">
            {{ getEventIcon(e.type) }}
          </span>
          <span v-if="item.events.filter(x => x.occurred).length === 0" class="no-event">平静</span>
        </div>
      </div>
    </div>
    <div v-else class="no-history">
      <p>暂无历史记录</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RoundResult, EventType } from '@/types/game'

defineProps<{
  history: RoundResult[]
  historyIndex: number
  canUndo: boolean
  canRedo: boolean
}>()

defineEmits<{
  undo: []
  redo: []
  viewRound: [index: number]
}>()

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
