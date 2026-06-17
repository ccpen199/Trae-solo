import { useState } from "react";
import { motion as m } from "framer-motion";
import { Crown, UserCog, Users, Shield, Award, Hash, Calendar, Vote, RotateCcw } from "lucide-react";
import { Card, CardContent, Button, Badge, Modal } from "@/components/ui";
import { useAppStore } from "@/stores";
import { formatDate } from "@/utils";
import type { CouncilMember } from "@/types";

const positionMap = {
  director: { label: "主任", icon: Crown, variant: "primary" as const },
  vice_director: { label: "副主任", icon: UserCog, variant: "info" as const },
  member: { label: "委员", icon: Users, variant: "secondary" as const },
  supervisor: { label: "监事", icon: Shield, variant: "warning" as const },
};

export default function CouncilManagement() {
  const councilMembers = useAppStore((s) => s.councilMembers);
  const [selectedMember, setSelectedMember] = useState<CouncilMember | null>(null);
  const [hashModalOpen, setHashModalOpen] = useState(false);

  const currentTerm = councilMembers.filter((m) => m.isCurrent);
  const historyTerms = councilMembers.filter((m) => !m.isCurrent);

  const MemberCard = ({ member }: { member: CouncilMember }) => {
    const pos = positionMap[member.position];
    const Icon = pos.icon;
    return (
      <m.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-5 text-white shadow-lg shadow-primary-500/20"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={member.avatar} alt={member.name} className="w-14 h-14 rounded-xl border-2 border-white/30" />
            <div>
              <h3 className="font-bold text-lg">{member.name}</h3>
              <Badge variant="default" className="mt-1 bg-white/20 border-0 text-white">
                <Icon className="w-3 h-3 mr-1" />{pos.label}
              </Badge>
            </div>
          </div>
          <Award className="w-6 h-6 text-white/60" />
        </div>
        <div className="space-y-2 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>任期：{formatDate(member.termStart)} - {formatDate(member.termEnd)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Vote className="w-4 h-4" />
            <span>选举得票：{member.votes} 票</span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="default"
            size="sm"
            leftIcon={<Hash className="w-4 h-4" />}
            className="flex-1 bg-white/20 hover:bg-white/30 border-0 text-white"
            onClick={() => { setSelectedMember(member); setHashModalOpen(true); }}
          >
            链上存证
          </Button>
        </div>
      </m.div>
    );
  };

  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">业委会管理</h2>
        <Button variant="primary" leftIcon={<RotateCcw className="w-4 h-4" />}>换届选举</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary-600" />
            当前任期委员
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentTerm.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            历史任期
          </h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
            <div className="space-y-4">
              {historyTerms.map((member, idx) => {
                const pos = positionMap[member.position];
                const Icon = pos.icon;
                return (
                  <div key={member.id} className="relative pl-10">
                    <div className="absolute left-2 top-2 w-5 h-5 rounded-full bg-primary-500 border-4 border-white shadow" />
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-lg" />
                          <div>
                            <h4 className="font-semibold">{member.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Badge variant={pos.variant} size="sm">
                                <Icon className="w-3 h-3 mr-1" />{pos.label}
                              </Badge>
                              <span>{formatDate(member.termStart)} - {formatDate(member.termEnd)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{member.votes} 票</p>
                          <p className="text-xs text-slate-500">第 {idx + 1} 届</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={hashModalOpen}
        onClose={() => setHashModalOpen(false)}
        title="选举投票链上存证"
        size="md"
        footer={<Button variant="primary" onClick={() => setHashModalOpen(false)}>关闭</Button>}
      >
        {selectedMember && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
              <img src={selectedMember.avatar} alt={selectedMember.name} className="w-12 h-12 rounded-lg" />
              <div>
                <h4 className="font-semibold">{selectedMember.name}</h4>
                <p className="text-sm text-slate-500">{positionMap[selectedMember.position].label} · {selectedMember.votes} 票</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">区块链交易哈希</p>
              <div className="p-3 bg-slate-900 rounded-lg font-mono text-sm text-emerald-400 break-all">
                {selectedMember.blockchainHash || "0x7a3f2c8e9b1d4e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-500">区块高度</p>
                <p className="font-medium">18,234,567</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-500">时间戳</p>
                <p className="font-medium">{formatDate(selectedMember.termStart)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </m.div>
  );
}
