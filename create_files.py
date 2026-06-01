
import os

comp_dir = "frontend/src/components"

files = {
    "OnboardingPage.jsx": """
import React from react

export default function OnboardingPage({ onComplete }) {
  return (
    <div style={{ minHeight: 100vh, display: flex, flexDirection: column }}>
      <div style={{ flex: 1, display: flex, flexDirection: column, alignItems: center, justifyContent: center, padding: 40px, textAlign: center }}>
        <div style={{ fontSize: 80px, marginBottom: 32px }}>🎬</div>
        <h2 style={{ fontSize: 24px, fontWeight: bold, marginBottom: 12px }}>海量影片</h2>
        <p style={{ fontSize: 16px, color: #666, lineHeight: 1.6 }}>热映大片、即将上映、经典佳作，应有尽有</p>
      </div>
      <div style={{ padding: 32px }}>
        <button onClick={() => { localStorage.setItem(hasSeenOnboarding, true); onComplete() }} style={{ width: 100%, paddin        <button onClick={() => { localStorage.setItem(hasSeene,        <button onClick={() =>: 16px, cursor: pointer }}>开始体验</button>
      </div>
    </div>
  )
}
""",
}

for name, content in files.items():
    with open(os.path.join(comp_dir, name), w) as f:
        f.write(content.strip())
    print(f"Created {name}")

