import { v4 as uuidv4 } from 'uuid';
import { 
  SplitContext, 
  SplitComponent, 
  MaterialBomItem, 
  HardwareBomItem, 
  ProcessingInstruction,
  Dimensions,
  MaterialInfo,
  EdgeBandingInfo,
  DrillingInfo,
  GroovingInfo,
  HardwarePosition
} from '../../types';
import {
  SplitInput,
  DesignComponent,
  DesignData,
  SplitResult,
  AssemblyInstruction,
  CuttingListItem,
  NestingLayout,
  SplitValidationResult,
  SplitMetadata,
  OptimizationLevel,
  SplitConfig,
  SplitLink,
  SplitChange,
  ComponentValidation,
  SplitValidationError,
  SplitValidationWarning
} from './types';
import logger from '../../config/logger';

const SPLIT_ENGINE_VERSION = '1.0.0';

export class SplitEngine {
  private config: SplitConfig;
  private linkedComponents: Map<string, SplitLink[]>;
  private changeHistory: SplitChange[];

  constructor(config?: Partial<SplitConfig>) {
    this.config = this.initializeDefaultConfig(config);
    this.linkedComponents = new Map();
    this.changeHistory = [];
  }

  private initializeDefaultConfig(override?: Partial<SplitConfig>): SplitConfig {
    const defaultConfig: SplitConfig = {
      optimizationLevel: 'STANDARD',
      materialThicknessTolerance: 0.5,
      edgeBandingAllowance: 0.5,
      kerfSize: 3.0,
      nestingGap: 5.0,
      defaultMaterialId: 'particle_board_18',
      defaultEdgeBanding: 'PVC_1mm',
      productionRules: []
    };

    return { ...defaultConfig, ...override };
  }

  public async executeSplit(input: SplitInput): Promise<SplitResult> {
    logger.info(`开始执行拆单: orderId=${input.orderId}, designId=${input.designId}`);
    const startTime = Date.now();

    const components = this.splitDesignComponents(input.designData);
    const materialBom = this.generateMaterialBom(components, input.designData);
    const hardwareBom = this.generateHardwareBom(components, input.designData);
    const processingInstructions = this.generateProcessingInstructions(components);
    const assemblyInstructions = this.generateAssemblyInstructions(components, input.designData);
    const cuttingList = this.generateCuttingList(components);
    const nestingLayout = this.generateNestingLayout(cuttingList);
    const validationResult = this.validateSplit(components, materialBom, hardwareBom);

    const endTime = Date.now();
    const estimatedProductionTime = this.estimateProductionTime(components, processingInstructions);

    logger.info(`拆单完成: orderId=${input.orderId}, components=${components.length}, time=${endTime - startTime}ms`);

    return {
      orderId: input.orderId,
      designId: input.designId,
      components,
      materialBom,
      hardwareBom,
      processingInstructions,
      assemblyInstructions,
      cuttingList,
      nestingLayout,
      validationResult,
      metadata: {
        splitAt: new Date(),
        splitBy: 'system',
        splitterId: '',
        splitEngineVersion: SPLIT_ENGINE_VERSION,
        optimizationLevel: this.config.optimizationLevel,
        totalComponents: components.length,
        totalMaterials: materialBom.length,
        totalHardware: hardwareBom.length,
        estimatedProductionTime
      }
    };
  }

  private splitDesignComponents(designData: DesignData): SplitComponent[] {
    const components: SplitComponent[] = [];

    for (const designComponent of designData.components) {
      const splitComponents = this.decomposeComponent(designComponent, designData);
      components.push(...splitComponents);
    }

    this.autoGenerateLinkedComponents(components, designData);

    return components;
  }

  private decomposeComponent(
    designComponent: DesignComponent,
    designData: DesignData
  ): SplitComponent[] {
    const components: SplitComponent[] = [];

    const mainComponent = this.convertToSplitComponent(designComponent, designData);
    components.push(mainComponent);

    if (designComponent.type === 'DOOR') {
      const hingeComponents = this.generateHingeComponents(designComponent, mainComponent);
      components.push(...hingeComponents);
    }

    if (designComponent.type === 'DRAWER_BOX') {
      const drawerComponents = this.generateDrawerComponents(designComponent, mainComponent);
      components.push(...drawerComponents);
    }

    if (designComponent.type === 'WARDROBE' || designComponent.type === 'CABINET') {
      const structuralComponents = this.generateStructuralComponents(designComponent, mainComponent);
      components.push(...structuralComponents);
    }

    return components;
  }

