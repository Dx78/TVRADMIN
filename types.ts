
export enum SalesChannel {
  EXPEDIA = 'Expedia',
  BOOKING = 'Booking',
  WEBSITE = 'Website',
  RESERVA_DIRECTA = 'Reserva Directa'
}

// NOTE: SalesType and PaymentMethod are now used as defaults, 
// but the app supports dynamic strings from AppSettings.
export enum SalesType {
  DAYPASS = 'Daypass',
  RESTAURANTE = 'Restaurante',
  HOTEL = 'Hotel',
  BOUTIQUE = 'Boutique',
  MASAJES = 'Masajes',
  TRANSPORTES = 'Transportes',
  TOURS = 'Tours',
  EVENTO = 'Evento',
  CLASE_SURF = 'Clase de Surf'
}

export enum PaymentMethod {
  EFECTIVO = 'Efectivo',
  BAC = 'BAC',
  PROMERICA = 'Promerica',
  LINK_DE_PAGO = 'Link de Pago',
  TRANSFERENCIA = 'Transferencia',
  BITCOIN = 'Bitcoin',
  OTROS = 'Otros'
}

export type Receptionist = 'Helen' | 'Diego' | 'Ninguno';

// --- AUTH TYPES ---
export type UserRole = 'admin' | 'receptionist';

export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  receptionistName?: Receptionist; // Maps to the specific receptionist for commissions
  isAdminDiego?: boolean; // Special flag for the Super Admin
}
// ------------------

export interface AppSettings {
  salesTypes: string[];
  paymentMethods: string[];
}

export interface Sale {
  id: string;
  date: string;
  commandNumber: string; // Numero de comanda
  amount: number;
  channel: SalesChannel;
  type: string; // Changed from Enum to string to support dynamic types
  paymentMethod: string; // Changed from Enum to string
  voucherNumber?: string; // Solo si es tarjeta/banco
  notes?: string;
  tip?: number; // Propina opcional
  
  // Commission Fields
  receptionist?: Receptionist;
  commissionAmount?: number;
}

export type ExpenseDocumentType = 'RECIBO' | 'CCF' | 'CREDITO_FISCAL' | 'FACTURA';

export interface Expense {
  id: string;
  date: string; // Fecha del documento
  
  provider: string; // PROVEEDOR (Antes recipientName)
  description: string;
  
  // Financials
  subtotal: number; // SUB TOTAL SIN IVA
  iva: number;      // IVA
  amount: number;   // TOTAL (Sub + IVA)
  
  paymentMethod: string; // FORMA DE PAGO
  
  documentType: ExpenseDocumentType;
  documentNumber: string; // NUMERO (Generic for all docs)
  
  // Optional / Specifics
  taxPayerName?: string; // Nombre / Razon Social
  taxDui?: string;       // DUI/NIT
  taxPhone?: string;     
  taxAddress?: string;   
}

export interface SalesSummary {
  totalAmount: number;
  totalTransactions: number;
  byChannel: Record<string, number>;
  byType: Record<string, number>;
}

// --- NEW: DAILY STATE TRACKING ---
export interface DayState {
  isOpen: boolean;
  initialFund: string; // Fondo inicial del dia
  finalFund?: string;  // Fondo final (si se cerro)
  closedAt?: string;   // Fecha hora de cierre
  closedBy?: string;   // Usuario que cerro
}
