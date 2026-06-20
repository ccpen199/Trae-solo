import * as React from "react"
import { cn } from "@/lib/utils"

export interface Tag {
  id: string | number
  label: string
  weight?: number
  color?: "primary" | "secondary" | "success" | "warning" | "default"
}

export interface TagCloudProps extends React.HTMLAttributes<HTMLDivElement> {
  tags: Tag[]
  maxTags?: number
  animate?: boolean
  onTagClick?: (tag: Tag) => void
  sizeVariant?: "sm" | "md" | "lg"
}

const TagCloud = React.forwardRef<HTMLDivElement, TagCloudProps>(
  ({ className, tags, maxTags, animate = true, onTagClick, sizeVariant = "md", ...props }, ref) => {
    const displayTags = maxTags ? tags.slice(0, maxTags) : tags

    const colorVariants: Record<string, string> = {
      primary: "bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25 hover:border-rose-500/50",
      secondary: "bg-sapphire-500/15 text-sapphire-300 border-sapphire-500/30 hover:bg-sapphire-500/25 hover:border-sapphire-500/50",
      success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-500/50",
      warning: "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-500/50",
      default: "bg-midnight-700/50 text-midnight-200 border-midnight-600 hover:bg-midnight-700 hover:border-midnight-500",
    }

    const sizeVariants = {
      sm: {
        base: "text-xs px-2 py-1",
        weightMultiplier: 0.5,
      },
      md: {
        base: "text-sm px-3 py-1.5",
        weightMultiplier: 0.8,
      },
      lg: {
        base: "text-base px-4 py-2",
        weightMultiplier: 1.2,
      },
    }

    const maxWeight = Math.max(...tags.map(t => t.weight || 1), 1)

    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap gap-2", className)}
        {...props}
      >
        {displayTags.map((tag, index) => {
          const weight = tag.weight || 1
          const normalizedWeight = weight / maxWeight
          const fontSize = sizeVariants[sizeVariant].weightMultiplier * (0.8 + normalizedWeight * 0.4)
          const color = tag.color || "default"

          return (
            <span
              key={tag.id}
              onClick={() => onTagClick?.(tag)}
              className={cn(
                "inline-flex items-center rounded-full border font-medium transition-all duration-300 ease-out-expo cursor-pointer",
                colorVariants[color],
                sizeVariants[sizeVariant].base,
                animate && "animate-fade-in-up",
                onTagClick && "hover:scale-105 hover:-translate-y-0.5"
              )}
              style={{
                fontSize: `${fontSize}rem`,
                animationDelay: `${index * 50}ms`,
                opacity: 0,
              }}
            >
              {tag.label}
            </span>
          )
        })}
      </div>
    )
  }
)
TagCloud.displayName = "TagCloud"

export interface SkillTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string
  level?: number
  color?: "primary" | "secondary" | "success" | "warning" | "default"
  showLevel?: boolean
}

const SkillTag = React.forwardRef<HTMLSpanElement, SkillTagProps>(
  ({ className, label, level = 1, color = "primary", showLevel = false, ...props }, ref) => {
    const colorVariants: Record<string, string> = {
      primary: "bg-gradient-to-r from-rose-500/20 to-rose-500/10 text-rose-300 border-rose-500/40",
      secondary: "bg-gradient-to-r from-sapphire-500/20 to-sapphire-500/10 text-sapphire-300 border-sapphire-500/40",
      success: "bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-300 border-emerald-500/40",
      warning: "bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-300 border-amber-500/40",
      default: "bg-gradient-to-r from-midnight-600/50 to-midnight-700/50 text-midnight-200 border-midnight-500/40",
    }

    const levelDots = Array.from({ length: 5 }, (_, i) => i < level)

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-300 hover:scale-105",
          colorVariants[color],
          className
        )}
        {...props}
      >
        <span>{label}</span>
        {showLevel && (
          <span className="flex gap-0.5">
            {levelDots.map((filled, i) => (
              <span
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  filled ? "bg-current opacity-100" : "bg-current opacity-20"
                )}
              />
            ))}
          </span>
        )}
      </span>
    )
  }
)
SkillTag.displayName = "SkillTag"

export { TagCloud, SkillTag }
