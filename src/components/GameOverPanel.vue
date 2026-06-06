<template>
  <div class="game-over-overlay">
    <div class="game-over-panel">
      <h2>🎉 游戏结束！</h2>
      
      <div class="final-score">
        <div class="score-item">
          <span class="score-label">最终得分</span>
          <span class="score-value">{{ totalScore >= 0 ? '+' : '' }}¥{{ totalScore }}</span>
        </div>
        <div class="score-item">
          <span class="score-label">完成轮数</span>
          <span class="score-value">{{ completedRounds }} / {{ maxRounds }}</span>
        </div>
      </div>

      <div class="rank-display">
        <span class="rank-icon">{{ rankIcon }}</span>
        <span class="rank-text">{{ rankText }}</span>
      </div>

      <div class="save-score">
        <input
          v-model="playerName"
          type="text"
          placeholder="输入你的名字"
          maxlength="10"
        />
        <button class="btn btn-primary" @click="handleSaveScore" :disabled="!playerName.trim()">
          💾 保存成绩
        </button>
      </div>

      <div v-if="saved" class="saved-message success">
        ✅ 成绩已保存！
      </div>

      <div class="final-actions">
        <button class="btn btn-secondary" @click="$emit('showScores')">
          🏆 查看排行榜
        </button>
        <button class="btn btn-primary" @click="$emit('restart')">
          🔄 重新开始
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { saveScore } from '@/utils/storage'

const props = defineProps<{
  totalScore: number
  completedRounds: number
  maxRounds: number
}>()

defineEmits<{
  restart: []
  showScores: []
}>()

const playerName = ref('')
const saved = ref(false)

const rankIcon = computed(() => {
  if (props.totalScore >= 5000) return '👑'
  if (props.totalScore >= 3000) return '🥇'
  if (props.totalScore >= 1500) return '🥈'
  if (props.totalScore >= 500) return '🥉'
  if (props.totalScore >= 0) return '🎖️'
  return '💪'
})

const rankText = computed(() => {
  if (props.totalScore >= 5000) return '展会传奇！'
  if (props.totalScore >= 3000) return '经营大师！'
  if (props.totalScore >= 1500) return '优秀摊主！'
  if (props.totalScore >= 500) return '合格经营者'
  if (props.totalScore >= 0) return '新手起步'
  return '再接再厉'
})

async function handleSaveScore() {
  if (!playerName.value.trim()) return
  await saveScore({
    playerName: playerName.value.trim(),
    score: props.totalScore,
    rounds: props.completedRounds,
    date: new Date().toLocaleString('zh-CN'),
    timestamp: Date.now()
  })
  saved.value = true
}
</script>