  private convertToSplitComponent(
    designComponent: DesignComponent,
    designData: DesignData
  ): SplitComponent {
    const material = designData.materials.find(m => m.materialId === designComponent.material.materialId);

    return {
      id: designComponent.id,
      name: designComponent.name,
      type: this.mapComponentType(designComponent.type),
      quantity: 1,
      dimensions: {
        width: designComponent.dimensions.width,
        height: designComponent.dimensions.height,
        depth: designComponent.dimensions.depth,
        unit: designComponent.dimensions.unit
      },
      material: {
        id: designComponent.material.materialId,
        name: material?.name || designComponent.material.materialName,
        type: material?.type || 'board',
        unitPrice: 0,
        unit: 'm2',
        supplierId: material?.supplierId || ''
      },
      edgeBanding: {
        edges: {
          top: designComponent.material.edgeBanding.top.enabled,
          bottom: designComponent.material.edgeBanding.bottom.enabled,
          left: designComponent.material.edgeBanding.left.enabled,
          right: designComponent.material.edgeBanding.right.enabled
        },
        material: designComponent.material.edgeBanding.top.material || this.config.defaultEdgeBanding,
        thickness: designComponent.material.edgeBanding.top.thickness || 1
      },
      drilling: this.generateDrillingInfo(designComponent),
      grooving: this.generateGroovingInfo(designComponent),
      hardwarePositions: this.generateHardwarePositions(designComponent),
      parentComponentId: designComponent.parentId,
      assemblyInstructions: designComponent.notes
    };
  }

  private mapComponentType(designType: string): string {
    const typeMap: Record<string, string> = {
      'PANEL': 'panel',
      'DOOR': 'door',
      'DRAWER_FRONT': 'drawer_front',
      'DRAWER_BOX': 'drawer_box',
      'SHELF': 'shelf',
      'TOP_PANEL': 'top_panel',
      'BOTTOM_PANEL': 'bottom_panel',
      'LEFT_PANEL': 'left_panel',
      'RIGHT_PANEL': 'right_panel',
      'BACK_PANEL': 'back_panel',
      'PARTITION': 'partition',
      'LEG': 'leg',
      'FRAME': 'frame',
      'TRIM': 'trim'
    };
    return typeMap[designType] || 'panel';
  }

  private generateDrillingInfo(designComponent: DesignComponent): DrillingInfo[] {
    const drillings: DrillingInfo[] = [];

    for (const hardware of designComponent.hardware) {
      for (const pos of hardware.positions) {
        const drilling = this.calculateDrillingParameters(hardware.type, pos);
        if (drilling) {
          drillings.push({
            id: uuidv4(),
            positionX: pos.x,
            positionY: pos.y,
            positionZ: pos.z,
            diameter: drilling.diameter,
            depth: drilling.depth,
            type: drilling.type,
            purpose: hardware.type
          });
        }
      }
    }

    for (const processing of designComponent.processing) {
      if (processing.type === 'DRILLING') {
        drillings.push({
          id: uuidv4(),
          positionX: processing.parameters.x || 0,
          positionY: processing.parameters.y || 0,
          positionZ: processing.parameters.z || 0,
          diameter: processing.parameters.diameter || 8,
          depth: processing.parameters.depth || 15,
          type: processing.parameters.type || 'THROUGH',
          purpose: processing.parameters.purpose || 'custom'
        });
      }
    }

    return drillings;
  }

  private calculateDrillingParameters(
    hardwareType: string,
    position: { x: number; y: number; z: number }
  ): { diameter: number; depth: number; type: 'THROUGH' | 'BLIND' } | null {
    const drillParams: Record<string, { diameter: number; depth: number; type: 'THROUGH' | 'BLIND' }> = {
      'hinge': { diameter: 35, depth: 13, type: 'BLIND' },
      'slide': { diameter: 5, depth: 12, type: 'BLIND' },
      'handle': { diameter: 5, depth: 15, type: 'THROUGH' },
      'shelf_support': { diameter: 5, depth: 10, type: 'BLIND' },
      'cam_lock': { diameter: 15, depth: 12, type: 'BLIND' },
      'dowel': { diameter: 8, depth: 15, type: 'BLIND' }
    };

    return drillParams[hardwareType] || null;
  }

