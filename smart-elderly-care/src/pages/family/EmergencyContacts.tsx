import { useState } from 'react'
import { ChevronDown, Phone, Plus, X, User, Star } from 'lucide-react'
import { elderProfiles } from '../../data/mockData'
import type { ElderProfile, EmergencyContact } from '../../types'

interface NewContact {
  name: string
  relationship: string
  phone: string
  level: number
}

export default function EmergencyContacts() {
  const [selectedElderId, setSelectedElderId] = useState(elderProfiles[0].id)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [newContact, setNewContact] = useState<NewContact>({ name: '', relationship: '', phone: '', level: 1 })

  const elder = elderProfiles.find((e) => e.id === selectedElderId) as ElderProfile
  const contacts = elder.emergencyContacts
  const primaryContacts = contacts.filter((c) => c.level === 1)
  const secondaryContacts = contacts.filter((c) => c.level === 2)

  const handleAddContact = () => {
    setShowModal(false)
    setNewContact({ name: '', relationship: '', phone: '', level: 1 })
  }

  const contactNode = (contact: EmergencyContact, isPrimary: boolean) => (
    <div className="flex flex-col items-center" key={contact.id}>
      <div className={`rounded-2xl flex flex-col items-center justify-center p-4 shadow-sm border ${
        isPrimary
          ? 'w-32 h-32 bg-elderly-50 border-elderly-200'
          : 'w-28 h-28 bg-blue-50 border-blue-100'
      }`}>
        <div className={`rounded-full flex items-center justify-center mb-2 ${
          isPrimary ? 'w-12 h-12 bg-elderly-200' : 'w-10 h-10 bg-blue-200'
        }`}>
          <User className={`w-5 h-5 ${isPrimary ? 'text-elderly-600' : 'text-blue-600'}`} />
        </div>
        <span className={`font-semibold ${isPrimary ? 'text-sm' : 'text-xs'} text-slate-800`}>{contact.name}</span>
        <span className="text-xs text-slate-400 mt-0.5">{contact.relationship}</span>
        <div className="flex items-center gap-1 mt-1">
          <Phone className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-500">{contact.phone}</span>
        </div>
        <div className="flex items-center gap-0.5 mt-1">
          {Array.from({ length: contact.level }).map((_, i) => (
            <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
          ))}
          <span className="text-xs text-slate-400 ml-1">
            {contact.level === 1 ? '首要' : '次要'}
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">紧急联系人</h2>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-elderly-300 transition-colors"
          >
            <div className="w-7 h-7 bg-elderly-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-elderly-500">{elder.name[0]}</span>
            </div>
            <span className="text-sm font-medium text-slate-700">{elder.name}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
              {elderProfiles.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelectedElderId(e.id)
                    setDropdownOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-elderly-50 transition-colors ${
                    e.id === selectedElderId ? 'bg-elderly-50 text-elderly-600 font-medium' : 'text-slate-700'
                  }`}
                >
                  <div className="w-6 h-6 bg-elderly-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-elderly-500">{e.name[0]}</span>
                  </div>
                  {e.name}（{e.age}岁）
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-br from-elderly-300 to-elderly-500 rounded-full flex items-center justify-center shadow-lg mb-3">
            <span className="text-3xl font-bold text-white">{elder.name[0]}</span>
          </div>
          <span className="text-lg font-bold text-slate-800">{elder.name}</span>
          <span className="text-sm text-slate-400">{elder.age}岁</span>
        </div>

        <div className="mt-8 flex flex-col items-center">
          {primaryContacts.length > 0 && (
            <div className="w-full">
              <div className="flex items-center justify-center gap-2 mb-4">
                {primaryContacts.map((_, i) => (
                  <div key={i} className="w-0.5 h-8 bg-elderly-300" />
                ))}
              </div>
              <div className="flex justify-center gap-4 flex-wrap">
                {primaryContacts.map((c) => contactNode(c, true))}
              </div>
            </div>
          )}

          {secondaryContacts.length > 0 && (
            <div className="w-full mt-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                {secondaryContacts.map((_, i) => (
                  <div key={i} className="w-0.5 h-6 bg-blue-200" />
                ))}
              </div>
              <div className="flex justify-center gap-4 flex-wrap">
                {secondaryContacts.map((c) => contactNode(c, false))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-700">联系人列表</h3>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-elderly-500 text-white text-sm rounded-lg hover:bg-elderly-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加联系人
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">姓名</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">关系</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">电话</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">优先级</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      contact.level === 1 ? 'bg-elderly-100' : 'bg-blue-100'
                    }`}>
                      <User className={`w-3.5 h-3.5 ${contact.level === 1 ? 'text-elderly-500' : 'text-blue-500'}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{contact.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-slate-600">{contact.relationship}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm text-slate-600">{contact.phone}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    contact.level === 1 ? 'bg-elderly-100 text-elderly-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {contact.level === 1 ? '首要' : '次要'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="text-xs text-elderly-500 hover:text-elderly-600 font-medium">编辑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-800">添加联系人</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">姓名</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-elderly-300 focus:border-elderly-300"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">关系</label>
                <input
                  type="text"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-elderly-300 focus:border-elderly-300"
                  placeholder="如: 儿子、女儿、儿媳"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">电话</label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-elderly-300 focus:border-elderly-300"
                  placeholder="请输入手机号码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">优先级</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNewContact({ ...newContact, level: 1 })}
                    className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
                      newContact.level === 1
                        ? 'bg-elderly-500 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    首要联系人
                  </button>
                  <button
                    onClick={() => setNewContact({ ...newContact, level: 2 })}
                    className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
                      newContact.level === 2
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    次要联系人
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddContact}
                className="flex-1 py-2.5 bg-elderly-500 text-white rounded-lg text-sm font-medium hover:bg-elderly-400 transition-colors"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
