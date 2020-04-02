export class RPCException extends Error {
  public readonly message: any;

  constructor(message?: string | object | any, error = 'Bad Gateway') {
    super();
    this.message = message;
  }

  public getMessage(): string | object {
    return this.message;
  }
}