  private generateGroovingInfo(designComponent: DesignComponent): GroovingInfo[] {
    const groovings: GroovingInfo[] = [];

    for (const processing of designComponent.processing) {
      if (processing.type === 'GROOVING') {
        groovings.push({
          id: uuidv4(),
          type: processing.parameters.type || 'GROOVE',
          positionX: processing.parameters.x || 0,
          positionY: processing.parameters.y || 0,
          width: processing.parameters.width || 3,
          depth: processing.parameters.depth || 8,
          length: processing.parameters.length || 0,
          orientation: processing.parameters.orientation || 'HORIZONTAL'
        });
      }
    }

    return groovings;
  }

  private generateHardwarePositions(designComponent: DesignComponent): HardwarePosition[] {
    const positions: HardwarePosition[] = [];

    for (const hardware of designComponent.hardware) {
      for (const pos of hardware.positions) {
        positions.push({
          hardwareId: hardware.hardwareId,
          positionX: pos.x,
          positionY: pos.y,
          positionZ: pos.z,
          orientation: pos.orientation,
          quantity: 1
        });
      }
    }

    return positions;
  }

  private generateHingeComponents(
    designComponent: DesignComponent,
    parentComponent: SplitComponent
  ): SplitComponent[] {
    const components: SplitComponent[] = [];
    const hingeCount = Math.ceil(designComponent.dimensions.height / 500);

    for (let i = 0; i < Math.max(2, hingeCount); i++) {
      components.push({
        id: `${designComponent.id}_hinge_${i}`,
        name: `${designComponent.name} - 铰链 ${i + 1}`,
        type: 'hardware_mount',
        quantity: 1,
        dimensions: {
          width: 35,
          height: 35,
          depth: 13,
          unit: 'mm'
        },
        material: parentComponent.material,
        edgeBanding: parentComponent.edgeBanding,
        drilling: [
          {
            id: uuidv4(),
            positionX: 37,
            positionY: 100 + i * 500,
            positionZ: 0,
            diameter: 35,
            depth: 13,
            type: 'BLIND',
            purpose: 'hinge'
          }
        ],
        grooving: [],
        hardwarePositions: [],
        parentComponentId: parentComponent.id,
        assemblyInstructions: '安装铰链'
      });
    }

    return components;
  }

  private generateDrawerComponents(
    designComponent: DesignComponent,
    parentComponent: SplitComponent
  ): SplitComponent[] {
    const components: SplitComponent[] = [];
    const width = designComponent.dimensions.width - 25;
    const depth = designComponent.dimensions.depth - 20;
    const height = designComponent.dimensions.height;

    components.push({
      id: `${designComponent.id}_front`,
      name: `${designComponent.name} - 抽屉面板`,
      type: 'drawer_front',
      quantity: 1,
      dimensions: {
        width: designComponent.dimensions.width,
        height,
        depth: 18,
        unit: 'mm'
      },
      material: parentComponent.material,
      edgeBanding: parentComponent.edgeBanding,
      drilling: [],
      grooving: [],
      hardwarePositions: [],
      parentComponentId: parentComponent.id,
      assemblyInstructions: '抽屉面板'
    });

    components.push({
      id: `${designComponent.id}_left`,
      name: `${designComponent.name} - 左侧板`,
      type: 'drawer_side',
      quantity: 1,
      dimensions: {
        width: depth,
        height: height - 18,
        depth: 16,
        unit: 'mm'
      },
      material: parentComponent.material,
      edgeBanding: {
        edges: { top: true, bottom: true, left: false, right: false },
        material: this.config.defaultEdgeBanding,
        thickness: 1
      },
      drilling: [],
      grooving: [
        {
          id: uuidv4(),
          type: 'GROOVE',
          positionX: 10,
          positionY: 8,
          width: 18,
          depth: 8,
          length: depth - 20,
          orientation: 'HORIZONTAL'
        }
      ],
      hardwarePositions: [],
      parentComponentId: parentComponent.id,
      assemblyInstructions: '抽屉左侧板'
    });

    components.push({
      id: `${designComponent.id}_right`,
      name: `${designComponent.name} - 右侧板`,
      type: 'drawer_side',
      quantity: 1,
      dimensions: {
        width: depth,
        height: height - 18,
        depth: 16,
        unit: 'mm'
      },
      material: parentComponent.material,
      edgeBanding: {
        edges: { top: true, bottom: true, left: false, right: false },
        material: this.config.defaultEdgeBanding,
        thickness: 1
      },
      drilling: [],
      grooving: [
        {
          id: uuidv4(),
          type: 'GROOVE',
          positionX: 10,
          positionY: 8,
          width: 18,
          depth: 8,
          length: depth - 20,
          orientation: 'HORIZONTAL'
        }
      ],
      hardwarePositions: [],
      parentComponentId: parentComponent.id,
      assemblyInstructions: '抽屉右侧板'
    });

    components.push({
      id: `${designComponent.id}_back`,
      name: `${designComponent.name} - 后板`,
      type: 'drawer_back',
      quantity: 1,
      dimensions: {
        width: width,
        height: height - 18,
        depth: 16,
        unit: 'mm'
      },
      material: parentComponent.material,
      edgeBanding: {
        edges: { top: true, bottom: false, left: false, right: false },
        material: this.config.defaultEdgeBanding,
        thickness: 1
      },
      drilling: [],
      grooving: [],
      hardwarePositions: [],
      parentComponentId: parentComponent.id,
      assemblyInstructions: '抽屉后板'
    });

    components.push({
      id: `${designComponent.id}_bottom`,
      name: `${designComponent.name} - 底板`,
      type: 'drawer_bottom',
      quantity: 1,
      dimensions: {
        width: width - 16,
        height: depth - 16,
        depth: 5,
        unit: 'mm'
      },
      material: parentComponent.material,
      edgeBanding: {
        edges: { top: false, bottom: false, left: false, right: false },
        material: this.config.defaultEdgeBanding,
        thickness: 1
      },
      drilling: [],
      grooving: [],
      hardwarePositions: [],
      parentComponentId: parentComponent.id,
      assemblyInstructions: '抽屉底板'
    });

    return components;
  }

