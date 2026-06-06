<template>
  <div class="backup-panel">
    <div class="panel-header">
      <span class="panel-icon">💾</span>
      <h3>数据备份</h3>
    </div>

    <div class="backup-actions">
      <button class="btn btn-small btn-primary" @click="handleSaveBackup">
        💾 保存当前进度
      </button>
      <label class="btn btn-small btn-secondary file-label">
        📂 导入备份
        <input type="file" accept=".json" @change="handleImport" hidden ref="fileInput" />
      </label>
    </div>

    <div class="backup-list" v-if="backups.length > 0">
      <div v-for="backup in backups" :key="backup.id" class="backup-item">
        <div class="backup-info">
          <span class="backup-name">{{ backup.name }}</span>
          <span class="backup-date">{{ backup.date }}</span>
        </div>
        <div class="backup-actions">
          <button class="btn-icon" title="加载" @click="handleLoad(backup.id)">📂</button>
          <button class="btn-icon" title="导出" @click="handleExport(backup.id)">⬇️</button>
          <button class="btn-icon danger" title="删除" @click="handleDelete(backup.id)">🗑️</button>
        </div>
      </div>
    </div>
    <div v-else class="no-backups">
      <p>暂无备份记录</p>
    </div>

    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { saveBackup, getBackups, getBackupData, deleteBackup, exportBackup, importBackup } from '@/utils/storage'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'

const gameStore = useGameStore()
const { round, totalMoney, booths, history } = storeToRefs(gameStore)

const backups = ref<Array<{ id: number; name: string; timestamp: number; date: string }>>([])
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const fileInput = ref<HTMLInputElement | null>(null)

async function loadBackups() {
  backups.value = await getBackups()
}

function showMessage(text: string, type: 'success' | 'error') {
  message.value = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}

async function handleSaveBackup() {
  const name = `第${round.value}轮-¥${totalMoney.value}`
  const data = {
    round: round.value,
    totalMoney: totalMoney.value,
    booths: booths.value,
    history: history.value
  }
  await saveBackup(name, data)
  await loadBackups()
  showMessage('备份保存成功！', 'success')
}

async function handleLoad(id: number) {
  const data = await getBackupData(id) as any
  if (!data) return
  
  round.value = data.round
  totalMoney.value = data.totalMoney
  booths.value = data.booths
  history.value = data.history
  gameStore.initStrategy()
  
  showMessage('备份加载成功！', 'success')
}

async function handleExport(id: number) {
  await exportBackup(id)
  showMessage('备份已导出！', 'success')
}

async function handleDelete(id: number) {
  await deleteBackup(id)
  await loadBackups()
  showMessage('备份已删除！', 'success')
}

async function handleImport(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  try {
    const data = await importBackup(file) as any
    round.value = data.round
    totalMoney.value = data.totalMoney
    booths.value = data.booths
    history.value = data.history
    gameStore.initStrategy()
    showMessage('备份导入成功！', 'success')
  } catch {
    showMessage('导入失败，文件格式错误', 'error')
  }
  
  if (input) input.value = ''
}

onMounted(() => {
  loadBackups()
})
</script>
