let selectedAddress = "";

export const setSelectedAddress = (value: string): void => {
  selectedAddress = value;
};

export const getSelectedAddress = (): string => selectedAddress;