  private generateStructuralComponents(
    designComponent: DesignComponent,
    parentComponent: SplitComponent
  ): SplitComponent[] {
    const components: SplitComponent[] = [];
    const width = designComponent.dimensions.width;
    const height = designComponent.dimensions.height;
    const depth = designComponent.dimensions.depth;

    components.push({
      id: `${designComponent.id}_top`,
      name: `${designComponent.name} - 顶板`,
      type: 'top_panel',
      quantity: 1,
      dimensions: {
        width: width - 36,
        height: depth,
        depth: 18,
        unit: 'mm'
      },
      material: parentComponent.material,
      edgeBanding: {
        edges: { top: true, bottom: false, left: false, right: false },
        material: this.config.defaultEdgeBanding,
        thickness: 1
      },
      drilling: [],
      grooving: [],
      hardwarePositions: [],
      parentComponentId: parentComponent.id,
      assemblyInstructions: '顶板'
    });

    components.push({
      id: `${designComponent.id}_bottom`,
      name: `${designComponent.name} - 底板`,
      type: 'bottom_panel',
      quantity: 1,
      dimensions: {
        width: width - 36,
        height: depth,
        depth: 18,
        unit: 'mm'
      },
      material: parentComponent.material,
      edgeBanding: {
        edges: { top: true, bottom: false, left: false, right: false },
        material: this.config.defaultEdgeBanding,
        thickness: 1
      },
      drilling: [],
      grooving: [],
      hardwarePositions: [],
      parentComponentId: parentComponent.id,
      assemblyInstructions: '底板'
    });

    components.push({
      id: `${designComponent.id}_left`,
      name: `${designComponent.name} - 左侧板`,
      type: 'left_panel',
      quantity: 1,
      dimensions: {
        width: height,
        height: depth,
        depth: 18,
        unit: 'mm'
      },
      material: parentComponent.material,
      edgeBanding: {
        edges: { top: true, bottom: true, left: false, right: false },
        material: this.config.defaultEdgeBanding,
        thickness: 1
      },
      drilling: [],
      grooving: [],
      hardwarePositions: [],
      parentComponentId: parentComponent.id,
      assemblyInstructions: '左侧板'
    });

    components.push({
      id: `${designComponent.id}_right`,
      name: `${designComponent.name} - 右侧板`,
      type: 'right_panel',
      quantity: 1,
      dimensions: {
        width: height,
        height: depth,
        depth: 18,
        unit: 'mm'
      },
      material: parentComponent.material,
      edgeBanding: {
        edges: { top: true, bottom: true, left: false, right: false },
        material: this.config.defaultEdgeBanding,
        thickness: 1
      },
      drilling: [],
      grooving: [],
      hardwarePositions: [],
      parentComponentId: parentComponent.id,
      assemblyInstructions: '右侧板'
    });

    components.push({
      id: `${designComponent.id}_back`,
      name: `${designComponent.name} - 背板`,
      type: 'back_panel',
      quantity: 1,
      dimensions: {
        width: width - 36,
        height: height - 36,
        depth: 5,
        unit: 'mm'
      },
      material: parentComponent.material,
      edgeBanding: {
        edges: { top: false, bottom: false, left: false, right: false },
        material: this.config.defaultEdgeBanding,
        thickness: 1
      },
      drilling: [],
      grooving: [],
      hardwarePositions: [],
      parentComponentId: parentComponent.id,
      assemblyInstructions: '背板'
    });

    return components;
  }

