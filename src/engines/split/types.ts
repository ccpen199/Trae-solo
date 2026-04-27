import { 
  SplitContext, 
  SplitComponent, 
  MaterialBomItem, 
  HardwareBomItem, 
  ProcessingInstruction,
  Dimensions
} from '../../types';

export interface SplitInput {
  orderId: string;
  designId: string;
  designData: DesignData;
  materialPreferences?: MaterialPreference[];
  hardwarePreferences?: HardwarePreference[];
}

export interface DesignData {
  furnitureType: FurnitureType;
  style: string;
  components: DesignComponent[];
  overallDimensions: Dimensions;
  assemblyRules: AssemblyRule[];
  materials: DesignMaterial[];
  hardware: DesignHardware[];
}

export type FurnitureType = 
  | 'CABINET'
  | 'WARDROBE'
  | 'DRAWER'
  | 'DESK'
  | 'BOOKSHELF'
  | 'BED'
  | 'DINING_TABLE'
  | 'COFFEE_TABLE'
  | 'TV_CABINET'
  | 'CUSTOM';

export interface DesignComponent {
  id: string;
  name: string;
  type: ComponentType;
  dimensions: Dimensions;
  material: ComponentMaterial;
  hardware: ComponentHardware[];
  processing: ComponentProcessing[];
  parentId: string | null;
  position: ComponentPosition;
  orientation: ComponentOrientation;
  assemblyGroup: string;
  notes: string;
}

export type ComponentType =
  | 'PANEL'
  | 'DOOR'
  | 'DRAWER_FRONT'
  | 'DRAWER_BOX'
  | 'SHELF'
  | 'TOP_PANEL'
  | 'BOTTOM_PANEL'
  | 'LEFT_PANEL'
  | 'RIGHT_PANEL'
  | 'BACK_PANEL'
  | 'PARTITION'
  | 'LEG'
  | 'FRAME'
  | 'TRIM'
  | 'CUSTOM';

export interface ComponentMaterial {
  materialId: string;
  materialName: string;
  thickness: number;
  edgeBanding: EdgeBandingConfig;
  surfaceTreatment: SurfaceTreatment;
}

export interface EdgeBandingConfig {
  top: EdgeBandingDetail;
  bottom: EdgeBandingDetail;
  left: EdgeBandingDetail;
  right: EdgeBandingDetail;
}

export interface EdgeBandingDetail {
  enabled: boolean;
  material: string;
  thickness: number;
  color: string;
}

export interface SurfaceTreatment {
  type: 'PAINT' | 'VENEER' | 'LAMINATE' | 'NONE';
  color: string;
  finish: 'MATTE' | 'SEMI_GLOSS' | 'GLOSS';
}

export interface ComponentHardware {
  hardwareId: string;
  hardwareName: string;
  type: string;
  quantity: number;
  positions: HardwarePosition[];
}

export interface HardwarePosition {
  x: number;
  y: number;
  z: number;
  orientation: string;
  side: 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT' | 'FRONT' | 'BACK';
}

export interface ComponentProcessing {
  type: ProcessingType;
  parameters: ProcessingParameters;
  notes: string;
}

export type ProcessingType =
  | 'CUTTING'
  | 'EDGE_BANDING'
  | 'DRILLING'
  | 'GROOVING'
  | 'MORTISE'
  | 'TENON'
  | 'ROUTING'
  | 'SANDING'
  | 'CUSTOM';

export interface ProcessingParameters {
  [key: string]: any;
}

export interface ComponentPosition {
  x: number;
  y: number;
  z: number;
}

