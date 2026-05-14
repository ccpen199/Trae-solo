import { Layout } from 'antd'

const { Content } = Layout

const AuthLayout = ({ children }) => {
  return (
    <Layout style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Content>
        {children}
      </Content>
    </Layout>
  )
}

export default AuthLayout