  private autoGenerateLinkedComponents(components: SplitComponent[], designData: DesignData): void {
    const componentMap = new Map(components.map(c => [c.id, c]));

    for (const component of components) {
      const links: SplitLink[] = [];

      if (component.parentComponentId) {
        const parent = componentMap.get(component.parentComponentId);
        if (parent) {
          links.push({
            sourceComponentId: component.id,
            targetComponentId: parent.id,
            linkType: 'POSITION_LINK',
            parameters: {
              offsetX: 0,
              offsetY: 0,
              offsetZ: 0
            },
            isBidirectional: false
          });
        }
      }

      if (component.type === 'door') {
        const hinges = components.filter(c => 
          c.parentComponentId === component.id && c.type === 'hardware_mount'
        );
        for (const hinge of hinges) {
          links.push({
            sourceComponentId: hinge.id,
            targetComponentId: component.id,
            linkType: 'HARDWARE_LINK',
            parameters: {
              hardwareType: 'hinge',
              position: 'edge'
            },
            isBidirectional: true
          });
        }
      }

      if (links.length > 0) {
        this.linkedComponents.set(component.id, links);
      }
    }
  }

  private generateMaterialBom(
    components: SplitComponent[],
    designData: DesignData
  ): MaterialBomItem[] {
    const bomMap = new Map<string, MaterialBomItem>();

    for (const component of components) {
      const area = this.calculateComponentArea(component);
      const key = component.material.id;

      if (!bomMap.has(key)) {
        bomMap.set(key, {
          id: uuidv4(),
          materialId: component.material.id,
          materialName: component.material.name,
          dimensions: component.dimensions,
          quantity: area,
          unit: 'm2',
          unitPrice: component.material.unitPrice,
          totalPrice: area * component.material.unitPrice,
          supplierId: component.material.supplierId,
          allocation: component.id
        });
      } else {
        const existing = bomMap.get(key)!;
        existing.quantity += area;
        existing.totalPrice += area * component.material.unitPrice;
        existing.allocation += `,${component.id}`;
      }
    }

    return Array.from(bomMap.values());
  }

  private generateHardwareBom(
    components: SplitComponent[],
    designData: DesignData
  ): HardwareBomItem[] {
    const bomMap = new Map<string, HardwareBomItem>();

    for (const component of components) {
      for (const pos of component.hardwarePositions) {
        const key = pos.hardwareId;
        const hardware = designData.hardware.find(h => h.hardwareId === pos.hardwareId);

        if (!bomMap.has(key)) {
          bomMap.set(key, {
            id: uuidv4(),
            hardwareId: pos.hardwareId,
            hardwareName: hardware?.name || pos.hardwareId,
            type: hardware?.type || 'unknown',
            quantity: pos.quantity,
            unitPrice: 0,
            totalPrice: 0,
            supplierId: hardware?.supplierId || ''
          });
        } else {
          const existing = bomMap.get(key)!;
          existing.quantity += pos.quantity;
        }
      }
    }

    return Array.from(bomMap.values());
  }

