<template>
  <div class="objectives-panel">
    <div class="panel-header">
      <span class="panel-icon">🎯</span>
      <h3>阶段经营目标</h3>
    </div>

    <div v-if="activeBuffs.length > 0" class="buffs-section">
      <div class="buffs-title">✨ 当前增益</div>
      <div class="buffs-list">
        <div v-for="buff in activeBuffs" :key="buff.type + buff.remainingRounds" class="buff-item">
          <span class="buff-icon">{{ getBuffIcon(buff.type) }}</span>
          <span class="buff-text">{{ buff.description }}</span>
        </div>
      </div>
    </div>

    <div class="objectives-list">
      <div
        v-for="obj in objectivesWithProgress"
        :key="obj.id"
        class="objective-card"
        :class="{
          milestone: obj.tier === 'milestone',
          completed: obj.progress?.completed,
          failed: gamePhase === 'settled' && !obj.progress?.completed
        }"
      >
        <div class="objective-header">
          <div class="objective-title">
            <span class="tier-badge" :class="obj.tier">
              {{ obj.tier === 'milestone' ? '里程碑' : '普通' }}
            </span>
            <span class="title-text">{{ obj.title }}</span>
          </div>
          <div class="objective-status">
            <span v-if="obj.progress?.completed" class="status-badge success">✅ 完成</span>
            <span v-else-if="gamePhase === 'settled'" class="status-badge failed">❌ 失败</span>
            <span v-else class="status-badge pending">⏳ 进行中</span>
          </div>
        </div>

        <div class="objective-desc">{{ obj.description }}</div>

        <div class="objective-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :class="{ completed: obj.progress?.completed }"
              :style="{ width: getProgressPercent(obj) + '%' }"
            ></div>
          </div>
          <div class="progress-text">
            <span v-if="obj.type === 'no_stockout'">
              {{ obj.progress?.completed ? '无缺货' : '等待结算' }}
            </span>
            <span v-else-if="obj.type === 'min_cost'">
              ¥{{ obj.progress?.currentValue ?? 0 }} / ≤¥{{ obj.targetValue }}
            </span>
            <span v-else>
              ¥{{ obj.progress?.currentValue ?? 0 }} / ¥{{ obj.targetValue }}
            </span>
          </div>
        </div>

        <div v-if="gamePhase === 'settled' && !obj.progress?.completed && obj.progress?.failedReason" class="failed-reason">
          📌 {{ obj.progress.failedReason }}
        </div>

        <div class="objective-reward">
          <span class="reward-label">🎁 奖励:</span>
          <span class="reward-text">{{ obj.reward.description }}</span>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <div class="stat-item">
        <span class="stat-label">已完成目标</span>
        <span class="stat-value">{{ totalObjectivesCompleted }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最佳连达</span>
        <span class="stat-value">{{ bestObjectiveStreak }} 轮</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'
import type { Objective, ObjectiveProgress, RewardType } from '@/types/game'

const gameStore = useGameStore()
const { 
  currentObjectives, 
  currentRoundResult, 
  gamePhase,
  activeBuffs,
  totalObjectivesCompleted,
  bestObjectiveStreak
} = storeToRefs(gameStore)

interface ObjectiveWithProgress extends Objective {
  progress?: ObjectiveProgress
}

const objectivesWithProgress = computed<ObjectiveWithProgress[]>(() => {
  return currentObjectives.value.map((obj, idx) => {
    const progress = currentRoundResult.value?.objectives?.[idx]
    return {
      ...obj,
      progress
    }
  })
})

function getProgressPercent(obj: ObjectiveWithProgress): number {
  if (!obj.progress) return 0
  if (obj.type === 'no_stockout') {
    return obj.progress.completed ? 100 : 0
  }
  if (obj.type === 'min_cost') {
    return obj.progress.currentValue <= obj.targetValue ? 100 : Math.max(0, 100 - (obj.progress.currentValue - obj.targetValue) / obj.targetValue * 100)
  }
  return Math.min(100, (obj.progress.currentValue / obj.targetValue) * 100)
}

function getBuffIcon(type: RewardType): string {
  const icons: Record<RewardType, string> = {
    money: '💰',
    restock_bonus: '📦',
    staff_bonus: '👥',
    risk_reduction: '🛡️'
  }
  return icons[type]
}
</script>

<style scoped>
.objectives-panel {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border-color);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.panel-icon {
  font-size: 20px;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.buffs-section {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1));
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 165, 0, 0.3);
}

.buffs-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.buffs-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.buff-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.buff-icon {
  font-size: 14px;
}

.objectives-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.objective-card {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 14px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.objective-card.milestone {
  border-color: rgba(255, 215, 0, 0.5);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.05), transparent);
}

.objective-card.completed {
  border-color: rgba(76, 175, 80, 0.5);
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.08), transparent);
}

.objective-card.failed {
  border-color: rgba(244, 67, 54, 0.3);
  opacity: 0.8;
}

.objective-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.objective-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tier-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.tier-badge.normal {
  background: rgba(33, 150, 243, 0.15);
  color: #2196F3;
}

.tier-badge.milestone {
  background: rgba(255, 215, 0, 0.2);
  color: #FFA000;
}

.title-text {
  font-weight: 600;
  font-size: 14px;
}

.status-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.status-badge.success {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.status-badge.failed {
  background: rgba(244, 67, 54, 0.2);
  color: #F44336;
}

.status-badge.pending {
  background: rgba(158, 158, 158, 0.2);
  color: #9E9E9E;
}

.objective-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.objective-progress {
  margin-bottom: 10px;
}

.progress-bar {
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2196F3, #64B5F6);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-fill.completed {
  background: linear-gradient(90deg, #4CAF50, #81C784);
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
}

.failed-reason {
  font-size: 12px;
  color: #F44336;
  margin-bottom: 10px;
  padding: 6px 10px;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 6px;
}

.objective-reward {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.reward-label {
  font-weight: 600;
}

.reward-text {
  color: #FF9800;
}

.stats-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}
</style>
