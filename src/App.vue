<template>
  <div class="app-container">
    <GameHeader />

    <div class="main-content">
      <div class="left-sidebar">
        <ProbabilityPanel />
        <BackupPanel />
      </div>

      <div class="center-content">
        <BoothPanel :round-result="currentRoundResult" />
        
        <div class="action-bar" v-if="gamePhase === 'planning'">
          <button class="btn btn-primary btn-large" @click="handleResolve">
            🎲 执行本轮策略
          </button>
        </div>
      </div>

      <div class="right-sidebar">
        <SettlementPanel
          :round-result="currentRoundResult"
          :can-undo="canUndo"
          @undo="handleUndo"
          @next="handleNext"
        />
        <HistoryPanel
          :history="history"
          :history-index="historyIndex"
          :can-undo="canUndo"
          :can-redo="canRedo"
          @undo="handleUndo"
          @redo="handleRedo"
          @view-round="handleViewRound"
        />
      </div>
    </div>

    <div class="footer-actions">
      <button class="btn btn-secondary" @click="showScoreboard = true">
        🏆 排行榜
      </button>
      <button class="btn btn-secondary" @click="handleReset">
        🔄 重新开始
      </button>
    </div>

    <GameOverPanel
      v-if="gameOver"
      :total-score="totalScore"
      :round="round"
      :max-rounds="maxRounds"
      @restart="handleReset"
      @show-scores="showScoreboard = true"
    />

    <ScoreboardPanel
      v-if="showScoreboard"
      @close="showScoreboard = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'
import GameHeader from '@/components/GameHeader.vue'
import BoothPanel from '@/components/BoothPanel.vue'
import ProbabilityPanel from '@/components/ProbabilityPanel.vue'
import SettlementPanel from '@/components/SettlementPanel.vue'
import HistoryPanel from '@/components/HistoryPanel.vue'
import BackupPanel from '@/components/BackupPanel.vue'
import GameOverPanel from '@/components/GameOverPanel.vue'
import ScoreboardPanel from '@/components/ScoreboardPanel.vue'

const gameStore = useGameStore()
const {
  gamePhase,
  gameOver,
  totalScore,
  round,
  maxRounds,
  currentRoundResult,
  history,
  historyIndex,
  canUndo,
  canRedo
} = storeToRefs(gameStore)

const showScoreboard = ref(false)

function handleResolve() {
  gameStore.resolveRound()
}

function handleUndo() {
  gameStore.undo()
}

function handleRedo() {
  gameStore.redo()
}

function handleNext() {
  gameStore.nextRound()
}

function handleViewRound(index: number) {
  console.log('查看轮次:', index)
}

function handleReset() {
  if (confirm('确定要重新开始游戏吗？当前进度将丢失。')) {
    gameStore.resetGame()
  }
}
</script>