  private generateProcessingInstructions(
    components: SplitComponent[]
  ): ProcessingInstruction[] {
    const instructions: ProcessingInstruction[] = [];
    let stepNumber = 1;

    const sortedComponents = this.sortByProcessingPriority(components);

    for (const component of sortedComponents) {
      if (component.drilling.length > 0) {
        instructions.push({
          id: uuidv4(),
          componentId: component.id,
          stepNumber: stepNumber++,
          operation: '钻孔',
          machine: 'CNC加工中心',
          parameters: {
            drillings: component.drilling.map(d => ({
              x: d.positionX,
              y: d.positionY,
              z: d.positionZ,
              diameter: d.diameter,
              depth: d.depth,
              type: d.type,
              purpose: d.purpose
            }))
          },
          duration: component.drilling.length * 2,
          notes: `为 ${component.name} 执行钻孔操作`
        });
      }

      if (component.grooving.length > 0) {
        instructions.push({
          id: uuidv4(),
          componentId: component.id,
          stepNumber: stepNumber++,
          operation: '开槽',
          machine: 'CNC加工中心',
          parameters: {
            groovings: component.grooving.map(g => ({
              type: g.type,
              x: g.positionX,
              y: g.positionY,
              width: g.width,
              depth: g.depth,
              length: g.length,
              orientation: g.orientation
            }))
          },
          duration: component.grooving.length * 5,
          notes: `为 ${component.name} 执行开槽操作`
        });
      }

      const edgeBandingEdges = [];
      if (component.edgeBanding.edges.top) edgeBandingEdges.push('顶边');
      if (component.edgeBanding.edges.bottom) edgeBandingEdges.push('底边');
      if (component.edgeBanding.edges.left) edgeBandingEdges.push('左边');
      if (component.edgeBanding.edges.right) edgeBandingEdges.push('右边');

      if (edgeBandingEdges.length > 0) {
        instructions.push({
          id: uuidv4(),
          componentId: component.id,
          stepNumber: stepNumber++,
          operation: '封边',
          machine: '自动封边机',
          parameters: {
            edges: edgeBandingEdges,
            material: component.edgeBanding.material,
            thickness: component.edgeBanding.thickness
          },
          duration: edgeBandingEdges.length * 3,
          notes: `为 ${component.name} 执行封边操作，封边材料: ${component.edgeBanding.material}`
        });
      }
    }

    return instructions;
  }

  private sortByProcessingPriority(components: SplitComponent[]): SplitComponent[] {
    const priorityMap: Record<string, number> = {
      'panel': 1,
      'top_panel': 1,
      'bottom_panel': 1,
      'left_panel': 1,
      'right_panel': 1,
      'back_panel': 1,
      'door': 2,
      'drawer_front': 2,
      'drawer_side': 3,
      'drawer_back': 3,
      'drawer_bottom': 3,
      'shelf': 4,
      'leg': 5,
      'hardware_mount': 6
    };

    return [...components].sort((a, b) => {
      const priorityA = priorityMap[a.type] || 10;
      const priorityB = priorityMap[b.type] || 10;
      return priorityA - priorityB;
    });
  }

  private generateAssemblyInstructions(
    components: SplitComponent[],
    designData: DesignData
  ): AssemblyInstruction[] {
    const instructions: AssemblyInstruction[] = [];

    instructions.push({
      id: uuidv4(),
      stepNumber: 1,
      title: '准备工作',
      description: '检查所有零部件是否齐全，确认型号和数量',
      components: components.map(c => c.id),
      hardware: [],
      tools: ['卷尺', '螺丝刀', '电钻'],
      estimatedTime: 10,
      diagramUrl: '',
      warnings: ['注意检查零部件是否有损坏']
    });

    const structuralComponents = components.filter(c => 
      ['top_panel', 'bottom_panel', 'left_panel', 'right_panel', 'back_panel'].includes(c.type)
    );

    if (structuralComponents.length > 0) {
      instructions.push({
        id: uuidv4(),
        stepNumber: 2,
        title: '组装柜体框架',
        description: '按照图纸组装柜体框架，使用偏心连接件连接各面板',
        components: structuralComponents.map(c => c.id),
        hardware: ['偏心连接件', '木榫'],
        tools: ['螺丝刀', '橡胶锤'],
        estimatedTime: 30,
        diagramUrl: '',
        warnings: ['确保各面板垂直对齐']
      });
    }

    const doorComponents = components.filter(c => c.type === 'door');
    if (doorComponents.length > 0) {
      instructions.push({
        id: uuidv4(),
        stepNumber: 3,
        title: '安装门板',
        description: '安装铰链并调整门板位置',
        components: doorComponents.map(c => c.id),
        hardware: ['铰链', '螺丝'],
        tools: ['螺丝刀', '水平尺'],
        estimatedTime: 20,
        diagramUrl: '',
        warnings: ['调整门板间隙使其均匀']
      });
    }

    const drawerComponents = components.filter(c => 
      c.type.startsWith('drawer')
    );
    if (drawerComponents.length > 0) {
      instructions.push({
        id: uuidv4(),
        stepNumber: 4,
        title: '组装抽屉',
        description: '组装抽屉并安装导轨',
        components: drawerComponents.map(c => c.id),
        hardware: ['导轨', '螺丝'],
        tools: ['螺丝刀'],
        estimatedTime: 25,
        diagramUrl: '',
        warnings: ['确保抽屉推拉顺畅']
      });
    }

    instructions.push({
      id: uuidv4(),
      stepNumber: 5,
      title: '最终检查',
      description: '检查所有安装是否牢固，功能是否正常',
      components: [],
      hardware: [],
      tools: ['水平尺', '卷尺'],
      estimatedTime: 10,
      diagramUrl: '',
      warnings: ['清理现场，核对所有配件']
    });

    return instructions;
  }

