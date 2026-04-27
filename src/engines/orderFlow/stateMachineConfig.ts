import { OrderStatus, UserRole } from '../../types';
import { StateMachineConfig } from './types';

export const orderStateMachineConfig: StateMachineConfig = {
  initialState: 'DEMAND_SUBMITTED',
  states: [
    'DEMAND_SUBMITTED',
    'DEMAND_ASSIGNED',
    'MEASURING_SCHEDULED',
    'MEASURING_COMPLETED',
    'DESIGN_IN_PROGRESS',
    'DESIGN_SUBMITTED',
    'QUOTE_GENERATED',
    'QUOTE_CONFIRMED',
    'CONTRACT_SIGNED',
    'PAYMENT_RECEIVED',
    'SPLIT_IN_PROGRESS',
    'SPLIT_COMPLETED',
    'PRODUCTION_SCHEDULED',
    'PRODUCTION_IN_PROGRESS',
    'PRODUCTION_COMPLETED',
    'INSTALLATION_ASSIGNED',
    'INSTALLATION_SCHEDULED',
    'INSTALLATION_IN_PROGRESS',
    'INSTALLATION_COMPLETED',
    'ACCEPTED',
    'COMPLETED',
    'CANCELLED',
    'REFUNDED'
  ],
  transitions: [
    {
      from: null,
      to: 'DEMAND_SUBMITTED',
      allowedRoles: ['CUSTOMER', 'ADMIN'],
      requiredConditions: ['hasValidDemandData'],
      sideEffects: ['createDemandRecord', 'notifyAdminNewDemand'],
      validationRules: ['validateCustomerInfo', 'validateAddress']
    },
    {
      from: 'DEMAND_SUBMITTED',
      to: 'DEMAND_ASSIGNED',
      allowedRoles: ['ADMIN'],
      requiredConditions: ['hasAvailableDesigner'],
      sideEffects: ['assignDesigner', 'notifyDesignerAssignment', 'notifyCustomerAssignment'],
      validationRules: ['validateDesignerExists', 'validateDesignerAvailable']
    },
    {
      from: 'DEMAND_ASSIGNED',
      to: 'MEASURING_SCHEDULED',
      allowedRoles: ['DESIGNER', 'ADMIN'],
      requiredConditions: ['hasScheduledDate'],
      sideEffects: ['scheduleMeasurement', 'notifyCustomerScheduling'],
      validationRules: ['validateScheduledDate']
    },
    {
      from: 'MEASURING_SCHEDULED',
      to: 'MEASURING_COMPLETED',
      allowedRoles: ['DESIGNER'],
      requiredConditions: ['hasMeasurementData', 'hasSitePhotos'],
      sideEffects: ['createMeasurementRecord', 'notifyAdminMeasurementComplete'],
      validationRules: ['validateMeasurements', 'validatePhotos']
    },
    {
      from: 'MEASURING_COMPLETED',
      to: 'DESIGN_IN_PROGRESS',
      allowedRoles: ['DESIGNER', 'ADMIN'],
      requiredConditions: [],
      sideEffects: ['startDesignProcess'],
      validationRules: []
    },
    {
      from: 'DESIGN_IN_PROGRESS',
      to: 'DESIGN_SUBMITTED',
      allowedRoles: ['DESIGNER'],
      requiredConditions: ['hasDesignData', 'hasRenderings'],
      sideEffects: ['submitDesign', 'notifyAdminDesignSubmitted', 'notifyCustomerDesignReady'],
      validationRules: ['validateDesignData', 'validateRenderings']
    },
    {
      from: 'DESIGN_SUBMITTED',
      to: 'QUOTE_GENERATED',
      allowedRoles: ['DESIGNER', 'ADMIN'],
      requiredConditions: ['hasValidDesign'],
      sideEffects: ['generateQuote', 'notifyCustomerQuoteReady'],
      validationRules: ['validateQuoteCalculation']
    },
    {
      from: 'QUOTE_GENERATED',
      to: 'QUOTE_CONFIRMED',
      allowedRoles: ['CUSTOMER'],
      requiredConditions: ['customerReviewed'],
      sideEffects: ['confirmQuote', 'notifyAdminQuoteConfirmed'],
      validationRules: ['validateCustomerAgreement']
    },
    {
      from: 'QUOTE_CONFIRMED',
      to: 'CONTRACT_SIGNED',
      allowedRoles: ['CUSTOMER', 'ADMIN'],
      requiredConditions: ['hasSignedContract'],
      sideEffects: ['createOrder', 'createContract', 'notifySplitterAssignment'],
      validationRules: ['validateContractSignature']
    },
    {
      from: 'CONTRACT_SIGNED',
      to: 'PAYMENT_RECEIVED',
      allowedRoles: ['ADMIN'],
      requiredConditions: ['hasPaymentRecord'],
      sideEffects: ['recordPayment', 'notifyFactoryAssignment', 'notifyCustomerPaymentConfirmed'],
      validationRules: ['validatePaymentAmount']
    },
    {
      from: 'PAYMENT_RECEIVED',
      to: 'SPLIT_IN_PROGRESS',
      allowedRoles: ['SPLITTER', 'ADMIN'],
      requiredConditions: [],
      sideEffects: ['startSplitProcess'],
      validationRules: []
    },
    {
      from: 'SPLIT_IN_PROGRESS',
      to: 'SPLIT_COMPLETED',
      allowedRoles: ['SPLITTER'],
      requiredConditions: ['hasSplitData', 'hasProcessingInstructions'],
      sideEffects: ['completeSplit', 'notifyFactorySplitComplete'],
      validationRules: ['validateSplitComponents', 'validateBomData']
    },
    {
      from: 'SPLIT_COMPLETED',
      to: 'PRODUCTION_SCHEDULED',
      allowedRoles: ['FACTORY', 'ADMIN'],
      requiredConditions: ['hasProductionSchedule'],
      sideEffects: ['scheduleProduction', 'notifyCustomerProductionScheduled'],
      validationRules: ['validateProductionSchedule']
    },
    {
      from: 'PRODUCTION_SCHEDULED',
      to: 'PRODUCTION_IN_PROGRESS',
      allowedRoles: ['FACTORY'],
      requiredConditions: [],
      sideEffects: ['startProduction'],
      validationRules: []
    },
    {
      from: 'PRODUCTION_IN_PROGRESS',
      to: 'PRODUCTION_COMPLETED',
      allowedRoles: ['FACTORY'],
      requiredConditions: ['hasQualityCheckPassed'],
      sideEffects: ['completeProduction', 'triggerInstallationAssignment', 'notifyCustomerProductionComplete'],
      validationRules: ['validateProductionQuality']
    },
    {
      from: 'PRODUCTION_COMPLETED',
      to: 'INSTALLATION_ASSIGNED',
      allowedRoles: ['ADMIN'],
      requiredConditions: ['hasInstallerAssigned'],
      sideEffects: ['assignInstaller', 'notifyInstallerAssignment', 'notifyCustomerInstallationScheduled'],
      validationRules: ['validateInstallerAssignment']
    },
    {
      from: 'INSTALLATION_ASSIGNED',
      to: 'INSTALLATION_SCHEDULED',
      allowedRoles: ['INSTALLER', 'ADMIN'],
      requiredConditions: ['hasInstallationSchedule'],
      sideEffects: ['scheduleInstallation', 'notifyCustomerInstallationTime'],
      validationRules: ['validateInstallationSchedule']
    },
    {
      from: 'INSTALLATION_SCHEDULED',
      to: 'INSTALLATION_IN_PROGRESS',
      allowedRoles: ['INSTALLER'],
      requiredConditions: [],
      sideEffects: ['startInstallation'],
      validationRules: []
    },
    {
      from: 'INSTALLATION_IN_PROGRESS',
      to: 'INSTALLATION_COMPLETED',
      allowedRoles: ['INSTALLER'],
      requiredConditions: ['hasInstallationPhotos', 'hasCustomerSignature'],
      sideEffects: ['completeInstallation', 'notifyCustomerAcceptancePending'],
      validationRules: ['validateInstallationCompletion']
    },
    {
      from: 'INSTALLATION_COMPLETED',
      to: 'ACCEPTED',
      allowedRoles: ['CUSTOMER'],
      requiredConditions: ['customerAcceptance'],
      sideEffects: ['acceptOrder', 'generateServiceRecord'],
      validationRules: ['validateCustomerAcceptance']
    },
    {
      from: 'ACCEPTED',
      to: 'COMPLETED',
      allowedRoles: ['ADMIN'],
      requiredConditions: [],
      sideEffects: ['finalizeOrder', 'sendThankYouMessage', 'updateCustomerProfile'],
      validationRules: []
    },
    {
      from: 'DEMAND_SUBMITTED',
      to: 'CANCELLED',
      allowedRoles: ['CUSTOMER', 'ADMIN'],
      requiredConditions: [],
      sideEffects: ['cancelOrder', 'notifyPartiesCancellation'],
      validationRules: ['validateCancellationReason']
    },
    {
      from: 'DEMAND_ASSIGNED',
      to: 'CANCELLED',
      allowedRoles: ['CUSTOMER', 'ADMIN'],
      requiredConditions: [],
      sideEffects: ['cancelOrder', 'notifyPartiesCancellation'],
      validationRules: ['validateCancellationReason']
    },
    {
      from: 'MEASURING_SCHEDULED',
      to: 'CANCELLED',
      allowedRoles: ['CUSTOMER', 'ADMIN'],
      requiredConditions: [],
      sideEffects: ['cancelOrder', 'notifyPartiesCancellation'],
      validationRules: ['validateCancellationReason']
    },
    {
      from: 'MEASURING_COMPLETED',
      to: 'CANCELLED',
      allowedRoles: ['CUSTOMER', 'ADMIN'],
      requiredConditions: [],
      sideEffects: ['cancelOrder', 'notifyPartiesCancellation'],
      validationRules: ['validateCancellationReason']
    },
    {
      from: 'DESIGN_IN_PROGRESS',
      to: 'CANCELLED',
      allowedRoles: ['CUSTOMER', 'ADMIN'],
      requiredConditions: [],
      sideEffects: ['cancelOrder', 'notifyPartiesCancellation'],
      validationRules: ['validateCancellationReason']
    },
    {
      from: 'DESIGN_SUBMITTED',
      to: 'CANCELLED',
      allowedRoles: ['CUSTOMER', 'ADMIN'],
      requiredConditions: [],
      sideEffects: ['cancelOrder', 'notifyPartiesCancellation'],
      validationRules: ['validateCancellationReason']
    },
    {
      from: 'QUOTE_GENERATED',
      to: 'CANCELLED',
      allowedRoles: ['CUSTOMER', 'ADMIN'],
      requiredConditions: [],
      sideEffects: ['cancelOrder', 'notifyPartiesCancellation'],
      validationRules: ['validateCancellationReason']
    },
    {
      from: 'QUOTE_CONFIRMED',
      to: 'CANCELLED',
      allowedRoles: ['CUSTOMER', 'ADMIN'],
      requiredConditions: [],
      sideEffects: ['cancelOrder', 'notifyPartiesCancellation'],
      validationRules: ['validateCancellationReason']
    },
    {
      from: 'PAYMENT_RECEIVED',
      to: 'REFUNDED',
      allowedRoles: ['ADMIN'],
      requiredConditions: ['hasRefundApproval'],
      sideEffects: ['refundOrder', 'notifyPartiesRefund'],
      validationRules: ['validateRefundReason']
    },
    {
      from: 'SPLIT_IN_PROGRESS',
      to: 'REFUNDED',
      allowedRoles: ['ADMIN'],
      requiredConditions: ['hasRefundApproval'],
      sideEffects: ['refundOrder', 'notifyPartiesRefund'],
      validationRules: ['validateRefundReason']
    },
    {
      from: 'SPLIT_COMPLETED',
      to: 'REFUNDED',
      allowedRoles: ['ADMIN'],
      requiredConditions: ['hasRefundApproval'],
      sideEffects: ['refundOrder', 'notifyPartiesRefund'],
      validationRules: ['validateRefundReason']
    },
    {
      from: 'PRODUCTION_SCHEDULED',
      to: 'REFUNDED',
      allowedRoles: ['ADMIN'],
      requiredConditions: ['hasRefundApproval'],
      sideEffects: ['refundOrder', 'notifyPartiesRefund'],
      validationRules: ['validateRefundReason']
    },
    {
      from: 'PRODUCTION_IN_PROGRESS',
      to: 'REFUNDED',
      allowedRoles: ['ADMIN'],
      requiredConditions: ['hasRefundApproval'],
      sideEffects: ['refundOrder', 'notifyPartiesRefund'],
      validationRules: ['validateRefundReason']
    },
    {
      from: 'PRODUCTION_COMPLETED',
      to: 'REFUNDED',
      allowedRoles: ['ADMIN'],
      requiredConditions: ['hasRefundApproval'],
      sideEffects: ['refundOrder', 'notifyPartiesRefund'],
      validationRules: ['validateRefundReason']
    },
    {
      from: 'INSTALLATION_ASSIGNED',
      to: 'REFUNDED',
      allowedRoles: ['ADMIN'],
      requiredConditions: ['hasRefundApproval'],
      sideEffects: ['refundOrder', 'notifyPartiesRefund'],
      validationRules: ['validateRefundReason']
    },
    {
      from: 'INSTALLATION_SCHEDULED',
      to: 'REFUNDED',
      allowedRoles: ['ADMIN'],
      requiredConditions: ['hasRefundApproval'],
      sideEffects: ['refundOrder', 'notifyPartiesRefund'],
      validationRules: ['validateRefundReason']
    },
    {
      from: 'INSTALLATION_IN_PROGRESS',
      to: 'REFUNDED',
      allowedRoles: ['ADMIN'],
      requiredConditions: ['hasRefundApproval'],
      sideEffects: ['refundOrder', 'notifyPartiesRefund'],
      validationRules: ['validateRefundReason']
    },
    {
      from: 'INSTALLATION_COMPLETED',
      to: 'REFUNDED',
      allowedRoles: ['ADMIN'],
      requiredConditions: ['hasRefundApproval'],
      sideEffects: ['refundOrder', 'notifyPartiesRefund'],
      validationRules: ['validateRefundReason']
    }
  ],
  finalStates: ['COMPLETED', 'CANCELLED', 'REFUNDED'],
  errorStates: ['CANCELLED', 'REFUNDED']
};

export default orderStateMachineConfig;
