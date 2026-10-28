export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export const notFound = (msg = '404 Not Found') => new HttpError(404, msg)
export const forbidden = (msg = '403 Forbidden') => new HttpError(403, msg)
export const badRequest = (msg = '400 Bad Request') => new HttpError(400, msg)
export const unauthorized = (msg = '401 Unauthorized') => new HttpError(401, msg)
