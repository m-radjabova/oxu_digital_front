import { useContext } from 'react'
import TelegramContext from '../context/TelegramContext'

export default function useTelegram() {
  const context = useContext(TelegramContext)
  if (!context) throw new Error('useTelegram faqat TelegramProvider ichida ishlatiladi.')
  return context
}
