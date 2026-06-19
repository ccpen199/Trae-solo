import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { useAppStore } from './store'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  const { fetchUserInfo } = useAppStore()

  useLaunch(() => {
    fetchUserInfo()
  })

  return children
}

export default App