export interface ComponentOrientation {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

export interface AssemblyRule {
  id: string;
  name: string;
  type: AssemblyRuleType;
  components: string[];
  parameters: Record<string, any>;
  priority: number;
}

export type AssemblyRuleType =
  | 'HINGE'
  | 'SLIDE'
  | 'SCREW'
  | 'DOWEL'
  | 'CAM_LOCK'
  | 'GLUE'
  | 'CUSTOM';

export interface DesignMaterial {
  materialId: string;
  name: string;
  type: string;
  thickness: number;
  color: string;
  finish: string;
  supplierId: string;
}

export interface DesignHardware {
  hardwareId: string;
  name: string;
  type: string;
  model: string;
  supplierId: string;
}

export interface MaterialPreference {
  materialType: string;
  preferredMaterialId: string;
  priority: number;
}

export interface HardwarePreference {
  hardwareType: string;
  preferredHardwareId: string;
  priority: number;
}

export interface SplitResult {
  orderId: string;
  designId: string;
  components: SplitComponent[];
  materialBom: MaterialBomItem[];
  hardwareBom: HardwareBomItem[];
  processingInstructions: ProcessingInstruction[];
  assemblyInstructions: AssemblyInstruction[];
  cuttingList: CuttingListItem[];
  nestingLayout: NestingLayout[];
  validationResult: SplitValidationResult;
  metadata: SplitMetadata;
}

export interface AssemblyInstruction {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  components: string[];
  hardware: string[];
  tools: string[];
  estimatedTime: number;
  diagramUrl: string;
  warnings: string[];
}

export interface CuttingListItem {
  id: string;
  componentId: string;
  materialId: string;
  materialName: string;
  width: number;
  height: number;
  thickness: number;
  quantity: number;
  grainDirection: 'LENGTH' | 'WIDTH';
  priority: number;
  notes: string;
}

export interface NestingLayout {
  id: string;
  sheetId: string;
  sheetDimensions: Dimensions;
  materialId: string;
  placements: NestingPlacement[];
  wastePercentage: number;
  optimizedBy: string;
  optimizedAt: Date;
}

export interface NestingPlacement {
  componentId: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
}

export interface SplitValidationResult {
  isValid: boolean;
  errors: SplitValidationError[];
  warnings: SplitValidationWarning[];
  componentValidations: ComponentValidation[];
}

export interface SplitValidationError {
  code: string;
  message: string;
  componentId?: string;
  field?: string;
  value?: any;
}

export interface SplitValidationWarning {
  code: string;
  message: string;
  componentId?: string;
  suggestions: string[];
}

export interface ComponentValidation {
  componentId: string;
  componentName: string;
  isValid: boolean;
  errors: SplitValidationError[];
  warnings: SplitValidationWarning[];
}

export interface SplitMetadata {
  splitAt: Date;
  splitBy: string;
  splitterId: string;
  splitEngineVersion: string;
  optimizationLevel: OptimizationLevel;
  totalComponents: number;
  totalMaterials: number;
  totalHardware: number;
  estimatedProductionTime: number;
}

export type OptimizationLevel = 'BASIC' | 'STANDARD' | 'ADVANCED';

export interface SplitConfig {
  optimizationLevel: OptimizationLevel;
  materialThicknessTolerance: number;
  edgeBandingAllowance: number;
  kerfSize: number;
  nestingGap: number;
  defaultMaterialId: string;
  defaultEdgeBanding: string;
  productionRules: ProductionRule[];
}

export interface ProductionRule {
  id: string;
  name: string;
  type: ProductionRuleType;
  conditions: ProductionRuleCondition[];
  actions: ProductionRuleAction[];
  priority: number;
  isEnabled: boolean;
}

export type ProductionRuleType = 'MATERIAL_SUBSTITUTION' | 'PROCESS_OPTIMIZATION' | 'HARDWARE_SUBSTITUTION';

export interface ProductionRuleCondition {
  field: string;
  operator: string;
  value: any;
}

export interface ProductionRuleAction {
  action: string;
  parameters: Record<string, any>;
}

export interface SplitChange {
  type: 'ADD' | 'REMOVE' | 'MODIFY';
  componentId: string;
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
  changedBy: string;
  changedAt: Date;
}

export interface SplitLink {
  sourceComponentId: string;
  targetComponentId: string;
  linkType: LinkType;
  parameters: Record<string, any>;
  isBidirectional: boolean;
}

export type LinkType = 'DIMENSION_LINK' | 'POSITION_LINK' | 'MATERIAL_LINK' | 'HARDWARE_LINK' | 'PROCESS_LINK';
