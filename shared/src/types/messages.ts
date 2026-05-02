export interface MessagePayload {
  type: string;
  data: any;
  timestamp: Date;
  requestId: string;
}

export interface AppointmentCreatedMessage extends MessagePayload {
  type: 'APPOINTMENT_CREATED';
  data: {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    departmentId: string;
    appointmentDate: Date;
    slotId: string;
  };
}

export interface AppointmentConfirmedMessage extends MessagePayload {
  type: 'APPOINTMENT_CONFIRMED';
  data: {
    appointmentId: string;
    paymentId: string;
    patientId: string;
    doctorId: string;
    queueNumber: number;
  };
}

export interface AppointmentCancelledMessage extends MessagePayload {
  type: 'APPOINTMENT_CANCELLED';
  data: {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    reason: string;
    cancelledAt: Date;
  };
}

export interface RegistrationCreatedMessage extends MessagePayload {
  type: 'REGISTRATION_CREATED';
  data: {
    registrationId: string;
    patientId: string;
    doctorId: string;
    departmentId: string;
    queueNumber: number;
    registrationType: 'ONLINE' | 'ON_SITE';
  };
}

export interface CheckInMessage extends MessagePayload {
  type: 'CHECK_IN';
  data: {
    registrationId: string;
    patientId: string;
    doctorId: string;
    queueNumber: number;
    checkedInAt: Date;
  };
}

export interface QueueCalledMessage extends MessagePayload {
  type: 'QUEUE_CALLED';
  data: {
    registrationId: string;
    patientId: string;
    doctorId: string;
    queueNumber: number;
    displayNumber: string;
    calledAt: Date;
    calledBy: string;
  };
}

export interface ConsultationStartedMessage extends MessagePayload {
  type: 'CONSULTATION_STARTED';
  data: {
    registrationId: string;
    patientId: string;
    doctorId: string;
    queueNumber: number;
    startTime: Date;
  };
}

export interface ConsultationCompletedMessage extends MessagePayload {
  type: 'CONSULTATION_COMPLETED';
  data: {
    registrationId: string;
    patientId: string;
    doctorId: string;
    queueNumber: number;
    endTime: Date;
  };
}

export interface PaymentSuccessMessage extends MessagePayload {
  type: 'PAYMENT_SUCCESS';
  data: {
    paymentId: string;
    registrationId?: string;
    appointmentId?: string;
    patientId: string;
    amount: number;
    method: string;
    transactionId?: string;
    paidAt: Date;
  };
}

export interface PaymentFailedMessage extends MessagePayload {
  type: 'PAYMENT_FAILED';
  data: {
    paymentId: string;
    registrationId?: string;
    appointmentId?: string;
    patientId: string;
    amount: number;
    errorMessage: string;
  };
}

export interface RefundInitiatedMessage extends MessagePayload {
  type: 'REFUND_INITIATED';
  data: {
    refundId: string;
    paymentId: string;
    registrationId?: string;
    appointmentId?: string;
    amount: number;
    reason: string;
    initiatedAt: Date;
  };
}

export interface RefundCompletedMessage extends MessagePayload {
  type: 'REFUND_COMPLETED';
  data: {
    refundId: string;
    paymentId: string;
    registrationId?: string;
    appointmentId?: string;
    amount: number;
    transactionId?: string;
    completedAt: Date;
  };
}

export interface SlotLockedMessage extends MessagePayload {
  type: 'SLOT_LOCKED';
  data: {
    slotId: string;
    scheduleId: string;
    doctorId: string;
    lockedBy: string;
    lockedAt: Date;
  };
}

export interface SlotReleasedMessage extends MessagePayload {
  type: 'SLOT_RELEASED';
  data: {
    slotId: string;
    scheduleId: string;
    doctorId: string;
    releasedAt: Date;
  };
}

export interface SlotBookedMessage extends MessagePayload {
  type: 'SLOT_BOOKED';
  data: {
    slotId: string;
    scheduleId: string;
    doctorId: string;
    appointmentId: string;
    bookedAt: Date;
  };
}

export interface NotificationMessage extends MessagePayload {
  type: 'NOTIFICATION';
  data: {
    userId: string;
    title: string;
    content: string;
    notificationType: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    resourceType?: string;
    resourceId?: string;
  };
}

export interface WebSocketMessage {
  type: 'BROADCAST' | 'PRIVATE' | 'GROUP';
  target?: string;
  event: string;
  payload: any;
  timestamp: Date;
}

export type MessageTypes =
  | AppointmentCreatedMessage
  | AppointmentConfirmedMessage
  | AppointmentCancelledMessage
  | RegistrationCreatedMessage
  | CheckInMessage
  | QueueCalledMessage
  | ConsultationStartedMessage
  | ConsultationCompletedMessage
  | PaymentSuccessMessage
  | PaymentFailedMessage
  | RefundInitiatedMessage
  | RefundCompletedMessage
  | SlotLockedMessage
  | SlotReleasedMessage
  | SlotBookedMessage
  | NotificationMessage;
