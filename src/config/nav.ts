import {
  Home,
  CreditCard,
  Repeat,
  Bell,
  FileText,
  RefreshCcw,
  Wallet,
  ShieldCheck,
  Calculator,
  Signature,
  Lock,
  BarChart3,
  Building2,
  Gift,
  Search,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  group?: string;
}

export const NAV_GROUPS = ["工作台", "缴费核心", "普惠金融", "运营管理"];

export const NAV_ITEMS: NavItem[] = [
  { label: "平台首页", path: "/", icon: Home, group: "工作台" },

  { label: "缴费中心", path: "/payment", icon: CreditCard, group: "缴费核心" },
  { label: "代扣签约", path: "/payment/auto-deduct", icon: Repeat, group: "缴费核心" },
  { label: "缴费提醒", path: "/payment/reminder", icon: Bell, group: "缴费核心" },
  { label: "电子发票", path: "/payment/invoice", icon: FileText, group: "缴费核心" },
  { label: "错缴冲正", path: "/payment/correction", icon: RefreshCcw, group: "缴费核心" },

  { label: "金融超市", path: "/finance", icon: Wallet, group: "普惠金融" },
  { label: "风险测评", path: "/finance/risk-assessment", icon: ShieldCheck, group: "普惠金融" },
  { label: "额度试算", path: "/finance/calculator", icon: Calculator, group: "普惠金融" },
  { label: "合同签署", path: "/finance/contract", icon: Signature, group: "普惠金融" },
  { label: "资金监管", path: "/finance/fund-supervision", icon: Lock, group: "普惠金融" },

  { label: "数据资产中心", path: "/data-center", icon: BarChart3, group: "运营管理" },
  { label: "商户分润结算", path: "/merchant", icon: Building2, group: "运营管理" },
  { label: "优惠活动配置", path: "/promotion", icon: Gift, group: "运营管理" },
  { label: "缴费诊断知识库", path: "/diagnosis", icon: Search, group: "运营管理" },
];
