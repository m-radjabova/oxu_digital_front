import { useContext } from 'react'
import ToastContext from '../context/ToastContext'

export default function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast faqat ToastProvider ichida ishlatilishi mumkin.')
  }
  return context
}
