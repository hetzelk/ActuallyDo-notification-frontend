import { useEffect } from 'react'

interface KeyboardShortcuts {
  onNewTask?: () => void
  onSwitchTab?: (tab: string) => void
}

const TAB_MAP: Record<string, string> = {
  '1': 'active',
  '2': 'backlog',
  '3': 'completed',
}

export function useKeyboardShortcuts({ onNewTask, onSwitchTab }: KeyboardShortcuts) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }

      // Ignore if modifier keys are held (except shift for ?)
      if (e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key === 'n' && onNewTask) {
        e.preventDefault()
        onNewTask()
        return
      }

      if (e.key in TAB_MAP && onSwitchTab) {
        e.preventDefault()
        onSwitchTab(TAB_MAP[e.key])
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNewTask, onSwitchTab])
}
