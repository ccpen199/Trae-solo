import React from 'react'

function Header({ title, rightContent }) {
  return (
    <header className="header flex-between">
      <h1 className="header-title">{title}</h1>
      {rightContent && <div>{rightContent}</div>}
    </header>
  )
}

export default Header
