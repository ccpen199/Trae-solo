import { ServiceItemRepository } from '../repositories/ServiceItemRepository.js';
import { ServiceItem, FormSchema, MaterialItem, ScenarioTree } from '../types/index.js';

const serviceItemRepository = new ServiceItemRepository();

function parseServiceItem(row: any): ServiceItem {
  return {
    ...row,
    formSchema: row.form_schema_json ? JSON.parse(row.form_schema_json) : { fields: [] },
    materialList: row.material_list_json ? JSON.parse(row.material_list_json) : [],
    scenarioTree: row.scenario_tree_json ? JSON.parse(row.scenario_tree_json) : { root: { question: '', options: [] } },
    handlingTimeLimit: row.handling_time_limit,
    handlingDepth: row.handling_depth,
    runningCount: row.running_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ServiceItemService {
  search(keyword: string, category: string, page: number, pageSize: number) {
    const result = serviceItemRepository.search(keyword, category, page, pageSize);
    return {
      ...result,
      data: result.data.map(parseServiceItem),
    };
  }

  findById(id: number): ServiceItem | undefined {
    const row = serviceItemRepository.findById(id);
    if (!row) return undefined;
    return parseServiceItem(row);
  }

  findByCode(code: string): ServiceItem | undefined {
    const row = serviceItemRepository.findByCode(code);
    if (!row) return undefined;
    return parseServiceItem(row);
  }

  getAllCategories(): string[] {
    return serviceItemRepository.getAllCategories();
  }

  getFormSchema(id: number, scenarioPath: string[]): FormSchema | undefined {
    const item = this.findById(id);
    if (!item) return undefined;

    if (scenarioPath.length > 0 && item.scenarioTree.root?.options) {
      const lastAnswer = scenarioPath[scenarioPath.length - 1];
      const option = item.scenarioTree.root.options.find(o => o.value === lastAnswer);
      if (option?.formFields) {
        const filteredFields = item.formSchema.fields.filter(f => option.formFields!.includes(f.name));
        return {
          ...item.formSchema,
          fields: filteredFields,
        };
      }
    }

    return item.formSchema;
  }

  getMaterials(id: number, scenarioPath: string[]): MaterialItem[] | undefined {
    const item = this.findById(id);
    if (!item) return undefined;

    if (scenarioPath.length > 0 && item.scenarioTree.root?.options) {
      const lastAnswer = scenarioPath[scenarioPath.length - 1];
      const option = item.scenarioTree.root.options.find(o => o.value === lastAnswer);
      if (option?.materials) {
        return item.materialList.filter(m => option.materials!.includes(m.name));
      }
    }

    return item.materialList;
  }

  getScenarioGuide(id: number, answers: string[]): {
    currentQuestion?: string;
    options: Array<{ label: string; value: string }>;
    isComplete: boolean;
    estimatedTime: number;
  } | undefined {
    const item = this.findById(id);
    if (!item) return undefined;

    const scenarioTree = item.scenarioTree as ScenarioTree;
    if (!scenarioTree.root) {
      return {
        isComplete: true,
        options: [],
        estimatedTime: item.handlingTimeLimit,
      };
    }

    let currentNode = scenarioTree.root;
    let isComplete = false;

    for (const answer of answers) {
      const nextOption = currentNode.options.find(o => o.value === answer);
      if (!nextOption) {
        break;
      }
    }

    return {
      currentQuestion: currentNode.question,
      options: currentNode.options.map(o => ({ label: o.label, value: o.value })),
      isComplete,
      estimatedTime: item.handlingTimeLimit,
    };
  }

  incrementRunningCount(id: number): void {
    serviceItemRepository.incrementRunningCount(id);
  }
}
