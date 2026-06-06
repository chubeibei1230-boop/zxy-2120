import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { ScoreRecord } from '@/types/game'

interface GameDB extends DBSchema {
  scores: {
    key: number
    value: ScoreRecord
    indexes: { 'by-timestamp': number; 'by-score': number }
  }
  backups: {
    key: number
    value: {
      id?: number
      name: string
      data: string
      timestamp: number
      date: string
    }
    indexes: { 'by-timestamp': number }
  }
}

const DB_NAME = 'exhibition-game-db'
const DB_VERSION = 1

let db: IDBPDatabase<GameDB> | null = null

async function initDB(): Promise<IDBPDatabase<GameDB>> {
  if (db) return db

  db = await openDB<GameDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('scores')) {
        const scoreStore = db.createObjectStore('scores', {
          keyPath: 'id',
          autoIncrement: true
        })
        scoreStore.createIndex('by-timestamp', 'timestamp')
        scoreStore.createIndex('by-score', 'score')
      }
      if (!db.objectStoreNames.contains('backups')) {
        const backupStore = db.createObjectStore('backups', {
          keyPath: 'id',
          autoIncrement: true
        })
        backupStore.createIndex('by-timestamp', 'timestamp')
      }
    }
  })

  return db
}

export async function saveScore(record: Omit<ScoreRecord, 'id'>): Promise<number> {
  const database = await initDB()
  return await database.add('scores', record)
}

export async function getScores(limit: number = 10): Promise<ScoreRecord[]> {
  const database = await initDB()
  const allScores = await database.getAllFromIndex('scores', 'by-score')
  return allScores.reverse().slice(0, limit)
}

export async function getAllScores(): Promise<ScoreRecord[]> {
  const database = await initDB()
  return await database.getAll('scores')
}

export async function deleteScore(id: number): Promise<void> {
  const database = await initDB()
  await database.delete('scores', id)
}

export async function clearScores(): Promise<void> {
  const database = await initDB()
  await database.clear('scores')
}

export async function saveBackup(name: string, data: unknown): Promise<number> {
  const database = await initDB()
  const now = Date.now()
  return await database.add('backups', {
    name,
    data: JSON.stringify(data),
    timestamp: now,
    date: new Date().toLocaleString('zh-CN')
  })
}

export async function getBackups(): Promise<Array<{
  id: number
  name: string
  timestamp: number
  date: string
}>> {
  const database = await initDB()
  const backups = await database.getAllFromIndex('backups', 'by-timestamp')
  return backups.reverse().map(b => ({
    id: b.id!,
    name: b.name,
    timestamp: b.timestamp,
    date: b.date
  }))
}

export async function getBackupData(id: number): Promise<unknown | null> {
  const database = await initDB()
  const backup = await database.get('backups', id)
  if (!backup) return null
  return JSON.parse(backup.data)
}

export async function deleteBackup(id: number): Promise<void> {
  const database = await initDB()
  await database.delete('backups', id)
}

export async function exportBackup(id: number): Promise<void> {
  const database = await initDB()
  const backup = await database.get('backups', id)
  if (!backup) return

  const blob = new Blob([backup.data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${backup.name}-${backup.timestamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importBackup(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        resolve(data)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}
