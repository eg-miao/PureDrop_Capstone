import type { RegisterParams } from "./registerfunctions";

let pendingRegistration: RegisterParams | null = null;

export function setPendingRegistration(registration: RegisterParams) {
  pendingRegistration = registration;
}

export function getPendingRegistration() {
  return pendingRegistration;
}

export function clearPendingRegistration() {
  pendingRegistration = null;
}