  private generateCuttingList(components: SplitComponent[]): CuttingListItem[] {
    const cuttingList: CuttingListItem[] = [];

    const boardComponents = components.filter(c => 
      ['panel', 'top_panel', 'bottom_panel', 'left_panel', 'right_panel', 
       'back_panel', 'door', 'drawer_front', 'drawer_side', 'drawer_back', 
       'shelf', 'partition'].includes(c.type)
    );

    const groupedByMaterial = new Map<string, SplitComponent[]>();
    for (const component of boardComponents) {
      const key = component.material.id;
      if (!groupedByMaterial.has(key)) {
        groupedByMaterial.set(key, []);
      }
      groupedByMaterial.get(key)!.push(component);
    }

    for (const [materialId, comps] of groupedByMaterial) {
      const material = comps[0].material;

      for (const component of comps) {
        cuttingList.push({
          id: uuidv4(),
          componentId: component.id,
          materialId: materialId,
          materialName: material.name,
          width: component.dimensions.width,
          height: component.dimensions.height,
          thickness: component.dimensions.depth,
          quantity: component.quantity,
          grainDirection: 'LENGTH',
          priority: 1,
          notes: component.name
        });
      }
    }

    return cuttingList;
  }

  private generateNestingLayout(cuttingList: CuttingListItem[]): NestingLayout[] {
    if (this.config.optimizationLevel === 'BASIC') {
      return this.basicNesting(cuttingList);
    }

    return this.optimizedNesting(cuttingList);
  }

  private basicNesting(cuttingList: CuttingListItem[]): NestingLayout[] {
    const layouts: NestingLayout[] = [];
    const standardSheetSize = { width: 2440, height: 1220 };

    const groupedByMaterial = new Map<string, CuttingListItem[]>();
    for (const item of cuttingList) {
      const key = item.materialId;
      if (!groupedByMaterial.has(key)) {
        groupedByMaterial.set(key, []);
      }
      groupedByMaterial.get(key)!.push(item);
    }

    for (const [materialId, items] of groupedByMaterial) {
      const layout: NestingLayout = {
        id: uuidv4(),
        sheetId: `sheet_${materialId}_1`,
        sheetDimensions: {
          width: standardSheetSize.width,
          height: standardSheetSize.height,
          depth: 18,
          unit: 'mm'
        },
        materialId,
        placements: [],
        wastePercentage: 0,
        optimizedBy: 'basic',
        optimizedAt: new Date()
      };

      let currentX = this.config.nestingGap;
      let currentY = this.config.nestingGap;
      let rowHeight = 0;

      for (const item of items) {
        if (currentX + item.width + this.config.nestingGap > standardSheetSize.width) {
          currentX = this.config.nestingGap;
          currentY += rowHeight + this.config.nestingGap;
          rowHeight = 0;
        }

        if (currentY + item.height + this.config.nestingGap > standardSheetSize.height) {
          break;
        }

        layout.placements.push({
          componentId: item.componentId,
          x: currentX,
          y: currentY,
          rotation: 0,
          width: item.width,
          height: item.height
        });

        currentX += item.width + this.config.nestingGap;
        rowHeight = Math.max(rowHeight, item.height);
      }

      const totalArea = standardSheetSize.width * standardSheetSize.height;
      const usedArea = layout.placements.reduce(
        (sum, p) => sum + p.width * p.height, 0
      );
      layout.wastePercentage = ((totalArea - usedArea) / totalArea) * 100;

      layouts.push(layout);
    }

    return layouts;
  }

  private optimizedNesting(cuttingList: CuttingListItem[]): NestingLayout[] {
    return this.basicNesting(cuttingList);
  }

