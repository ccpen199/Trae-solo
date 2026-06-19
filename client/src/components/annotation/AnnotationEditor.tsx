import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "../ui/Card"
import { Button } from "../ui/Button"
import { Badge } from "../ui/Badge"
import { Progress } from "../ui/Progress"
import type { Task, TaskUnit, BoundingBox, PolygonPoint, AnnotationData } from "../../types"
import {
  MousePointer2,
  Square,
  PenTool,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
  X,
  Info,
  Layers,
} from "lucide-react"
import { cn } from "../../lib/utils"

type ToolType = "select" | "rect" | "polygon"

interface LabelClass {
  id: string
  name: string
  color: string
}

const labelClasses: LabelClass[] = [
  { id: "car", name: "汽车", color: "#ef4444" },
  { id: "person", name: "行人", color: "#22c55e" },
  { id: "truck", name: "卡车", color: "#3b82f6" },
  { id: "bus", name: "公交车", color: "#a855f7" },
  { id: "motorcycle", name: "摩托车", color: "#f59e0b" },
  { id: "bicycle", name: "自行车", color: "#14b8a6" },
  { id: "traffic_light", name: "交通灯", color: "#ec4899" },
  { id: "traffic_sign", name: "交通标志", color: "#6366f1" },
  { id: "building", name: "建筑", color: "#8b5cf6" },
  { id: "other", name: "其他", color: "#6b7280" },
]

interface AnnotationEditorProps {
  task: Task
  units: TaskUnit[]
  onClose: () => void
  onSubmit: (unitId: string, data: AnnotationData) => void
}

