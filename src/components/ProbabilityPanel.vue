<template>
  <div class="probability-panel">
    <div class="panel-header">
      <span class="panel-icon">🔮</span>
      <h3>提示员 - 风险概率分析</h3>
    </div>
    <p class="panel-desc">根据最新情报，本轮可能发生以下事件：</p>
    
    <div class="probability-list">
      <div
        v-for="prob in probabilityItems"
        :key="prob.key"
        class="probability-item"
        :class="{ high: prob.value > 0.35, medium: prob.value > 0.2 && prob.value <= 0.35 }"
      >
        <div class="prob-info">
          <span class="prob-icon">{{ prob.icon }}</span>
          <span class="prob-name">{{ prob.name }}</span>
        </div>
        <div class="prob-bar-container">
          <div
            class="prob-bar"
            :style="{ width: (prob.value * 100) + '%' }"
          ></div>
        </div>
        <span class="prob-value">{{ Math.round(prob.value * 100) }}%</span>
      </div>
    </div>

    <div class="tips-box">
      <h4>💡 策略建议</h4>
      <ul>
        <li v-if="probabilities.surge > 0.3">
          ⚠️ 客流突增风险较高，建议增加热门摊位人手
        </li>
        <li v-if="probabilities.shortage > 0.3">
          ⚠️ 缺货风险较高，建议提前补货
        </li>
        <li v-if="probabilities.detour > 0.3">
          ⚠️ 改道风险较高，分散库存和人员更安全
        </li>
        <li v-if="probabilities.fatigue > 0.3">
          ⚠️ 人员疲劳风险高，适当增加人手应对效率下降
        </li>
        <li v-if="allLowRisk">
          ✅ 本轮风险较低，可适当减少成本投入
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'

const gameStore = useGameStore()
const { currentProbabilities: probabilities } = storeToRefs(gameStore)

const probabilityItems = computed(() => [
  { key: 'surge', name: '客流突增', icon: '👥', value: probabilities.value.surge },
  { key: 'shortage', name: '热门品缺货', icon: '📦', value: probabilities.value.shortage },
  { key: 'detour', name: '临时改道', icon: '🔄', value: probabilities.value.detour },
  { key: 'fatigue', name: '人员疲劳', icon: '😴', value: probabilities.value.fatigue }
])

const allLowRisk = computed(() => 
  Object.values(probabilities.value).every(v => v <= 0.25)
)
</script>