  private validateSplit(
    components: SplitComponent[],
    materialBom: MaterialBomItem[],
    hardwareBom: HardwareBomItem[]
  ): SplitValidationResult {
    const errors: SplitValidationError[] = [];
    const warnings: SplitValidationWarning[] = [];
    const componentValidations: ComponentValidation[] = [];

    for (const component of components) {
      const compErrors: SplitValidationError[] = [];
      const compWarnings: SplitValidationWarning[] = [];

      if (component.dimensions.width <= 0 || 
          component.dimensions.height <= 0 || 
          component.dimensions.depth <= 0) {
        compErrors.push({
          code: 'INVALID_DIMENSION',
          message: '零部件尺寸必须大于0',
          componentId: component.id,
          field: 'dimensions',
          value: component.dimensions
        });
      }

      if (component.dimensions.width > 2400 || component.dimensions.height > 2400) {
        compWarnings.push({
          code: 'OVERSIZED_COMPONENT',
          message: '零部件尺寸较大，建议确认板材规格',
          componentId: component.id,
          suggestions: ['考虑使用大板或拼接方案']
        });
      }

      if (component.drilling.length > 0) {
        for (const drilling of component.drilling) {
          if (drilling.depth > component.dimensions.depth - 3) {
            compErrors.push({
              code: 'DRILLING_TOO_DEEP',
              message: `钻孔深度 ${drilling.depth}mm 超过板材厚度`,
              componentId: component.id,
              field: 'drilling.depth',
              value: drilling.depth
            });
          }
        }
      }

      componentValidations.push({
        componentId: component.id,
        componentName: component.name,
        isValid: compErrors.length === 0,
        errors: compErrors,
        warnings: compWarnings
      });

      errors.push(...compErrors);
      warnings.push(...compWarnings);
    }

    if (components.length === 0) {
      errors.push({
        code: 'NO_COMPONENTS',
        message: '拆单结果中没有任何零部件'
      });
    }

    const uniqueMaterials = new Set(components.map(c => c.material.id));
    if (uniqueMaterials.size === 0) {
      warnings.push({
        code: 'NO_MATERIALS',
        message: '未指定任何材料',
        suggestions: ['检查设计方案中的材料配置']
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      componentValidations
    };
  }

  private calculateComponentArea(component: SplitComponent): number {
    const widthM = component.dimensions.width / 1000;
    const heightM = component.dimensions.height / 1000;
    return Math.round((widthM * heightM) * 100) / 100;
  }

  private estimateProductionTime(
    components: SplitComponent[],
    processingInstructions: ProcessingInstruction[]
  ): number {
    let totalMinutes = 0;

    totalMinutes += components.length * 5;
    totalMinutes += processingInstructions.reduce(
      (sum, instr) => sum + (instr.duration || 0), 0
    );
    totalMinutes += components.length * 2;
    totalMinutes += 60;

    return Math.round(totalMinutes / 60);
  }

  public updateComponent(
    componentId: string,
    updates: Partial<SplitComponent>,
    reason: string,
    changedBy: string
  ): SplitChange | null {
    const change: SplitChange = {
      type: 'MODIFY',
      componentId,
      field: '',
      oldValue: null,
      newValue: null,
      reason,
      changedBy,
      changedAt: new Date()
    };

    this.changeHistory.push(change);

    this.propagateLinkedChanges(componentId, updates);

    return change;
  }

  private propagateLinkedChanges(
    sourceComponentId: string,
    updates: Partial<SplitComponent>
  ): void {
    const links = this.linkedComponents.get(sourceComponentId);
    if (!links) return;

    for (const link of links) {
      const linkedChanges: Partial<SplitComponent> = {};

      if (link.linkType === 'DIMENSION_LINK' && updates.dimensions) {
        linkedChanges.dimensions = {
          ...updates.dimensions,
          width: updates.dimensions.width + (link.parameters.offsetX || 0),
          height: updates.dimensions.height + (link.parameters.offsetY || 0),
          depth: updates.dimensions.depth + (link.parameters.offsetZ || 0),
          unit: updates.dimensions.unit
        };
      }

      if (link.linkType === 'MATERIAL_LINK' && updates.material) {
        linkedChanges.material = updates.material;
      }

      if (Object.keys(linkedChanges).length > 0) {
        this.updateComponent(
          link.targetComponentId,
          linkedChanges,
          `联动更新 (源: ${sourceComponentId})`,
          'system'
        );
      }
    }
  }

  public getConfig(): SplitConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<SplitConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public getLinkedComponents(): Map<string, SplitLink[]> {
    return new Map(this.linkedComponents);
  }

  public getChangeHistory(): SplitChange[] {
    return [...this.changeHistory];
  }
}

export const splitEngine = new SplitEngine();

export default SplitEngine;