export function AnnotationEditor({ task, units, onClose, onSubmit }: AnnotationEditorProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [tool, setTool] = useState<ToolType>("select")
  const [selectedLabel, setSelectedLabel] = useState(labelClasses[0])
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([])
  const [polygons, setPolygons] = useState<PolygonPoint[][]>([])
  const [currentPolygon, setCurrentPolygon] = useState<PolygonPoint[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [tempRect, setTempRect] = useState<BoundingBox | null>(null)
  const [zoom, setZoom] = useState(100)
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null)
  const [selectedPolyIndex, setSelectedPolyIndex] = useState<number | null>(null)
  const [history, setHistory] = useState<{ boxes: BoundingBox[]; polys: PolygonPoint[][] }[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showTips, setShowTips] = useState(true)
  const [isAdversarialNotice, setIsAdversarialNotice] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const currentUnit = units[currentIndex]

  useEffect(() => {
    if (currentUnit) {
      setBoundingBoxes([])
      setPolygons([])
      setCurrentPolygon([])
      setHistory([])
      setHistoryIndex(-1)
      setSelectedBoxIndex(null)
      setSelectedPolyIndex(null)

      if (currentUnit.isAdversarial) {
        setIsAdversarialNotice(true)
        setTimeout(() => setIsAdversarialNotice(false), 3000)
      }
    }
  }, [currentIndex, currentUnit])

  const saveToHistory = useCallback(() => {
    const newEntry = { boxes: [...boundingBoxes], polys: [...polygons] }
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newEntry)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [boundingBoxes, polygons, history, historyIndex])

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setBoundingBoxes(history[newIndex].boxes)
      setPolygons(history[newIndex].polys)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setBoundingBoxes(history[newIndex].boxes)
      setPolygons(history[newIndex].polys)
    }
  }

  const getCanvasCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    }
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getCanvasCoords(e)

    if (tool === "rect") {
      setIsDrawing(true)
      setStartPoint(coords)
      setTempRect({
        id: "temp",
        label: selectedLabel.name,
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0,
      })
    } else if (tool === "polygon") {
      if (e.detail === 2) {
        if (currentPolygon.length > 2) {
          const newPolys = [...polygons, [...currentPolygon]]
          setPolygons(newPolys)
          setCurrentPolygon([])
          saveToHistory()
        }
      } else {
        setCurrentPolygon([...currentPolygon, coords])
      }
    } else if (tool === "select") {
      setSelectedBoxIndex(null)
      setSelectedPolyIndex(null)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || tool !== "rect" || !startPoint) return

    const coords = getCanvasCoords(e)
    setTempRect({
      id: "temp",
      label: selectedLabel.name,
      x: Math.min(startPoint.x, coords.x),
      y: Math.min(startPoint.y, coords.y),
      width: Math.abs(coords.x - startPoint.x),
      height: Math.abs(coords.y - startPoint.y),
    })
  }

  const handleCanvasMouseUp = () => {
    if (isDrawing && tool === "rect" && tempRect && tempRect.width > 1 && tempRect.height > 1) {
      const newBox: BoundingBox = {
        ...tempRect,
        id: `box-${Date.now()}`,
      }
      const newBoxes = [...boundingBoxes, newBox]
      setBoundingBoxes(newBoxes)
      saveToHistory()
    }
    setIsDrawing(false)
    setStartPoint(null)
    setTempRect(null)
  }

  const handleDeleteSelected = () => {
    if (selectedBoxIndex !== null) {
      const newBoxes = boundingBoxes.filter((_, i) => i !== selectedBoxIndex)
      setBoundingBoxes(newBoxes)
      setSelectedBoxIndex(null)
      saveToHistory()
    }
    if (selectedPolyIndex !== null) {
      const newPolys = polygons.filter((_, i) => i !== selectedPolyIndex)
      setPolygons(newPolys)
      setSelectedPolyIndex(null)
      saveToHistory()
    }
  }

  const handleClearAll = () => {
    setBoundingBoxes([])
    setPolygons([])
    setCurrentPolygon([])
    setSelectedBoxIndex(null)
    setSelectedPolyIndex(null)
    saveToHistory()
  }

  const handleSubmit = () => {
    const data: AnnotationData = {
      boundingBoxes,
      polygons,
      labels: labelClasses.filter((lc) =>
        boundingBoxes.some((bb) => bb.label === lc.name)
      ),
    }
    onSubmit(currentUnit.id, data)
    if (currentIndex < units.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      onClose()
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  const goToNext = () => {
    if (currentIndex < units.length - 1) setCurrentIndex(currentIndex + 1)
  }

  const progress = ((currentIndex + 1) / units.length) * 100

  if (!currentUnit) return null

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b px-6 py-3 flex items-center justify-between bg-card/50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ChevronLeft className="w-4 h-4" />
            返回
          </Button>
          <div>
            <h2 className="font-semibold">{task.title}</h2>
            <p className="text-xs text-muted-foreground">
              第 {currentIndex + 1} / {units.length} 条
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Progress value={progress} className="w-48 h-2" />
          {currentUnit.isAdversarial && (
            <Badge variant="warning" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              质检样本
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-16 border-r bg-card/30 flex flex-col items-center py-4 gap-1">
          <ToolButton
            active={tool === "select"}
            onClick={() => setTool("select")}
            icon={<MousePointer2 className="w-5 h-5" />}
            tooltip="选择工具"
          />
          <ToolButton
            active={tool === "rect"}
            onClick={() => setTool("rect")}
            icon={<Square className="w-5 h-5" />}
            tooltip="矩形框选"
          />
          <ToolButton
            active={tool === "polygon"}
            onClick={() => setTool("polygon")}
            icon={<PenTool className="w-5 h-5" />}
            tooltip="多边形分割"
          />

          <div className="w-8 h-px bg-border my-2" />

          <ToolButton
            onClick={handleUndo}
            icon={<Undo2 className="w-5 h-5" />}
            tooltip="撤销"
            disabled={historyIndex <= 0}
          />
          <ToolButton
            onClick={handleRedo}
            icon={<Redo2 className="w-5 h-5" />}
            tooltip="重做"
            disabled={historyIndex >= history.length - 1}
          />

          <div className="w-8 h-px bg-border my-2" />

          <ToolButton
            onClick={() => setZoom(Math.min(zoom + 10, 200))}
            icon={<ZoomIn className="w-5 h-5" />}
            tooltip="放大"
          />
          <ToolButton
            onClick={() => setZoom(Math.max(zoom - 10, 50))}
            icon={<ZoomOut className="w-5 h-5" />}
            tooltip="缩小"
          />
          <ToolButton
            onClick={() => setZoom(100)}
            icon={<RotateCcw className="w-5 h-5" />}
            tooltip="重置视图"
          />

          <div className="w-8 h-px bg-border my-2" />

          <ToolButton
            onClick={handleDeleteSelected}
            icon={<Trash2 className="w-5 h-5" />}
            tooltip="删除选中"
            danger
            disabled={selectedBoxIndex === null && selectedPolyIndex === null}
          />
        </div>

        <div className="flex-1 overflow-auto p-6 bg-muted/30">
          <div
            ref={canvasRef}
            className={cn(
              "relative mx-auto bg-black rounded-lg overflow-hidden shadow-2xl select-none",
              tool === "select" && "cursor-default",
              tool === "rect" && "cursor-crosshair",
              tool === "polygon" && "cursor-crosshair"
            )}
            style={{
              width: `${zoom}%`,
              maxWidth: "100%",
              aspectRatio: "4/3",
              minWidth: "300px",
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            <img
              src={currentUnit.content.imageUrl}
              alt=""
              className="w-full h-full object-contain bg-black"
              draggable={false}
            />

            {boundingBoxes.map((box, index) => (
              <div
                key={box.id}
                className={cn(
                  "absolute border-2 cursor-pointer transition-all",
                  selectedBoxIndex === index
                    ? "border-yellow-400 ring-2 ring-yellow-400/50"
                    : "hover:border-white/80"
                )}
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                  borderColor: selectedBoxIndex === index ? undefined : getLabelColor(box.label),
                  backgroundColor: `${getLabelColor(box.label)}20`,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (tool === "select") {
                    setSelectedBoxIndex(index)
                    setSelectedPolyIndex(null)
                  }
                }}
              >
                <span
                  className="absolute -top-5 left-0 px-1.5 py-0.5 text-xs text-white rounded-t font-medium"
                  style={{ backgroundColor: getLabelColor(box.label) }}
                >
                  {box.label}
                </span>
              </div>
            ))}

            {polygons.map((poly, pIndex) => (
              <svg
                key={pIndex}
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <polygon
                  points={poly.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill={`${getLabelColor("汽车")}30`}
                  stroke={selectedPolyIndex === pIndex ? "#facc15" : getLabelColor("汽车")}
                  strokeWidth={selectedPolyIndex === pIndex ? 0.5 : 0.3}
                  className={cn(
                    "cursor-pointer pointer-events-auto",
                    selectedPolyIndex === pIndex && "drop-shadow-lg"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (tool === "select") {
                      setSelectedPolyIndex(pIndex)
                      setSelectedBoxIndex(null)
                    }
                  }}
                />
              </svg>
            ))}

            {currentPolygon.length > 0 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {currentPolygon.map((point, i) => (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r={0.8}
                    fill="white"
                    stroke={selectedLabel.color}
                    strokeWidth={0.3}
                  />
                ))}
                {currentPolygon.length > 1 && (
                  <polyline
                    points={currentPolygon.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke={selectedLabel.color}
                    strokeWidth={0.3}
                    strokeDasharray="1,0.5"
                  />
                )}
              </svg>
            )}

            {tempRect && (
              <div
                className="absolute border-2 border-dashed border-white pointer-events-none"
                style={{
                  left: `${tempRect.x}%`,
                  top: `${tempRect.y}%`,
                  width: `${tempRect.width}%`,
                  height: `${tempRect.height}%`,
                  backgroundColor: `${selectedLabel.color}30`,
                }}
              />
            )}

            {isAdversarialNotice && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg animate-pulse-soft">
                <AlertTriangle className="w-5 h-5" />
                这是一条质检样本，请认真标注
              </div>
            )}
          </div>
        </div>

        <div className="w-72 border-l bg-card/30 flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              标签类别
            </h3>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto scrollbar-thin">
              {labelClasses.map((label) => (
                <button
                  key={label.id}
                  onClick={() => setSelectedLabel(label)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all",
                    selectedLabel.id === label.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-accent"
                  )}
                >
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="truncate">{label.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
            <h3 className="font-semibold text-sm mb-3">标注列表</h3>
            {boundingBoxes.length === 0 && polygons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>暂无标注</p>
                <p className="text-xs mt-1">使用左侧工具开始标注</p>
              </div>
            ) : (
              <div className="space-y-2">
                {boundingBoxes.map((box, index) => (
                  <div
                    key={box.id}
                    className={cn(
                      "p-2 rounded-lg border cursor-pointer transition-colors text-sm",
                      selectedBoxIndex === index
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-accent/50"
                    )}
                    onClick={() => {
                      setSelectedBoxIndex(index)
                      setSelectedPolyIndex(null)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: getLabelColor(box.label) }}
                      />
                      <span className="flex-1 truncate">{box.label}</span>
                      <span className="text-xs text-muted-foreground">矩形</span>
                    </div>
                  </div>
                ))}
                {polygons.map((poly, index) => (
                  <div
                    key={`poly-${index}`}
                    className={cn(
                      "p-2 rounded-lg border cursor-pointer transition-colors text-sm",
                      selectedPolyIndex === index
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-accent/50"
                    )}
                    onClick={() => {
                      setSelectedPolyIndex(index)
                      setSelectedBoxIndex(null)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <PenTool className="w-3 h-3 text-primary" />
                      <span className="flex-1 truncate">多边形 #{index + 1}</span>
                      <span className="text-xs text-muted-foreground">{poly.length}点</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-card/50 space-y-3">
            <div className="text-xs text-muted-foreground">
              快捷键：矩形(R) · 多边形(P) · 选择(V) · 删除(Del)
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleClearAll}>
                <X className="w-4 h-4" />
                清空
              </Button>
              <Button className="flex-1" onClick={handleSubmit}>
                <Check className="w-4 h-4" />
                提交
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t px-6 py-3 bg-card/50 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={goToPrev} disabled={currentIndex === 0}>
          <ChevronLeft className="w-4 h-4" />
          上一条
        </Button>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            当前已标注 {boundingBoxes.length + polygons.length} 个目标
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNext}
          disabled={currentIndex === units.length - 1}
        >
          下一条
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function ToolButton({
  active,
  onClick,
  icon,
  tooltip,
  danger,
  disabled,
}: {
  active?: boolean
  onClick: () => void
  icon: React.ReactNode
  tooltip: string
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
        active && "bg-primary text-primary-foreground shadow-md",
        !active && !danger && !disabled && "hover:bg-accent text-muted-foreground hover:text-foreground",
        danger && !disabled && "text-destructive hover:bg-destructive/10",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {icon}
    </button>
  )
}

function getLabelColor(label: string): string {
  const found = labelClasses.find((l) => l.name === label)
  return found?.color || "#6b7280"
}
