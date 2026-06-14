import { Layout } from 'antd'
import { APP_TITLE } from '@/utils/constants'

const { Footer: AntFooter } = Layout

const Footer = () => {
  return (
    <AntFooter className="text-center bg-gray-50 text-gray-500 py-4">
      <p className="m-0">© {new Date().getFullYear()} {APP_TITLE} All Rights Reserved</p>
    </AntFooter>
  )
}

export default Footer
