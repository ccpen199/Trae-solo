import { BasePileAdapter } from './base';
import { StateGridAdapter } from './stateGrid';
import { ThirdPartyAdapter } from './thirdParty';
import { GBT27930Adapter } from './gbt27930';

export type ProtocolType = 'stateGrid' | 'thirdParty' | 'gbt27930';

export const createAdapter = (
  protocolType: ProtocolType,
  operatorId: string,
  apiKey: string,
  apiSecret: string,
  baseUrl: string
): BasePileAdapter => {
  switch (protocolType) {
    case 'stateGrid':
      return new StateGridAdapter(operatorId, apiKey, apiSecret, baseUrl);
    case 'thirdParty':
      return new ThirdPartyAdapter(operatorId, apiKey, apiSecret, baseUrl);
    case 'gbt27930':
      return new GBT27930Adapter(operatorId, apiKey, apiSecret, baseUrl);
    default:
      throw new Error(`Unsupported protocol type: ${protocolType}`);
  }
};

export { BasePileAdapter, StateGridAdapter, ThirdPartyAdapter, GBT27930Adapter };
export * from './base';
