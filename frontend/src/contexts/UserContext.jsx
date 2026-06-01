import { createContext, useContext, useState } from 'react'

const UserContext = createContext(null)

const mockUsers = [
  { id: 'applicant1', name: '张三', role: 'applicant', roleName: '申请人' },
  { id: 'reviewer1', name: '李审核', role: 'reviewer', roleName: '信审员' },
  { id: 'risk1', name: '王风控', role: 'risk', roleName: '风控复核员' },
  { id: 'admin1', name: '赵管理', role: 'admin', roleName: '系统管理员' }
]

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(mockUsers[0])

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, mockUsers }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}

export default UserContext
