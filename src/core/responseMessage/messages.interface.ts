export interface IResponseMessage<T, E> {
  message: string;
  status: boolean;
  statusCode: number;
  data?: T;
  error?: E | Error;
}
