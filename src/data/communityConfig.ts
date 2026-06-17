import type { PostCategory } from "../../shared/types";
import {
  Stethoscope,
  BookOpen,
  HelpCircle,
  LayoutGrid,
} from "lucide-react";

export const CATEGORY_TABS: {
  key: PostCategory | "all";
  label: string;
  icon: typeof Stethoscope;
  color: string;
}[] = [
  { key: "all", label: "全部", icon: LayoutGrid, color: "text-warm-brown" },
  { key: "vet-article", label: "兽医科普", icon: Stethoscope, color: "text-brand-mint-dark" },
  { key: "story", label: "故事", icon: BookOpen, color: "text-brand-orange-dark" },
  { key: "question", label: "问答", icon: HelpCircle, color: "text-amber-700" },
];

export const CATEGORY_BADGE: Record<string, { bg: string; text: string }> = {
  "vet-article": { bg: "bg-brand-mint/15", text: "text-brand-mint-dark" },
  story: { bg: "bg-brand-orange/15", text: "text-brand-orange-dark" },
  question: { bg: "bg-accent-sunny/30", text: "text-amber-700" },
  knowledge: { bg: "bg-accent-sky/20", text: "text-sky-700" },
};

export const CATEGORY_LABEL: Record<string, string> = {
  "vet-article": "兽医科普",
  story: "养宠故事",
  question: "求助问答",
  knowledge: "知识分享",
};

export const VET_AVATAR =
  "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20veterinarian%20doctor%20portrait%20in%20white%20coat%20friendly%20smile%20clinic%20background&image_size=square";
