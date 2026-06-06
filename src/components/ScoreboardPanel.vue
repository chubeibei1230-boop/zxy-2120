<template>
  <div class="scoreboard-overlay" @click.self="$emit('close')">
    <div class="scoreboard-panel">
      <div class="panel-header">
        <h2>🏆 排行榜</h2>
        <button class="btn-icon close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="score-list" v-if="scores.length > 0">
        <div
          v-for="(score, index) in scores"
          :key="score.id"
          class="score-item"
          :class="{ top3: index < 3 }"
        >
          <span class="rank">{{ getRankIcon(index) }}</span>
          <span class="player-name">{{ score.playerName }}</span>
          <span class="score">¥{{ score.score }}</span>
          <span class="rounds">{{ score.rounds }}轮</span>
          <span class="date">{{ score.date }}</span>
        </div>
      </div>
      <div v-else class="no-scores">
        <p>暂无成绩记录</p>
      </div>

      <div class="panel-actions">
        <button class="btn btn-secondary" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getScores } from '@/utils/storage'
import type { ScoreRecord } from '@/types/game'

defineEmits<{
  close: []
}>()

const scores = ref<ScoreRecord[]>([])

function getRankIcon(index: number): string {
  const icons = ['🥇', '🥈', '🥉']
  return icons[index] || `#${index + 1}`
}

async function loadScores() {
  scores.value = await getScores(20)
}

onMounted(() => {
  loadScores()
})
</script>
