import ResponseMessage from "./message.class";

export const successMessage = (data: unknown, message?: string, status?: number) => {
  return ResponseMessage.success(data, message, status);
};

export const errorMessage = (data: unknown, message?: string, status?: number) => {
  return ResponseMessage.error(data, message, status);
};
